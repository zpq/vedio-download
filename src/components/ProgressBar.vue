<template>
  <div class="progress-wrap">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: clamped + '%' }"></div>
    </div>
    <div class="progress-info">
      <span>{{ clamped.toFixed(1) }}%</span>
      <span>{{ detail }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  percent: { type: Number, default: 0 },
  totalSize: { type: String, default: '' },
  speed: { type: String, default: '' },
  status: { type: String, default: '' },
})

const clamped = computed(() => Math.min(100, Math.max(0, props.percent)))
const detail = computed(() => {
  if (props.status === 'merging') return '合并音视频中...'
  if (props.status === 'converting') return '转换格式中...'
  return [props.totalSize, props.speed].filter(Boolean).join(' · ')
})
</script>

<style scoped>
.progress-wrap {
  margin-top: 10px;
}
.progress-bar {
  height: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--success));
  border-radius: 3px;
  transition: width 0.3s ease;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-dim);
}
</style>
