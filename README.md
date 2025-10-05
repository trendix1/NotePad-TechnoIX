NotePad Technoix - Web version
--------------------------------
This is a self-contained single-page web app (HTML/CSS/JS) that implements:
- Bottom navigation (Home, Projects, Settings, Account)
- Local accounts stored in localStorage (email + password hash)
- Per-account projects stored in localStorage
- Create project (title, description, location, image)
- Editor with basic formatting (contentEditable)
- Export project as TXT and PNG (PNG via html2canvas)
- Import TXT and other plain files into a new project
- VIP gating and a single redeem code to activate VIP
- Share link for VIP users (encodes project into URL hash)
- Theme toggle and language selection (basic)
- Contact via mailto (and placeholder for EmailJS)

Redeem code (single, embedded): TECHNOIX-VIP-2025
Use it in Account -> Redeem to enable VIP features.

Notes:
- This app uses client-side storage only. For real multi-device accounts, integrate Firebase Auth + Firestore.
- Sharing is done via URL encoding; large projects may exceed URL length. For sharing at scale, use server-side storage and short links.
- Encryption claims are not implemented here; for production, use server-side encryption and Android/iOS secure key stores.
- To run: open index.html in a browser. For full functionality (file downloads), use a normal browser (Chrome/Firefox).
