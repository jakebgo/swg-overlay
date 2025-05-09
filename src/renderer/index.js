// Import required modules
const { ipcRenderer } = require('electron');
const { themeStore } = require('../main/store');

// Initialize remote module
require('@electron/remote/renderer');

// Get the current window
let currentWindow;
try {
  const { getCurrentWindow } = require('@electron/remote');
  currentWindow = getCurrentWindow();
  
  // Make the window always on top
  currentWindow.setAlwaysOnTop(true);
} catch (error) {
  console.error('Failed to get current window:', error);
}

// Apply theme
function applyTheme() {
  const mode = themeStore.getMode();
  const opacity = themeStore.getOpacity();
  
  document.body.style.backgroundColor = mode === 'dark' ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)';
  document.getElementById('app').style.backgroundColor = mode === 'dark' 
    ? `rgba(0, 0, 0, ${opacity})` 
    : `rgba(255, 255, 255, ${opacity})`;
}

// Listen for click-through toggle events from main process
ipcRenderer.on('click-through-toggled', (_, isClickThrough) => {
  const statusText = document.querySelector('.click-through-status');
  if (statusText) {
    statusText.textContent = `Click-through: ${isClickThrough ? 'On' : 'Off'}`;
  }
  
  // Update draggable regions based on click-through state
  if (isClickThrough) {
    document.body.style.webkitAppRegion = 'no-drag';
    document.querySelector('.gh-header').style.webkitAppRegion = 'no-drag';
  } else {
    document.body.style.webkitAppRegion = 'drag';
    document.querySelector('.gh-header').style.webkitAppRegion = 'drag';
  }
});

// Handle window dragging
const header = document.querySelector('.gh-header');
if (header) {
  header.addEventListener('mousedown', () => {
    ipcRenderer.send('start-drag');
  });

  header.addEventListener('mouseup', () => {
    ipcRenderer.send('end-drag');
  });
}

// Apply initial theme
applyTheme();

// Listen for theme changes
ipcRenderer.on('theme-changed', () => {
  applyTheme();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Alt+V to toggle visibility
  if (e.altKey && e.key === 'V' && currentWindow) {
    if (currentWindow.isVisible()) {
      currentWindow.hide();
    } else {
      currentWindow.show();
    }
  }
}); 