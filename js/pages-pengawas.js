'use strict';
/* =====================================================================
   PENGAWAS PAGES
===================================================================== */
function pgPJadwal() {
  const ex = (S.pw && S.pw.exams) || [];
  const t = todayStr();
  const body = !ex.length ? card('Jadwal Ujian', empty('Belum ada jadwal ujian.')) : ex.map(u => {
    const live = u.status === 'Aktif' && now() >= new Date(u.start_at).getTime() && now() < new Date(u.end_at).getTime();
    const until = new Date(u.token_updated_at).getTime() + 300000;
    return `<div class="glass rounded-2xl p-5 mb-4 ${u.tanggal === t ? 'ring-2 ring-indigo-200' : ''}"><div class="flex flex-wrap items-start justify-between gap-3">
      <div><div class="font-extrabold text-xl text-slate-800">${esc(u.mapel)}</div><div class="text-sm text-slate-500">Kelas ${esc(u.kelas)} • ${fmtDate(u.tanggal)}</div><div class="text-sm text-slate-500">${esc(u.sesi)} • ${hhmm(u.jam_mulai)}-${hhmm(u.jam_berakhir)}${u.extra_menit ? ` <b class="text-amber-600">(+${u.extra_menit} menit)</b>` : ''}</div>
      <div class="mt-2">${u.status !== 'Aktif' ? '<span class="badge bg-slate-200 text-slate-600">Selesai</span>' : live ? '<span class="badge bg-emerald-100 text-emerald-700">Berlangsung</span>' : now() < new Date(u.start_at).getTime() ? '<span class="badge bg-amber-100 text-amber-700">Belum Mulai</span>' : '<span class="badge bg-slate-200 text-slate-600">Waktu Berakhir</span>'}</div></div>
      <div class="text-center"><div class="text-[11px] font-bold uppercase text-slate-500">Token Ujian</div>${u.status === 'Aktif' ? `<div class="token-box">${esc(u.token)}</div><div class="text-xs text-slate-500">Berganti dalam <b class="tk-count" data-until="${until}">--:--</b></div>` : '<div class="token-box text-slate-300">-----</div>'}</div></div>
      ${u.status === 'Aktif' ? `<div class="flex flex-wrap gap-2 mt-4"><button class="btn btn-g btn-sm" onclick="A.pNewToken('${u.id}')"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Ganti Token</button><button class="btn btn-p btn-sm" onclick="A.pMon('${u.id}')"><i data-lucide="activity" style="width:14px;height:14px"></i> Pantau Peserta</button><button class="btn btn-s btn-sm" onclick="A.pExtend('${u.id}')"><i data-lucide="timer" style="width:14px;height:14px"></i> Tambah Waktu</button><button class="btn btn-d btn-sm" onclick="A.pEnd('${u.id}')"><i data-lucide="x" style="width:14px;height:14px"></i> Akhiri Ujian</button></div>` : ''}</div>`;
  }).join('');
  return pageTitle('Jadwal & Token', 'Semua jadwal ujian. Halaman diperbarui otomatis setiap 20 detik.') + body;
}
function pgPTugas() {
  const t = (S.pw && S.pw.tugas) || [];
  return pageTitle('Tugas Saya', 'Jadwal pengawasan ruang Anda.') + card('Jadwal Tugas Pengawas', !t.length ? empty('Belum ada tugas pengawasan.') : tableWrap(`<table class="tbl"><thead><tr><th>Tanggal</th><th>Sesi</th><th>Jam</th><th>Ruang</th></tr></thead><tbody>${t.map(x => `<tr><td>${fmtDate(x.tanggal)}</td><td>${esc(x.sesi)}</td><td>${hhmm(x.jam_mulai)}-${hhmm(x.jam_berakhir)}</td><td class="font-semibold">${esc(x.ruang)}</td></tr>`).join('')}</tbody></table>`));
}
