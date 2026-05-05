const express = require('express')
const path = require('path')
const fs = require('fs')
const { parseVideo, downloadVideoStream } = require('./video-service')
const { addRecord, getHistory, deleteRecord, clearHistory } = require('./history-service')
const { getSettings, updateSettings } = require('./settings-service')

const VIDEO_TYPES = {
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
}

function getVideoType(ext) {
  return VIDEO_TYPES[ext?.toLowerCase()] || 'application/octet-stream'
}

function isPathSafe(filepath, downloadDir) {
  const resolved = path.resolve(filepath)
  return resolved.startsWith(path.resolve(downloadDir))
}

const URL_RE = /^https?:\/\/.+/i

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

const publicDir = path.join(__dirname, 'public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
}

// 解析
app.post('/api/parse', async (req, res) => {
  const { url } = req.body
  if (!url || !URL_RE.test(url)) {
    return res.status(400).json({ success: false, error: '请输入有效的视频网址' })
  }
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
  if (!url || !URL_RE.test(url)) {
    return res.status(400).json({ success: false, error: '请输入有效的视频网址' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-store')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  // 客户端断开时通过 AbortSignal 通知 video-service 终止子进程
  const controller = new AbortController()
  req.on('close', () => controller.abort())

  try {
    const settings = await getSettings()
    const result = await downloadVideoStream(
      url,
      formatId || null,
      settings,
      (progress) => send('progress', progress),
      controller.signal,
    )
    const record = await addRecord({
      title: title || result.filename || '未知',
      url, site, resolution, ext, filesize,
      filename: result.filename,
      filepath: result.filepath,
    })
    send('done', { ...result, record })
  } catch (err) {
    if (!res.writableEnded) {
      send('error', { error: err.message })
    }
  } finally {
    res.end()
  }
})

// 历史记录
app.get('/api/history', async (req, res) => {
  const data = await getHistory()
  res.json({ success: true, data })
})

app.delete('/api/history/:id', async (req, res) => {
  const remaining = await deleteRecord(req.params.id)
  res.json({ success: true, data: remaining })
})

app.delete('/api/history', async (req, res) => {
  await clearHistory()
  res.json({ success: true })
})

// 视频预览（支持 Range 请求）
app.get('/api/preview/:id', async (req, res) => {
  const history = await getHistory()
  const record = history.find(r => r.id === req.params.id)
  if (!record || !record.filepath) {
    return res.status(404).json({ success: false, error: '文件不存在' })
  }

  const settings = await getSettings()
  const downloadDir = settings.downloadDir || path.join(__dirname, '..', 'downloads')
  if (!isPathSafe(record.filepath, downloadDir)) {
    return res.status(403).json({ success: false, error: '非法路径' })
  }

  if (!fs.existsSync(record.filepath)) {
    return res.status(404).json({ success: false, error: '文件已被删除' })
  }

  const stat = fs.statSync(record.filepath)
  const contentType = getVideoType(record.ext || path.extname(record.filepath).slice(1))
  const range = req.headers.range

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    let start = parseInt(parts[0], 10)
    let end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1

    if (start >= stat.size || start > end) {
      return res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end()
    }

    end = Math.min(end, stat.size - 1)

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': contentType,
    })
    fs.createReadStream(record.filepath, { start, end }).pipe(res)
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
    })
    fs.createReadStream(record.filepath).pipe(res)
  }
})

// 文件下载
app.get('/api/files/:id', async (req, res) => {
  const history = await getHistory()
  const record = history.find(r => r.id === req.params.id)
  if (!record || !record.filepath) {
    return res.status(404).json({ success: false, error: '文件不存在' })
  }

  const settings = await getSettings()
  const downloadDir = settings.downloadDir || path.join(__dirname, '..', 'downloads')
  if (!isPathSafe(record.filepath, downloadDir)) {
    return res.status(403).json({ success: false, error: '非法路径' })
  }

  if (!fs.existsSync(record.filepath)) {
    return res.status(404).json({ success: false, error: '文件已被删除' })
  }
  res.download(record.filepath, record.filename || path.basename(record.filepath))
})

// 设置
app.get('/api/settings', async (req, res) => {
  const data = await getSettings()
  res.json({ success: true, data })
})

app.put('/api/settings', async (req, res) => {
  const updated = await updateSettings(req.body)
  res.json({ success: true, data: updated })
})

// SPA 路由回退
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
