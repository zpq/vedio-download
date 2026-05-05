# 视频下载工具重构 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有原生 HTML/JS 前端重构为 Vue 3 + Vite SPA，新增批量下载、视频预览、设置管理（下载目录/代理）、主题切换、历史搜索筛选功能。

**Architecture:** 前端 Vue 3 SPA 通过 Vite 开发服务器代理后端 Express API。Express 继续作为独立后端服务在 3000 端口运行。Vite 开发时代理 API 请求到 3000 端口，生产构建时将静态文件输出到 `server/public` 供 Express 直接托管。

**Tech Stack:** Vue 3, Vite, Pinia, Express, yt-dlp, SSE

---

## 文件变更清单

### 删除（旧前端）
- `public/index.html`
- `public/style.css`
- `public/app.js`

### 新建（后端）
- `server/settings-service.js` — 设置读写服务
- `server/public/` — Vite 构建产物输出目录（生产部署用）

### 修改（后端）
- `server/video-service.js` — 接受 downloadDir/proxy 参数
- `server/history-service.js` — 新增 filename/filepath 字段
- `server/index.js` — 新增 settings/preview/files 路由，移除旧 static 中间件
- `package.json` — 新增 vite/vue 开发依赖和脚本

### 新建（前端）
- `index.html` — Vite 入口 HTML
- `vite.config.js` — Vite 配置（开发代理 + 构建输出）
- `src/main.js` — Vue 应用入口
- `src/App.vue` — 根组件（布局 + Tab 路由）
- `src/style/variables.css` — 深色/浅色 CSS 变量
- `src/style/global.css` — 全局样式
- `src/stores/theme.js` — Pinia 主题 store
- `src/services/api.js` — 后端 API 封装
- `src/composables/useDownload.js` — SSE 下载逻辑
- `src/composables/useHistory.js` — 历史记录 + 搜索筛选
- `src/composables/useSettings.js` — 设置读写
- `src/components/TabBar.vue` — Tab 导航
- `src/components/ThemeToggle.vue` — 主题切换按钮
- `src/components/DownloadTab.vue` — 下载页容器
- `src/components/UrlInput.vue` — 多行 URL 输入
- `src/components/TaskCard.vue` — 视频任务卡片
- `src/components/FormatSelector.vue` — 格式选择下拉
- `src/components/ProgressBar.vue` — 下载进度条
- `src/components/VideoPlayer.vue` — 视频预览播放器
- `src/components/HistoryTab.vue` — 历史记录页容器
- `src/components/HistorySearch.vue` — 搜索 + 筛选
- `src/components/HistoryItem.vue` — 单条历史记录
- `src/components/SettingsTab.vue` — 设置页
- `src/components/SettingsForm.vue` — 设置表单

---

### Task 1: 初始化 Vite + Vue 3 项目

**Files:**
- Modify: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Delete: `public/index.html`, `public/style.css`, `public/app.js`

- [ ] **Step 1: 安装 Vue 3 + Vite 依赖**

```bash
cd D:\workspace\js\application\all_network_vedio_download
npm install vue pinia
npm install -D vite @vitejs/plugin-vue
```

- [ ] **Step 2: 更新 package.json 脚本**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node server/index.js",
    "start": "npm run build && npm run server"
  }
}
```

- [ ] **Step 3: 创建 vite.config.js**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'server/public',
    emptyOutDir: true,
  },
})
```

- [ ] **Step 4: 创建 index.html（Vite 入口）**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>视频下载工具</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: 创建 src/main.js**

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style/variables.css'
import './style/global.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

- [ ] **Step 6: 删除旧前端文件**

```bash
rm public/index.html public/style.css public/app.js
```

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: 初始化 Vite + Vue 3 项目，移除旧前端"
```

---

### Task 2: 主题系统（CSS 变量 + Pinia store）

**Files:**
- Create: `src/style/variables.css`
- Create: `src/style/global.css`
- Create: `src/stores/theme.js`
- Create: `src/components/ThemeToggle.vue`

- [ ] **Step 1: 创建 src/style/variables.css**

```css
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --border: #e2e8f0;
  --text: #1e293b;
  --text-dim: #94a3b8;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --success: #22c55e;
  --error: #ef4444;
  --radius: 10px;
}

