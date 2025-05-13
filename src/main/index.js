const { app, BrowserWindow, globalShortcut, ipcMain, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { windowStore, authStore } = require('./store');
const resourceService = require('./services/resourceService');

// Initialize remote module
require('@electron/remote/main').initialize();

let mainWindow;
let loginWindow;

function createWindow() {
  // Get saved window bounds or use defaults
  const bounds = windowStore.getBounds();
  
  mainWindow = new BrowserWindow({
    ...bounds,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false // Required for loading local resources
    }
  });

  // Enable remote module for this window
  require('@electron/remote/main').enable(mainWindow.webContents);

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Restore window state
  if (windowStore.getVisibility()) {
    mainWindow.show();
  } else {
    mainWindow.hide();
  }

  // Set initial click-through state
  const isClickThrough = windowStore.getClickThrough();
  mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });

  // Save window bounds when moved or resized
  mainWindow.on('moved', () => {
    windowStore.setBounds(mainWindow.getBounds());
  });

  mainWindow.on('resized', () => {
    windowStore.setBounds(mainWindow.getBounds());
  });

  // Set up click-through toggle (Alt+C)
  globalShortcut.register('Alt+C', () => {
    const newState = !windowStore.getClickThrough();
    windowStore.setClickThrough(newState);
    mainWindow.setIgnoreMouseEvents(newState, { forward: true });
    mainWindow.webContents.send('click-through-toggled', newState);
  });

  // Set up visibility toggle (Alt+V)
  globalShortcut.register('Alt+V', () => {
    const newState = !windowStore.getVisibility();
    windowStore.setVisibility(newState);
    if (newState) {
      mainWindow.show();
    } else {
      mainWindow.hide();
    }
  });

  // Set up window dragging
  ipcMain.on('start-drag', () => {
    mainWindow.setIgnoreMouseEvents(false);
  });

  ipcMain.on('end-drag', () => {
    if (windowStore.getClickThrough()) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  });

  // Handle click-through toggle from renderer
  ipcMain.on('toggle-click-through', () => {
    const newState = !windowStore.getClickThrough();
    windowStore.setClickThrough(newState);
    mainWindow.setIgnoreMouseEvents(newState, { forward: true });
    mainWindow.webContents.send('click-through-toggled', newState);
  });
}

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // Enable remote module for login window
  require('@electron/remote/main').enable(loginWindow.webContents);

  // Add error handling for page load
  loginWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Login window failed to load:', errorCode, errorDescription);
    mainWindow.webContents.send('login-error', {
      type: 'load-failed',
      message: `Failed to load login page: ${errorDescription}`
    });
  });

  // Add console logging
  loginWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Login window console:', message);
  });

  // Load Galaxy Harvester login page
  const loginUrl = 'https://galaxyharvester.net/ghHome.py?';
  console.log('Loading login URL:', loginUrl);
  loginWindow.loadURL(loginUrl);

  // Check for successful login
  const checkLoginStatus = async () => {
    try {
      const cookies = await session.defaultSession.cookies.get({});
      console.log('All cookies:', cookies.map(c => ({ name: c.name, domain: c.domain })));
      
      // Look for the gh_sid cookie
      const ghCookie = cookies.find(cookie => 
        cookie.domain === 'galaxyharvester.net' && 
        cookie.name === 'gh_sid'
      );
      
      if (ghCookie) {
        console.log('Found GH cookie:', ghCookie);
        // Store cookie securely
        authStore.setGhCookie(ghCookie);
        mainWindow.webContents.send('login-success', {
          expires: ghCookie.expirationDate || (Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days if no expiration
        });
        loginWindow.close();
      }
    } catch (err) {
      console.error('Error checking login status:', err);
    }
  };

  // Check login status periodically
  const loginCheckInterval = setInterval(checkLoginStatus, 1000);

  // Handle successful navigation
  loginWindow.webContents.on('did-navigate', async (event, url) => {
    console.log('Navigation occurred:', url);
    checkLoginStatus();
  });

  // Handle window close
  loginWindow.on('closed', () => {
    clearInterval(loginCheckInterval);
    loginWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Clean up shortcuts when app is quitting
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Add IPC handlers for login
ipcMain.handle('open-gh-login', () => {
  if (!loginWindow) {
    createLoginWindow();
  } else {
    loginWindow.focus();
  }
});

ipcMain.handle('clear-gh-cookie', async () => {
  await session.defaultSession.clearStorageData({
    storages: ['cookies']
  });
  authStore.deleteGhCookie();
  mainWindow.webContents.send('login-cleared');
});

// Add IPC handlers for resource fetching
ipcMain.handle('fetch-resources', async () => {
  try {
    const result = await resourceService.fetchResources();
    mainWindow.webContents.send('resources-updated', result);
    return result;
  } catch (error) {
    console.error('Error fetching resources:', error);
    mainWindow.webContents.send('resource-error', error.message);
    throw error;
  }
});

// Add server selection handler
ipcMain.handle('set-server', async (_, serverId) => {
  try {
    resourceService.setServer(serverId);
    return { success: true };
  } catch (error) {
    console.error('Error setting server:', error);
    throw error;
  }
});

// Add sort parameter handler
ipcMain.handle('set-sort', async (_, sortBy) => {
  try {
    const success = resourceService.setSortBy(sortBy);
    return { success };
  } catch (error) {
    console.error('Error setting sort parameter:', error);
    throw error;
  }
});

// Add periodic resource updates when authenticated
let resourceUpdateInterval;

function startResourceUpdates() {
  if (resourceUpdateInterval) {
    clearInterval(resourceUpdateInterval);
  }
  
  // Update resources every 5 minutes
  resourceUpdateInterval = setInterval(async () => {
    try {
      const result = await resourceService.fetchResources();
      mainWindow.webContents.send('resources-updated', result);
    } catch (error) {
      console.error('Error in periodic resource update:', error);
    }
  }, 5 * 60 * 1000);
}

function stopResourceUpdates() {
  if (resourceUpdateInterval) {
    clearInterval(resourceUpdateInterval);
    resourceUpdateInterval = null;
  }
}

// Update resource update handling in login success
ipcMain.on('login-success', () => {
  startResourceUpdates();
});

ipcMain.on('login-cleared', () => {
  stopResourceUpdates();
});

// Add this near other IPC handlers
ipcMain.handle('debug-url-structure', async () => {
  try {
    const result = await resourceService.debugUrlStructure();
    return result;
  } catch (error) {
    console.error('Error in debug-url-structure handler:', error);
    throw error;
  }
}); 