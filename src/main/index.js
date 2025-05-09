const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { windowStore } = require('./store');

// Initialize remote module
require('@electron/remote/main').initialize();

let mainWindow;

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