[data-theme="dark"] {
  --bg: #0f0f0f;
  --surface: #1a1a2e;
  --border: #2d2d44;
  --text: #e0e0e0;
  --text-dim: #888;
  --accent: #6c63ff;
  --accent-hover: #5a52d5;
  --success: #4ecdc4;
  --error: #ff6b6b;
}
```

- [ ] **Step 2: 创建 src/style/global.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  transition: background 0.3s, color 0.3s;
}

.hidden {
  display: none !important;
}
```

- [ ] **Step 3: 创建 src/stores/theme.js**

```js
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: localStorage.getItem('theme') || 'system',
  }),
  getters: {
    resolvedTheme(state) {
      if (state.mode === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return state.mode
    },
  },
  actions: {
    setMode(mode) {
      this.mode = mode
      localStorage.setItem('theme', mode)
      this.apply()
    },
    apply() {
      document.documentElement.setAttribute('data-theme', this.resolvedTheme)
    },
    init() {
      this.apply()
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.mode === 'system') this.apply()
      })
    },
  },
})
```

- [ ] **Step 4: 创建 src/components/ThemeToggle.vue**

```vue
<template>
  <button class="theme-toggle" @click="cycleTheme" :title="label">
    <span v-if="resolvedTheme === 'dark'">☀️</span>
    <span v-else>🌙</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

const store = useThemeStore()
const resolvedTheme = computed(() => store.resolvedTheme)
const label = computed(() => resolvedTheme.value === 'dark' ? '切换到浅色' : '切换到深色')

function cycleTheme() {
  const next = store.mode === 'light' ? 'dark' : store.mode === 'dark' ? 'system' : 'light'
  store.setMode(next)
}
</script>

<style scoped>
.theme-toggle {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 16px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.theme-toggle:hover {
  border-color: var(--accent);
}
</style>
```

- [ ] **Step 5: 在 main.js 中初始化主题**

在 `src/main.js` 的 `app.mount('#app')` 之后添加：

```js
import { useThemeStore } from './stores/theme'
const theme = useThemeStore()
theme.init()
```

注意：需要在 `app.mount('#app')` 之后调用，因为 Pinia store 需要应用已挂载。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: 主题系统 — CSS 变量 + Pinia store + 切换按钮"
```

---

### Task 3: 后端设置服务 + 历史记录增强

**Files:**
- Create: `server/settings-service.js`
- Modify: `server/history-service.js`
- Modify: `server/index.js`

- [ ] **Step 1: 创建 server/settings-service.js**

```js
const fs = require('fs')
const path = require('path')

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json')

const DEFAULTS = {
  downloadDir: path.join(__dirname, '..', 'downloads'),
  proxy: '',
}

function ensureDataDir() {
  const dir = path.dirname(SETTINGS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function getSettings() {
  ensureDataDir()
  if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULTS }
  try {
    const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    return { ...DEFAULTS, ...saved }
  } catch {
    return { ...DEFAULTS }
  }
}

function updateSettings(updates) {
  const current = getSettings()
  const merged = { ...current, ...updates }
  ensureDataDir()
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}

module.exports = { getSettings, updateSettings }
```

- [ ] **Step 2: 修改 history-service.js，新增 filename/filepath 字段**

在 `addRecord` 函数的 entry 对象中添加：

```js
filename: record.filename || null,
filepath: record.filepath || null,
```

- [ ] **Step 3: 修改 server/index.js — 新增路由 + 旧 static 替换**

完整重写 `server/index.js`：

```js
const express = require('express')
const path = require('path')
const fs = require('fs')
const { parseVideo, downloadVideoStream } = require('./video-service')
const { addRecord, getHistory, deleteRecord, clearHistory } = require('./history-service')
const { getSettings, updateSettings } = require('./settings-service')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// 生产环境：托管 Vite 构建产物
const publicDir = path.join(__dirname, 'public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
}

// 解析
app.post('/api/parse', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ success: false, error: '请输入视频网址' })
  try {
    const info = await parseVideo(url)
    res.json({ success: true, data: info })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 下载（SSE）
app.get('/api/download', async (req, res) => {
  const { url, formatId, title, site, resolution, ext, filesize } = req.query
  if (!url) return res.status(400).json({ success: false, error: '请输入视频网址' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const settings = getSettings()
    const result = await downloadVideoStream(
      url,
      formatId || null,
      settings,
      (progress) => send('progress', progress)
    )
    const record = addRecord({
      title: title || result.filename || '未知',
      url, site, resolution, ext, filesize,
      filename: result.filename,
      filepath: result.filepath,
    })
    send('done', { ...result, record })
  } catch (err) {
    send('error', { error: err.message })
  } finally {
    res.end()
  }
})

// 历史记录
app.get('/api/history', (req, res) => {
  res.json({ success: true, data: getHistory() })
})

app.delete('/api/history/:id', (req, res) => {
  const remaining = deleteRecord(req.params.id)
  res.json({ success: true, data: remaining })
})

app.delete('/api/history', (req, res) => {
  clearHistory()
  res.json({ success: true })
})

// 视频预览（支持 Range 请求）
app.get('/api/preview/:id', (req, res) => {
  const history = getHistory()
  const record = history.find(r => r.id === req.params.id)
  if (!record || !record.filepath) {
    return res.status(404).json({ success: false, error: '文件不存在' })
  }
  if (!fs.existsSync(record.filepath)) {
    return res.status(404).json({ success: false, error: '文件已被删除' })
  }
  const stat = fs.statSync(record.filepath)
  const range = req.headers.range
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': 'video/mp4',
    })
    fs.createReadStream(record.filepath, { start, end }).pipe(res)
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': 'video/mp4',
    })
    fs.createReadStream(record.filepath).pipe(res)
  }
})

