<template>
  <div class="empty-state" :class="[`empty-state--${variant}`, { 'empty-state--compact': compact }]">
    <v-icon :icon="icon" :size="compact ? 48 : 64" :color="iconColor" class="empty-state__icon"></v-icon>

    <h3 class="empty-state__title text-h6">{{ title }}</h3>

    <p v-if="subtitle" class="empty-state__subtitle text-body-2 text-medium-emphasis">
      {{ subtitle }}
    </p>

    <!-- Suggestions list -->
    <div v-if="suggestions && suggestions.length" class="empty-state__suggestions">
      <p class="text-body-2 text-medium-emphasis mb-2">{{ suggestionsTitle }}</p>
      <ul class="empty-state__list">
        <li v-for="(suggestion, index) in suggestions" :key="index" class="text-body-2">
          <v-icon icon="mdi-chevron-right" size="x-small" class="mr-1"></v-icon>
          {{ suggestion }}
        </li>
      </ul>
    </div>

    <!-- Syntax hints for search -->
    <div v-if="showSyntaxHints" class="empty-state__hints mt-4">
      <p class="text-caption text-medium-emphasis mb-2">Quick syntax reference:</p>
      <div class="empty-state__chips">
        <v-chip
          v-for="hint in syntaxHints"
          :key="hint.syntax"
          size="small"
          variant="outlined"
          class="ma-1"
          @click="$emit('hint-click', hint.syntax)"
        >
          <code class="mr-1">{{ hint.syntax }}</code>
          <span class="text-medium-emphasis">{{ hint.label }}</span>
        </v-chip>
      </div>
    </div>

    <!-- Action buttons -->
    <div v-if="$slots.actions || primaryAction" class="empty-state__actions mt-4">
      <slot name="actions">
        <v-btn
          v-if="primaryAction"
          :color="primaryActionColor"
          variant="tonal"
          @click="$emit('primary-action')"
        >
          <v-icon v-if="primaryActionIcon" :icon="primaryActionIcon" start></v-icon>
          {{ primaryAction }}
        </v-btn>
        <v-btn
          v-if="secondaryAction"
          variant="text"
          class="ml-2"
          @click="$emit('secondary-action')"
        >
          {{ secondaryAction }}
        </v-btn>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: v => ['default', 'no-results', 'error', 'ready'].includes(v)
  },
  icon: {
    type: String,
    default: 'mdi-magnify'
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  suggestionsTitle: {
    type: String,
    default: 'Suggestions:'
  },
  showSyntaxHints: {
    type: Boolean,
    default: false
  },
  primaryAction: {
    type: String,
    default: ''
  },
  primaryActionIcon: {
    type: String,
    default: ''
  },
  primaryActionColor: {
    type: String,
    default: 'primary'
  },
  secondaryAction: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  }
})

defineEmits(['primary-action', 'secondary-action', 'hint-click'])

const iconColor = computed(() => {
  switch (props.variant) {
    case 'no-results': return 'warning'
    case 'error': return 'error'
    case 'ready': return 'primary'
    default: return 'grey'
  }
})

const syntaxHints = [
  { syntax: 'AND', label: 'both terms' },
  { syntax: 'OR', label: 'either term' },
  { syntax: 'NOT', label: 'exclude' },
  { syntax: '*', label: 'wildcard' },
  { syntax: '"..."', label: 'phrase' }
]
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  max-width: 480px;
  margin: 0 auto;
}

.empty-state--compact {
  padding: 24px 16px;
}

.empty-state__icon {
  margin-bottom: 16px;
  opacity: 0.7;
}

.empty-state__title {
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-state__subtitle {
  margin-bottom: 16px;
  max-width: 360px;
}

.empty-state__suggestions {
  text-align: left;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  max-width: 360px;
}

.empty-state__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.empty-state__list li {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.empty-state__hints {
  width: 100%;
  max-width: 400px;
}

.empty-state__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.empty-state__chips code {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.75rem;
}

.empty-state__actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Variant-specific styles */
.empty-state--no-results .empty-state__icon {
  color: rgb(var(--v-theme-warning));
}

.empty-state--error .empty-state__icon {
  color: rgb(var(--v-theme-error));
}

.empty-state--ready .empty-state__icon {
  color: rgb(var(--v-theme-primary));
  opacity: 0.8;
}
</style>
