// NotePad Technoix - updated redeem logic (max 4 uses for redeem code)
// Redeem code (single): Sdwierh8dsDihdD
const REDEEM_CODE = "Sdwierh8dsDihdD";
const REDEEM_KEY = "np_redeem_" + REDEEM_CODE;
const REDEEM_LIMIT = 4;
const VIP_PRICE_IDR = 90000;

function qs(sel, el=document){return el.querySelector(sel)}
function qsa(sel, el=document){return Array.from(el.querySelectorAll(sel))}

const state = { user: null, projects: [], locale:'id', theme:'light' };

function init(){
  state.theme = localStorage.getItem('np_theme') || 'light';
  state.locale = localStorage.getItem('np_lang') || 'id';
  document.getElementById('app').className = state.theme;
  qs('#theme-select').value = state.theme;
  qs('#lang-select').value = state.locale;
  qsa('.nav-btn').forEach(b=>{ b.addEventListener('click', ()=>showView(b.dataset.view)); });
  showView('home-view');
  qs('#btn-add-project').onclick = ()=>qs('#modal-add').classList.remove('hidden');
  qs('#btn-cancel').onclick = ()=>qs('#modal-add').classList.add('hidden');
  qs('#btn-create').onclick = createProjectFromModal;
  qs('#btn-back').onclick = ()=>showView('home-view');
  qs('#btn-save-project').onclick = saveCurrentEditor;
  qs('#btn-export-project').onclick = exportCurrentProject;
  qs('#btn-export-all').onclick = exportAll;
  qs('#btn-import').onclick = ()=>{ qs('#file-import')?.remove(); let f=document.createElement('input'); f.type='file'; f.id='file-import'; f.accept='*/*'; f.onchange=handleImport; document.body.appendChild(f); f.click(); }
  qs('#btn-login').onclick = loginHandler;
  qs('#btn-register').onclick = registerHandler;
  qs('#link-register').onclick = (e)=>{ e.preventDefault(); toggleAuthForms('register'); }
  qs('#link-login').onclick = (e)=>{ e.preventDefault(); toggleAuthForms('login'); }
  qs('#btn-logout').onclick = logoutHandler;
  qs('#btn-redeem').onclick = redeemHandler;
  qs('#btn-vip-free').onclick = ()=>{alert('You are using Free plan.'); qs('#vip-popup').classList.add('hidden')};
  qs('#btn-buy-vip').onclick = buyVipPlaceholder;
  qs('#btn-close-vip').onclick = ()=>{ qs('#vip-popup').classList.add('hidden'); localStorage.setItem('np_vip_dismissed','1'); };
  qs('#theme-select').onchange = (e)=>{ setTheme(e.target.value) };
  qs('#lang-select').onchange = (e)=>{ setLang(e.target.value) };
  qs('#contact-mail').onclick = contactMail;
  qsa('[data-cmd]').forEach(b=>b.onclick = ()=>document.execCommand(b.dataset.cmd, false, null));
  qs('#font-select').onchange = ()=>document.execCommand('fontName', false, qs('#font-select').value);
  qs('#file-image').onchange = insertImageToEditor;
  loadSession();
  renderUserUI();
  renderProjects();
  checkSharedLink();
  qs('#vip-desc').textContent = 'Dua plan: Gratis dan VIP. VIP unlock sharing, fonts, dan enkripsi lebih kuat.';
  qs('#vip-price').textContent = VIP_PRICE_IDR.toLocaleString();
  setupVipCloseButtons();
  updateRedeemRemaining();
  setTimeout(()=>{ if(state.user && state.user.plan!=='vip' && !localStorage.getItem('np_vip_dismissed')) qs('#vip-popup').classList.remove('hidden'); }, 800);
}

function setupVipCloseButtons(){
  const vipClose = qs('#vip-close');
  const vipBtnClose = qs('#btn-close-vip');
  if(vipClose) vipClose.onclick = ()=>{ qs('#vip-popup').classList.add('hidden'); qs('#vip-popup').setAttribute('aria-hidden','true'); localStorage.setItem('np_vip_dismissed','1'); };
  if(vipBtnClose) vipBtnClose.onclick = ()=>{ qs('#vip-popup').classList.add('hidden'); qs('#vip-popup').setAttribute('aria-hidden','true'); localStorage.setItem('np_vip_dismissed','1'); };
}

function updateRedeemRemaining(){
  const used = JSON.parse(localStorage.getItem(REDEEM_KEY) || '[]');
  const remain = Math.max(0, REDEEM_LIMIT - used.length);
  const el = qs('#redeem-remaining');
  if(el) el.textContent = 'Sisa kuota kode redeem: ' + remain;
}

