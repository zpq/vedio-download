<template>
  <div class="history-search">
    <input
      v-model="searchModel"
      placeholder="搜索标题或链接..."
      class="search-input"
    />
    <select v-model="siteFilterModel" class="site-select">
      <option value="">全部网站</option>
      <option v-for="s in sites.slice(1)" :key="s" :value="s">{{ s }}</option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  search: { type: String, default: '' },
  siteFilter: { type: String, default: '' },
  sites: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:search', 'update:siteFilter'])

const searchModel = computed({
  get: () => props.search,
  set: (val) => emit('update:search', val),
})
const siteFilterModel = computed({
  get: () => props.siteFilter,
  set: (val) => emit('update:siteFilter', val),
})
</script>

<style scoped>
.history-search {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.search-input {
  flex: 1;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 13px;
  outline: none;
}
.search-input:focus { border-color: var(--accent); }
.site-select {
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
</style>
