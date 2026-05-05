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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