function showView(id){
  qsa('.view').forEach(v=>v.classList.add('hidden'));
  const el = qs('#'+id);
  if(el) el.classList.remove('hidden');
  if(id==='account-view') updateAccountPanel();
}

function storageKeyForUser(email){ return 'np_user_'+email.toLowerCase(); }
function usersIndexKey(){ return 'np_users_index'; }

async function loginHandler(){
  const e = qs('#login-email').value.trim();
  const p = qs('#login-pass').value;
  if(!e||!p){ alert('Email dan password harus diisi'); return; }
  const idx = JSON.parse(localStorage.getItem(usersIndexKey())||'[]');
  const found = idx.find(u=>u.email===e.toLowerCase());
  if(!found){ if(confirm('Akun tidak ditemukan. Ke halaman registrasi?')) toggleAuthForms('register'); return; }
  const hash = await sha256(p);
  if(found.passHash !== hash){ alert('Password salah'); return; }
  const user = JSON.parse(localStorage.getItem(storageKeyForUser(e)) || '{}');
  state.user = user;
  sessionStorage.setItem('np_session', e.toLowerCase());
  renderUserUI();
  loadProjectsForUser();
  showView('home-view');
}

async function registerHandler(){
  const e = qs('#reg-email').value.trim();
  const p = qs('#reg-pass').value;
  if(!e||!p){ alert('Email dan password harus diisi'); return; }
  const idx = JSON.parse(localStorage.getItem(usersIndexKey())||'[]');
  if(idx.find(u=>u.email===e.toLowerCase())){ alert('Akun sudah terdaftar. Silakan login.'); toggleAuthForms('login'); return; }
  const hash = await sha256(p);
  idx.push({email:e.toLowerCase(), passHash:hash});
  localStorage.setItem(usersIndexKey(), JSON.stringify(idx));
  const userObj = { email: e.toLowerCase(), plan: 'free', projects: [] };
  localStorage.setItem(storageKeyForUser(e), JSON.stringify(userObj));
  sessionStorage.setItem('np_session', e.toLowerCase());
  state.user = userObj;
  renderUserUI();
  loadProjectsForUser();
  alert('Terdaftar. Selamat!');
  showView('home-view');
}

function toggleAuthForms(mode){
  if(mode==='register'){ qs('#register-form').classList.remove('hidden'); qs('#login-form').classList.add('hidden'); }
  else { qs('#register-form').classList.add('hidden'); qs('#login-form').classList.remove('hidden'); }
}

function logoutHandler(){
  sessionStorage.removeItem('np_session');
  state.user = null;
  state.projects = [];
  renderUserUI();
  showView('account-view');
}

function renderUserUI(){
  const info = qs('#user-info');
  if(state.user){ info.textContent = state.user.email + ' (' + (state.user.plan||'Biasa') + ')'; qs('#acc-email').textContent = state.user.email; qs('#acc-plan').textContent = (state.user.plan==='vip'?'VIP':'Biasa'); qs('#account-panel').classList.remove('hidden'); qs('#auth-forms').classList.add('hidden'); }
  else { info.textContent = ''; qs('#account-panel').classList.add('hidden'); qs('#auth-forms').classList.remove('hidden'); toggleAuthForms('login'); }
}

function loadSession(){
  const s = sessionStorage.getItem('np_session');
  if(s){
    const userObj = JSON.parse(localStorage.getItem(storageKeyForUser(s))||'{}');
    if(userObj && userObj.email) { state.user = userObj; loadProjectsForUser(); }
  }
}

function loadProjectsForUser(){
  if(!state.user) return;
  state.projects = state.user.projects || [];
  renderProjects();
}

function saveUserState(){
  if(!state.user) return;
  localStorage.setItem(storageKeyForUser(state.user.email), JSON.stringify(state.user));
  updateRedeemRemaining();
}

