#!/usr/bin/env python3
"""
MDB to SQLite FTS5 Converter
=============================

Converts Microsoft Access (.mdb) tables to SQLite database with FTS5 full-text search support.
This script creates both regular tables and FTS5 virtual tables for efficient text searching.

Requirements:
    - mdbtools (Linux: sudo apt install mdbtools, macOS: brew install mdbtools)
    - Python 3.7+

Usage:
    python scripts/mdb_to_sqlite_fts5.py \
        --input db/input.mdb \
        --output db/output.sqlite \
        --tables table1 table2 \
        --fts-columns all

Features:
    - Exports specified tables from MDB to SQLite
    - Creates FTS5 virtual tables for full-text search
    - Configurable tokenizer (porter, unicode61, ascii, trigram)
    - Support for external content tables (saves storage)
    - Automatic schema detection and creation
    - Progress reporting and error handling

Author: Generated with Claude Code
License: Same as sqlite-search project
"""

import argparse
import csv
import os
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import List, Optional, Tuple


class MDBToSQLiteConverter:
    """
    Converts Microsoft Access MDB tables to SQLite with FTS5 support.

    Best practices implemented:
    - Uses mdbtools for cross-platform MDB reading
    - Creates FTS5 virtual tables with external content for efficiency
    - Configurable tokenizer (porter stemming recommended)
    - Proper error handling and transaction management
    """

    def __init__(
        self,
        input_mdb: str,
        output_sqlite: str,
        tokenizer: str = "porter unicode61",
        prefix_index: Optional[List[int]] = None,
        verbose: bool = True
    ):
        """
        Initialize the converter.

        Args:
            input_mdb: Path to input .mdb file
            output_sqlite: Path to output .sqlite file
            tokenizer: FTS5 tokenizer (default: 'porter unicode61' for stemming + multilingual)
            prefix_index: List of prefix lengths for prefix indexing (e.g., [2, 3])
            verbose: Enable verbose output
        """
        self.input_mdb = Path(input_mdb)
        self.output_sqlite = Path(output_sqlite)
        self.tokenizer = tokenizer
        self.prefix_index = prefix_index
        self.verbose = verbose

        if not self.input_mdb.exists():
            raise FileNotFoundError(f"Input MDB file not found: {self.input_mdb}")

        self._check_mdbtools()

    def _check_mdbtools(self):
        """Verify mdbtools is installed."""
        try:
            subprocess.run(
                ["mdb-ver", "--version"],
                capture_output=True,
                check=True
            )
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise RuntimeError(
                "mdbtools not found. Install it:\n"
                "  Ubuntu/Debian: sudo apt install mdbtools\n"
                "  macOS: brew install mdbtools\n"
                "  Windows: Use WSL or download from mdbtools.sourceforge.net"
            )

    def _log(self, message: str):
        """Log message if verbose mode is enabled."""
        if self.verbose:
            print(f"[INFO] {message}")

    def _error(self, message: str):
        """Log error message."""
        print(f"[ERROR] {message}", file=sys.stderr)

    def list_tables(self) -> List[str]:
        """
        List all tables in the MDB file.

        Returns:
            List of table names
        """
        result = subprocess.run(
            ["mdb-tables", "-1", str(self.input_mdb)],
            capture_output=True,
            text=True,
            check=True
        )
        tables = [t.strip() for t in result.stdout.strip().split("\n") if t.strip()]
        return tables

    def get_table_schema(self, table_name: str) -> List[Tuple[str, str]]:
        """
        Get schema for a table from MDB file.

        Args:
            table_name: Name of the table

        Returns:
            List of (column_name, data_type) tuples
        """
        result = subprocess.run(
            ["mdb-schema", str(self.input_mdb), "sqlite", "-T", table_name],
            capture_output=True,
            text=True,
            check=True
        )

        # Parse CREATE TABLE statement to extract columns
        schema = []
        create_stmt = result.stdout

        # Extract column definitions from CREATE TABLE
        if "CREATE TABLE" in create_stmt:
            # Find the columns section between parentheses
            start = create_stmt.find("(")
            end = create_stmt.rfind(")")
            if start != -1 and end != -1:
                columns_str = create_stmt[start+1:end]
                for line in columns_str.split("\n"):
                    line = line.strip().rstrip(",")
                    if line and not line.startswith("--"):
                        # Parse: column_name data_type [constraints]
                        parts = line.split(maxsplit=1)
                        if len(parts) >= 2:
                            col_name = parts[0].strip().strip('"').strip("[]")
                            col_type = parts[1].split()[0].upper()
                            schema.append((col_name, col_type))

        return schema

    def export_table(self, table_name: str, fts_columns: Optional[List[str]] = None):
        """
        Export a table from MDB to SQLite with FTS5 support.

        Args:
            table_name: Name of the table to export
            fts_columns: List of columns to include in FTS5 index, or 'all'
        """
        self._log(f"Exporting table: {table_name}")

        # Get schema
        schema = self.get_table_schema(table_name)
        if not schema:
            self._error(f"Could not determine schema for table: {table_name}")
            return

        self._log(f"  Schema: {len(schema)} columns")

        # Export to temporary CSV
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as tmpfile:
            csv_path = tmpfile.name

        try:
            # Export data using mdb-export
            subprocess.run(
                ["mdb-export", str(self.input_mdb), table_name],
                stdout=open(csv_path, 'w'),
                check=True
            )

            # Import to SQLite
            conn = sqlite3.connect(str(self.output_sqlite))
            cursor = conn.cursor()

            try:
                # Create regular table
                columns_def = ", ".join([
                    f'"{col[0]}" {col[1]}' for col in schema
                ])

                # Drop if exists and create
                cursor.execute(f'DROP TABLE IF EXISTS "{table_name}"')
                cursor.execute(f'CREATE TABLE "{table_name}" ({columns_def})')

                # Import CSV data
                with open(csv_path, 'r', encoding='utf-8', errors='replace') as csvfile:
                    csv_reader = csv.reader(csvfile)
                    header = next(csv_reader)  # Skip header

                    # Prepare INSERT statement
                    placeholders = ", ".join(["?" for _ in header])
                    insert_sql = f'INSERT INTO "{table_name}" VALUES ({placeholders})'

                    # Import rows
                    row_count = 0
                    for row in csv_reader:
                        # Handle NULL values
                        processed_row = [
                            None if val == '' or val.upper() == 'NULL' else val
                            for val in row
                        ]
                        cursor.execute(insert_sql, processed_row)
                        row_count += 1

                    self._log(f"  Imported {row_count} rows")

                # Create FTS5 virtual table if requested
                if fts_columns:
                    self._create_fts5_table(cursor, table_name, schema, fts_columns)

                conn.commit()
                self._log(f"  ✓ Table '{table_name}' exported successfully")

            except Exception as e:
                conn.rollback()
                self._error(f"Failed to import table {table_name}: {e}")
                raise

            finally:
                conn.close()

        finally:
            # Clean up temporary CSV file
            if os.path.exists(csv_path):
                os.remove(csv_path)

    def _create_fts5_table(
        self,
        cursor: sqlite3.Cursor,
        table_name: str,
        schema: List[Tuple[str, str]],
        fts_columns: List[str]
    ):
        """
        Create FTS5 virtual table for full-text search.

        Args:
            cursor: SQLite cursor
            table_name: Name of the base table
            schema: Table schema
            fts_columns: Columns to include in FTS5 index ('all' or list of column names)
        """
        fts_table_name = f"{table_name}_fts"

        # Determine which columns to index
        if fts_columns == ['all']:
            # Index all text columns
            text_columns = [
                col[0] for col in schema
                if 'TEXT' in col[1].upper() or 'VARCHAR' in col[1].upper() or 'CHAR' in col[1].upper()
            ]
        else:
            text_columns = fts_columns

        if not text_columns:
            self._log(f"  No text columns found for FTS5 index")
            return

        # Build FTS5 CREATE statement with external content table
        columns_str = ", ".join([f'"{col}"' for col in text_columns])

        # FTS5 options
        fts_options = [
            f"content='{table_name}'",
            f"content_rowid='rowid'",
            f"tokenize='{self.tokenizer}'"
        ]

        if self.prefix_index:
            prefix_str = " ".join(map(str, self.prefix_index))
            fts_options.append(f"prefix='{prefix_str}'")

        options_str = ", ".join(fts_options)

        # Create FTS5 table
        cursor.execute(f'DROP TABLE IF EXISTS "{fts_table_name}"')
        cursor.execute(
            f'CREATE VIRTUAL TABLE "{fts_table_name}" USING fts5('
            f'{columns_str}, {options_str})'
        )

        # Populate FTS5 table
        cursor.execute(
            f'INSERT INTO "{fts_table_name}"("{fts_table_name}") VALUES("rebuild")'
        )

        self._log(f"  ✓ Created FTS5 index on columns: {', '.join(text_columns)}")

    def convert(self, tables: Optional[List[str]] = None, fts_columns: str = "all"):
        """
        Convert MDB tables to SQLite with FTS5.

        Args:
            tables: List of specific tables to convert, or None for all tables
            fts_columns: 'all' to index all text columns, 'none' to skip FTS5,
                        or comma-separated list of column names
        """
        # Get list of tables to convert
        if tables:
            table_list = tables
        else:
            table_list = self.list_tables()
            self._log(f"Found {len(table_list)} tables in MDB file")

        # Determine FTS column strategy
        if fts_columns.lower() == "none":
            fts_cols = None
        elif fts_columns.lower() == "all":
            fts_cols = ['all']
        else:
            fts_cols = [col.strip() for col in fts_columns.split(",")]

        # Export each table
        for table_name in table_list:
            try:
                self.export_table(table_name, fts_cols)
            except Exception as e:
                self._error(f"Failed to export table '{table_name}': {e}")
                continue

        self._log(f"\n✓ Conversion complete: {self.output_sqlite}")
        self._log(f"  Database size: {self.output_sqlite.stat().st_size / 1024:.2f} KB")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Convert Microsoft Access MDB to SQLite with FTS5 full-text search",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert specific tables with FTS5 on all text columns
  python scripts/mdb_to_sqlite_fts5.py \\
      --input db/input.mdb \\
      --output db/output.sqlite \\
      --tables table1 table2

  # Convert all tables without FTS5
  python scripts/mdb_to_sqlite_fts5.py \\
      --input db/input.mdb \\
      --output db/output.sqlite \\
      --fts-columns none

  # Convert with specific FTS columns and prefix indexing
  python scripts/mdb_to_sqlite_fts5.py \\
      --input db/input.mdb \\
      --output db/output.sqlite \\
      --tables myTable \\
      --fts-columns "Name,Description" \\
      --prefix 2,3
        """
    )

    parser.add_argument(
        "-i", "--input",
        required=True,
        help="Input MDB file path"
    )

    parser.add_argument(
        "-o", "--output",
        required=True,
        help="Output SQLite file path"
    )

    parser.add_argument(
        "-t", "--tables",
        nargs="+",
        help="Specific tables to convert (default: all tables)"
    )

    parser.add_argument(
        "-f", "--fts-columns",
        default="all",
        help="Columns for FTS5 index: 'all' (default), 'none', or comma-separated list"
    )

    parser.add_argument(
        "--tokenizer",
        default="porter unicode61",
        help="FTS5 tokenizer (default: 'porter unicode61' for stemming + multilingual)"
    )

    parser.add_argument(
        "--prefix",
        help="Prefix index lengths (e.g., '2,3' for 2 and 3 character prefixes)"
    )

    parser.add_argument(
        "-l", "--list-tables",
        action="store_true",
        help="List all tables in MDB file and exit"
    )

    parser.add_argument(
        "-q", "--quiet",
        action="store_true",
        help="Suppress verbose output"
    )

    args = parser.parse_args()

    # Parse prefix index
    prefix_index = None
    if args.prefix:
        prefix_index = [int(x.strip()) for x in args.prefix.split(",")]

    # Create converter
    try:
        converter = MDBToSQLiteConverter(
            input_mdb=args.input,
            output_sqlite=args.output,
            tokenizer=args.tokenizer,
            prefix_index=prefix_index,
            verbose=not args.quiet
        )

        # List tables mode
        if args.list_tables:
            tables = converter.list_tables()
            print(f"Tables in {args.input}:")
            for table in tables:
                print(f"  - {table}")
            return 0

        # Convert mode
        converter.convert(
            tables=args.tables,
            fts_columns=args.fts_columns
        )

        return 0

    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
