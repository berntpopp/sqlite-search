// electron/preload/index.js

import { contextBridge, ipcRenderer } from 'electron'

/**
 * Exposes a safe, limited API to the renderer process, providing functionality
 * for performing database searches and retrieving database information.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  performSearch: (searchTerm, selectedTable, selectedColumns) =>
    ipcRenderer.send('perform-search', searchTerm, selectedTable, selectedColumns),
  onSearchResults: (callback) => ipcRenderer.on('search-results', callback),
  onSearchError: (callback) => ipcRenderer.on('search-error', callback),

  getTableList: () => ipcRenderer.send('get-table-list'),
  onTableList: (callback) => ipcRenderer.on('table-list', callback),

  getColumns: (tableName) => ipcRenderer.send('get-columns', tableName),
  onColumnsList: (callback) => ipcRenderer.on('column-list', callback),

  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  changeDatabase: (filePath) => ipcRenderer.send('change-database', filePath),

  onDatabaseError: (callback) => ipcRenderer.on('database-connection-error', callback)
})
