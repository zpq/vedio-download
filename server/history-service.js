const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json')

let writeLock = Promise.resolve()

function ensureDataDir() {
  const dir = path.dirname(HISTORY_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function readHistory() {
  ensureDataDir()
  if (!fs.existsSync(HISTORY_FILE)) return []
  try {
    const content = await fs.promises.readFile(HISTORY_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

async function writeHistory(records) {
  ensureDataDir()
  await fs.promises.writeFile(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf-8')
}

function withLock(fn) {
  const prev = writeLock
  let resolve
  writeLock = new Promise(r => resolve = r)
  return fn().finally(() => resolve())
}

async function addRecord(record) {
  return withLock(async () => {
    const history = await readHistory()
    const entry = {
      id: crypto.randomBytes(8).toString('hex'),
      title: record.title,
      url: record.url,
      site: record.site,
      resolution: record.resolution,
      ext: record.ext,
      filesize: record.filesize,
      filename: record.filename || null,
      filepath: record.filepath || null,
      downloadedAt: new Date().toISOString(),
    }
    history.unshift(entry)
    await writeHistory(history)
    return entry
  })
}

async function getHistory() {
  return readHistory()
}

async function deleteRecord(id) {
  return withLock(async () => {
    const history = await readHistory()
    const filtered = history.filter(r => r.id !== id)
    await writeHistory(filtered)
    return filtered
  })
}

async function clearHistory() {
  await writeHistory([])
}

module.exports = { addRecord, getHistory, deleteRecord, clearHistory }
