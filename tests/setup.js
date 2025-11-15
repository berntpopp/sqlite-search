// tests/setup.js
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock window.electronAPI for testing
global.window.electronAPI = {
  performSearch: vi.fn(),
  getTableList: vi.fn(),
  getColumns: vi.fn(),
  openFileDialog: vi.fn(),
  changeDatabase: vi.fn(),
  onSearchResults: vi.fn(),
  onSearchError: vi.fn(),
  onTableList: vi.fn(),
  onTableListError: vi.fn(),
  onColumnList: vi.fn(),
  onColumnListError: vi.fn(),
}

// Configure Vue Test Utils
config.global.mocks = {
  $electronAPI: global.window.electronAPI,
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}
