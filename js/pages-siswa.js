'use strict';
/* =====================================================================
   SISWA PAGES
===================================================================== */
function pgSUjian() {
  const ex = (S.sw && S.sw.exams) || [];
  const n = now();
  const body = !ex.length ? card('Ujian', empty('Belum ada jadwal ujian untuk kelas Anda.')) : `<div class="grid md:grid-cols-2 gap-4">${ex.map(u => {
    const st = new Date(u.start_at).getTime(), en = new Date(u.end_at).getTime();
    let badge, can = false;
    if (u.status !== 'Aktif') badge = '<span class="badge bg-slate-200 text-slate-600">Diakhiri</span>';
    else if (n < st) badge = '<span class="badge bg-amber-100 text-amber-700">Belum Dimulai</span>';
    else if (n >= en) badge = '<span class="badge bg-slate-200 text-slate-600">Selesai</span>';
    else { badge = '<span class="badge bg-emerald-100 text-emerald-700">Berlangsung</span>'; can = true; }
    return `<div class="glass rounded-2xl p-5"><div class="flex items-start justify-between gap-2"><h3 class="font-extrabold text-xl text-indigo-900">${esc(u.mapel)}</h3>${badge}</div>
      <div class="text-sm text-slate-600 mt-2 space-y-1"><div class="flex items-center gap-2"><i data-lucide="calendar-check" style="width:15px;height:15px"></i>${fmtDate(u.tanggal)}</div><div class="flex items-center gap-2"><i data-lucide="clock" style="width:15px;height:15px"></i>${esc(u.sesi)} • ${hhmm(u.jam_mulai)}-${hhmm(u.jam_berakhir)}</div></div>
      <button class="btn ${can ? 'btn-p' : 'btn-g'} w-full mt-4" ${can ? '' : 'disabled style="opacity:.55;cursor:not-allowed"'} onclick="A.prepareExam('${u.id}')"><i data-lucide="play" style="width:16px;height:16px"></i> Mulai Ujian</button></div>`;
  }).join('')}</div>`;
  return pageTitle('Ujian Saya', `Halo, ${esc(S.user.nama)}. Pilih ujian lalu masukkan token dari pengawas.`) + body;
}
function pgSProfil() {
  const u = S.user;
  return pageTitle('Profil') + `<div class="max-w-lg">${card('Data Peserta', `<div class="space-y-3 text-sm"><div class="flex justify-between border-b border-slate-100 pb-2"><span class="text-slate-500">Nama</span><b>${esc(u.nama)}</b></div><div class="flex justify-between border-b border-slate-100 pb-2"><span class="text-slate-500">Username</span><b>${esc(u.username)}</b></div><div class="flex justify-between border-b border-slate-100 pb-2"><span class="text-slate-500">Kelas</span><b>${esc(u.kelas || '-')}</b></div><div class="flex justify-between"><span class="text-slate-500">Sekolah</span><b>${esc(S.settings.nama_sekolah)}</b></div></div>
    <button class="btn btn-d w-full mt-5" onclick="A.logout()"><i data-lucide="log-out" style="width:16px;height:16px"></i> Keluar</button>`)}</div>`;
}
