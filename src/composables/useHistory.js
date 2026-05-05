import { ref, computed } from 'vue'
import { fetchHistory, deleteHistoryItem, clearAllHistory } from '../services/api'

export function useHistory() {
  const records = ref([])
  const search = ref('')
  const siteFilter = ref('')

  const sites = computed(() => {
    const set = new Set(records.value.map(r => r.site).filter(Boolean))
    return ['', ...Array.from(set).sort()]
  })

  const filtered = computed(() => {
    return records.value.filter(r => {
      const q = search.value.toLowerCase()
      if (q && !r.title.toLowerCase().includes(q) && !r.url.toLowerCase().includes(q)) return false
      if (siteFilter.value && r.site !== siteFilter.value) return false
      return true
    })
  })

  async function load() {
    const res = await fetchHistory()
    if (res.success) records.value = res.data
  }

  async function remove(id) {
    const res = await deleteHistoryItem(id)
    if (res.success) records.value = res.data
  }

  async function clear() {
    await clearAllHistory()
    records.value = []
  }

  return { records, search, siteFilter, sites, filtered, load, remove, clear }
}