// 文件下载
app.get('/api/files/:id', (req, res) => {
  const history = getHistory()
  const record = history.find(r => r.id === req.params.id)
  if (!record || !record.filepath) {
    return res.status(404).json({ success: false, error: '文件不存在' })
  }
  if (!fs.existsSync(record.filepath)) {
    return res.status(404).json({ success: false, error: '文件已被删除' })
  }
  res.download(record.filepath, record.filename || path.basename(record.filepath))
})

// 设置
app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: getSettings() })
})

app.put('/api/settings', (req, res) => {
  const updated = updateSettings(req.body)
  res.json({ success: true, data: updated })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: 后端设置服务 + 历史 filename/filepath + 预览/文件下载 API"
```

---

### Task 4: 修改 video-service.js 支持设置参数

**Files:**
- Modify: `server/video-service.js`

- [ ] **Step 1: 修改 downloadVideoStream 函数签名和逻辑**

将 `downloadVideoStream(url, formatId, onProgress)` 改为 `downloadVideoStream(url, formatId, settings, onProgress)`，使用 settings.downloadDir 和 settings.proxy：

完整替换 `server/video-service.js`：

```js
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', d => stdout += d)
    proc.stderr.on('data', d => stderr += d)
    proc.on('error', reject)
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || `yt-dlp exited with code ${code}`))
      resolve(stdout)
    })
  })
}

async function parseVideo(url) {
  const output = await runYtDlp(['--dump-json', '--no-playlist', '--no-warnings', url])
  const info = JSON.parse(output)
  const formats = (info.formats || [])
    .filter(f => f.vcodec !== 'none' || f.acodec !== 'none')
    .map(f => ({
      formatId: f.format_id,
      ext: f.ext,
      resolution: f.resolution || (f.width ? `${f.width}x${f.height}` : 'audio only'),
      filesize: f.filesize || f.filesize_approx || null,
      vcodec: f.vcodec || '',
      acodec: f.acodec || '',
      tbr: f.tbr || null,
    }))

  return {
    title: info.title,
    thumbnail: info.thumbnail,
    duration: info.duration,
    site: info.extractor_key,
    formats: formats.filter(f => f.vcodec && f.vcodec !== 'none'),
    audioFormats: formats.filter(f => !f.vcodec || f.vcodec === 'none'),
  }
}

