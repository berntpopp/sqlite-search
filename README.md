# sqlite-search

## Overview

`sqlite-search` is a simple Electron-based desktop application designed to search SQLite databases using full-text search (FTS5). It provides a user-friendly interface for selecting a database, specifying search terms, and viewing search results.

## Features

- **Database Selection**: Users can select a SQLite database file to search.
- **Table and Column Selection**: Users can choose the table and columns to search within.
- **Full-Text Search**: Utilizes SQLite's FTS5 extension for efficient full-text search.
- **Interactive Results**: Displays search results in a table format with dynamic column selection.
- **Copy to Clipboard**: Allows users to copy search result details to the clipboard.
- **Dark/Light Theme**: Supports toggling between dark and light themes.

## Setup and Installation

1. Clone the repository: `git clone https://github.com/berntpopp/sqlite-search.git`
2. Navigate to the project directory: `cd sqlite-search`
3. Install dependencies: `npm install`
4. Start the application: `npm run electron:serve`

## Usage

1. Launch the application.
2. Select a SQLite database file by clicking the "Select Database" button.
3. Choose the table and columns to search within.
4. Enter the search term in the provided input field and press Enter or click the search icon.
5. View the search results in the table below.
6. Optionally, copy details of a specific result by clicking the copy icon.
7. Toggle between dark and light themes using the theme toggle button.
8. For further assistance or FAQs, click the "Help/FAQ" button.

## Prerequisites

- Node.js (npm)
- Electron
- Vue.js
- Vuetify

## Dependencies

- `sqlite3`: SQLite database driver for Node.js
- `electron`: Framework for creating native desktop applications
- `vue`: JavaScript framework for building user interfaces
- `vuetify`: Material Design component library for Vue.js

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
