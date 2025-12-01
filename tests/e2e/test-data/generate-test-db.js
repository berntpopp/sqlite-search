#!/usr/bin/env node
/**
 * Generate Test Database for E2E Testing
 *
 * Creates a SQLite database with FTS5 tables containing sample genomic data.
 * This database is used for E2E testing and screenshot generation.
 *
 * Usage:
 *   node e2e/test-data/generate-test-db.js
 *   # or via npm script:
 *   pnpm run test:e2e:setup
 *
 * @module e2e/test-data/generate-test-db
 */

import sqlite3 from 'sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, 'test.db')
const SQL_PATH = path.join(__dirname, 'create-test-db.sql')

/**
 * Run SQL commands from file
 */
async function createDatabase() {
  console.log('🗄️  Creating test database...')
  console.log(`   Path: ${DB_PATH}`)

  // Remove existing database
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH)
    console.log('   Removed existing database')
  }

  // Read SQL file
  const sql = fs.readFileSync(SQL_PATH, 'utf8')

  // Create database
  const db = new sqlite3.Database(DB_PATH)

  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        console.error('❌ Error creating database:', err)
        db.close()
        reject(err)
        return
      }

      // Verify tables
      db.all(
        `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
        (err, tables) => {
          if (err) {
            console.error('❌ Error listing tables:', err)
            db.close()
            reject(err)
            return
          }

          console.log('   Tables created:')
          tables.forEach((t) => console.log(`     - ${t.name}`))

          // Get counts
          db.get('SELECT COUNT(*) as count FROM genes_fts', (err, row) => {
            if (!err) {
              console.log(`   genes_fts: ${row.count} records`)
            }

            db.get('SELECT COUNT(*) as count FROM variants_fts', (err, row) => {
              if (!err) {
                console.log(`   variants_fts: ${row.count} records`)
              }

              db.close()
              console.log('✅ Test database created successfully!')
              console.log('')
              console.log('To use in tests:')
              console.log(`   Database path: ${DB_PATH}`)
              resolve()
            })
          })
        }
      )
    })
  })
}

// Run if executed directly
createDatabase().catch((err) => {
  console.error(err)
  process.exit(1)
})
