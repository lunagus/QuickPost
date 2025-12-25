import { supabase } from './lib/supabase.js';

export function renderFooter(container) {
  const footerHtml = `
    <footer class="app-footer">
        <div class="footer-content">
            <!-- GitHub -->
            <a href="https://github.com/lunagus" target="_blank" class="footer-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                <span>lunagus</span>
            </a>

            <!-- Feedback -->
            <button id="openFeedback" class="footer-btn primary">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                <span>Feedback</span>
            </button>

            <!-- Donate -->
            <a href="https://coff.ee/lunagus" target="_blank" class="footer-link warning">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>
                <span>Donate</span>
            </a>
            
             <!-- Legal Links -->
            <div class="footer-separator"></div>
            <a href="/terms" class="footer-text-link">Terms</a>
            <button id="openReport" class="footer-text-link">Report Abuse</button>
        </div>
    </footer>

    <!-- Feedback Modal -->
    <div id="feedbackModal" class="modal hidden">
        <div class="modal-content">
            <h3 class="modal-title">Send Feedback</h3>
            <p class="modal-subtitle">We'd love to hear from you!</p>
            
            <div id="feedbackForm">
                <input type="text" id="fbName" class="input-full" placeholder="Name">
                <input type="email" id="fbEmail" class="input-full" placeholder="Email">
                <textarea id="fbMessage" class="input-full" rows="4" placeholder="Message"></textarea>
                
                <div class="modal-actions">
                    <button class="btn-text" id="closeFeedback">Cancel</button>
                    <button class="btn-primary" id="submitFeedback">Send</button>
                </div>
            </div>
            <div id="feedbackSuccess" class="hidden" style="text-align: center; color: var(--accent);">
                Thank you! Message sent.
            </div>
        </div>
    </div>

    <!-- Report Abuse Modal -->
    <div id="reportModal" class="modal hidden">
        <div class="modal-content">
            <h3 class="modal-title" style="color: var(--warning);">Report Abuse</h3>
            <p class="modal-subtitle">Report content that violates our policies.</p>
            
            <input type="text" id="reportLink" class="input-full" placeholder="Link to content (e.g. qp.ftp.sh/xyz)">
            <select id="reportReason" class="input-full">
                 <option value="" disabled selected>Select Reason</option>
                 <option value="malware">Malware / Virus</option>
                 <option value="illegal">Illegal Content</option>
                 <option value="copyright">Copyright Infringement</option>
                 <option value="other">Other</option>
            </select>
            <textarea id="reportDesc" class="input-full" rows="3" placeholder="Additional details..."></textarea>
            
            <div class="modal-actions">
                <button class="btn-text" id="closeReport">Cancel</button>
                <button class="btn-primary warning" id="submitReport">Submit Report</button>
            </div>
        </div>
    </div>
  `;

  // Append footer to body if not present, or container
  if(container) {
      container.innerHTML += footerHtml;
  } else {
      document.body.insertAdjacentHTML('beforeend', footerHtml);
  }

  attachFooterEvents();
}

function attachFooterEvents() {
    // Modal Toggles
    const toggleModal = (id, show) => {
        const el = document.getElementById(id);
        if(show) el.classList.remove('hidden');
        else el.classList.add('hidden');
    };

    document.getElementById('openFeedback').onclick = () => toggleModal('feedbackModal', true);
    document.getElementById('closeFeedback').onclick = () => toggleModal('feedbackModal', false);
    
    document.getElementById('openReport').onclick = () => toggleModal('reportModal', true);
    document.getElementById('closeReport').onclick = () => toggleModal('reportModal', false);

    // Feedback Submission
    document.getElementById('submitFeedback').onclick = async () => {
        const btn = document.getElementById('submitFeedback');
        const name = document.getElementById('fbName').value;
        const email = document.getElementById('fbEmail').value;
        const message = document.getElementById('fbMessage').value;

        if(!message) return alert("Please enter a message");

        btn.disabled = true;
        btn.innerText = "Sending...";

        try {
            await fetch("https://formspree.io/f/xldleqja", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message })
            });
            document.getElementById('feedbackForm').classList.add('hidden');
            document.getElementById('feedbackSuccess').classList.remove('hidden');
            setTimeout(() => {
                toggleModal('feedbackModal', false);
                // Reset form
                document.getElementById('feedbackForm').classList.remove('hidden');
                document.getElementById('feedbackSuccess').classList.add('hidden');
                document.getElementById('fbMessage').value = '';
                btn.disabled = false;
                btn.innerText = "Send";
            }, 2000);
        } catch(e) {
            alert("Failed to send feedback");
            btn.disabled = false;
            btn.innerText = "Send";
        }
    };

    // Report Submission
    document.getElementById('submitReport').onclick = async () => {
         const btn = document.getElementById('submitReport');
         btn.disabled = true;
         btn.innerText = "Reporting...";
         
         
         // In a real app, this would hit a backend. For now, we use Formspree.
         const link = document.getElementById('reportLink').value;
         const reason = document.getElementById('reportReason').value;
         
         if(!link || !reason) {
             alert("Please provide a link and reason");
             btn.disabled = false;
             btn.innerText = "Submit Report";
             return;
         }

         try {
            await fetch("https://formspree.io/f/xldleqja", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject: "ABUSE REPORT", link, reason, details: document.getElementById('reportDesc').value })
            });
             alert("Report submitted. We will review it shortly.");
             toggleModal('reportModal', false);
         } catch(e) {
             alert("Error submitting report");
         } finally {
             btn.disabled = false;
             btn.innerText = "Submit Report";
         }
    };
}
