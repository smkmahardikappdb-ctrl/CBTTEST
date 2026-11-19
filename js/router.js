'use strict';
/* =====================================================================
   ROUTER / RENDER
===================================================================== */
function render() { { const r = $('cbt-root'); if (r) r.dataset.role = S.role || ''; }
  if (!S.role) { renderLogin(); return; }
  const P_ = { dashboard: pgDashboard, kelas: pgKelas, users: pgUsers, sesi: pgSesi, ruang: pgRuang, ujian: pgUjian, settings: pgSettings, p_jadwal: pgPJadwal, p_tugas: pgPTugas, monitor: pgMonitor, p_monitor: pgMonitor, rekap: pgRekap, p_rekap: pgRekap, s_ujian: pgSUjian, s_profil: pgSProfil };
  const sc = $('cbt-root').scrollTop;
  $('app').innerHTML = shell((P_[S.page] || pgDashboard)());
  $('cbt-root').scrollTop = sc; icons(); tickTokens();
}
function tickTokens() {
  document.querySelectorAll('.tk-count').forEach(el => { const left = Number(el.dataset.until) - now(); el.textContent = left > 0 ? fmtDur(left).slice(3) : '00:00'; });
}
async function refresh() { S.data = await API.loadAll(); }
async function loadRole() {
  clearInterval(S.poll);
  if (S.role === 'admin') { await refresh(); }
  else if (S.role === 'pengawas') { S.pw = await API.getPengawas(S.cred); sync(S.pw.server_now); S.poll = setInterval(async () => { try { if (S.role === 'pengawas' && S.page === 'p_jadwal' && !$('modal').innerHTML) { S.pw = await API.getPengawas(S.cred); sync(S.pw.server_now); render(); } } catch (e) {} }, 20000); }
  else if (S.role === 'siswa') { S.sw = await API.getExams(S.cred); sync(S.sw.server_now); S.poll = setInterval(async () => { try { if (S.role === 'siswa' && S.page === 's_ujian' && !S.room) { S.sw = await API.getExams(S.cred); sync(S.sw.server_now); render(); } } catch (e) {} }, 30000); }
}
setInterval(() => { tickTokens(); }, 1000);
setInterval(() => { if ((S.page === 'monitor' || S.page === 'p_monitor') && S.monId && S.role && !$('modal').innerHTML) A.loadMon(true); }, 8000);
setInterval(() => { if (S.role === 'pengawas' && S.page === 'p_jadwal') { const exp = [...document.querySelectorAll('.tk-count')].some(el => Number(el.dataset.until) - now() < -1500); if (exp && !S.expBusy) { S.expBusy = true; API.getPengawas(S.cred).then(r => { S.pw = r; sync(r.server_now); render(); }).catch(() => {}).finally(() => { S.expBusy = false; }); } } }, 3000);

async function enter(role, user, cred) {
  S.role = role; S.user = user; S.cred = cred;
  $('cbt-root').dataset.role = role; S.page = role === 'admin' ? 'dashboard' : role === 'pengawas' ? 'p_jadwal' : 's_ujian';
  await loadRole(); render();
}
