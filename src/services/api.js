const BASE = '/api'

async function request(url, options) {
  const res = await fetch(url, options)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || `请求失败 (${res.status})`)
  }
  return json
}

export async function parseVideo(url) {
  return request(`${BASE}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
}

export function buildDownloadUrl(params) {
  const qs = new URLSearchParams(params).toString()
  return `${BASE}/download?${qs}`
}

export async function fetchHistory() {
  return request(`${BASE}/history`)
}

export async function deleteHistoryItem(id) {
  return request(`${BASE}/history/${id}`, { method: 'DELETE' })
}

export async function clearAllHistory() {
  return request(`${BASE}/history`, { method: 'DELETE' })
}

export async function fetchSettings() {
  return request(`${BASE}/settings`)
}

export async function updateSettings(data) {
  return request(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function previewUrl(id) {
  return `${BASE}/preview/${id}`
}

export function fileDownloadUrl(id) {
  return `${BASE}/files/${id}`
}