function downloadVideoStream(url, formatId, settings, onProgress) {
  return new Promise((resolve, reject) => {
    const downloadDir = settings.downloadDir || path.join(__dirname, '..', 'downloads')
    ensureDir(downloadDir)
    const outputTemplate = path.join(downloadDir, '%(title)s.%(ext)s')

    const args = [
      '--no-playlist',
      '--newline',
      '--progress',
      '--print', 'after_move:filepath',
      '-o', outputTemplate,
    ]

    if (formatId) {
      args.push('-f', formatId)
    } else {
      args.push('-f', 'best')
    }

    if (settings.proxy) {
      args.push('--proxy', settings.proxy)
    }

    args.push(url)

    const proc = spawn('yt-dlp', args)

    let lastFilepath = ''

    const progressRe = /\[download\]\s+(\d+\.?\d*)%/
    const totalSizeRe = /\[download\]\s+.*?of\s+([\d.]+\w+)/
    const speedRe = /\s+at\s+([\d.]+\s*\w+\/s)/

    proc.stdout.on('data', data => {
      const line = data.toString()
      const fileMatch = line.match(/^\[download\] Destination: (.+)/)
      if (fileMatch) lastFilepath = fileMatch[1].trim()

      const afterMoveMatch = line.match(/^\[Info\] .*?: "(.+)"$/m)
      if (afterMoveMatch) lastFilepath = afterMoveMatch[1].trim()

      const pctMatch = line.match(progressRe)
      if (pctMatch) {
        const percent = parseFloat(pctMatch[1])
        const sizeMatch = line.match(totalSizeRe)
        const spdMatch = line.match(speedRe)
        onProgress({
          percent,
          totalSize: sizeMatch ? sizeMatch[1] : '',
          speed: spdMatch ? spdMatch[1] : '',
        })
      }
    })

    proc.stderr.on('data', data => {
      const line = data.toString()
      if (/\[Merger\]/.test(line)) {
        onProgress({ percent: 100, status: 'merging' })
      } else if (/\[ExtractAudio\]|\[FFmpeg\]/.test(line)) {
        onProgress({ percent: 100, status: 'converting' })
      }
    })

    proc.on('error', reject)
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(`yt-dlp exited with code ${code}`))
      resolve({
        downloaded: true,
        filename: lastFilepath ? path.basename(lastFilepath) : null,
        filepath: lastFilepath || null,
      })
    })
  })
}

module.exports = { parseVideo, downloadVideoStream }
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: video-service 支持自定义下载目录和代理"
```

---

### Task 5: API 服务层 + App 根组件

**Files:**
- Create: `src/services/api.js`
- Create: `src/App.vue`
- Create: `src/components/TabBar.vue`

- [ ] **Step 1: 创建 src/services/api.js**

```js
const BASE = '/api'

