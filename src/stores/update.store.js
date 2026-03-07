/**
 * Update Store
 * Manages auto-update state for the application
 * Uses Pinia Composition API pattern
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUpdateStore = defineStore('update', () => {
  // State
  const status = ref('idle') // idle | checking | available | downloading | downloaded | error
  const availableVersion = ref(null)
  const releaseNotes = ref(null)
  const releaseDate = ref(null)
  const downloadProgress = ref(0)
  const errorMessage = ref(null)

  // Getters
  const hasUpdate = computed(() => status.value === 'available' || status.value === 'downloaded')
  const isDownloaded = computed(() => status.value === 'downloaded')
  const isChecking = computed(() => status.value === 'checking')
  const isDownloading = computed(() => status.value === 'downloading')

  // Actions
  function setChecking() {
    status.value = 'checking'
    errorMessage.value = null
  }

  function setAvailable(info) {
    status.value = 'available'
    availableVersion.value = info.version
    releaseNotes.value = info.releaseNotes || null
    releaseDate.value = info.releaseDate || null
  }

  function setNotAvailable() {
    status.value = 'idle'
  }

  function setDownloading() {
    status.value = 'downloading'
    downloadProgress.value = 0
  }

  function setProgress(percent) {
    downloadProgress.value = percent
  }

  function setDownloaded(info) {
    status.value = 'downloaded'
    availableVersion.value = info.version
    downloadProgress.value = 100
  }

  function setError(message) {
    status.value = 'error'
    errorMessage.value = message
  }

  function reset() {
    status.value = 'idle'
    availableVersion.value = null
    releaseNotes.value = null
    releaseDate.value = null
    downloadProgress.value = 0
    errorMessage.value = null
  }

  return {
    status,
    availableVersion,
    releaseNotes,
    releaseDate,
    downloadProgress,
    errorMessage,
    hasUpdate,
    isDownloaded,
    isChecking,
    isDownloading,
    setChecking,
    setAvailable,
    setNotAvailable,
    setDownloading,
    setProgress,
    setDownloaded,
    setError,
    reset,
  }
})
