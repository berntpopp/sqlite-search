// src/preload.js

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exposes a safe, limited API to the renderer process, providing functionality
 * for performing database searches and retrieving database information.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  performSearch: (searchTerm, selectedTable) => ipcRenderer.send('perform-search', searchTerm, selectedTable),
  onSearchResults: (callback) => ipcRenderer.on('search-results', callback),
  getTableList: () => ipcRenderer.send('get-table-list'),
  onTableList: (callback) => ipcRenderer.on('table-list', callback),
  getColumns: (tableName) => ipcRenderer.send('get-columns', tableName),
  onColumnsList: (callback) => ipcRenderer.on('column-list', callback),
});
