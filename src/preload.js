// src/preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  performSearch: (searchTerm) => ipcRenderer.send('perform-search', searchTerm),
  onSearchResults: (callback) => ipcRenderer.on('search-results', callback)
});
