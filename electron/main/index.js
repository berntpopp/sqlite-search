// electron/main/index.js
'use strict'

import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import sqlite3 from 'sqlite3'
import { escapeFts5SearchTerm, buildFts5MatchQuery, isValidSearchTerm } from './utils/search.js'

// Enhanced logging for production debugging with file output
const logFile = path.join(app.getPath('temp'), 'sqlite-search-debug.log')
const logStream = fs.createWriteStream(logFile, { flags: 'a' })

const log = {
  info: (...args) => {
    const msg = `[INFO] ${new Date().toISOString()} ${args.join(' ')}\n`
    console.log('[INFO]', new Date().toISOString(), ...args)
    logStream.write(msg)
  },
  error: (...args) => {
    const msg = `[ERROR] ${new Date().toISOString()} ${args.join(' ')}\n`
    console.error('[ERROR]', new Date().toISOString(), ...args)
    logStream.write(msg)
  },
  warn: (...args) => {
    const msg = `[WARN] ${new Date().toISOString()} ${args.join(' ')}\n`
    console.warn('[WARN]', new Date().toISOString(), ...args)
    logStream.write(msg)
  }
}

log.info('='.repeat(80))
log.info('Log file location:', logFile)

log.info('Application starting...')
log.info('Node version:', process.version)
log.info('Electron version:', process.versions.electron)
log.info('Platform:', process.platform)
log.info('CWD:', process.cwd())
log.info('__dirname equivalent:', fileURLToPath(new URL('.', import.meta.url)))

// Get __dirname equivalent in ESM
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Set the environment variable to control the environment
const isDevelopment = process.env.NODE_ENV !== 'production'
log.info('Environment:', isDevelopment ? 'development' : 'production')
log.info('NODE_ENV:', process.env.NODE_ENV)

// Set the default database path
const defaultDbPath = path.join(app.getPath('userData'), 'db/db.sqlite')
log.info('Default database path:', defaultDbPath)

/**
 * Application menu configuration
 * Disable menu for cleaner production UI
 */
Menu.setApplicationMenu(null)

