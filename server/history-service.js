const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json');

function ensureDataDir() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readHistory() {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeHistory(records) {
  ensureDataDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function addRecord(record) {
  const history = readHistory();
  const entry = {
    id: Date.now().toString(36),
    title: record.title,
    url: record.url,
    site: record.site,
    resolution: record.resolution,
    ext: record.ext,
    filesize: record.filesize,
    downloadedAt: new Date().toISOString(),
  };
  history.unshift(entry);
  writeHistory(history);
  return entry;
}

function getHistory() {
  return readHistory();
}

function deleteRecord(id) {
  const history = readHistory();
  const filtered = history.filter(r => r.id !== id);
  writeHistory(filtered);
  return filtered;
}

function clearHistory() {
  writeHistory([]);
}

module.exports = { addRecord, getHistory, deleteRecord, clearHistory };
