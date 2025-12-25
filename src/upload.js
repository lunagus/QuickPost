import { supabase } from './lib/supabase.js';
import QRCode from 'qrcode';

export function renderUpload(container) {
  // Reset layout width in case Viewer expanded it
  container.style.maxWidth = '';
  
  container.innerHTML = `
    <div class="tabs">
      <button class="tab-btn active" id="tab-file">File Upload</button>
      <button class="tab-btn" id="tab-text">Paste Text</button>
    </div>
    <div id="view-file">
      <div class="upload-box" id="dropZone">
        <div style="font-size: 1.5rem; margin-bottom: 1rem;">↓</div>
        <div>Select, paste or drop file</div>
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
    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
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
  
  document.getElementById('tab-file').onclick = (e) => {
    fileView.classList.remove('hidden'); textView.classList.add('hidden');
    e.target.classList.add('active'); document.getElementById('tab-text').classList.remove('active');
  };
  
  document.getElementById('tab-text').onclick = (e) => {
    textView.classList.remove('hidden'); fileView.classList.add('hidden');
    e.target.classList.add('active'); document.getElementById('tab-file').classList.remove('active');
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
  // Global Paste Handler
  document.onpaste = (e) => {
    // Ignore if paste target is an editable input/textarea
    // We check this first to allow normal pasting in form fields
    if (['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName) && 
        document.activeElement.type === 'text' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let handled = false;

    // Check for Image first (higher priority if mixed)
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

    // Check for Text if no image was handled
    for (const item of items) {
        if (item.type === "text/plain") {
             // Synchronously prevent default to stop any body-level paste
             e.preventDefault();
             
             item.getAsString((s) => {
                 if(!s.trim()) return;
                 
                 // Switch to Text Tab
                 document.getElementById('tab-text').click();
                 
                 // Insert text
                 const codeInput = document.getElementById('codeInput');
                 codeInput.value = s;
                 
                 // Trigger detection and focus
                 codeInput.dispatchEvent(new Event('input'));
                 codeInput.focus();
             });
             return;
        }
    }
  };
}

function detectLanguage(code) {
  if (!code) return null;
  const trimmed = code.trim();
  if (/<(!DOCTYPE|html|head|body|div|span|script|style)/i.test(trimmed)) return 'html';
  if (/^[\{\[][\s\S]*[\}\]]$/.test(trimmed)) { try { JSON.parse(trimmed); return 'json'; } catch(e){} }
  if (/^([a-z0-9\-_]+|\.|#)[\s\S]*\{[\s\S]*:[^;]+;[\s\S]*\}/i.test(trimmed)) return 'css';
  if (/(def\s+\w+|import\s+\w+|print\(|if\s+__name__\s*==|class\s+\w+:)/.test(trimmed)) return 'py';
  if (/(const|let|var|function|=>|console\.log|import\s+.*from|document\.|window\.)/.test(trimmed)) return 'js';
  if (/(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|FROM|WHERE|JOIN)/i.test(trimmed)) return 'sql';
  return 'txt';
}

async function handleUpload() {
  const isFile = !document.getElementById('view-file').classList.contains('hidden');
  const customName = document.getElementById('customName').value.trim();
  let file, fileName;

  if (isFile) {
    file = document.getElementById('fileInput').files[0];
    if (!file) return alert("No file selected");
    fileName = customName || file.name;
  } else {
    const content = document.getElementById('codeInput').value;
    if (!content) return alert("Please enter some text");
    const ext = document.getElementById('langSelect').value;
    fileName = customName ? (customName.includes('.') ? customName : `${customName}.${ext}`) : `snippet.${ext}`;
    file = new File([content], fileName, { type: 'text/plain' });
  }

  // Generate Short ID
  const shortId = Math.random().toString(36).substring(2, 5);

  // Determine effective extension
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : (document.getElementById('langSelect').value || 'txt');
  
  const path = `${shortId}.${ext}`;

  const { error: upErr } = await supabase.storage.from('uploads').upload(path, file);
  if (upErr) {
    console.error('Upload error:', upErr);
    return alert(`Upload failed: ${upErr.message}`);
  }

  const { error: dbErr } = await supabase.from('files').insert({ short_id: shortId, filename: fileName, storage_path: path });
  if (dbErr) {
    console.error('Database error:', dbErr);
    return alert(`Database error: ${dbErr.message}`);
  }

  const directLink = `${window.location.origin}/${shortId}.${ext}`;

  // Update UI with success state
  const dropZone = document.getElementById('dropZone');
  
  dropZone.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
        <div style="color: var(--accent); font-size: 0.9rem; margin-bottom:0.5rem;">UPLOAD COMPLETE</div>
        
        <div style="position: relative; display: flex; align-items: center;">
            <input type="text" value="${directLink}" id="resultUrl" class="input-minimal" 
                   style="padding-right: 120px; text-overflow: ellipsis; background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 4px; border: 1px solid var(--border);" readonly>
            
            <div style="position: absolute; right: 5px; display: flex; gap: 5px;">
                 <button onclick="showQr('${directLink}')" style="background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 0.3rem 0.6rem; font-size: 0.75rem; cursor: pointer; border-radius: 3px;" title="Show QR Code">
                    QR
                </button>
                <button onclick="copyUrl()" style="background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 0.3rem 0.6rem; font-size: 0.75rem; cursor: pointer; border-radius: 3px;">
                    COPY
                </button>
            </div>
        </div>

        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
            Direct Link • Expires in 24h
        </div>
        
        <button onclick="resetUpload()" style="margin-top: 1rem; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.8rem; text-decoration: underline;">
            Upload Another
        </button>
    </div>
  `;
  
  dropZone.onclick = null;
  dropZone.style.cursor = 'default';
  dropZone.classList.remove('drag-over');

  // Helper functions exposed to window
  window.copyUrl = () => {
    const input = document.getElementById('resultUrl');
    input.select();
    navigator.clipboard.writeText(input.value);
    
    // Animation
    input.classList.add('success-ring');
    setTimeout(() => input.classList.remove('success-ring'), 1000);
    
    // Button Text
    const btn = document.querySelector('button[onclick="copyUrl()"]');
    btn.innerText = 'COPIED';
    setTimeout(() => btn.innerText = 'COPY', 1500);
  };

  window.showQr = (url) => {
      const modal = document.getElementById('qrModal');
      const canvas = document.getElementById('qrCanvas');
      modal.classList.remove('hidden');
      
      QRCode.toCanvas(canvas, url, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, function (error) {
        if (error) console.error(error);
      });
  };

  window.resetUpload = () => {
    window.location.reload(); 
  };
}
