'use strict';
/* =====================================================================
   RENDER: LOGIN
===================================================================== */
function brand(size = 40) {
  const lg = S.settings.logo;
  return lg ? `<img src="${esc(lg)}" style="width:${size}px;height:${size}px;object-fit:contain;border-radius:10px" alt="">`
    : `<div style="width:${size}px;height:${size}px" class="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg"><i data-lucide="graduation-cap" style="width:${size * .55}px;height:${size * .55}px"></i></div>`;
}
function renderLogin() {
  const t = S.loginTab;
  $('app').innerHTML = `<div class="min-h-screen flex items-center justify-center p-4"><div class="login-wrap fade-in"><div class="login-hero"><div>${brand(48)}</div><div><h2>${esc(S.settings.nama_sekolah)}</h2><p>${esc(S.settings.nama_app)}</p></div><div><div class="bubbles"><i></i><i class="f"></i><i></i><i></i></div><small>Masuk dengan akun pada kartu ujian Anda.</small></div></div><div class="login-form">
    <div class="mb-6"><h1 class="text-2xl font-extrabold text-slate-800">Masuk</h1><p class="text-sm text-slate-500">Pilih jenis akun, lalu isi data login.</p></div>
    <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 mb-5">
      <button class="btn ${t === 'user' ? 'btn-p' : 'btn-g'} !shadow-none" onclick="A.loginTab('user')"><i data-lucide="users" style="width:16px;height:16px"></i> Peserta / Pengawas</button>
      <button class="btn ${t === 'admin' ? 'btn-p' : 'btn-g'} !shadow-none" onclick="A.loginTab('admin')"><i data-lucide="shield-check" style="width:16px;height:16px"></i> Admin</button>
    </div>
    <form onsubmit="return A.doLogin(event)" class="space-y-4">
      <div><label class="lbl">${t === 'admin' ? 'Email Admin' : 'Username / ID'}</label><input id="lg-u" class="inp" type="${t === 'admin' ? 'email' : 'text'}" required autocomplete="username" placeholder="${t === 'admin' ? 'admin@email.com' : 'Masukkan username'}"></div>
      <div><label class="lbl">Password</label><div class="relative"><input id="lg-p" class="inp pr-10" type="password" required autocomplete="current-password" placeholder="••••••••"><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onclick="A.togglePw()"><i data-lucide="eye" style="width:18px;height:18px"></i></button></div></div>
      <button class="btn btn-p w-full !py-3" type="submit">Masuk</button>
    </form>
    ${IS_PREVIEW ? `<div class="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed"><b>MODE PREVIEW</b> (data dummy di memori, tidak masuk Supabase)<br>Admin: <code>admin@demo.com</code> / <code>admin123</code><br>Pengawas: <code>pengawas01</code> / <code>pengawas123</code><br>Siswa: <code>siswa001</code> / <code>siswa123</code></div>` : ''}
  </div></div></div>`;
  icons();
}

