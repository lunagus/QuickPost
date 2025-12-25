import { supabase } from './lib/supabase.js';
import Prism from 'prismjs';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

export async function renderViewer(container, id) {
  container.innerHTML = `<div>Fetching data...</div>`;

  const { data: file, error } = await supabase.from('files').select('*').eq('short_id', id).single();

  if (error || !file) {
    container.innerHTML = `<div>404 // FILE_NOT_FOUND</div><br><a href="/" style="color:#fff;">Return home</a>`;
    return;
  }

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(file.storage_path);
  const ext = file.filename.split('.').pop().toLowerCase();
  const isCode = ['js','py','json','html','css','txt','md','sql'].includes(ext);

  if (isCode) {
    const text = await (await fetch(publicUrl)).text();
    renderCodeViewer(container, text, file.filename, publicUrl, ext);
    Prism.highlightAll();
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    // Image Viewer
    container.innerHTML = `
        <div class="upload-box" style="cursor: default; padding: 2rem;">
            <div style="margin-bottom: 1rem; font-weight: 600;">${file.filename}</div>
            <img src="${publicUrl}" alt="${file.filename}" style="max-width: 100%; border-radius: var(--radius); border: 1px solid var(--border); display: block; margin: 0 auto 1rem auto;">
            <a href="${publicUrl}" class="btn-primary" download>Download Original</a>
        </div>
        <a href="/" style="display:block; margin-top:2rem; color:#666; text-decoration:none; text-align: center;">← Upload New</a>
    `;
  } else {
    // Basic download button for other files
    container.innerHTML = `
        <div class="upload-box" style="cursor: default;">
            <div style="margin-bottom: 1rem;">${file.filename}</div>
            <a href="${publicUrl}" class="btn-primary" download>Download File</a>
        </div>
        <a href="/" style="display:block; margin-top:2rem; color:#666; text-decoration:none; text-align: center;">← Upload New</a>
    `;
  }
}

function renderCodeViewer(container, text, filename, publicUrl, ext) {
  // Widen the container for code view
  document.querySelector('.container').style.maxWidth = '1200px';

  const lines = text.split('\n').length;
  const size = formatBytes(new Blob([text]).size);

  container.innerHTML = `
    <div class="editor-wrapper">
      <div class="editor-header">
          <div style="display: flex; gap: 1rem; align-items: baseline;">
            <span style="font-weight: 600; color: var(--text);">${filename}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${lines} lines • ${size}</span>
          </div>
          <div style="display: flex; gap: 1rem; align-items: center;">
              <button id="wrapBtn" class="header-btn">WRAP: OFF</button>
              <a href="${publicUrl}" target="_blank" class="header-link">RAW</a>
              <button id="copyBtn" class="header-btn">COPY</button>
          </div>
      </div>
      <pre id="codePre" class="line-numbers"><code class="language-${ext}">${escapeHtml(text)}</code></pre>
    </div>
    <a href="/" style="display:block; margin-top:2rem; color:#666; text-decoration:none;">← Upload New</a>
  `;

  // Attach Events
  const copyBtn = document.getElementById('copyBtn');
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'COPIED!';
      setTimeout(() => copyBtn.textContent = 'COPY', 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      copyBtn.textContent = 'ERROR';
    }
  };

  const wrapBtn = document.getElementById('wrapBtn');
  const pre = document.getElementById('codePre');
  let isWrapped = false;
  
  wrapBtn.onclick = () => {
    isWrapped = !isWrapped;
    pre.style.whiteSpace = isWrapped ? 'pre-wrap' : 'pre';
    pre.style.wordBreak = isWrapped ? 'break-word' : 'normal';
    wrapBtn.textContent = `WRAP: ${isWrapped ? 'ON' : 'OFF'}`;
  };
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
