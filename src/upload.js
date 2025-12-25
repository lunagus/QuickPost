import { supabase } from './lib/supabase.js';
import QRCode from 'qrcode';

export function renderUpload(container) {
  // Reset layout width in case Viewer expanded it
  container.style.maxWidth = '';
  
  container.innerHTML = `
    <div class="tabs">
      <button class="tab-btn active" id="tab-file">File Upload</button>
      <button class="tab-btn" id="tab-text">Paste Text</button>
      <button class="tab-btn" id="tab-history">History</button>
    </div>

    <!-- History Container -->
    <div id="uploadHistory" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;"></div>

    <div id="view-file">
      <div class="upload-box" id="dropZone">
        <div style="font-size: 1.5rem; margin-bottom: 1rem;">↓</div>
        <div>Select, paste or drop file</div>
      </div>
      <div class="upload-box hidden" id="uploadSuccess" style="cursor: default; border-color: var(--accent);">
         <!-- Success content will be injected here -->
      </div>
      <input type="file" id="fileInput" hidden>
    </div>
    <div id="view-text" class="hidden">
      <div class="editor-wrapper">
        <div class="editor-header">
            <span>INPUT</span>
            <select id="langSelect" style="background:none; border:none; color:#888;">
                <option value="txt">Plain Text</option>
                <option value="json">JSON</option>
                <option value="js">JavaScript</option>
                <option value="py">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="sql">SQL</option>
            </select>
        </div>
        <textarea class="code-area" id="codeInput" placeholder="// Paste content..." spellcheck="false"></textarea>
      </div>
    </div>
    
    <div id="view-history" class="hidden">
        <div id="history-list" style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- History items will be rendered here -->
            <div style="text-align: center; color: var(--text-muted); padding: 2rem;">No history found.</div>
        </div>
        <button id="clearHistoryBtn" class="btn-text" style="display: block; margin: 2rem auto; font-size: 0.8rem; color: #666;">Clear History</button>
    </div>

    <div id="uploadControls" class="upload-controls">
      <input type="text" class="input-minimal" id="customName" placeholder="filename (optional)">
      <button id="uploadBtn" class="btn-primary">Upload</button>
    </div>
    
    <!-- Upload Disclaimer -->
    <div style="margin-top: 1rem; text-align: center; font-size: 0.75rem; color: var(--text-muted);">
        By uploading, you agree to our <a href="/terms" style="color: var(--text-muted); text-decoration: underline;">Terms of Service</a>
    </div>

    <!-- QR Modal -->
    <div id="qrModal" class="modal hidden">
        <div class="modal-content" style="text-align: center; max-width: 350px;">
            <h3 class="modal-title">Scan to Share</h3>
            <div style="margin: 1.5rem auto; background: white; padding: 1rem; border-radius: 8px; width: fit-content;">
                <canvas id="qrCanvas"></canvas>
            </div>
            <button class="btn-text" id="closeQr">Close</button>
        </div>
    </div>
  `;
  attachEvents();
}

