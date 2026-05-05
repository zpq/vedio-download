<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="['tab', { active: modelValue === tab.key }]"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
})

defineEmits(['update:modelValue'])

const tabs = [
  { key: 'download', label: '下载' },
  { key: 'history', label: '历史记录' },
  { key: 'settings', label: '设置' },
]
</script>

<style scoped>
.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--border);
}
.tab {
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-dim);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}
.tab:hover:not(.active) {
  color: var(--text);
}
</style>