export async function parseVideo(url) {
  const res = await fetch(`${BASE}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return res.json()
}

export function buildDownloadUrl(params) {
  const qs = new URLSearchParams(params).toString()
  return `${BASE}/download?${qs}`
}

export async function fetchHistory() {
  const res = await fetch(`${BASE}/history`)
  return res.json()
}

export async function deleteHistoryItem(id) {
  const res = await fetch(`${BASE}/history/${id}`, { method: 'DELETE' })
  return res.json()
}

export async function clearHistory() {
  const res = await fetch(`${BASE}/history`, { method: 'DELETE' })
  return res.json()
}

export async function fetchSettings() {
  const res = await fetch(`${BASE}/settings`)
  return res.json()
}

export async function updateSettings(data) {
  const res = await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export function previewUrl(id) {
  return `${BASE}/preview/${id}`
}

export function fileDownloadUrl(id) {
  return `${BASE}/files/${id}`
}
```

- [ ] **Step 2: 创建 src/components/TabBar.vue**

```vue
<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="['tab', { active: modelValue === tab.key }]"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
})

defineEmits(['update:modelValue'])

const tabs = [
  { key: 'download', label: '下载' },
  { key: 'history', label: '历史记录' },
  { key: 'settings', label: '设置' },
]
</script>

<style scoped>
.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--border);
}
.tab {
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-dim);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}
.tab:hover:not(.active) {
  color: var(--text);
}
</style>
```

- [ ] **Step 3: 创建 src/App.vue**

```vue
<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">Video Downloader</h1>
      <ThemeToggle />
    </header>
    <TabBar v-model="activeTab" />
    <main class="app-main">
      <DownloadTab v-if="activeTab === 'download'" />
      <HistoryTab v-if="activeTab === 'history'" />
      <SettingsTab v-if="activeTab === 'settings'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from './components/TabBar.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import DownloadTab from './components/DownloadTab.vue'
import HistoryTab from './components/HistoryTab.vue'
import SettingsTab from './components/SettingsTab.vue'

const activeTab = ref('download')
</script>

<style scoped>
.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.app-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.app-main {
  margin-top: 20px;
}
</style>
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: API 服务层 + App 根组件 + TabBar 导航"
```

---

### Task 6: 下载 Tab 组件（单视频流程）

**Files:**
- Create: `src/components/UrlInput.vue`
- Create: `src/components/TaskCard.vue`
- Create: `src/components/FormatSelector.vue`
- Create: `src/components/ProgressBar.vue`
- Create: `src/composables/useDownload.js`
- Create: `src/components/DownloadTab.vue`

- [ ] **Step 1: 创建 src/composables/useDownload.js**

```js
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
```

注意：需要在文件顶部添加 `import { ref, reactive, watch } from 'vue'`。

- [ ] **Step 2: 创建 src/components/UrlInput.vue**

```vue
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
```

- [ ] **Step 3: 创建 src/components/FormatSelector.vue**

```vue
<template>
  <select class="format-select" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
    <option disabled value="">选择格式</option>
    <option v-for="f in formats" :key="f.formatId" :value="f.formatId">
      {{ f.resolution }} · {{ f.ext.toUpperCase() }}
    </option>
  </select>
</template>

<script setup>
defineProps({
  formats: { type: Array, required: true },
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.format-select {
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
.format-select:focus {
  border-color: var(--accent);
}
</style>
```

- [ ] **Step 4: 创建 src/components/ProgressBar.vue**

```vue
<template>
  <div class="progress-wrap">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: clamped + '%' }"></div>
    </div>
    <div class="progress-info">
      <span>{{ clamped.toFixed(1) }}%</span>
      <span>{{ detail }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  percent: { type: Number, default: 0 },
  totalSize: { type: String, default: '' },
  speed: { type: String, default: '' },
  status: { type: String, default: '' },
})

const clamped = computed(() => Math.min(100, Math.max(0, props.percent)))
const detail = computed(() => {
  if (props.status === 'merging') return '合并音视频中...'
  if (props.status === 'converting') return '转换格式中...'
  return [props.totalSize, props.speed].filter(Boolean).join(' · ')
})
</script>

<style scoped>
.progress-wrap {
  margin-top: 10px;
}
.progress-bar {
  height: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--success));
  border-radius: 3px;
  transition: width 0.3s ease;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-dim);
}
</style>
```

- [ ] **Step 5: 创建 src/components/TaskCard.vue**

```vue
<template>
  <div :class="['task-card', task.status]">
    <div class="task-header">
      <div class="task-title">
        <template v-if="task.info">{{ task.info.title }}</template>
        <template v-else>{{ task.url }}</template>
      </div>
      <button class="remove-btn" @click="$emit('remove')" title="移除">✕</button>
    </div>
    <div class="task-meta" v-if="task.info">
      <span class="badge">{{ task.info.site }}</span>
      <span class="badge" v-if="task.info.duration">{{ formatDuration(task.info.duration) }}</span>
    </div>

    <!-- 格式选择 -->
    <div v-if="task.status === 'ready'" class="task-actions">
      <FormatSelector
        :formats="task.info.formats"
        v-model="task.selectedFormat"
      />
      <button class="dl-btn" @click="$emit('download', task)" :disabled="!task.selectedFormat">
        下载
      </button>
    </div>

    <!-- 进度 -->
    <ProgressBar
      v-if="task.status === 'downloading' && task.progress"
      :percent="task.progress.percent"
      :totalSize="task.progress.totalSize"
      :speed="task.progress.speed"
      :status="task.progress.status"
    />

    <!-- 完成 -->
    <div v-if="task.status === 'done'" class="task-done">
      <span class="badge success">已完成</span>
      <span class="filename" v-if="task.result?.filename">{{ task.result.filename }}</span>
    </div>

    <!-- 错误 -->
    <div v-if="task.status === 'error'" class="task-error">
      {{ task.error }}
    </div>

    <!-- 解析中 -->
    <div v-if="task.status === 'parsing'" class="task-parsing">解析中...</div>
  </div>
</template>

<script setup>
import FormatSelector from './FormatSelector.vue'
import ProgressBar from './ProgressBar.vue'

defineProps({
  task: { type: Object, required: true },
})
defineEmits(['remove', 'download'])

function formatDuration(s) {
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}
</script>

<style scoped>
.task-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
}
.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.task-title {
  font-size: 14px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.remove-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}
.task-card:hover .remove-btn { opacity: 1; }
.remove-btn:hover { color: var(--error); }

.task-meta { margin-top: 6px; }
.badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-dim);
  margin-right: 6px;
}
.badge.success {
  background: rgba(34,197,94,0.1);
  border-color: var(--success);
  color: var(--success);
}
.task-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.dl-btn {
  padding: 8px 18px;
  background: var(--success);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.dl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dl-btn:hover:not(:disabled) { opacity: 0.9; }

.task-done {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.filename { font-size: 12px; color: var(--text-dim); }
.task-error {
  margin-top: 8px;
  color: var(--error);
  font-size: 13px;
}
.task-parsing {
  margin-top: 8px;
  color: var(--text-dim);
  font-size: 13px;
}
</style>
```

- [ ] **Step 6: 创建 src/components/DownloadTab.vue**

```vue
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
```

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: 下载 Tab — URL 输入、格式选择、SSE 进度、批量下载"
```

---

### Task 7: 视频预览播放器

**Files:**
- Create: `src/components/VideoPlayer.vue`

- [ ] **Step 1: 创建 src/components/VideoPlayer.vue**

```vue
<template>
  <div class="video-player" v-if="src">
    <video controls :src="src" preload="metadata" />
    <p v-if="error" class="player-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { previewUrl } from '../services/api'

const props = defineProps({
  recordId: { type: String, required: true },
})

const src = computed(() => previewUrl(props.recordId))
const error = ref('')
</script>

<style scoped>
.video-player {
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}
.video-player video {
  width: 100%;
  display: block;
  max-height: 360px;
}
.player-error {
  color: var(--error);
  font-size: 12px;
  padding: 8px;
  text-align: center;
}
</style>
```

- [ ] **Step 2: 在 TaskCard.vue 中集成播放器**

在 TaskCard.vue 的 `task-done` 区域中添加播放按钮和播放器：

```vue
<!-- 在 task-done div 中添加 -->
<button class="play-btn" @click="showPlayer = !showPlayer">
  {{ showPlayer ? '收起' : '播放' }}
</button>
<VideoPlayer v-if="showPlayer && task.result?.record" :recordId="task.result.record.id" />
```

在 script setup 中添加：

```js
import VideoPlayer from './VideoPlayer.vue'
const showPlayer = ref(false)
```

需要添加 `import { ref } from 'vue'`（如果尚未导入）。

添加样式：

```css
.play-btn {
  padding: 6px 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.play-btn:hover { opacity: 0.9; }
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: 视频预览播放器组件"
```

---

### Task 8: 历史记录 Tab

**Files:**
- Create: `src/composables/useHistory.js`
- Create: `src/components/HistorySearch.vue`
- Create: `src/components/HistoryItem.vue`
- Create: `src/components/HistoryTab.vue`

- [ ] **Step 1: 创建 src/composables/useHistory.js**

```js
import { ref, computed } from 'vue'
import { fetchHistory, deleteHistoryItem, clearHistory } from '../services/api'

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
    await clearHistory()
    records.value = []
  }

  return { records, search, siteFilter, sites, filtered, load, remove, clear }
}
```

- [ ] **Step 2: 创建 src/components/HistorySearch.vue**

```vue
<template>
  <div class="history-search">
    <input
      v-model="search"
      placeholder="搜索标题或链接..."
      class="search-input"
    />
    <select v-model="siteFilter" class="site-select">
      <option value="">全部网站</option>
      <option v-for="s in sites.slice(1)" :key="s" :value="s">{{ s }}</option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  search: { type: String, default: '' },
  siteFilter: { type: String, default: '' },
  sites: { type: Array, default: () => [] },
})
defineEmits(['update:search', 'update:siteFilter'])
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
```

- [ ] **Step 3: 创建 src/components/HistoryItem.vue**

```vue
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
import { ref } from 'vue'
import VideoPlayer from './VideoPlayer.vue'
import { fileDownloadUrl } from '../services/api'

