const express = require('express');
const path = require('path');
const { parseVideo, downloadVideoStream } = require('./video-service');
const { addRecord, getHistory, deleteRecord, clearHistory } = require('./history-service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/parse', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: '请输入视频网址' });
  }
  try {
    const info = await parseVideo(url);
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/download', async (req, res) => {
  const { url, formatId, title, site, resolution, ext, filesize } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, error: '请输入视频网址' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await downloadVideoStream(
      url,
      formatId || null,
      (progress) => send('progress', progress)
    );
    const record = addRecord({
      title: title || result.filename || '未知',
      url, site, resolution, ext, filesize,
    });
    send('done', { ...result, record });
  } catch (err) {
    send('error', { error: err.message });
  } finally {
    res.end();
  }
});

app.get('/api/history', (req, res) => {
  res.json({ success: true, data: getHistory() });
});

app.delete('/api/history/:id', (req, res) => {
  const remaining = deleteRecord(req.params.id);
  res.json({ success: true, data: remaining });
});

app.delete('/api/history', (req, res) => {
  clearHistory();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
