<template>
  <div class="history-tab">
    <HistorySearch
      v-model:search="search"
      v-model:siteFilter="siteFilter"
      :sites="sites"
      @update:search="resetPage"
      @update:siteFilter="resetPage"
    />
    <div class="history-list" v-if="paged.length">
      <HistoryItem
        v-for="r in paged"
        :key="r.id"
        :record="r"
        @delete="remove"
      />
    </div>
    <div v-else class="empty">暂无下载记录</div>

    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="page >= totalPages" @click="page++">下一页</button>
    </div>

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

const { records, search, siteFilter, sites, filtered, page, totalPages, paged, resetPage, load, remove, clear } = useHistory()

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
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}
.page-btn {
  padding: 6px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.page-btn:hover:not(:disabled) { border-color: var(--accent); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info {
  font-size: 13px;
  color: var(--text-dim);
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
