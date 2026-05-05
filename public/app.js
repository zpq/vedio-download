const urlInput = document.getElementById('urlInput');
const parseBtn = document.getElementById('parseBtn');
const result = document.getElementById('result');
const formatList = document.getElementById('formatList');
const downloadBtn = document.getElementById('downloadBtn');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');
const videoTitle = document.getElementById('videoTitle');
const videoSite = document.getElementById('videoSite');
const videoDuration = document.getElementById('videoDuration');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const progressDetail = document.getElementById('progressDetail');

let currentData = null;

// --- 页面加载时获取历史 ---
loadHistory();

// --- 解析 ---
parseBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return;

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');
  result.classList.add('hidden');
  parseBtn.textContent = '解析中...';
  parseBtn.disabled = true;

  try {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const json = await res.json();

    if (!json.success) {
      showError(json.error || '解析失败');
      return;
    }

    currentData = json.data;
    renderResult(currentData);
  } catch (e) {
    showError('网络错误，请重试');
  } finally {
    parseBtn.textContent = '解析';
    parseBtn.disabled = false;
  }
});

function renderResult(data) {
  videoTitle.textContent = data.title;
  videoSite.textContent = data.site;
  videoDuration.textContent = formatDuration(data.duration);
  formatList.innerHTML = '';

  data.formats.forEach(f => {
    const item = document.createElement('div');
    item.className = 'format-item';
    item.innerHTML = `
      <input type="radio" name="format" value="${f.formatId}" />
      <span class="format-label">${f.resolution} · ${f.ext.toUpperCase()}</span>
      <span class="format-meta">${f.vcodec ? '视频' : ''}</span>
    `;
    item.addEventListener('click', () => {
      const radio = item.querySelector('input');
      radio.checked = true;
      document.querySelectorAll('.format-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
    });
    formatList.appendChild(item);
  });

  result.classList.remove('hidden');
}

// --- 下载（SSE 流式进度） ---
downloadBtn.addEventListener('click', () => {
  if (!currentData) return;

  const selected = document.querySelector('input[name="format"]:checked');
  if (!selected) {
    showError('请先选择视频格式');
    return;
  }

  const selectedFormat = currentData.formats.find(f => f.formatId === selected.value);

  const params = new URLSearchParams({
    url: urlInput.value.trim(),
    formatId: selected.value,
    title: currentData.title || '',
    site: currentData.site || '',
    resolution: selectedFormat?.resolution || '',
    ext: selectedFormat?.ext || '',
    filesize: selectedFormat?.filesize || '',
  });

  downloadBtn.disabled = true;
  downloadBtn.textContent = '下载中...';
  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');
  showProgress(0, '');

  const es = new EventSource(`/api/download?${params}`);

  es.addEventListener('progress', (e) => {
    const data = JSON.parse(e.data);
    if (data.status === 'merging') {
      setProgress(100, '合并音视频中...');
    } else if (data.status === 'converting') {
      setProgress(100, '转换格式中...');
    } else {
      const detail = [data.totalSize, data.speed].filter(Boolean).join(' · ');
      setProgress(data.percent, detail);
    }
  });

  es.addEventListener('done', (e) => {
    es.close();
    const data = JSON.parse(e.data);
    hideProgress();
    showSuccess(`下载完成！${data.filename ? '文件：' + data.filename : ''}`);
    downloadBtn.textContent = '下载选中格式';
    downloadBtn.disabled = false;
    loadHistory();
  });

  es.addEventListener('error', (e) => {
    // SSE 的 error 事件在连接异常时触发，不代表业务错误
    if (es.readyState === EventSource.CLOSED) return;
    // 尝试读取业务错误数据
    es.close();
    hideProgress();
    showError('下载出错，请重试');
    downloadBtn.textContent = '下载选中格式';
    downloadBtn.disabled = false;
  });

  // 业务错误通过自定义事件名无法捕获时，用 onmessage 兜底
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.error) {
        es.close();
        hideProgress();
        showError(data.error);
        downloadBtn.textContent = '下载选中格式';
        downloadBtn.disabled = false;
      }
    } catch { /* ignore */ }
  };
});

function showProgress(percent, detail) {
  progressWrap.classList.remove('hidden');
  setProgress(percent, detail);
}

function setProgress(percent, detail) {
  const clamped = Math.min(100, Math.max(0, percent));
  progressFill.style.width = clamped + '%';
  progressPercent.textContent = clamped.toFixed(1) + '%';
  progressDetail.textContent = detail || '';
}

function hideProgress() {
  progressWrap.classList.add('hidden');
  progressFill.style.width = '0%';
}

// --- 历史记录 ---
async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const json = await res.json();
    if (json.success) {
      renderHistory(json.data);
    }
  } catch (e) {
    // 静默失败
  }
}

function renderHistory(records) {
  if (!records.length) {
    historyList.innerHTML = '<p class="empty-text">暂无下载记录</p>';
    return;
  }

  historyList.innerHTML = '';
  records.forEach(r => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-main">
        <span class="history-title">${escapeHtml(r.title)}</span>
        <div class="history-meta">
          <span class="badge">${r.site || ''}</span>
          ${r.resolution ? `<span class="badge">${r.resolution}</span>` : ''}
          ${r.ext ? `<span class="badge">${r.ext.toUpperCase()}</span>` : ''}
          <span class="history-time">${formatTime(r.downloadedAt)}</span>
        </div>
      </div>
      <button class="icon-btn delete-btn" data-id="${r.id}" title="删除">&#10005;</button>
    `;
    historyList.appendChild(item);
  });

  historyList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) renderHistory(json.data);
      } catch (e) { /* ignore */ }
    });
  });
}

clearHistoryBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/history', { method: 'DELETE' });
    renderHistory([]);
  } catch (e) { /* ignore */ }
});

// --- 工具函数 ---
function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

function showSuccess(msg) {
  successEl.textContent = msg;
  successEl.classList.remove('hidden');
  setTimeout(() => successEl.classList.add('hidden'), 5000);
}
