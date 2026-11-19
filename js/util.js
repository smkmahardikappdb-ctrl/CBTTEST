'use strict';
/* =====================================================================
   UTIL
===================================================================== */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => 'id_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36).slice(-3);
const rndToken = () => String(Math.floor(10000 + Math.random() * 90000));
const rndPass = () => { const c = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
const pad = (n) => String(n).padStart(2, '0');
const hhmm = (t) => String(t || '').slice(0, 5);
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = (d) => { if (!d) return '-'; const x = new Date(String(d).slice(0, 10) + 'T00:00:00'); return x.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
const fmtDur = (ms) => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`; };
const ICONS = {
  'graduation-cap': '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'layout-dashboard': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  'school': '<path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 5v17M6 5v17"/><circle cx="12" cy="9" r="2"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'door-open': '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3M13 20h9M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>',
  'calendar-check': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'key': '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  'clipboard-list': '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  'user-cog': '<circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3M15.2 13.9l-.9-.3M16.6 18.7l.3-.9M19.1 12.2l.3-.9M19.6 18.7l-.4-1M16.8 12.3l-.4-1M14.3 16.6l1-.4M20.7 13.8l1-.4"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  'trash-2': '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  'plus': '<path d="M5 12h14M12 5v14"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'printer': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  'pencil': '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  'x': '<path d="M18 6 6 18M6 6l12 12"/>',
  'play': '<polygon points="5 3 19 12 5 21 5 3"/>',
  'check': '<polyline points="20 6 9 17 4 12"/>',
  'timer': '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  'lock-open': '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  'history': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'
};
const icons = () => {
  document.querySelectorAll('i[data-lucide]').forEach(el => {
    const p = ICONS[el.getAttribute('data-lucide')]; if (!p) return;
    const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ['viewBox:0 0 24 24', 'fill:none', 'stroke:currentColor', 'stroke-width:2', 'stroke-linecap:round', 'stroke-linejoin:round', 'width:20', 'height:20'].forEach(a => { const i = a.indexOf(':'); sv.setAttribute(a.slice(0, i), a.slice(i + 1)); });
    sv.style.cssText = 'flex-shrink:0;' + (el.getAttribute('style') || '');
    if (el.getAttribute('class')) sv.setAttribute('class', el.getAttribute('class'));
    sv.innerHTML = p; el.replaceWith(sv);
  });
};
const byId = (arr, id) => (arr || []).find(x => x.id === id);

function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  const col = type === 'err' ? '#dc2626' : type === 'warn' ? '#d97706' : '#059669';
  el.style.cssText = `background:rgba(255,255,255,.95);border:1px solid #e2e8f0;border-left:4px solid ${col};padding:10px 14px;border-radius:12px;font-size:.85rem;font-weight:600;box-shadow:0 10px 30px rgba(15,23,42,.15);width:100%`;
  el.textContent = msg;
  $('toast').appendChild(el);
  setTimeout(() => { el.style.transition = '.3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3200);
}
function loading(on, text = 'Memuat...') { $('loader').style.display = on ? 'flex' : 'none'; $('loader-text').textContent = text; }
async function run(fn, text) {
  loading(true, text);
  try { return await fn(); }
  catch (e) {
    console.error(e);
    let m = (e && e.message) ? e.message : String(e);
    if (/function .* does not exist|schema cache|relation .* does not exist/i.test(m)) m = 'Database belum disiapkan. Jalankan file SQL di Supabase SQL Editor terlebih dahulu.';
    toast(m, 'err');
    return undefined;
  } finally { loading(false); }
}
function openModal(html, wide) {
  const m = $('modal');
  m.innerHTML = `<div class="glass-strong fade-in" style="border-radius:1.25rem;padding:1.5rem;width:100%;max-width:${wide ? '720px' : '420px'};max-height:90vh;overflow:auto">${html}</div>`;
  m.style.display = 'flex'; icons();
}
function closeModal() { $('modal').style.display = 'none'; $('modal').innerHTML = ''; }
function ask({ title, text = '', input = null, ok = 'OK', danger = false, cancel = true }) {
  return new Promise(res => {
    const inp = input ? `<input id="ask-inp" class="inp mt-3" type="${input.type || 'text'}" value="${esc(input.value || '')}" placeholder="${esc(input.placeholder || '')}" autocomplete="off">` : '';
    openModal(`<h3 class="text-lg font-bold mb-1">${esc(title)}</h3><p class="text-sm text-slate-600">${text}</p>${inp}
      <div class="flex gap-2 justify-end mt-5">${cancel ? '<button class="btn btn-g" id="ask-no">Batal</button>' : ''}<button class="btn ${danger ? 'btn-d' : 'btn-p'}" id="ask-yes">${esc(ok)}</button></div>`);
    const done = (v) => { closeModal(); res(v); };
    $('ask-yes').onclick = () => done(input ? $('ask-inp').value : true);
    if ($('ask-no')) $('ask-no').onclick = () => done(input ? null : false);
    if (input) { $('ask-inp').focus(); $('ask-inp').onkeydown = (e) => { if (e.key === 'Enter') $('ask-yes').click(); }; }
  });
}
function printDoc(title, body) {
  const w = window.open('', '_blank');
  if (!w) { toast('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.', 'warn'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px}
  h2,h3{margin:0 0 4px}.kop{text-align:center;border-bottom:3px double #111;padding-bottom:10px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #333;padding:6px 8px;font-size:13px;text-align:left}th{background:#eee}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{border:2px solid #333;border-radius:8px;padding:12px;page-break-inside:avoid;font-size:13px}
  .card h4{margin:0 0 8px;text-align:center;border-bottom:1px solid #333;padding-bottom:6px}.card td{border:none;padding:2px 4px}
  .ruang{page-break-after:always;margin-bottom:24px}.ruang:last-child{page-break-after:auto}
  @media print{body{margin:10mm}}</style></head><body>${body}<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`);
  w.document.close();
}
