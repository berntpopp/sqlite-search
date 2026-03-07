<template>
  <div class="expandable-text">
    <!-- eslint-disable vue/no-v-html -->
    <div
      ref="textRef"
      class="text-body-2 value-text"
      :class="{ collapsed: !expanded && shouldTruncate }"
      :style="collapsedStyle"
      v-html="displayHtml"
    ></div>
    <!-- eslint-enable vue/no-v-html -->
    <v-btn
      v-if="shouldTruncate"
      variant="text"
      size="x-small"
      density="compact"
      class="expand-btn mt-1"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : `Show more (${charCount} chars)` }}
      <v-icon end size="x-small">
        {{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
      </v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  html: { type: String, required: true },
  rawLength: { type: Number, default: 0 },
  maxLines: { type: Number, default: 3 },
  charThreshold: { type: Number, default: 200 },
})

const expanded = ref(false)

const shouldTruncate = computed(() => props.rawLength > props.charThreshold)

const charCount = computed(() => props.rawLength.toLocaleString())

const collapsedStyle = computed(() => {
  if (!shouldTruncate.value || expanded.value) return {}
  return {
    maxHeight: `${props.maxLines * 1.5}em`,
    overflow: 'hidden',
  }
})

const displayHtml = computed(() => props.html)

defineExpose({ expanded })
</script>

<style scoped>
.expandable-text {
  width: 100%;
}

.value-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.collapsed {
  position: relative;
}

.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1.5em;
  background: linear-gradient(transparent, var(--v-theme-surface, #fff));
  pointer-events: none;
}

.expand-btn {
  text-transform: none;
  font-size: 0.75rem;
  padding: 0 4px;
}

:deep(mark) {
  background-color: rgba(255, 213, 0, 0.4);
  border-radius: 2px;
  padding: 0 1px;
}
</style>