defineProps({
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
.item-main { flex: 1; min-width: 0; }
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
```

注意：`downloadUrl` 的 computed 需要导入 `computed` 并且用 `props` 引用。修正：

```js
import { ref, computed } from 'vue'

const props = defineProps({
  record: { type: Object, required: true },
})
defineEmits(['delete'])

const showPlayer = ref(false)
const downloadUrl = computed(() => fileDownloadUrl(props.record.id))
```

- [ ] **Step 4: 创建 src/components/HistoryTab.vue**

```vue
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
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 历史记录 Tab — 搜索筛选、视频预览、文件下载"
```

---

### Task 9: 设置 Tab

**Files:**
- Create: `src/composables/useSettings.js`
- Create: `src/components/SettingsForm.vue`
- Create: `src/components/SettingsTab.vue`

- [ ] **Step 1: 创建 src/composables/useSettings.js**

```js
import { ref } from 'vue'
import { fetchSettings, updateSettings } from '../services/api'

export function useSettings() {
  const settings = ref({ downloadDir: '', proxy: '' })
  const saving = ref(false)
  const message = ref('')

  async function load() {
    const res = await fetchSettings()
    if (res.success) settings.value = res.data
  }

  async function save() {
    saving.value = true
    message.value = ''
    const res = await updateSettings(settings.value)
    saving.value = false
    if (res.success) {
      settings.value = res.data
      message.value = '设置已保存'
      setTimeout(() => message.value = '', 3000)
    } else {
      message.value = res.error || '保存失败'
    }
  }

  return { settings, saving, message, load, save }
}
```

- [ ] **Step 2: 创建 src/components/SettingsForm.vue**

```vue
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
```

- [ ] **Step 3: 创建 src/components/SettingsTab.vue**

```vue
<template>
  <div class="settings-tab">
    <SettingsForm
      :settings="settings"
      :saving="saving"
      :message="message"
      @save="save"
    />
    <div class="theme-section">
      <h3>主题</h3>
      <div class="theme-options">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          :class="['theme-btn', { active: themeStore.mode === opt.value }]"
          @click="themeStore.setMode(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import SettingsForm from './SettingsForm.vue'
import { useSettings } from '../composables/useSettings'
import { useThemeStore } from '../stores/theme'

const { settings, saving, message, load, save } = useSettings()
const themeStore = useThemeStore()

const themeOptions = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

onMounted(load)
</script>

<style scoped>
.theme-section {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}
.theme-section h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}
.theme-options {
  display: flex;
  gap: 8px;
}
.theme-btn {
  padding: 8px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.theme-btn.active {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}
.theme-btn:hover:not(.active) { border-color: var(--text-dim); }
</style>
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: 设置 Tab — 下载目录、代理地址、主题切换"
```

---

### Task 10: 构建配置与集成验证

**Files:**
- Modify: `server/index.js` — 确保生产环境 SPA 路由回退

- [ ] **Step 1: 在 server/index.js 中添加 SPA 路由回退**

在所有 API 路由之后、`app.listen` 之前添加：

```js
// SPA 路由回退：非 API 请求返回 index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ success: false, error: 'Not found' })
  const indexPath = path.join(publicDir, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Run `npm run build` first')
  }
})
```

- [ ] **Step 2: 构建 Vue 前端**

```bash
cd D:\workspace\js\application\all_network_vedio_download
npm run build
```

预期：`server/public/` 目录下生成 Vite 构建产物。

- [ ] **Step 3: 启动后端验证生产模式**

```bash
npm run server
```

访问 `http://localhost:3000`，验证页面加载正常。

