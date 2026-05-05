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

export async function clearAllHistory() {
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
