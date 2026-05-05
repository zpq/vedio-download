const fs = require('fs')
const path = require('path')

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json')

const ALLOWED_KEYS = ['downloadDir', 'proxy']

const DEFAULTS = {
  downloadDir: path.join(__dirname, '..', 'downloads'),
  proxy: '',
}

function ensureDataDir() {
  const dir = path.dirname(SETTINGS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

async function getSettings() {
  ensureDataDir()
  if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULTS }
  try {
    const content = await fs.promises.readFile(SETTINGS_FILE, 'utf-8')
    const saved = JSON.parse(content)
    return { ...DEFAULTS, ...saved }
  } catch {
    return { ...DEFAULTS }
  }
}

async function updateSettings(updates) {
  const current = await getSettings()
  const merged = { ...current }
  for (const key of ALLOWED_KEYS) {
    if (updates[key] !== undefined) {
      merged[key] = typeof updates[key] === 'string' ? updates[key] : String(updates[key])
    }
  }
  ensureDataDir()
  await fs.promises.writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}

module.exports = { getSettings, updateSettings }
