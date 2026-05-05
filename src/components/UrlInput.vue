<template>
  <div class="url-input">
    <textarea
      v-model="text"
      placeholder="粘贴视频链接，多个链接换行输入..."
      rows="3"
      @keydown.ctrl.enter="handleParse"
    />
    <button class="parse-btn" :disabled="loading" @click="handleParse">
      {{ loading ? '解析中...' : '解析' }}
    </button>
  </div>
  <p class="hint">支持批量，每行一个链接 · Ctrl+Enter 快捷解析</p>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['parse'])
const text = ref('')
const loading = ref(false)

async function handleParse() {
  const urls = text.value.split('\n').map(u => u.trim()).filter(Boolean)
  if (!urls.length) return
  loading.value = true
  emit('parse', urls)
  loading.value = false
}
</script>

<style scoped>
.url-input {
  display: flex;
  gap: 10px;
}
.url-input textarea {
  flex: 1;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 14px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.url-input textarea:focus {
  border-color: var(--accent);
}
.parse-btn {
  padding: 12px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.parse-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}
.parse-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.hint {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 6px;
}
</style>