function attachEvents() {
  const fileView = document.getElementById('view-file');
  const textView = document.getElementById('view-text');
  const historyView = document.getElementById('view-history');
  const uploadControls = document.getElementById('uploadControls');
  
  // Helper to reset the form inputs
  const resetForm = () => {
      document.getElementById('customName').value = "";
      document.getElementById('fileInput').value = ""; 
      document.getElementById('codeInput').value = ""; 
      document.getElementById('dropZone').innerHTML = `
        <div style="font-size: 1.5rem; margin-bottom: 1rem;">↓</div>
        <div>Select, paste or drop file</div>
      `;
      const btn = document.getElementById('uploadBtn');
      btn.innerText = "Upload";
      btn.disabled = false;
  };

  const updateTabs = (activeId) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(activeId).classList.add('active');
  };

  document.getElementById('tab-file').onclick = (e) => {
    fileView.classList.remove('hidden'); 
    textView.classList.add('hidden'); 
    historyView.classList.add('hidden');
    uploadControls.classList.remove('hidden');
    // Also remove hidden from history stack? No, stack is global to upload views. 
    // Actually stack might look weird in History tab. Let's hide stack in history tab.
    document.getElementById('uploadHistory').classList.remove('hidden');
    updateTabs('tab-file');
  };
  
  document.getElementById('tab-text').onclick = (e) => {
    textView.classList.remove('hidden'); 
    fileView.classList.add('hidden'); 
    historyView.classList.add('hidden');
    uploadControls.classList.remove('hidden');
    document.getElementById('uploadHistory').classList.remove('hidden');
    updateTabs('tab-text');
  };
  
  document.getElementById('tab-history').onclick = (e) => {
    renderHistoryList();
    historyView.classList.remove('hidden'); 
    fileView.classList.add('hidden'); 
    textView.classList.add('hidden');
    uploadControls.classList.add('hidden'); // No new upload calc in history
    document.getElementById('uploadHistory').classList.add('hidden'); // Hide the "Current Session" stack
    updateTabs('tab-history');
  };

  document.getElementById('clearHistoryBtn').onclick = () => {
      if(confirm('Clear all local upload history?')) {
          localStorage.removeItem('qp_upload_history');
          renderHistoryList();
      }
  };

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  
  dropZone.onclick = () => fileInput.click();
  fileInput.onchange = (e) => {
    if(e.target.files[0]) dropZone.innerHTML = `<div>SELECTED: ${e.target.files[0].name}</div>`;
  };

  document.getElementById('uploadBtn').onclick = handleUpload;
  
  // Close QR Modal logic
  document.getElementById('closeQr').onclick = () => document.getElementById('qrModal').classList.add('hidden');

  const codeInput = document.getElementById('codeInput');
  codeInput.addEventListener('input', () => {
    const text = codeInput.value;
    const detected = detectLanguage(text);
    if (detected) {
      document.getElementById('langSelect').value = detected;
    }
  });

  // Edit Feature: Check if we have content to edit
  const editContent = localStorage.getItem('qp_edit_content');
  if (editContent) {
      localStorage.removeItem('qp_edit_content');
      document.getElementById('tab-text').click(); // Reuse click handler for visibility
      codeInput.value = editContent;
      codeInput.dispatchEvent(new Event('input'));
  }

  // Global Paste Handler
  document.onpaste = (e) => {
    if (['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName) && 
        document.activeElement.type === 'text' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    // Switch to upload view if on history
    if(!historyView.classList.contains('hidden')) {
        document.getElementById('tab-file').click();
    }

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;

    // Check for Image
    for (const item of items) {
        if (item.type.indexOf("image") === 0) {
            e.preventDefault();
            const blob = item.getAsFile();
            const file = new File([blob], `pasted_image_${Date.now()}.png`, { type: item.type });
            document.getElementById('tab-file').click();
            const dt = new DataTransfer();
            dt.items.add(file);
            document.getElementById('fileInput').files = dt.files;
            document.getElementById('dropZone').innerHTML = `<div>SELECTED: ${file.name}</div>`;
            return; 
        }
    }

    // Check for Text
    for (const item of items) {
        if (item.type === "text/plain") {
             e.preventDefault();
             item.getAsString((s) => {
                 if(!s.trim()) return;
                 document.getElementById('tab-text').click();
                 const codeInput = document.getElementById('codeInput');
                 codeInput.value = s;
                 codeInput.dispatchEvent(new Event('input'));
                 codeInput.focus();
             });
             return;
        }
    }
  };
  
  window.resetForm = resetForm;
}

function saveToHistory(item) {
    let history = [];
    try { history = JSON.parse(localStorage.getItem('qp_upload_history') || '[]'); } catch(e){}
    history.unshift(item);
    if(history.length > 50) history = history.slice(0, 50); // Limit to 50
    localStorage.setItem('qp_upload_history', JSON.stringify(history));
}

function renderHistoryList() {
    const list = document.getElementById('history-list');
    let history = [];
    try { history = JSON.parse(localStorage.getItem('qp_upload_history') || '[]'); } catch(e){}
    
    if(history.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No history found.</div>';
        return;
    }
    
    list.innerHTML = history.map((item, index) => `
        <div class="upload-box history-card">
            <div class="history-header">
                 <div class="history-meta">
                    <div style="font-weight: 600; font-size: 0.9rem; color: var(--text);">${item.fileName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(item.date).toLocaleString()}</div>
                 </div>
                 <div class="tag">${item.type}</div>
            </div>
            
             <div class="url-group">
                <input type="text" value="${item.url}" class="url-input" readonly>
                <div class="url-actions">
                    <a href="${item.url}" target="_blank" class="action-btn">OPEN</a>
                </div>
            </div>
        </div>
    `).join('');
}

function detectLanguage(code) {
  if (!code) return null;
  const trimmed = code.trim();
  if (/<(!DOCTYPE|html|head|body|div|span|script|style)/i.test(trimmed)) return 'html';
  if (/^[\{\[][\s\S]*[\}\]]$/.test(trimmed)) { try { JSON.parse(trimmed); return 'json'; } catch(e){} }
  if (/^([a-z0-9\-_]+|\.|#)[\s\S]*\{[\s\S]*:[^;]+;[\s\S]*\}/i.test(trimmed)) return 'css';
  if (/(def\s+\w+|import\s+\w+|print\(|if\s+__name__\s*==|class\s+\w+:)/.test(trimmed)) return 'py';
  if (/(const|let|var|function|=>|console\.log|import\s+.*from|document\.|window\.)/.test(trimmed)) return 'js';
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|FROM|WHERE|JOIN)\b/i.test(trimmed)) return 'sql';
  return 'txt';
}

async function handleUpload() {
  try {
    const isFile = !document.getElementById('view-file').classList.contains('hidden');
    const customName = document.getElementById('customName').value.trim();
    let file, fileName;

    // We need to store standard file object logic but maybe cache content for "Raw Copy"
    let rawContentToCopy = null;

    if (isFile) {
      file = document.getElementById('fileInput').files[0];
      if (!file) throw new Error("No file selected");
      fileName = customName || file.name;
      
      if(file.size < 1024 * 512) { 
          try { rawContentToCopy = await file.text(); } catch(e) {}
      }
    } else {
      const codeInput = document.getElementById('codeInput');
      const content = codeInput.value;
      if (!content) throw new Error("Please enter some text");
      
      const ext = document.getElementById('langSelect').value;
      fileName = customName ? (customName.includes('.') ? customName : `${customName}.${ext}`) : `snippet.${ext}`;
      file = new File([content], fileName, { type: 'text/plain' });
      rawContentToCopy = content;
    }

    // === COMPREHENSIVE CHECKS ===
    
    // 0. Check existence
    if (!file) throw new Error("No file data found.");

    // 1. Size Check (50 MB Limit)
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
        throw new Error(`File is too large (${formatBytes(file.size)}). Maximum allowed size is 50MB.`);
    }

    // 2. Empty File Check
    if (file.size === 0) {
        throw new Error("File is empty (0 bytes). Cannot upload.");
    }

    // 3. Filename Length Check
    if (fileName.length > 255) {
        throw new Error("Filename is too long. Please rename it to under 255 characters.");
    }

    const shortId = Math.random().toString(36).substring(2, 5);
    const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : 'txt';
    const path = `${shortId}.${ext}`;

    // Show loading state
    const btn = document.getElementById('uploadBtn');
    const originalText = btn.innerText;
    btn.innerText = "Uploading...";
    btn.disabled = true;

    // console.log('DEBUG: Starting upload:', { path, fileName, size: file.size, type: file.type });

    // Standard upload
    const { data: upData, error: upErr } = await supabase.storage.from('uploads').upload(path, file);
    
    // console.log('DEBUG: Upload result:', { upData, upErr });
    if (upErr) throw upErr;

    // console.log('DEBUG: Inserting database record...');
    const { error: dbErr } = await supabase.from('files').insert({ short_id: shortId, filename: fileName, storage_path: path });
    
    if (dbErr) throw dbErr;

    // === SUCCESS UI ===
    const directLink = `${window.location.origin}/${shortId}.${ext}`;
    const showRaw = rawContentToCopy !== null && (ext === 'txt' || ext === 'js' || ext === 'py' || ext === 'html' || ext === 'css' || ext === 'json' || ext === 'sql' || ext === 'md');

    // === SAVE TO HISTORY ===
    saveToHistory({
        fileName: fileName,
        url: directLink,
        date: new Date().toISOString(),
        type: isFile ? 'File' : 'Snippet (' + ext + ')'
    });

    // Generate Result Card
    const resultCard = document.createElement('div');
    resultCard.className = 'upload-box history-card';
    resultCard.style.marginBottom = '1rem'; 
    
    // Unique ID for inputs to avoid conflicts
    const resultId = Math.random().toString(36).substring(7);

    resultCard.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
          <div class="history-header">
              <div class="history-meta">
                  <div style="color: var(--accent); font-size: 0.9rem; font-weight: 600;">UPLOAD COMPLETE</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${fileName}</div>
              </div>
          </div>
          
          <div class="url-group">
              <input type="text" value="${directLink}" id="url-${resultId}" class="url-input" readonly>
              
              <div class="url-actions">
                   <button onclick="showQr('${directLink}')" class="action-btn" title="Show QR Code">QR</button>
                  ${showRaw ? `<button onclick="copyRaw('${resultId}', '${directLink}')" class="action-btn" title="Copy Raw Content">RAW</button>` : ''}
                  <button onclick="copyUrl('${resultId}')" class="action-btn">COPY</button>
                   <a href="${directLink}" target="_blank" class="action-btn">OPEN</a>
              </div>
          </div>
          
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
              Expires in 24h
          </div>
      </div>
    `;

    // Prepend to History Stack (Newest Top)
    const history = document.getElementById('uploadHistory');
    history.prepend(resultCard);

    // Reset Form for next upload
    window.resetForm();

    // Window helper functions for buttons (updated for IDs)
    window.copyUrl = (id) => {
      const input = document.getElementById(`url-${id}`);
      input.select();
      navigator.clipboard.writeText(input.value);
      input.classList.add('success-ring');
      setTimeout(() => input.classList.remove('success-ring'), 1000);
    };

    // Note: copyRaw logic needs raw content. For simplicity in multi-card UI, we fetch it if not cached, 
    // or we could attach it to the DOM. Fetching is safer/cleaner.
    window.copyRaw = async (id, url) => {
        try {
            const text = await (await fetch(url)).text();
            if(!text) return alert("Content not available");
            navigator.clipboard.writeText(text);
            const btn = document.querySelector(`button[onclick="copyRaw('${id}', '${url}')"]`);
            if(btn) { 
                const old = btn.innerText; 
                btn.innerText = 'COPIED'; 
                setTimeout(() => btn.innerText = old, 1500); 
            }
        } catch(e) {
            alert("Failed to copy raw content");
        }
    };

    window.showQr = (url) => {
        const modal = document.getElementById('qrModal');
        const canvas = document.getElementById('qrCanvas');
        modal.classList.remove('hidden');
        QRCode.toCanvas(canvas, url, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, function (error) {
          if (error) console.error(error);
        });
    };

  } catch (err) {
      console.error(err);
      alert("Error: " + (err.message || err));
      // Reset button state
      const btn = document.getElementById('uploadBtn');
      if(btn) {
          btn.innerText = "Upload";
          btn.disabled = false;
      }
  }
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
