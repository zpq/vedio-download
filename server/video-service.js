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

function downloadVideoStream(url, formatId, settings, onProgress, abortSignal) {
  return new Promise((resolve, reject) => {
    const downloadDir = settings.downloadDir || path.join(__dirname, '..', 'downloads')
    ensureDir(downloadDir)
    const outputTemplate = path.join(downloadDir, '%(title)s.%(ext)s')

    // 记录下载前的文件列表，用于下载后匹配新文件
    const filesBefore = new Set(fs.readdirSync(downloadDir))

    const args = [
      '--no-playlist',
      '--newline',
      '--progress',
      '-o', outputTemplate,
      '--merge-output-format', 'mp4',
    ]

    if (formatId) {
      args.push('-f', `${formatId}+bestaudio/best`)
    } else {
      args.push('-f', 'bestvideo+bestaudio/best')
    }

    if (settings.proxy) {
      args.push('--proxy', settings.proxy)
    }

    args.push(url)

    const proc = spawn('yt-dlp', args)

    // 客户端断开时终止 yt-dlp 子进程
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => proc.kill(), { once: true })
    }

    const progressRe = /\[download\]\s+(\d+\.?\d*)%/
    const totalSizeRe = /\[download\]\s+.*?of\s+([\d.]+\w+)/
    const speedRe = /\s+at\s+([\d.]+\s*\w+\/s)/

    proc.stdout.on('data', data => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
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

      // 通过对比目录找到新下载的文件（避免中文编码问题）
      const filesAfter = fs.readdirSync(downloadDir)
      const newFiles = filesAfter.filter(f => !filesBefore.has(f))
      const videoFile = newFiles.find(f => /\.(mp4|mkv|webm)$/i.test(f)) || newFiles[0] || null
      const filepath = videoFile ? path.join(downloadDir, videoFile) : null

      resolve({
        downloaded: true,
        filename: videoFile || null,
        filepath,
      })
    })
  })
}

module.exports = { parseVideo, downloadVideoStream }