/* =====================================================================
   RENDER: SHELL (sidebar desktop + bottom nav mobile)
===================================================================== */
const MENUS = {
  admin: [['dashboard', 'Dashboard', 'layout-dashboard'], ['kelas', 'Kelas', 'school'], ['users', 'Pengguna', 'users'], ['sesi', 'Sesi', 'clock'], ['ruang', 'Ruang', 'door-open'], ['ujian', 'Jadwal Ujian', 'calendar-check'], ['monitor', 'Monitoring', 'activity'], ['rekap', 'Rekap Ujian', 'file-text'], ['settings', 'Pengaturan', 'settings']],
  pengawas: [['p_jadwal', 'Jadwal & Token', 'key'], ['p_monitor', 'Pantau Peserta', 'activity'], ['p_rekap', 'Rekap Ujian', 'file-text'], ['p_tugas', 'Tugas Saya', 'clipboard-list']],
  siswa: [['s_ujian', 'Ujian Saya', 'calendar-check'], ['s_profil', 'Profil', 'user-cog']]
};
const NAV_GROUPS = {
  admin: [{ n: 'Beranda', ic: 'layout-dashboard', p: ['dashboard'] }, { n: 'Data Master', ic: 'school', p: ['kelas', 'users', 'sesi', 'ruang'] }, { n: 'Ujian', ic: 'calendar-check', p: ['ujian', 'monitor', 'rekap'] }, { n: 'Pengaturan', ic: 'settings', p: ['settings'] }],
  pengawas: [{ n: 'Ujian', ic: 'activity', p: ['p_jadwal', 'p_monitor', 'p_rekap'] }, { n: 'Tugas Saya', ic: 'clipboard-list', p: ['p_tugas'] }]
};
const ROLE_LABEL = { admin: 'Administrator', pengawas: 'Pengawas', siswa: 'Peserta' };
function shell(content) {
  const menus = MENUS[S.role];
  const grp = NAV_GROUPS[S.role] || menus.map(m => ({ n: m[1], ic: m[2], p: [m[0]] }));
  const mi = (id) => menus.find(m => m[0] === id);
  const isAct = (g) => g.p.includes(S.page);
  const nav = grp.map(g => {
    if (g.p.length === 1) { const m = mi(g.p[0]); return `<button class="nav-btn ${isAct(g) ? 'on' : ''}" onclick="A.go('${m[0]}')"><i data-lucide="${m[2]}" style="width:18px;height:18px"></i>${m[1]}</button>`; }
    const open = (S.navOpen || {})[g.n] !== undefined ? S.navOpen[g.n] : isAct(g);
    return `<div><button class="nav-btn" onclick="A.navToggle('${g.n}')"><i data-lucide="${g.ic}" style="width:18px;height:18px"></i><span class="flex-1">${g.n}</span><span class="nav-car">${open ? '\u2212' : '+'}</span></button>${open ? `<div class="nav-sub">${g.p.map(id => `<button class="nav-btn ${S.page === id ? 'on' : ''}" onclick="A.go('${id}')">${mi(id)[1]}</button>`).join('')}</div>` : ''}</div>`;
  }).join('');
  const bn = grp.map(g => { const one = g.p.length === 1, m = mi(g.p[0]); return `<button class="bn-btn ${isAct(g) ? 'on' : ''}" onclick="A.go('${g.p[0]}')"><i data-lucide="${one ? m[2] : g.ic}"></i><span>${one ? m[1] : g.n}</span></button>`; }).join('');
  const ag = grp.find(isAct);
  const chips = ag && ag.p.length > 1 ? `<div class="md:hidden flex gap-2 overflow-x-auto mb-4 bn-scroll">${ag.p.map(id => `<button class="btn btn-sm ${S.page === id ? 'btn-p' : 'btn-g'}" onclick="A.go('${id}')">${mi(id)[1]}</button>`).join('')}</div>` : '';
  const inst = S.installEvt ? `<button class="nav-btn" onclick="A.install()"><i data-lucide="download" style="width:18px;height:18px"></i>Pasang Aplikasi</button>` : '';
  return `<aside class="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 glass-strong p-4 z-20" style="border-radius:0 1.5rem 1.5rem 0">
      <div class="flex items-center gap-3 px-2 py-3 mb-3">${brand(40)}<div class="min-w-0"><div class="font-extrabold text-slate-800 leading-tight truncate">${esc(S.settings.nama_app)}</div><div class="text-[11px] text-slate-500 truncate">${esc(S.settings.nama_sekolah)}</div></div></div>
      <nav class="flex-1 space-y-1 overflow-y-auto">${nav}${inst}</nav>
      <div class="mt-3 p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100"><div class="text-sm font-bold text-indigo-900 truncate">${esc(S.user.nama)}</div><div class="text-[11px] text-indigo-600 mb-2">${ROLE_LABEL[S.role]}${S.user.kelas ? ' • ' + esc(S.user.kelas) : ''}</div>
        <button class="btn btn-d btn-sm w-full" onclick="A.logout()"><i data-lucide="log-out" style="width:14px;height:14px"></i> Keluar</button></div>
    </aside>
    <header class="md:hidden sticky top-0 z-20 glass-strong flex items-center justify-between px-4 py-3" style="border-radius:0 0 1.25rem 1.25rem">
      <div class="flex items-center gap-2 min-w-0">${brand(32)}<div class="font-extrabold text-slate-800 truncate text-sm">${esc(S.settings.nama_app)}</div></div>
      <div class="flex items-center gap-2">${S.installEvt ? `<button class="btn btn-g btn-sm" onclick="A.install()"><i data-lucide="download" style="width:14px;height:14px"></i></button>` : ''}<button class="btn btn-d btn-sm" onclick="A.logout()"><i data-lucide="log-out" style="width:14px;height:14px"></i></button></div>
    </header>
    <main class="md:ml-64 p-4 md:p-8 pb-32 md:pb-8 fade-in" id="main">${chips}${content}</main>
    <nav class="md:hidden fixed left-3 right-3 z-30 glass-strong rounded-2xl p-1.5 flex gap-1 overflow-x-auto bn-scroll" style="bottom:calc(12px + env(safe-area-inset-bottom));justify-content:${grp.length < 4 ? 'space-around' : 'flex-start'}">${bn}</nav>`;
}
const card = (title, inner, extra = '') => `<div class="glass rounded-2xl p-5 md:p-6 mb-5"><div class="flex items-center justify-between gap-3 flex-wrap mb-4"><h3 class="font-bold text-lg text-slate-800">${title}</h3>${extra}</div>${inner}</div>`;
const pageTitle = (t, sub = '') => `<div class="mb-6"><h2 class="text-2xl md:text-3xl font-extrabold text-slate-800">${t}</h2>${sub ? `<p class="text-sm text-slate-500 mt-1">${sub}</p>` : ''}</div>`;
const tableWrap = (inner) => `<div class="overflow-x-auto rounded-xl border border-slate-100 bg-white/60">${inner}</div>`;
const empty = (t = 'Belum ada data.') => `<div class="text-center text-sm text-slate-400 py-8">${t}</div>`;
const kName = (id) => (byId(S.data.kelas, id) || {}).nama_kelas || '-';
const uName = (id) => (byId(S.data.users, id) || {}).nama || '-';
const delBtn = (t, id) => `<button class="btn btn-d btn-sm" onclick="A.del('${t}','${id}')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>`;
const kelasOpts = (sel = '', all = false) => (all ? `<option value="">Semua Kelas</option>` : `<option value="">- Pilih Kelas -</option>`) + S.data.kelas.slice().sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas)).map(k => `<option value="${k.id}" ${k.id === sel ? 'selected' : ''}>${esc(k.nama_kelas)}</option>`).join('');
const sesiLabel = (s) => `${esc(s.nama_sesi)} (${hhmm(s.jam_mulai)}-${hhmm(s.jam_berakhir)})`;