async function createWindow() {
  log.info('createWindow() called')

  try {
    // Create the browser window.
    log.info('Creating BrowserWindow...')
    const iconPath = path.join(__dirname, '../../public/favicon.ico')
    const preloadPath = path.join(__dirname, '../preload/index.mjs')

    log.info('Icon path:', iconPath)
    log.info('Icon exists:', fs.existsSync(iconPath))
    log.info('Preload path:', preloadPath)
    log.info('Preload exists:', fs.existsSync(preloadPath))

    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: iconPath,
      // Defense in depth: Auto-hide menu bar as fallback
      // User can still reveal with Alt key if needed
      autoHideMenuBar: true,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Required for sqlite3
      },
    })

    log.info('BrowserWindow created successfully')

    // Load the appropriate URL based on packaging state
    // Best practice: Use app.isPackaged instead of NODE_ENV
    // electron-vite sets ELECTRON_RENDERER_URL during development
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      // Development mode: Load from Vite dev server
      log.info('Loading development URL:', process.env.ELECTRON_RENDERER_URL)
      await win.loadURL(process.env.ELECTRON_RENDERER_URL)
      log.info('Development URL loaded')
      win.webContents.openDevTools()
    } else {
      // Production mode: Load from built files
      const htmlPath = path.join(__dirname, '../renderer/index.html')
      log.info('Loading production HTML:', htmlPath)
      log.info('app.isPackaged:', app.isPackaged)
      log.info('__dirname:', __dirname)
      log.info('HTML file exists:', fs.existsSync(htmlPath))

      if (!fs.existsSync(htmlPath)) {
        log.error('CRITICAL: index.html not found at', htmlPath)
        log.info('Directory contents of __dirname:')
        try {
          log.info(fs.readdirSync(__dirname))
        } catch (e) {
          log.error('Cannot read __dirname:', e.message)
        }
        log.info('Parent directory:', path.join(__dirname, '..'))
        try {
          log.info(fs.readdirSync(path.join(__dirname, '..')))
        } catch (e) {
          log.error('Cannot read parent directory:', e.message)
        }
      }

      await win.loadFile(htmlPath)
      log.info('Production HTML loaded')
    }

    // Log when the window is ready to show
    win.once('ready-to-show', () => {
      log.info('Window ready-to-show event fired')
    })

    // Log renderer process console messages
    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
      log.info(`Renderer console [${level}]:`, message, `(${sourceId}:${line})`)
    })

    // Log any crashes
    win.webContents.on('crashed', (event, killed) => {
      log.error('Renderer process crashed!', { killed })
    })

    log.info('Window setup complete')
  } catch (error) {
    log.error('Error in createWindow():', error)
    throw error
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

// Global error handlers
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
log.info('Setting up app.whenReady() handler')
app.whenReady().then(() => {
  log.info('app.whenReady() fired - Electron initialized')
  log.info('App path:', app.getAppPath())
  log.info('Exe path:', app.getPath('exe'))
  log.info('User data:', app.getPath('userData'))
  createWindow().catch(err => {
    log.error('Failed to create window:', err)
  })
}).catch(err => {
  log.error('app.whenReady() failed:', err)
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
 * Fetches and caches valid column information for a table
 * Returns structured data with name and type for each column
 * For FTS5 tables, queries the actual FTS5 table for column names (for validation),
 * then enriches with type info from the base table if available
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

    // Check if this is an FTS5 table and find the base table name
    // FTS5 tables are named with _fts suffix in our conversion script
    const baseTableName = tableName.replace(/_fts$/, '')
    const isFTS5 = tableName !== baseTableName

    // IMPORTANT: Always query the actual table for column names (for validation)
    // This fixes a bug where base table had columns not in FTS5 table
    // PRAGMA table_info returns: cid, name, type, notnull, dflt_value, pk
    const columnListQuery = `PRAGMA table_info(${tableName});`
    database.all(columnListQuery, [], (err, ftsColumns) => {
      if (err) {
        console.error('Failed to fetch columns from table:', err)
        reject(err)
        return
      }

      // For FTS5 tables, try to get type info from base table to enrich the data
      if (isFTS5) {
        const baseTableQuery = `PRAGMA table_info(${baseTableName});`
        database.all(baseTableQuery, [], (err2, baseColumns) => {
          // Create a map of base table column types for lookup
          const baseTypeMap = new Map()
          if (!err2 && baseColumns) {
            baseColumns.forEach(col => {
              baseTypeMap.set(col.name, col.type || 'TEXT')
            })
          }

          // Build column data using FTS5 column names, enriched with base table types
          const columnData = ftsColumns.map(col => ({
            name: col.name,
            // Use type from base table if available, otherwise default to TEXT
            type: baseTypeMap.get(col.name) || col.type || 'TEXT'
          }))
          validColumnsCache.set(tableName, columnData)
          console.log(`Loaded column types for FTS5 table ${tableName}:`, columnData.slice(0, 5))
          resolve(columnData)
        })
      } else {
        // Non-FTS5 table: use columns directly
        const columnData = ftsColumns.map(col => ({
          name: col.name,
          type: col.type || 'TEXT'
        }))
        validColumnsCache.set(tableName, columnData)
        console.log(`Loaded column types for ${tableName}:`, columnData.slice(0, 5))
        resolve(columnData)
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
    // Extract names from structured column data
    const validColNames = validCols.map(col => col.name)
    return columnNames.every(col => validColNames.includes(col))
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

  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
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
    log.error('Database connection not established.')
    event.reply('search-error', 'Database connection not established.')
    return
  }

  // Validate search term
  if (!isValidSearchTerm(searchTerm)) {
    log.warn('Empty search term provided')
    event.reply('search-error', 'Search term cannot be empty')
    return
  }

  // SECURITY: Validate table name against whitelist to prevent SQL injection
  if (!isValidTable(selectedTable)) {
    log.error('Security: Invalid table name attempted:', selectedTable)
    event.reply('search-error', `Invalid table: ${selectedTable}`)
    return
  }

  // SECURITY: Validate column names against whitelist to prevent SQL injection
  const columnsValid = await areValidColumns(db, selectedTable, selectedColumns)
  if (!columnsValid) {
    log.error('Security: Invalid column names attempted:', selectedColumns)
    event.reply('search-error', 'Invalid column names')
    return
  }

  try {
    // Escape search term for FTS5 safety (prevents special character syntax errors)
    const escapedSearchTerm = escapeFts5SearchTerm(searchTerm)

    // Build FTS5 MATCH query with column filtering
    // All identifiers (table/columns) validated against whitelist above
    const matchQuery = buildFts5MatchQuery(selectedColumns, escapedSearchTerm)
    const query = `SELECT * FROM ${selectedTable} WHERE ${selectedTable} MATCH ?`

    log.info('Executing FTS5 search:', {
      table: selectedTable,
      columns: selectedColumns,
      originalTerm: searchTerm,
      escapedTerm: escapedSearchTerm,
      matchQuery
    })

    // Execute the query
    db.all(query, [matchQuery], (err, rows) => {
      if (err) {
        log.error('FTS5 search error:', err.message)
        event.reply('search-error', err.message)
        return
      }

      log.info(`Search completed: ${rows.length} results found`)
      // Send the results back to the renderer process
      event.reply('search-results', rows)
    })
  } catch (error) {
    log.error('Search preparation error:', error.message)
    event.reply('search-error', error.message)
  }
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
    // Store reference to old database and clear global immediately
    const oldDb = db
    db = null

    oldDb.close(err => {
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
