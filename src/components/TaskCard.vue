<template>
  <div :class="['task-card', task.status]">
    <div class="task-header">
      <div class="task-title">
        <template v-if="task.info">{{ task.info.title }}</template>
        <template v-else>{{ task.url }}</template>
      </div>
      <button class="remove-btn" @click="$emit('remove')" title="移除">✕</button>
    </div>
    <div class="task-meta" v-if="task.info">
      <span class="badge">{{ task.info.site }}</span>
      <span class="badge" v-if="task.info.duration">{{ formatDuration(task.info.duration) }}</span>
    </div>

    <div v-if="task.status === 'ready'" class="task-actions">
      <FormatSelector
        :formats="task.info.formats"
        v-model="task.selectedFormat"
      />
      <button class="dl-btn" @click="$emit('download', task)" :disabled="!task.selectedFormat">
        下载
      </button>
    </div>

    <ProgressBar
      v-if="task.status === 'downloading' && task.progress"
      :percent="task.progress.percent"
      :totalSize="task.progress.totalSize"
      :speed="task.progress.speed"
      :status="task.progress.status"
    />

    <div v-if="task.status === 'done'" class="task-done">
      <span class="badge success">已完成</span>
      <span class="filename" v-if="task.result?.filename">{{ task.result.filename }}</span>
      <button class="play-btn" @click="showPlayer = !showPlayer">
        {{ showPlayer ? '收起' : '播放' }}
      </button>
      <VideoPlayer v-if="showPlayer && task.result?.record" :recordId="task.result.record.id" />
    </div>

    <div v-if="task.status === 'error'" class="task-error">
      {{ task.error }}
    </div>

    <div v-if="task.status === 'parsing'" class="task-parsing">解析中...</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FormatSelector from './FormatSelector.vue'
import ProgressBar from './ProgressBar.vue'
import VideoPlayer from './VideoPlayer.vue'

defineProps({
  task: { type: Object, required: true },
})
defineEmits(['remove', 'download'])

const showPlayer = ref(false)

function formatDuration(s) {
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}
</script>

<style scoped>
.task-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
}
.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.task-title {
  font-size: 14px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.remove-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}
.task-card:hover .remove-btn { opacity: 1; }
.remove-btn:hover { color: var(--error); }
.task-meta { margin-top: 6px; }
.badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-dim);
  margin-right: 6px;
}
.badge.success {
  background: rgba(34,197,94,0.1);
  border-color: var(--success);
  color: var(--success);
}
.task-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.dl-btn {
  padding: 8px 18px;
  background: var(--success);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.dl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dl-btn:hover:not(:disabled) { opacity: 0.9; }
.task-done {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filename { font-size: 12px; color: var(--text-dim); }
.play-btn {
  padding: 6px 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.play-btn:hover { opacity: 0.9; }
.task-error {
  margin-top: 8px;
  color: var(--error);
  font-size: 13px;
}
.task-parsing {
  margin-top: 8px;
  color: var(--text-dim);
  font-size: 13px;
}
</style>
