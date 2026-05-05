<template>
  <div class="settings-tab">
    <SettingsForm
      :settings="settings"
      :saving="saving"
      :message="message"
      @save="save"
    />
    <div class="theme-section">
      <h3>主题</h3>
      <div class="theme-options">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          :class="['theme-btn', { active: themeStore.mode === opt.value }]"
          @click="themeStore.setMode(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import SettingsForm from './SettingsForm.vue'
import { useSettings } from '../composables/useSettings'
import { useThemeStore } from '../stores/theme'

const { settings, saving, message, load, save } = useSettings()
const themeStore = useThemeStore()

const themeOptions = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

onMounted(load)
</script>

<style scoped>
.theme-section {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}
.theme-section h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}
.theme-options {
  display: flex;
  gap: 8px;
}
.theme-btn {
  padding: 8px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.theme-btn.active {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}
.theme-btn:hover:not(.active) { border-color: var(--text-dim); }
</style>
