'use strict';
/* =====================================================================
   BOOT
===================================================================== */
async function boot() {
  document.title = S.settings.nama_app;
  setupPWA();
  render();
  if (!IS_PREVIEW) {
    if (SUPABASE_URL.includes('URL_SUPABASE') || SUPABASE_ANON_KEY.includes('ANON_KEY')) { $('app').innerHTML = `<div class="min-h-screen flex items-center justify-center p-6"><div class="glass-strong rounded-3xl p-8 max-w-md text-center"><div class="text-4xl mb-3">️</div><h2 class="text-xl font-extrabold mb-2">Konfigurasi Belum Lengkap</h2><p class="text-sm text-slate-600">Isi <b>SUPABASE_URL</b> dan <b>SUPABASE_ANON_KEY</b> pada bagian KONFIGURASI APLIKASI di kode.</p></div></div>`; return; }
    sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
    API = L;
  }
  await run(async () => {
    await autoSetupDatabase();
    try { const s = await API.getSettings(); if (s) S.settings = { ...S.settings, ...s }; document.title = S.settings.nama_app; } catch (e) { console.warn(e); }
    // pulihkan sesi
    let restored = false;
    try {
      if (!IS_PREVIEW) { const au = await API.adminSession(); if (au) { await enter('admin', { nama: 'Administrator', username: au.email }, null); restored = true; } }
      const ss = sessionStorage.getItem('cbt_sess');
      if (!restored && ss) {
        const { cred, user } = JSON.parse(ss); const r = await API.loginUser(cred.u, cred.p);
        if (r && r.success) {
          await enter(r.user.role, r.user, cred); restored = true;
          const rm = JSON.parse(sessionStorage.getItem('cbt_room') || 'null');
          if (rm && r.user.role === 'siswa' && new Date(rm.end).getTime() > now()) {
            const ex = ((S.sw && S.sw.exams) || []).find(x => x.id === rm.id);
            if (ex) { const st = await API.examState(S.cred, rm.id, rm.sid); sync(st.server_now); if (st.status === 'Aktif' && !st.duplicate && !st.selesai) startRoom(ex, rm.link, st.end_at, { sid: rm.sid, restored: true, count: st.pelanggaran, maks: st.maks, locked: st.terkunci }); else sessionStorage.removeItem('cbt_room'); }
          }
        }
      }
    } catch (e) { console.warn(e); sessionStorage.removeItem('cbt_sess'); }
    if (!restored) render(); else icons();
  }, 'Menyiapkan aplikasi...');
}
setInterval(() => { const c = $('mon-cd'); if (c) c.textContent = monClockText(); }, 1000);
boot();
