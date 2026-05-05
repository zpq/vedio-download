import { ref, reactive, watch } from 'vue'
import { parseVideo, buildDownloadUrl } from '../services/api'

export function useDownload() {
  const tasks = ref([])

  async function addUrls(urls) {
    for (const url of urls) {
      const trimmed = url.trim()
      if (!trimmed) continue
      const task = reactive({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        url: trimmed,
        status: 'parsing',
        info: null,
        selectedFormat: null,
        progress: null,
        error: null,
        result: null,
      })
      tasks.value.push(task)
      try {
        const res = await parseVideo(trimmed)
        if (res.success) {
          task.info = res.data
          task.status = 'ready'
        } else {
          task.status = 'error'
          task.error = res.error || '解析失败'
        }
      } catch {
        task.status = 'error'
        task.error = '网络错误'
      }
    }
  }

  function startDownload(task) {
    if (!task.selectedFormat) return
    task.status = 'downloading'
    task.progress = { percent: 0, totalSize: '', speed: '' }

    const params = {
      url: task.url,
      formatId: task.selectedFormat.formatId,
      title: task.info.title || '',
      site: task.info.site || '',
      resolution: task.selectedFormat.resolution || '',
      ext: task.selectedFormat.ext || '',
      filesize: task.selectedFormat.filesize || '',
    }

    const es = new EventSource(buildDownloadUrl(params))

    es.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data)
      if (data.status === 'merging') {
        task.progress = { percent: 100, status: 'merging', detail: '合并音视频中...' }
      } else if (data.status === 'converting') {
        task.progress = { percent: 100, status: 'converting', detail: '转换格式中...' }
      } else {
        task.progress = {
          percent: data.percent,
          totalSize: data.totalSize || '',
          speed: data.speed || '',
        }
      }
    })

    es.addEventListener('done', (e) => {
      es.close()
      const data = JSON.parse(e.data)
      task.result = data
      task.status = 'done'
    })

    es.addEventListener('error', () => {
      if (es.readyState === EventSource.CLOSED) return
      es.close()
      task.status = 'error'
      task.error = '下载出错'
    })
  }

  async function downloadAll() {
    const ready = tasks.value.filter(t => t.status === 'ready')
    for (const task of ready) {
      startDownload(task)
      await new Promise(resolve => {
        const unwatch = watch(() => task.status, (val) => {
          if (val === 'done' || val === 'error') {
            unwatch()
            resolve()
          }
        })
      })
    }
  }

  function removeTask(id) {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  function clearTasks() {
    tasks.value = []
  }

  return { tasks, addUrls, startDownload, downloadAll, removeTask, clearTasks }
}