function renderProjects(){
  const grid = qs('#projects-grid');
  grid.innerHTML = '';
  if(!state.user){ grid.innerHTML = '<p>Silakan login untuk melihat proyek Anda.</p>'; return; }
  if(state.projects.length===0) { grid.innerHTML = '<p>Belum ada proyek. Tekan "Tambah Proyek" untuk membuat.</p>'; return; }
  state.projects.forEach((p, i)=>{
    const card = document.createElement('div'); card.className='card';
    const img = document.createElement('img'); img.src = p.image || placeholderImage(p.title);
    const title = document.createElement('div'); title.textContent = p.title;
    const desc = document.createElement('div'); desc.textContent = p.location ? p.location + ' — ' + (p.description||'') : (p.description||'');
    const btnOpen = document.createElement('button'); btnOpen.textContent='Buka'; btnOpen.onclick = ()=>openProject(i);
    const btnDelete = document.createElement('button'); btnDelete.textContent='Hapus'; btnDelete.onclick = ()=>{ if(confirm('Hapus proyek?')){ state.projects.splice(i,1); state.user.projects = state.projects; saveUserState(); renderProjects(); } };
    card.appendChild(img); card.appendChild(title); card.appendChild(desc); card.appendChild(btnOpen); card.appendChild(btnDelete);
    grid.appendChild(card);
  });
}

function placeholderImage(title){
  const c=document.createElement('canvas'); c.width=600; c.height=320; const ctx=c.getContext('2d'); ctx.fillStyle='#ddd'; ctx.fillRect(0,0,c.width,c.height); ctx.fillStyle='#666'; ctx.font='30px Arial'; ctx.fillText(title||'Project',40,160); return c.toDataURL();
}

function createProjectFromModal(){
  const name = qs('#add-name').value.trim();
  if(!name){ alert('Nama proyek wajib'); return; }
  const loc = qs('#add-location').value.trim();
  const desc = qs('#add-desc').value.trim();
  const file = qs('#add-image').files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = ()=>{ const img = reader.result; pushProject({ title:name, location:loc, description:desc, image:img, content:'' }); qs('#modal-add').classList.add('hidden'); clearAddModal(); };
    reader.readAsDataURL(file);
  } else {
    pushProject({ title:name, location:loc, description:desc, image:placeholderImage(name), content:'' });
    qs('#modal-add').classList.add('hidden'); clearAddModal();
  }
}

function clearAddModal(){ qs('#add-name').value=''; qs('#add-desc').value=''; qs('#add-location').value=''; qs('#add-image').value=''; }

function pushProject(p){
  if(!state.user){ alert('Silakan login untuk membuat proyek'); return; }
  state.projects.push(p);
  state.user.projects = state.projects;
  saveUserState();
  alert('Proyek dibuat dan tersimpan permanen sampai dihapus.');
}

function openProject(index){
  const p = state.projects[index];
  if(!p) return;
  qs('#project-title').value = p.title;
  qs('#project-location').value = p.location || '';
  qs('#editor').innerHTML = p.content || '';
  qs('#editor-view').dataset.currentIndex = index;
  showView('editor-view');
}

function saveCurrentEditor(){
  const i = parseInt(qs('#editor-view').dataset.currentIndex || -1);
  const title = qs('#project-title').value.trim();
  const loc = qs('#project-location').value.trim();
  const content = qs('#editor').innerHTML;
  if(i<0){ alert('No project open'); return; }
  const p = state.projects[i];
  p.title = title; p.location = loc; p.content = content;
  state.user.projects = state.projects;
  saveUserState();
  renderProjects();
  alert('Disimpan.');
}

function exportCurrentProject(){
  const i = parseInt(qs('#editor-view').dataset.currentIndex || -1);
  if(i<0) return alert('Tidak ada proyek terbuka');
  const p = state.projects[i];
  const txt = stripHtml(p.content || '');
  downloadFile( txt, (p.title||'project') + '.txt', 'text/plain' );
  html2canvas(qs('#editor')).then(canvas=>{
    canvas.toBlob(blob=>{ downloadBlob(blob, (p.title||'project') + '.png'); }, 'image/png');
  });
}

function exportAll(){
  if(!state.user) return alert('Login untuk export');
  state.projects.forEach((p,i)=>{ const txt = stripHtml(p.content||''); downloadFile(txt, (p.title||'project') + '.txt', 'text/plain'); const img = new Image(); img.src = p.image || placeholderImage(p.title); img.onload = ()=>{ const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); ctx.drawImage(img,0,0); c.toBlob(b=>downloadBlob(b, (p.title||'project') + '.png'), 'image/png'); }; });
  alert('Export individual files dimulai; cek folder download Anda.');
}

function downloadFile(text, filename, type){
  const a = document.createElement('a');
  const blob = new Blob([text], {type});
  a.href = URL.createObjectURL(blob);
  a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}
function downloadBlob(blob, filename){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}

function stripHtml(html){ const tmp=document.createElement('div'); tmp.innerHTML = html; return tmp.textContent||tmp.innerText||''; }

function insertImageToEditor(e){
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{ document.execCommand('insertImage', false, r.result); };
  r.readAsDataURL(f);
}

