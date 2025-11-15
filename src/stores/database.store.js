// src/stores/database.store.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDatabaseStore = defineStore('database', () => {
  // State - using ref for reactivity
  const path = ref(localStorage.getItem('databasePath') || '')
  const tables = ref([])
  const selectedTable = ref(localStorage.getItem('selectedTable') || '')
  const columns = ref([])
  const selectedColumns = ref(
    JSON.parse(localStorage.getItem('selectedColumns') || '[]')
  )

  // Getters - using computed
  const isConnected = computed(() => !!path.value)
  const hasSelectedTable = computed(() => !!selectedTable.value)
  const hasColumns = computed(() => columns.value.length > 0)
  const fileName = computed(() => {
    if (!path.value) return ''
    const pathParts = path.value.split(/[/\\]/)
    return pathParts[pathParts.length - 1]
  })

  // Actions
  function setPath(newPath) {
    path.value = newPath
    localStorage.setItem('databasePath', newPath)
  }

  function setTables(newTables) {
    tables.value = newTables
  }

  function selectTable(table) {
    selectedTable.value = table
    localStorage.setItem('selectedTable', table)
    // Reset columns when table changes
    selectedColumns.value = []
    localStorage.removeItem('selectedColumns')
  }

  function setColumns(newColumns) {
    columns.value = newColumns
  }

  function selectColumns(cols) {
    selectedColumns.value = cols
    localStorage.setItem('selectedColumns', JSON.stringify(cols))
  }

  function reset() {
    path.value = ''
    tables.value = []
    selectedTable.value = ''
    columns.value = []
    selectedColumns.value = []
    localStorage.removeItem('databasePath')
    localStorage.removeItem('selectedTable')
    localStorage.removeItem('selectedColumns')
  }

  function clearTableSelection() {
    selectedTable.value = ''
    columns.value = []
    selectedColumns.value = []
    localStorage.removeItem('selectedTable')
    localStorage.removeItem('selectedColumns')
  }

  return {
    // State
    path,
    tables,
    selectedTable,
    columns,
    selectedColumns,
    // Getters
    isConnected,
    hasSelectedTable,
    hasColumns,
    fileName,
    // Actions
    setPath,
    setTables,
    selectTable,
    setColumns,
    selectColumns,
    reset,
    clearTableSelection,
  }
})
