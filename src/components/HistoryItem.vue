<template>
  <div class="history-item">
    <div class="item-main">
      <span class="item-title">{{ record.title }}</span>
      <div class="item-meta">
        <span class="badge">{{ record.site }}</span>
        <span class="badge" v-if="record.resolution">{{ record.resolution }}</span>
        <span class="badge" v-if="record.ext">{{ record.ext.toUpperCase() }}</span>
        <span class="time">{{ formatTime(record.downloadedAt) }}</span>
      </div>
    </div>
    <div class="item-actions">
      <button class="action-btn play" @click="showPlayer = !showPlayer" title="预览">
        {{ showPlayer ? '收起' : '▶' }}
      </button>
      <a :href="downloadUrl" class="action-btn dl" title="下载文件">⬇</a>
      <button class="action-btn del" @click="$emit('delete', record.id)" title="删除">✕</button>
    </div>
    <VideoPlayer v-if="showPlayer" :recordId="record.id" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VideoPlayer from './VideoPlayer.vue'
import { fileDownloadUrl } from '../services/api'

const props = defineProps({
  record: { type: Object, required: true },
})
defineEmits(['delete'])

const showPlayer = ref(false)
const downloadUrl = computed(() => fileDownloadUrl(props.record.id))

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.history-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
}
.item-main { min-width: 0; }
.item-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}
.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.badge {
  padding: 2px 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-dim);
}
.time { font-size: 11px; color: var(--text-dim); }
.item-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}
.action-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  color: var(--text-dim);
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s;
}
.action-btn:hover { border-color: var(--accent); color: var(--accent); }
.action-btn.del:hover { border-color: var(--error); color: var(--error); }
</style>
