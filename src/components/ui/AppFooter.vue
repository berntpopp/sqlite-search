<template>
  <!-- Compact modern footer with elevation -->
  <v-footer app class="pa-2" elevation="2" border="t">
    <v-row justify="center" no-gutters dense>
      <v-col v-for="link in links" :key="link.text" cols="auto">
        <v-btn
          :href="link.href"
          :icon="link.icon"
          target="_blank"
          variant="text"
          size="small"
          density="compact"
        >
          <v-icon size="small">{{ link.icon }}</v-icon>
          <v-tooltip activator="parent" location="top">{{
            link.text
          }}</v-tooltip>
        </v-btn>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script setup>
import footerConfig from '@/config/footerConfig.json'

// Footer links from config
const links = footerConfig.links
</script>

<style scoped>
/* Compact footer styling */
.v-footer {
  min-height: 48px !important;
}
</style>
