// src/background.js
'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'

// importing sqlite3 and path
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Set the environment variable to control the environment
const isDevelopment = process.env.NODE_ENV !== 'production'

// Set the default database path
const defaultDbPath = path.join(app.getPath('userData'), 'db/db.sqlite');

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

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
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
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

// Function to initialize database connection
function initDbConnection(dbPath) {
  // Check if the database file exists
  if (!fs.existsSync(dbPath)) {
    console.log('Default database file not found. Awaiting user selection.');
    return null;
  }

  let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Connected to the sqlite database at:', dbPath);
    }
  });

  return db;
}

// Initialize database with default path or await user selection
let db = initDbConnection(defaultDbPath);

// Handling the search request
ipcMain.on('perform-search', (event, searchTerm, selectedTable, selectedColumns) => {
  // Check if the database connection exists
  if (!db) {
    console.error("Database connection not established.");
    event.reply('search-error', 'Database connection not established.');
    return;
  }

  // Construct the MATCH part of the query
  const searchColumns = selectedColumns.map(col => `${col}`).join(' ');
  const matchQuery = `{${searchColumns}}: ${searchTerm}`;
  
  // Construct the full SQL query
  const query = `SELECT * FROM ${selectedTable} WHERE ${selectedTable} MATCH ?`;

  // Execute the query
  db.all(query, [matchQuery], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      event.reply('search-error', err.message); // Send error to renderer
      return;
    }

    // Send the results back to the renderer process
    event.reply('search-results', rows);
  });
});

// Handling the table list request
ipcMain.on('get-table-list', async (event) => {
  // Check if the database connection exists
  if (!db) {
    console.error("Database connection not established.");
    event.reply('table-list-error', 'Database connection not established.');
    return;
  }

  const fts5TableListQuery = `
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' 
      AND sql LIKE '%USING FTS5%'`;

  db.all(fts5TableListQuery, [], (err, tables) => {
    if (err) {
      console.error("Database error:", err);
      event.reply('table-list-error', err.message);
    } else {
      event.reply('table-list', tables.map(t => t.name));
    }
  });
});

// Handling the column list request
// Handling the column list request
ipcMain.on('get-columns', async (event, tableName) => {
  // Check if the database connection exists
  if (!db) {
    console.error("Database connection not established.");
    event.reply('column-list-error', 'Database connection not established.');
    return;
  }

  const columnListQuery = `PRAGMA table_info(${tableName});`;
  db.all(columnListQuery, [], (err, columns) => {
    if (err) {
      console.error("Database error:", err);
      event.reply('column-list-error', err.message);
    } else {
      // Extract column names from the PRAGMA result
      const columnNames = columns.map(col => col.name);
      event.reply('column-list', columnNames);
    }
  });
});

// Handling the open file dialog request
ipcMain.handle('open-file-dialog', async () => {
  // Show open dialog and return the selected path
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
  });
  if (filePaths.length > 0) {
    return filePaths[0]; // Send the selected path back to the renderer process
  }
});

ipcMain.on('change-database', (event, newPath) => {
  // Close the existing database connection if open
  if (db) db.close();

  // Connect to the new database
  db = initDbConnection(newPath);
});
