<template>
  <button class="theme-toggle" @click="cycleTheme" :title="label">
    <span v-if="resolvedTheme === 'dark'">☀️</span>
    <span v-else>🌙</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

const store = useThemeStore()
const resolvedTheme = computed(() => store.resolvedTheme)
const label = computed(() => resolvedTheme.value === 'dark' ? '切换到浅色' : '切换到深色')

function cycleTheme() {
  const next = store.mode === 'light' ? 'dark' : store.mode === 'dark' ? 'system' : 'light'
  store.setMode(next)
}
</script>

<style scoped>
.theme-toggle {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 16px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.theme-toggle:hover {
  border-color: var(--accent);
}
</style>
