import { ref, computed } from 'vue'
import { fetchHistory, deleteHistoryItem, clearAllHistory } from '../services/api'

const PAGE_SIZE = 20

export function useHistory() {
  const records = ref([])
  const search = ref('')
  const siteFilter = ref('')
  const page = ref(1)

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

  const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

  const paged = computed(() => {
    const start = (page.value - 1) * PAGE_SIZE
    return filtered.value.slice(start, start + PAGE_SIZE)
  })

  function resetPage() {
    page.value = 1
  }

  async function load() {
    const res = await fetchHistory()
    if (res.success) records.value = res.data
  }

  async function remove(id) {
    const res = await deleteHistoryItem(id)
    if (res.success) {
      records.value = res.data
      if (page.value > totalPages.value) page.value = totalPages.value
    }
  }

  async function clear() {
    await clearAllHistory()
    records.value = []
    page.value = 1
  }

  return {
    records, search, siteFilter, sites, filtered,
    page, totalPages, paged, resetPage,
    load, remove, clear,
  }
}
