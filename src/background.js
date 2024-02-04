// src/background.js
'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
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

// importing sqlite3 and path
import sqlite3 from 'sqlite3';
import path from 'path';

// TODO: remove hardcoded path
// Connecting to the database
const dbPath = path.resolve('C:/development/sqlite-search/db/er.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the sqlite database.');
});

// importing ipcMain
import { ipcMain } from 'electron';

// Handling the search request
ipcMain.on('perform-search', (event, searchTerm, selectedTable) => {
  const query = `SELECT * FROM ${selectedTable} WHERE Beurteilung MATCH ?`;

  // Running the query
  db.all(query, [searchTerm], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      event.reply('search-error', err.message); // Sending back error message
      return;
    }

    // returning the rows to the renderer process
    event.reply('search-results', rows);
  });
});

// Handling the table list request
// TODO allow non FTS5 tables
ipcMain.on('get-table-list', async (event) => {
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
ipcMain.on('get-columns', async (event, tableName) => {
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
