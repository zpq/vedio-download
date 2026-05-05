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
