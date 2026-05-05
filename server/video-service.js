const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const DOWNLOAD_DIR = path.join(__dirname, '..', 'downloads');

function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('error', reject);
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      resolve(stdout);
    });
  });
}

async function parseVideo(url) {
  const output = await runYtDlp([
    '--dump-json',
    '--no-playlist',
    '--no-warnings',
    url
  ]);

  const info = JSON.parse(output);
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
    }));

  const videoFormats = formats.filter(f => f.vcodec && f.vcodec !== 'none');
  const audioFormats = formats.filter(f => !f.vcodec || f.vcodec === 'none');

  return {
    title: info.title,
    thumbnail: info.thumbnail,
    duration: info.duration,
    site: info.extractor_key,
    formats: videoFormats,
    audioFormats,
  };
}

function downloadVideoStream(url, formatId, onProgress) {
  return new Promise((resolve, reject) => {
    ensureDownloadDir();
    const outputTemplate = path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s');

    const args = [
      '--no-playlist',
      '--newline',
      '--progress',
      '--print', 'after_move:filepath',
      '-o', outputTemplate,
    ];

    if (formatId) {
      args.push('-f', formatId);
    } else {
      args.push('-f', 'best');
    }

    args.push(url);

    const proc = spawn('yt-dlp', args);

    let lastFilepath = '';

    const progressRe = /\[download\]\s+(\d+\.?\d*)%/;
    const totalSizeRe = /\[download\]\s+.*?of\s+([\d.]+\w+)/;
    const speedRe = /\s+at\s+([\d.]+\s*\w+\/s)/;

    proc.stdout.on('data', data => {
      const line = data.toString();
      const fileMatch = line.match(/^\[download\] Destination: (.+)/);
      if (fileMatch) lastFilepath = fileMatch[1].trim();

      const afterMoveMatch = line.match(/^\[Info\] .*?: "(.+)"$/m);
      if (afterMoveMatch) lastFilepath = afterMoveMatch[1].trim();

      const pctMatch = line.match(progressRe);
      if (pctMatch) {
        const percent = parseFloat(pctMatch[1]);
        const sizeMatch = line.match(totalSizeRe);
        const spdMatch = line.match(speedRe);
        onProgress({
          percent,
          totalSize: sizeMatch ? sizeMatch[1] : '',
          speed: spdMatch ? spdMatch[1] : '',
        });
      }
    });

    proc.stderr.on('data', data => {
      const line = data.toString();
      const mergeRe = /\[Merger\]/;
      const convertRe = /\[ExtractAudio\]|\[FFmpeg\]/;
      if (mergeRe.test(line)) {
        onProgress({ percent: 100, status: 'merging' });
      } else if (convertRe.test(line)) {
        onProgress({ percent: 100, status: 'converting' });
      }
    });

    proc.on('error', reject);
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(`yt-dlp exited with code ${code}`));
      resolve({
        downloaded: true,
        filename: lastFilepath ? path.basename(lastFilepath) : null,
        filepath: lastFilepath || null,
      });
    });
  });
}

module.exports = { parseVideo, downloadVideoStream };
