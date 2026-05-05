<template>
  <div class="history-tab">
    <HistorySearch
      v-model:search="search"
      v-model:siteFilter="siteFilter"
      :sites="sites"
    />
    <div class="history-list" v-if="filtered.length">
      <HistoryItem
        v-for="r in filtered"
        :key="r.id"
        :record="r"
        @delete="remove"
      />
    </div>
    <div v-else class="empty">暂无下载记录</div>
    <div class="history-footer" v-if="records.length">
      <button class="clear-btn" @click="clear">清空全部</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import HistorySearch from './HistorySearch.vue'
import HistoryItem from './HistoryItem.vue'
import { useHistory } from '../composables/useHistory'

const { records, search, siteFilter, sites, filtered, load, remove, clear } = useHistory()

onMounted(load)
</script>

<style scoped>
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty {
  text-align: center;
  color: var(--text-dim);
  font-size: 13px;
  padding: 32px 0;
}
.history-footer {
  margin-top: 16px;
  text-align: center;
}
.clear-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-dim);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.clear-btn:hover { color: var(--error); border-color: var(--error); }
</style>
