<template>
  <div class="settings-form">
    <div class="field">
      <label>下载目录</label>
      <input v-model="settings.downloadDir" placeholder="默认: ./downloads" />
    </div>
    <div class="field">
      <label>代理地址</label>
      <input v-model="settings.proxy" placeholder="如 http://127.0.0.1:7890，留空则不走代理" />
    </div>
    <button class="save-btn" :disabled="saving" @click="$emit('save')">
      {{ saving ? '保存中...' : '保存设置' }}
    </button>
    <p v-if="message" :class="['msg', msgType]">{{ message }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  settings: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  message: { type: String, default: '' },
})
defineEmits(['save'])

const msgType = computed(() => props.message.includes('失败') ? 'error' : 'success')
</script>

<style scoped>
.field {
  margin-bottom: 16px;
}
.field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 14px;
  outline: none;
}
.field input:focus { border-color: var(--accent); }
.save-btn {
  padding: 10px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.save-btn:hover:not(:disabled) { background: var(--accent-hover); }
.msg {
  margin-top: 10px;
  font-size: 13px;
}
.msg.success { color: var(--success); }
.msg.error { color: var(--error); }
</style>
