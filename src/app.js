import { renderUpload } from './upload.js';
import { renderViewer } from './viewer.js';
import { renderTerms } from './terms.js';
import { renderFooter } from './footer.js';

const app = document.getElementById('app');

async function init() {
  const path = window.location.pathname.replace(/^\/|\/$/g, '');
  const params = new URLSearchParams(window.location.search);
  const fileId = params.get('id');

  // 1. Terms Page Route
  if (path === 'terms') {
    renderTerms(app);
  }
  // 2. Viewer Route (Direct ID in path or ?id= param)
  // Check if path exists and isn't index.html
  else if (path && path !== 'index.html') {
      const id = path.split('.')[0]; // Remove .jpg etc if present
      await renderViewer(app, id);
  } 
  else if (fileId) {
      await renderViewer(app, fileId);
  } 
  // 3. Home / Upload Route
  else {
      renderUpload(app);
  }

  // Always render Footer
  renderFooter();
}

init();
