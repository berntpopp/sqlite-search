// electron/preload/index.js

import { contextBridge, ipcRenderer } from 'electron'

/**
 * Exposes a safe, limited API to the renderer process, providing functionality
 * for performing database searches and retrieving database information.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Search operations
  performSearch: (searchTerm, selectedTable, selectedColumns) =>
    ipcRenderer.send('perform-search', searchTerm, selectedTable, selectedColumns),
  onSearchResults: callback => ipcRenderer.on('search-results', callback),
  onSearchError: callback => ipcRenderer.on('search-error', callback),

  // Browse operations (server-side pagination)
  browseTable: (tableName, columns, page, itemsPerPage, sort) =>
    ipcRenderer.send('browse-table', tableName, columns, page, itemsPerPage, sort),
  onBrowseResults: callback => ipcRenderer.on('browse-results', callback),
  onBrowseError: callback => ipcRenderer.on('browse-error', callback),

  // Table row count (for browse mode UI)
  getTableRowCount: tableName => ipcRenderer.send('get-table-row-count', tableName),
  onTableRowCount: callback => ipcRenderer.on('table-row-count', callback),
  onTableRowCountError: callback => ipcRenderer.on('table-row-count-error', callback),

  // Table and column operations
  getTableList: () => ipcRenderer.send('get-table-list'),
  onTableList: callback => ipcRenderer.on('table-list', callback),

  getColumns: tableName => ipcRenderer.send('get-columns', tableName),
  onColumnsList: callback => ipcRenderer.on('column-list', callback),

  // File dialog and database management
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  changeDatabase: filePath => ipcRenderer.send('change-database', filePath),

  onDatabaseError: callback => ipcRenderer.on('database-connection-error', callback),

  // Get current database path (useful for E2E testing with pre-loaded database)
  getCurrentDatabase: () => ipcRenderer.invoke('get-current-database'),
  onDatabaseLoaded: callback => ipcRenderer.on('database-loaded', callback),
})
