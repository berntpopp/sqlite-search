# sqlite-search

[![Build](https://github.com/berntpopp/sqlite-search/actions/workflows/build.yml/badge.svg)](https://github.com/berntpopp/sqlite-search/actions/workflows/build.yml)
[![Release](https://github.com/berntpopp/sqlite-search/actions/workflows/release.yml/badge.svg)](https://github.com/berntpopp/sqlite-search/actions/workflows/release.yml)
[![GitHub release](https://img.shields.io/github/v/release/berntpopp/sqlite-search)](https://github.com/berntpopp/sqlite-search/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`sqlite-search` is a modern Electron-based desktop application designed to search SQLite databases using full-text search (FTS5). Built with Vue 3, Vuetify 3, and electron-vite, it provides a user-friendly interface for selecting databases, performing searches, and viewing results.

## Features

- **Database Selection**: Select SQLite database files with FTS5 tables
- **Table and Column Selection**: Choose specific tables and columns to search
- **Full-Text Search**: Utilizes SQLite's FTS5 extension with porter stemming and unicode61 tokenizer
- **Interactive Results**: Displays search results in a responsive data table
- **Copy to Clipboard**: Copy search result details to clipboard
- **Dark/Light Theme**: Toggle between dark and light themes with persistent preferences
- **MDB Converter**: Convert Microsoft Access (.mdb) databases to SQLite with FTS5 indexing

## Download

Pre-built installers are available for Windows, macOS, and Linux:

**[Download Latest Release](https://github.com/berntpopp/sqlite-search/releases/latest)**

- **Windows**: `sqlite-search-Setup-{version}.exe` (NSIS installer)
- **macOS**: `sqlite-search-{version}.dmg` (requires macOS 10.13+)
- **Linux**: `sqlite-search-{version}.AppImage` (universal) or `.deb` (Debian/Ubuntu)

## Setup and Installation

### Prerequisites

- Node.js >= 20.16.0
- pnpm >= 9.0.0
- mdbtools (for MDB conversion)

### Installation

```bash
# Clone the repository
git clone https://github.com/berntpopp/sqlite-search.git
cd sqlite-search

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

## Development Commands

```bash
# Development with hot-reload
pnpm run dev

# Build application
pnpm run build

# Create distributable
pnpm run build:dist

# Preview production build
pnpm run preview

# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Lint and fix
pnpm run lint

# Format code
pnpm run format

# Type check
pnpm run typecheck
```

## Architecture

### Tech Stack

- **Frontend**: Vue 3 (Composition API) + Vuetify 3 (Material Design)
- **State Management**: Pinia
- **Build Tool**: Vite + electron-vite
- **Language**: TypeScript
- **Testing**: Vitest + Vue Test Utils
- **Database**: SQLite3 with FTS5
- **Process Communication**: Electron IPC with contextBridge

### Project Structure

```
sqlite-search/
├── electron/           # Electron main and preload scripts
│   ├── main/          # Main process (Node.js/SQLite)
│   └── preload/       # Preload scripts (contextBridge)
├── src/               # Renderer process (Vue app)
│   ├── components/    # Vue components
│   ├── composables/   # Composition API composables
│   ├── stores/        # Pinia stores
│   ├── styles/        # Global styles
│   └── App.vue        # Root component
├── scripts/           # Utility scripts
│   └── mdb_to_sqlite_fts5.py  # MDB converter
└── tests/             # Test files
```

## Converting Access Databases to SQLite

The project includes a robust Python script to convert Microsoft Access (.mdb) databases to SQLite with FTS5 full-text search indexing.

### Features

- **Corruption Handling**: Robust error recovery for corrupted MDB files
- **FTS5 Indexing**: Automatic full-text search index creation
- **Custom Tokenizers**: Porter stemming and unicode61 support
- **Prefix Indexing**: Configurable prefix lengths for autocomplete
- **Row Limiting**: Import subset of data for testing
- **Data Sanitization**: Handles special characters, null bytes, and invalid data

### Prerequisites

```bash
# Install mdbtools
# Ubuntu/Debian
sudo apt-get install mdbtools

# macOS
brew install mdbtools
```

### Usage

```bash
# Basic conversion
python scripts/mdb_to_sqlite_fts5.py \
  --input db/input.mdb \
  --output db/output.sqlite

# Convert specific tables
python scripts/mdb_to_sqlite_fts5.py \
  --input db/input.mdb \
  --output db/output.sqlite \
  --tables table1 table2

# Quick test with limited rows
python scripts/mdb_to_sqlite_fts5.py \
  --input db/input.mdb \
  --output db/output.sqlite \
  --limit 1000

# Custom FTS5 tokenizer
python scripts/mdb_to_sqlite_fts5.py \
  --input db/input.mdb \
  --output db/output.sqlite \
  --tokenizer "porter unicode61 remove_diacritics 2"

# Enable prefix indexing for autocomplete
python scripts/mdb_to_sqlite_fts5.py \
  --input db/input.mdb \
  --output db/output.sqlite \
  --prefix 2,3,4

# All options combined
python scripts/mdb_to_sqlite_fts5.py \
  --input db/input.mdb \
  --output db/output.sqlite \
  --tables patients diagnoses \
  --tokenizer "porter unicode61" \
  --prefix 2,3 \
  --limit 10000
```

### Handling Corrupted Databases

The converter automatically handles common corruption issues:

- Invalid page buffers and memory locations
- Incorrect memo field lengths
- Malformed rows with SQL syntax errors
- Column names with special characters
- Null bytes in text data

Corrupted rows are logged and skipped rather than stopping the entire conversion.

## Application Usage

1. Launch the application
2. Select a SQLite database file (or create one using the MDB converter)
3. Choose the FTS5 table and columns to search
4. Enter search terms using FTS5 syntax:
   - `word` - Find exact word
   - `word*` - Prefix match
   - `"phrase"` - Exact phrase
   - `word1 AND word2` - Boolean operators
5. View results in the data table
6. Copy result details using the copy button

## Testing

```bash
# Run unit tests
pnpm run test

# Run with UI
pnpm run test:ui

# Generate coverage report
pnpm run test:coverage
```

Test coverage includes:

- Vue components (SearchBar, ResultsTable, ThemeToggle)
- Composables (useTheme, useDatabase)
- Pinia stores (ui.store)

## Dependencies

### Production

- `vue` - Progressive JavaScript framework
- `vuetify` - Material Design component framework
- `pinia` - State management
- `sqlite3` - SQLite database driver
- `@mdi/font` - Material Design Icons

### Development

- `electron` - Desktop application framework
- `electron-vite` - Build tool for Electron
- `vite` - Next-generation frontend build tool
- `typescript` - Type-safe JavaScript
- `vitest` - Fast unit testing framework
- `eslint` - Code linting
- `prettier` - Code formatting

## Security

- **SQL Injection Protection**: Parameterized queries throughout
- **Context Isolation**: Electron contextBridge for secure IPC
- **Read-only Database Access**: Databases opened with OPEN_READONLY flag
- **Input Sanitization**: User input validated before processing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
