// electron/main/index.js
'use strict'

import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import sqlite3 from 'sqlite3'

// Get __dirname equivalent in ESM
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Set the environment variable to control the environment
const isDevelopment = process.env.NODE_ENV !== 'production'

// Set the default database path
const defaultDbPath = path.join(app.getPath('userData'), 'db/db.sqlite')

/**
 * Disable default application menu for cleaner UI
 * Best Practice: Call before app.ready for optimal performance
 * - Windows/Linux: Completely removes the menu bar
 * - macOS: Removes application menu (system menu bar remains)
 * Reference: https://www.electronjs.org/docs/latest/tutorial/performance
 */
Menu.setApplicationMenu(null)

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../../public/favicon.ico'),
    // Defense in depth: Auto-hide menu bar as fallback
    // User can still reveal with Alt key if needed
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for sqlite3
    },
  })

  // Load the appropriate URL based on environment
  if (isDevelopment) {
    // In development, Vite dev server runs on port 5173 by default
    // electron-vite will set ELECTRON_RENDERER_URL
    const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173'
    await win.loadURL(rendererUrl)
    win.webContents.openDevTools()
  } else {
    // In production, load the built index.html
    await win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// Cleanup function for IPC listeners and database connections
function cleanupApp() {
  console.log('Cleaning up application resources...')

  // Remove all IPC listeners to prevent memory leaks
  ipcMain.removeHandler('open-file-dialog')
  ipcMain.removeAllListeners('perform-search')
  ipcMain.removeAllListeners('get-table-list')
  ipcMain.removeAllListeners('get-columns')
  ipcMain.removeAllListeners('change-database')

  // Close database connection
  if (db) {
    db.close(err => {
      if (err) {
        console.error('Error closing database:', err)
      } else {
        console.log('Database connection closed.')
      }
    })
    db = null
  }

  // Clear security caches
  validTables = []
  validColumnsCache.clear()
}

// Cleanup before app quits
app.on('before-quit', _event => {
  cleanupApp()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// Cache for valid FTS5 table names (security: whitelist validation)
let validTables = []

// Cache for valid column names per table (security: whitelist validation)
const validColumnsCache = new Map()

/**
 * Fetches and caches valid FTS5 table names for whitelist validation
 * This prevents SQL injection by ensuring only known tables can be queried
 */
function refreshValidTables(database) {
  return new Promise((resolve, reject) => {
    const fts5TableListQuery = `
      SELECT name
      FROM sqlite_master
      WHERE type='table'
        AND sql LIKE '%USING FTS5%'`

    database.all(fts5TableListQuery, [], (err, tables) => {
      if (err) {
        console.error('Failed to fetch valid tables:', err)
        reject(err)
      } else {
        validTables = tables.map(t => t.name)
        console.log('Valid FTS5 tables cached:', validTables)
        // Clear column cache when tables are refreshed
        validColumnsCache.clear()
        resolve(validTables)
      }
    })
  })
}

/**
 * Fetches and caches valid column names for a table
 * This prevents SQL injection by ensuring only known columns can be queried
 */
function getValidColumns(database, tableName) {
  return new Promise((resolve, reject) => {
    // Check cache first
    if (validColumnsCache.has(tableName)) {
      resolve(validColumnsCache.get(tableName))
      return
    }

    // Security: Validate table name against whitelist before using in PRAGMA
    if (!validTables.includes(tableName)) {
      reject(new Error(`Invalid table name: ${tableName}`))
      return
    }

    // Now safe to use table name (validated against whitelist)
    const columnListQuery = `PRAGMA table_info(${tableName});`
    database.all(columnListQuery, [], (err, columns) => {
      if (err) {
        console.error('Failed to fetch columns:', err)
        reject(err)
      } else {
        const columnNames = columns.map(col => col.name)
        validColumnsCache.set(tableName, columnNames)
        resolve(columnNames)
      }
    })
  })
}

/**
 * Validates that table name exists in whitelist
 * @param {string} tableName - Table name to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidTable(tableName) {
  return validTables.includes(tableName)
}

/**
 * Validates that all column names exist in table's column whitelist
 * @param {string} tableName - Table name
 * @param {string[]} columnNames - Column names to validate
 * @returns {Promise<boolean>} True if all columns valid
 */
async function areValidColumns(database, tableName, columnNames) {
  try {
    const validCols = await getValidColumns(database, tableName)
    return columnNames.every(col => validCols.includes(col))
  } catch (error) {
    console.error('Column validation error:', error)
    return false
  }
}

// Function to initialize database connection
function initDbConnection(dbPath) {
  // Check if the database file exists
  if (!fs.existsSync(dbPath)) {
    console.log('Default database file not found. Awaiting user selection.')
    return null
  }

  let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
    if (err) {
      console.error(err.message)
    } else {
      console.log('Connected to the sqlite database at:', dbPath)
      // Initialize table whitelist on connection
      refreshValidTables(db).catch(err => {
        console.error('Failed to initialize table whitelist:', err)
      })
    }
  })

  return db
}

// Initialize database with default path or await user selection
let db = initDbConnection(defaultDbPath)

// Handling the search request
ipcMain.on('perform-search', async (event, searchTerm, selectedTable, selectedColumns) => {
  // Check if the database connection exists
  if (!db) {
    console.error('Database connection not established.')
    event.reply('search-error', 'Database connection not established.')
    return
  }

  // SECURITY: Validate table name against whitelist to prevent SQL injection
  if (!isValidTable(selectedTable)) {
    console.error('Security: Invalid table name attempted:', selectedTable)
    event.reply('search-error', `Invalid table: ${selectedTable}`)
    return
  }

  // SECURITY: Validate column names against whitelist to prevent SQL injection
  const columnsValid = await areValidColumns(db, selectedTable, selectedColumns)
  if (!columnsValid) {
    console.error('Security: Invalid column names attempted:', selectedColumns)
    event.reply('search-error', 'Invalid column names')
    return
  }

  // Now safe to construct query (all identifiers validated against whitelist)
  const searchColumns = selectedColumns.map(col => `${col}`).join(' ')
  const matchQuery = `{${searchColumns}}: ${searchTerm}`
  const query = `SELECT * FROM ${selectedTable} WHERE ${selectedTable} MATCH ?`

  // Execute the query
  db.all(query, [matchQuery], (err, rows) => {
    if (err) {
      console.error('Database error:', err)
      event.reply('search-error', err.message)
      return
    }

    // Send the results back to the renderer process
    event.reply('search-results', rows)
  })
})

// Handling the table list request
ipcMain.on('get-table-list', async event => {
  // Check if the database connection exists
  if (!db) {
    console.error('Database connection not established.')
    event.reply('table-list-error', 'Database connection not established.')
    return
  }

  try {
    // Refresh whitelist and return to renderer
    const tables = await refreshValidTables(db)
    event.reply('table-list', tables)
  } catch (err) {
    console.error('Database error:', err)
    event.reply('table-list-error', err.message)
  }
})

// Handling the column list request
ipcMain.on('get-columns', async (event, tableName) => {
  // Check if the database connection exists
  if (!db) {
    console.error('Database connection not established.')
    event.reply('column-list-error', 'Database connection not established.')
    return
  }

  try {
    // Use whitelist-validated column fetching (prevents SQL injection)
    const columnNames = await getValidColumns(db, tableName)
    event.reply('column-list', columnNames)
  } catch (err) {
    console.error('Database error:', err)
    event.reply('column-list-error', err.message)
  }
})

// Handling the open file dialog request
ipcMain.handle('open-file-dialog', async () => {
  // Show open dialog and return the selected path
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
  })
  if (filePaths.length > 0) {
    return filePaths[0] // Send the selected path back to the renderer process
  }
})

ipcMain.on('change-database', (event, newPath) => {
  // Close the existing database connection if open
  if (db) {
    db.close(err => {
      if (err) {
        console.error('Error closing previous database:', err)
      } else {
        console.log('Previous database closed successfully')
      }

      // Clear security whitelists when changing database
      validTables = []
      validColumnsCache.clear()

      // Connect to the new database (will auto-refresh whitelist)
      db = initDbConnection(newPath)
    })
  } else {
    // No existing database, just connect to new one
    db = initDbConnection(newPath)
  }
})
