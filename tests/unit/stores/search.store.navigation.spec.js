import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '@/stores/search.store'

describe('Search Store - Navigation', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSearchStore()
    // Set up test data
    store.setResults([
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
      { id: 3, name: 'Gamma' },
    ])
  })

  it('should track selectedItemIndex', () => {
    expect(store.selectedItemIndex).toBe(-1)
  })

  it('should set selectedItemIndex when setting selected item by index', () => {
    store.setSelectedItemByIndex(1)
    expect(store.selectedItemIndex).toBe(1)
    expect(store.selectedItem).toEqual({ id: 2, name: 'Beta' })
  })

  it('should navigate to next item', () => {
    store.setSelectedItemByIndex(0)
    store.navigateNext()
    expect(store.selectedItemIndex).toBe(1)
    expect(store.selectedItem).toEqual({ id: 2, name: 'Beta' })
  })

  it('should not navigate past last item', () => {
    store.setSelectedItemByIndex(2)
    store.navigateNext()
    expect(store.selectedItemIndex).toBe(2)
  })

  it('should navigate to previous item', () => {
    store.setSelectedItemByIndex(2)
    store.navigatePrevious()
    expect(store.selectedItemIndex).toBe(1)
    expect(store.selectedItem).toEqual({ id: 2, name: 'Beta' })
  })

  it('should not navigate before first item', () => {
    store.setSelectedItemByIndex(0)
    store.navigatePrevious()
    expect(store.selectedItemIndex).toBe(0)
  })

  it('should report canNavigateNext and canNavigatePrevious', () => {
    store.setSelectedItemByIndex(0)
    expect(store.canNavigatePrevious).toBe(false)
    expect(store.canNavigateNext).toBe(true)

    store.setSelectedItemByIndex(2)
    expect(store.canNavigatePrevious).toBe(true)
    expect(store.canNavigateNext).toBe(false)
  })

  it('should report navigation position string', () => {
    store.setSelectedItemByIndex(1)
    expect(store.navigationPosition).toBe('2 of 3')
  })

  it('should clear index on reset', () => {
    store.setSelectedItemByIndex(1)
    store.reset()
    expect(store.selectedItemIndex).toBe(-1)
  })
})