- [ ] **Step 4: 验证开发模式**

终端 1 启动后端：`npm run server`
终端 2 启动 Vite 开发服务器：`npm run dev`

访问 `http://localhost:5173`，验证热更新和 API 代理正常。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 构建配置 + SPA 路由回退 + 集成验证"
```

---

### Task 11: 端到端功能验证

- [ ] **Step 1: 验证主题切换** — 点击主题按钮，确认深色/浅色/系统三种模式切换正常

- [ ] **Step 2: 验证视频解析** — 粘贴 B站链接，确认解析出格式列表

- [ ] **Step 3: 验证单视频下载** — 选择格式后点击下载，确认进度条正常推进，完成后可播放

- [ ] **Step 4: 验证批量下载** — 粘贴多个链接，解析后点击「全部下载」，确认串行下载

- [ ] **Step 5: 验证历史记录** — 切换到历史 Tab，确认记录显示、搜索筛选、视频预览正常

- [ ] **Step 6: 验证设置** — 修改下载目录和代理地址，保存后下载新视频确认设置生效

- [ ] **Step 7: 验证文件下载** — 历史记录中点击下载按钮，确认浏览器下载文件

- [ ] **Step 8: 最终提交**

```bash
git add -A
git commit -m "feat: 全功能验证通过，重构完成"
```
