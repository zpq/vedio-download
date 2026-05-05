<template>
  <div class="download-tab">
    <UrlInput @parse="handleParse" />
    <div class="task-list" v-if="tasks.length">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @remove="removeTask(task.id)"
        @download="startDownload"
      />
    </div>
    <div v-if="hasReady" class="batch-actions">
      <button class="primary" @click="downloadAll">全部下载</button>
    </div>
    <div v-if="!tasks.length" class="empty">解析视频后，任务将显示在这里</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import UrlInput from './UrlInput.vue'
import TaskCard from './TaskCard.vue'
import { useDownload } from '../composables/useDownload'

const { tasks, addUrls, startDownload, downloadAll, removeTask } = useDownload()
const hasReady = computed(() => tasks.value.some(t => t.status === 'ready'))

function handleParse(urls) {
  addUrls(urls)
}
</script>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}
.batch-actions {
  margin-top: 16px;
  text-align: center;
}
.primary {
  padding: 12px 32px;
  background: var(--success);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.primary:hover { opacity: 0.9; }
.empty {
  text-align: center;
  color: var(--text-dim);
  font-size: 13px;
  margin-top: 40px;
}
</style>
