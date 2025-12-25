export function renderTerms(container) {
  container.innerHTML = `
    <div class="terms-card">
        <div class="terms-header">
            <h1>LEGAL NOTICES</h1>
            <span class="terms-date">Effective Date: December 24, 2025</span>
        </div>

        <!-- TABS / NAVIGATION could go here, but scrolling is fine for now -->

        <div class="terms-section">
            <h2 style="color: var(--accent); margin-bottom: 1rem;">TERMS OF SERVICE</h2>
            
            <h3>1. Scope and Acceptance</h3>
            <p>Welcome to QuickPost ("QP", "we", "us"). By accessing or using our website and services (the "Service"), you agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and our Acceptable Use Policy. If you do not agree to these Terms, you may not use the Service.</p>
            <p>We reserve the right to modify these Terms at any time. Continued use of the Service constitutes acceptance of any changes.</p>

            <h3>2. Your Content & Permissions</h3>
            <p>You retain full ownership of the files, text, and other data you upload ("Your Content"). However, to provide the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, store, copy, transmit, and display Your Content solely as necessary to operate the Service (e.g., hosting your file and showing it to people you share the link with).</p>
            <p>We reserve the right to delete any content that violates these Terms or for any other reason at our sole discretion. <strong>You acknowledge that QuickPost is a temporary file hosting service. Files are automatically deleted after 24 hours. We make no guarantees of data persistence.</strong></p>

            <h3>3. Responsibilities</h3>
            <p>You are solely responsible for Your Content and your conduct. You represent and warrant that you own or have the necessary rights to all content you upload.</p>
            
            <h3>4. Disclaimer "AS-IS"</h3>
            <p><strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE".</strong> TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</p>

            <h3>5. Limitation of Liability</h3>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, QUICKPOST SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</p>
        </div>

        <div class="terms-section">
            <h2 style="color: var(--accent); margin-bottom: 1rem; margin-top: 3rem;">ACCEPTABLE USE POLICY (AUP)</h2>
            <p>You agree NOT to use the Service to:</p>
            <ul class="terms-list">
                <li>Upload <strong>Malware</strong>, viruses, ransomware, or malicious code of any kind.</li>
                <li>Distribute <strong>Child Sexual Abuse Material (CSAM)</strong> or any non-consensual sexual content. We strictly report such content to relevant authorities (e.g., NCMEC).</li>
                <li>Promote <strong>Terrorism</strong> or violent extremism.</li>
                <li>Infringe upon the <strong>Intellectual Property</strong> rights of others.</li>
                <li>Host content for <strong>Phishing</strong> or deceptive practices.</li>
                <li>Interfere with the security or proper functioning of the Service (e.g., DDoS, scraping).</li>
            </ul>
            <p>Violation of this AUP will result in immediate file deletion and potential blocking of your access.</p>
        </div>

        <div class="terms-section">
            <h2 style="color: var(--accent); margin-bottom: 1rem; margin-top: 3rem;">PRIVACY POLICY</h2>
            
            <h3>1. Data Collection</h3>
            <p>We collect minimal data to operate the Service:</p>
            <ul class="terms-list">
                <li><strong>Files</strong>: The content you upload (deleted after 24h).</li>
                <li><strong>Metadata</strong>: File size, upload time, and associated IP address (for abuse prevention).</li>
                <li><strong>Logs</strong>: Standard server logs (IP, User-Agent) retained briefly for security and debugging.</li>
            </ul>

            <h3>2. Data Use & Sharing</h3>
            <p>We do not sell your personal data. We only share information with third parties when necessary to:</p>
            <ul class="terms-list">
                <li>Comply with the law (e.g., valid subpoenas, warrants).</li>
                <li>Protect the rights and safety of QuickPost or its users.</li>
                <li>Service Providers: We use Supabase (Database/Storage) to host the Service.</li>
            </ul>
        </div>

        <div class="terms-section">
            <h2 style="color: var(--accent); margin-bottom: 1rem; margin-top: 3rem;">DMCA / COPYRIGHT POLICY</h2>
            <p>We respect intellectual property rights. If you believe your work isn being infringed, please use the <strong>"Report Abuse"</strong> button in the footer to submit a claim providing:</p>
            <ul class="terms-list">
                <li>Identification of the copyrighted work.</li>
                <li>The URL of the infringing material on QuickPost.</li>
                <li>Your contact information.</li>
            </ul>
            <p>We will respond expeditiously to remove infringing material in accordance with the Digital Millennium Copyright Act (DMCA).</p>
        </div>

        <div class="terms-actions">
            <a href="/" class="btn-primary">I Agree - Return to App</a>
        </div>
    </div>
  `;
}
