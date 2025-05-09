const Store = require('electron-store');

// Initialize the store with default values
const store = new Store({
  defaults: {
    window: {
      bounds: {
        x: 100,
        y: 100,
        width: 400,
        height: 600
      },
      isClickThrough: false,
      isVisible: true
    },
    theme: {
      mode: 'dark', // 'dark' or 'light'
      opacity: 0.8
    },
    settings: {
      pollInterval: 300000, // 5 minutes in milliseconds
      lastPollTime: null
    }
  }
});

// Window state management
const windowStore = {
  getBounds: () => store.get('window.bounds'),
  setBounds: (bounds) => store.set('window.bounds', bounds),
  
  getClickThrough: () => store.get('window.isClickThrough'),
  setClickThrough: (isClickThrough) => store.set('window.isClickThrough', isClickThrough),
  
  getVisibility: () => store.get('window.isVisible'),
  setVisibility: (isVisible) => store.set('window.isVisible', isVisible)
};

// Theme management
const themeStore = {
  getMode: () => store.get('theme.mode'),
  setMode: (mode) => store.set('theme.mode', mode),
  
  getOpacity: () => store.get('theme.opacity'),
  setOpacity: (opacity) => store.set('theme.opacity', opacity)
};

// Settings management
const settingsStore = {
  getPollInterval: () => store.get('settings.pollInterval'),
  setPollInterval: (interval) => {
    // Ensure minimum interval of 5 minutes
    const minInterval = 300000; // 5 minutes in milliseconds
    const safeInterval = Math.max(interval, minInterval);
    store.set('settings.pollInterval', safeInterval);
  },
  
  getLastPollTime: () => store.get('settings.lastPollTime'),
  setLastPollTime: (timestamp) => store.set('settings.lastPollTime', timestamp)
};

module.exports = {
  windowStore,
  themeStore,
  settingsStore
}; 