function handleImport(e){
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{ const txt = reader.result; const title = prompt('Nama proyek baru untuk import', f.name.replace(/\.[^/.]+$/,"")); if(title){ pushProject({ title, location:'', description:'(Imported)', image:placeholderImage(title), content: '<pre>' + escapeHtml(txt) + '</pre>' }); } };
  reader.readAsText(f);
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function sha256(msg){
  const enc = new TextEncoder(); const data = enc.encode(msg);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b=>('00'+b.toString(16)).slice(-2)).join('');
}

// Redeem handler: limited to REDEEM_LIMIT unique users
function redeemHandler(){
  if(!state.user) return alert('Login untuk redeem');
  const code = qs('#redeem-input').value.trim();
  if(!code) return alert('Masukan kode');
  if(code !== REDEEM_CODE) { qs('#redeem-msg').textContent = 'Kode tidak valid.'; return; }
  // load used list
  let used = JSON.parse(localStorage.getItem(REDEEM_KEY) || '[]');
  const userEmail = state.user.email.toLowerCase();
  if(used.includes(userEmail)){
    qs('#redeem-msg').textContent = 'Akun ini sudah menggunakan kode redeem.';
    return;
  }
  if(used.length >= REDEEM_LIMIT){
    qs('#redeem-msg').textContent = 'Kode redeem sudah mencapai batas penggunaan.';
    return;
  }
  // grant VIP permanently
  used.push(userEmail);
  localStorage.setItem(REDEEM_KEY, JSON.stringify(used));
  state.user.plan = 'vip';
  saveUserState();
  qs('#redeem-msg').textContent = 'Redeem berhasil. Akun Anda sekarang VIP permanen.';
  updateRedeemRemaining();
}

// ... rest of functions (sharing, etc.) are unchanged for brevity
function buyVipPlaceholder(){ if(!state.user) return alert('Login untuk membeli VIP'); if(confirm('Simulasi pembelian VIP seharga '+VIP_PRICE_IDR.toLocaleString()+' IDR. Simulasikan status VIP?')){ state.user.plan = 'vip'; saveUserState(); renderUserUI(); alert('Status VIP aktif (simulasi).'); } }

function showVipPopupIfNeeded(){ if(!state.user) return; if(state.user.plan !== 'vip') qs('#vip-popup').classList.remove('hidden'); }

function updateAccountPanel(){ if(state.user){ qs('#account-panel').classList.remove('hidden'); qs('#auth-forms').classList.add('hidden'); } else { qs('#account-panel').classList.add('hidden'); qs('#auth-forms').classList.remove('hidden'); toggleAuthForms('login'); } }

function contactMail(){ const subj = encodeURIComponent('Permintaan bantuan - NotePad Technoix'); const body = encodeURIComponent('Halo Tim Technoix,%0A%0ASaya ingin... (isi pesan di sini)'); window.location.href = 'mailto:technoix.support@example.com?subject='+subj+'&body='+body; }

function setTheme(t){ state.theme = t; document.getElementById('app').className = t; localStorage.setItem('np_theme', t); }
function setLang(l){ state.locale = l; localStorage.setItem('np_lang', l); applyTranslations(); }
function applyTranslations(){}

function getCurrencySymbol(){ try{ const region = navigator.language || 'id-ID'; return (Intl.NumberFormat().resolvedOptions().locale || 'ID').toUpperCase(); }catch(e){ return 'IDR'; } }

// Sharing (VIP-only) simplified
function shareCurrentProject(){ const i = parseInt(qs('#editor-view').dataset.currentIndex || -1); if(i<0) return alert('Tidak ada proyek terbuka'); if(!state.user || state.user.plan !== 'vip') return alert('Fitur berbagi hanya untuk VIP'); const p = state.projects[i]; const data = btoa(encodeURIComponent(JSON.stringify(p))); const url = location.origin + location.pathname + '#share=' + data; copyToClipboard(url); alert('Link dibagikan (disalin ke clipboard). Anda dapat mengirimkannya ke teman.'); }
function copyToClipboard(txt){ navigator.clipboard.writeText(txt).then(()=>{},()=>{ alert('Gagal salin otomatis, copy manual: '+txt) }) }
function checkSharedLink(){ if(location.hash.startsWith('#share=')){ try{ const data = decodeURIComponent(atob(location.hash.slice(7))); const p = JSON.parse(data); if(confirm('Anda membuka proyek bersama. Import ke akun Anda?')){ const title = p.title || 'shared'; p.title = title + ' (shared)'; pushProject(p); location.hash = ''; } }catch(e){ console.error(e) } } }

window.addEventListener('DOMContentLoaded', init);
