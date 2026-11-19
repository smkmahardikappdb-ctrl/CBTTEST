'use strict';
/* =====================================================================
   RUANG UJIAN SISWA + ANTI CURANG
   Lapis 1 (browser): layar penuh wajib, deteksi pindah tab/jendela, devtools,
     pemblokiran copy/paste/klik kanan/shortcut/print/back, watermark identitas.
   Lapis 2 (server): kunci otomatis, sesi tunggal, status 'selesai', log
     pelanggaran, pemantauan & buka-kunci oleh pengawas.
===================================================================== */
const FS_OK = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
const COARSE = !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function goFs() { const e = document.documentElement; try { const f = e.requestFullscreen || e.webkitRequestFullscreen; if (f) return Promise.resolve(f.call(e)).catch(() => {}); } catch (x) {} return Promise.resolve(); }
function leaveFs() { try { if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (x) {} }
const newSid = () => 's' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
function wmUrl(text) {
  const t = String(text).replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170"><text x="150" y="90" text-anchor="middle" transform="rotate(-24 150 85)" font-family="Arial" font-size="15" font-weight="700" fill="rgba(79,70,229,0.16)">${t}</text></svg>`;
  return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
}
const ovBox = (emoji, title, text, extra = '') => `<div class="glass-strong rounded-3xl p-7 max-w-md text-center mx-4"><div class="text-5xl mb-3">${emoji}</div><h3 class="text-2xl font-extrabold text-slate-800 mb-2">${title}</h3><p class="text-slate-600 text-sm mb-5">${text}</p>${extra}</div>`;
function roomOv(html, kind) { const o = $('room-ov'); if (!o || !S.room) return; S.room.ovKind = kind; o.innerHTML = html; o.style.display = 'flex'; icons(); }
function roomOvHide() { const o = $('room-ov'); if (o) { o.style.display = 'none'; o.innerHTML = ''; } if (S.room) { clearInterval(S.room.warnT); S.room.ovKind = null; } }
function roomHdr() { const R = S.room, el = $('room-viol'); if (!R || !el) return; el.textContent = `Pelanggaran ${R.count}/${R.maks}`; el.style.color = R.count ? '#dc2626' : '#64748b'; }
function showNeedFs() { const R = S.room; if (!R || R.over || R.locked) return; roomOv(ovBox('▢️', 'Layar Penuh Wajib', 'Ujian hanya dapat dikerjakan dalam mode layar penuh. Klik tombol di bawah untuk melanjutkan.', '<button class="btn btn-p w-full" onclick="A.roomFs()">Masuk Layar Penuh</button>'), 'fs'); }
function showLock() { const R = S.room; if (!R || R.over) return; clearInterval(R.warnT); roomOv(ovBox('✕', 'Ujian Terkunci', 'Anda melakukan pelanggaran melebihi batas yang diizinkan dan telah dilaporkan ke pengawas. Hubungi pengawas untuk membuka kunci. Halaman ini otomatis dilanjutkan setelah kunci dibuka.', '<button class="btn btn-g w-full" onclick="A.closeRoom()">Keluar dari Ruang Ujian</button>'), 'lock'); roomHdr(); }
function showWarn(jenis) {
  const R = S.room; if (!R || R.over) return;
  if (R.locked || R.count >= R.maks) { R.locked = true; showLock(); return; }
  let sec = 5;
  const draw = () => roomOv(ovBox('!️', 'Pelanggaran Terdeteksi', `<b>${esc(VIOL_LABEL[jenis] || jenis)}</b><br>Pelanggaran <b>${R.count} dari ${R.maks}</b>. Pada pelanggaran ke-${R.maks}, ujian Anda akan <b>terkunci</b> dan dilaporkan ke pengawas.`,
    `<button class="btn btn-p w-full" ${sec > 0 ? 'disabled style="opacity:.5"' : ''} onclick="A.roomAck()">${sec > 0 ? 'Harap tunggu ' + sec + ' detik' : 'Saya Mengerti, Lanjutkan'}</button>`), 'warn');
  draw(); clearInterval(R.warnT); R.warnT = setInterval(() => { sec--; if (sec <= 0) clearInterval(R.warnT); if (S.room && S.room.ovKind === 'warn') draw(); }, 1000); roomHdr();
}
function roomCleanup() {
  const R = S.room; if (!R) return;
  clearInterval(R.t1); clearInterval(R.t2); clearInterval(R.t3); clearInterval(R.warnT);
  (R.cleanups || []).forEach(f => { try { f(); } catch (e) {} }); R.cleanups = [];
  leaveFs();
}
function startRoom(ex, link, endAt, opt = {}) {
  const R = S.room = { ex, link, endAt: new Date(endAt).getTime(), over: false, sid: opt.sid || newSid(), count: opt.count || 0, maks: opt.maks || S.settings.maks_pelanggaran || 3, locked: !!opt.locked, lastV: 0, t0: Date.now(), cleanups: [], ovKind: null };
  sessionStorage.setItem('cbt_room', JSON.stringify({ id: ex.id, mapel: ex.mapel, link, end: endAt, sid: R.sid }));
  const el = document.createElement('div'); el.id = 'room'; el.className = 'noselect';
  el.style.cssText = 'position:fixed;inset:0;z-index:70;background:#fff;display:flex;flex-direction:column';
  el.innerHTML = `<div class="glass-strong flex items-center justify-between gap-3 px-4 py-2.5" style="border-radius:0 0 1rem 1rem;z-index:2"><div class="min-w-0"><div class="font-extrabold text-indigo-900 truncate">${esc(ex.mapel)}</div><div class="text-[11px] text-slate-500 truncate">${esc(S.user.nama)} • ${esc(S.user.kelas || '')} • <b id="room-viol">Pelanggaran 0/3</b></div></div>
    <div class="flex items-center gap-3"><div class="text-center"><div class="text-[10px] font-bold uppercase text-slate-400">Sisa Waktu</div><div id="room-timer" class="font-mono font-extrabold text-xl text-indigo-700">--:--:--</div></div><button class="btn btn-d btn-sm" onclick="A.finishExam()">Selesai</button></div></div>
    <div id="room-body" style="flex:1;position:relative;overflow:hidden"><iframe id="room-frame" src="${esc(link)}" sandbox="allow-scripts allow-forms allow-same-origin allow-modals" referrerpolicy="no-referrer" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="fullscreen"></iframe>
      <div style="position:absolute;inset:0;pointer-events:none;z-index:3;background-image:${wmUrl(S.user.nama + ' • ' + S.user.username)};background-repeat:repeat"></div></div>
    <div id="room-ov" style="display:none;position:absolute;inset:0;z-index:9;background:rgba(255,255,255,.98);align-items:center;justify-content:center;padding:16px"></div>`;
  $('cbt-root').appendChild(el); roomHdr();

  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); R.cleanups.push(() => t.removeEventListener(ev, fn, o)); };
  const violate = (jenis, detail = '') => {
    if (R.over || Date.now() - R.t0 < 2500 || Date.now() - R.lastV < 3000) return;
    R.lastV = Date.now(); R.count++; showWarn(jenis);
    API.logViolation(S.cred, ex.id, R.sid, jenis, detail).then(r => {
      if (!r || R.over) return;
      if (r.duplicate) { timeUp('Sesi Ganda / Direset', 'Ujian ini dibuka di perangkat lain atau sesi Anda direset oleh pengawas.'); return; }
      R.count = r.pelanggaran; R.maks = r.maks; roomHdr();
      if (r.terkunci && !R.locked) { R.locked = true; showLock(); }
    }).catch(() => {});
  };
  R.violate = violate;

  // --- Deteksi keluar dari fokus ujian ---
  on(document, 'visibilitychange', () => { if (document.hidden) violate('pindah_tab'); });
  on(window, 'blur', () => setTimeout(() => { const f = $('room-frame'); if (R.over) return; if (document.activeElement === f) return; if (!document.hasFocus()) violate('jendela_blur'); }, 200));
  if (FS_OK) { on(document, 'fullscreenchange', () => { if (!isFs() && !R.over) violate('fullscreen_keluar'); }); on(document, 'webkitfullscreenchange', () => { if (!isFs() && !R.over) violate('fullscreen_keluar'); }); }
  // --- Blokir aksi terlarang di halaman induk ---
  ['contextmenu', 'selectstart', 'dragstart'].forEach(ev => on(document, ev, e => { e.preventDefault(); }));
  ['copy', 'cut', 'paste'].forEach(ev => on(document, ev, e => { e.preventDefault(); violate('salin_tempel', ev); }));
  on(document, 'keydown', e => {
    const k = e.key || '', c = e.ctrlKey || e.metaKey;
    if (k === 'F12' || k === 'F5' || (c && e.shiftKey && /^[ijckIJCK]$/.test(k)) || (c && /^[uUsSpPaAcCvVxXrRfF]$/.test(k))) { e.preventDefault(); e.stopPropagation(); violate('shortcut', k); }
  }, true);
  on(document, 'keyup', e => { if (e.key === 'PrintScreen') { try { navigator.clipboard.writeText('Dilarang menyalin soal ujian'); } catch (x) {} violate('screenshot'); } });
  on(window, 'beforeunload', e => { e.preventDefault(); e.returnValue = ''; });
  try { history.pushState(null, '', location.href); } catch (x) {}
  on(window, 'popstate', () => { try { history.pushState(null, '', location.href); } catch (x) {} violate('tombol_kembali'); });
  on(window, 'offline', () => toast('Koneksi terputus. Jawaban yang belum terkirim mungkin gagal tersimpan.', 'warn'));
  // --- Heuristik developer tools (hanya desktop, saat layar penuh) ---
  R.t3 = setInterval(() => { if (R.over || COARSE || !isFs()) return; if (window.outerWidth - window.innerWidth > 220 || window.outerHeight - window.innerHeight > 220) violate('devtools'); }, 2500);

  // --- Timer ---
  const tick = () => {
    const left = R.endAt - now(); const t = $('room-timer'); if (!t) return;
    t.textContent = fmtDur(left); t.style.color = left < 300000 ? '#dc2626' : '#4338ca';
    if (left <= 0) timeUp('Waktu Habis!', 'Waktu ujian telah berakhir. Jawaban Anda sudah tidak dapat diubah.');
  };
  R.t1 = setInterval(tick, 1000); tick();
  // --- Detak jantung ke server (sesi ganda, kunci, perpanjangan, akhir ujian) ---
  R.t2 = setInterval(async () => {
    try {
      const st = await API.examState(S.cred, ex.id, R.sid); sync(st.server_now); if (R.over) return;
      R.endAt = new Date(st.end_at).getTime();
      if (st.duplicate) { timeUp('Sesi Ganda / Direset', 'Ujian ini dibuka di perangkat lain atau sesi Anda direset oleh pengawas.'); return; }
      if (st.status !== 'Aktif') { timeUp('Ujian Diakhiri', 'Ujian telah diakhiri oleh pengawas.'); return; }
      R.maks = st.maks; R.count = st.pelanggaran; roomHdr();
      if (st.terkunci && !R.locked) { R.locked = true; showLock(); }
      else if (!st.terkunci && R.locked) { R.locked = false; roomOv(ovBox('✓', 'Kunci Dibuka', 'Pengawas telah membuka kunci ujian Anda. Pelanggaran berikutnya akan langsung mengunci kembali.', '<button class="btn btn-p w-full" onclick="A.roomAck()">Lanjutkan Ujian</button>'), 'warn'); }
    } catch (e) {}
  }, 10000);

  // --- Awal masuk ---
  if (R.locked) showLock();
  else if (FS_OK && !isFs()) { goFs().then(() => { if (!isFs() && S.room === R && !R.ovKind) showNeedFs(); }); }
  if (opt.restored) { R.t0 = Date.now() - 3000; violate('reload'); }
}
function timeUp(title, text) {
  const R = S.room; if (!R || R.over) return; R.over = true; roomCleanup(); roomOvHide();
  const b = $('room-body'); if (b) b.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center"><div class="glass-strong rounded-3xl p-8 max-w-md"><div class="text-5xl mb-3">⏰</div><h3 class="text-3xl font-extrabold text-slate-800 mb-2">${esc(title)}</h3><p class="text-slate-600 mb-5">${esc(text)}</p><button class="btn btn-p" onclick="A.closeRoom()">Kembali ke Beranda</button></div></div>`;
}
function closeRoom(silent) {
  roomCleanup(); S.room = null; sessionStorage.removeItem('cbt_room');
  const el = $('room'); if (el) el.remove();
  if (!silent) A.go('s_ujian');
}
