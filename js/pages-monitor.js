'use strict';
/* =====================================================================
   MONITORING (Admin & Pengawas)
===================================================================== */
const VIOL_LABEL = { fullscreen_keluar: 'Keluar dari layar penuh', pindah_tab: 'Berpindah tab / aplikasi', jendela_blur: 'Jendela kehilangan fokus', devtools: 'Terdeteksi developer tools', shortcut: 'Menekan tombol terlarang', salin_tempel: 'Menyalin / menempel', screenshot: 'Mencoba screenshot', tombol_kembali: 'Menekan tombol kembali', reload: 'Memuat ulang halaman' };
const MON_BADGE = { selesai: ['Selesai', 'bg-slate-200 text-slate-600'], terkunci: ['Terkunci', 'bg-red-100 text-red-700'], aktif: ['Mengerjakan', 'bg-emerald-100 text-emerald-700'], offline: ['Offline', 'bg-amber-100 text-amber-700'], belum: ['Belum Masuk', 'bg-slate-100 text-slate-500'] };
function monState(r) { if (r.selesai) return 'selesai'; if (r.terkunci) return 'terkunci'; if (r.last_seen && now() - new Date(r.last_seen).getTime() < 45000) return 'aktif'; if (r.mulai_at) return 'offline'; return 'belum'; }
const agoStr = (t) => { if (!t) return '-'; const x = Math.max(0, Math.round((now() - new Date(t).getTime()) / 1000)); return x < 60 ? x + ' dtk lalu' : x < 3600 ? Math.floor(x / 60) + ' mnt lalu' : Math.floor(x / 3600) + ' jam lalu'; };
function monTable() {
  const m = S.mon; if (!S.monId) return empty('Pilih ujian terlebih dahulu.'); if (!m) return empty('Memuat data...');
  const cnt = { aktif: 0, terkunci: 0, selesai: 0, offline: 0, belum: 0 }; m.rows.forEach(r => cnt[monState(r)]++);
  const chip = (k, c) => `<div class="rounded-xl px-3 py-2 text-center ${c}"><div class="text-xl font-extrabold">${cnt[k]}</div><div class="text-[10px] font-bold uppercase">${MON_BADGE[k][0]}</div></div>`;
  const head = `<div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">${chip('aktif', 'bg-emerald-50 text-emerald-700')}${chip('terkunci', 'bg-red-50 text-red-700')}${chip('selesai', 'bg-slate-100 text-slate-600')}${chip('offline', 'bg-amber-50 text-amber-700')}${chip('belum', 'bg-slate-50 text-slate-500')}</div>`;
  if (!m.rows.length) return head + empty('Tidak ada siswa pada kelas ujian ini.');
  return head + tableWrap(`<table class="tbl"><thead><tr><th>Nama</th><th>Ruang</th><th>Status</th><th>Pelanggaran</th><th>Aktif Terakhir</th><th></th></tr></thead><tbody>${m.rows.map(r => { const st = monState(r), b = MON_BADGE[st];
    return `<tr><td class="font-semibold">${esc(r.nama)}<div class="text-[11px] text-slate-400">${esc(r.username)}</div></td><td>${esc(r.ruang)}</td><td><span class="badge ${b[1]}">${b[0]}</span></td>
      <td><b class="${r.pelanggaran >= m.maks ? 'text-red-600' : r.pelanggaran ? 'text-amber-600' : 'text-slate-500'}">${r.pelanggaran}/${m.maks}</b>${r.last_jenis ? `<div class="text-[11px] text-slate-400">${esc(VIOL_LABEL[r.last_jenis] || r.last_jenis)}</div>` : ''}</td><td class="text-xs text-slate-500">${agoStr(r.last_seen)}</td>
      <td class="text-right whitespace-nowrap">${r.pelanggaran ? `<button class="btn btn-g btn-sm" title="Riwayat" onclick="A.monDetail('${r.siswa_id}')"><i data-lucide="history" style="width:14px;height:14px"></i></button> ` : ''}${r.terkunci ? `<button class="btn btn-s btn-sm" onclick="A.monAct('${r.siswa_id}','buka_kunci')"><i data-lucide="lock-open" style="width:14px;height:14px"></i> Buka Kunci</button> ` : ''}${r.mulai_at && !r.terkunci ? `<button class="btn btn-g btn-sm" title="Izinkan masuk ulang" onclick="A.monAct('${r.siswa_id}','masuk_ulang')"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Masuk Ulang</button> ` : ''}${r.pelanggaran || r.mulai_at ? `<button class="btn btn-d btn-sm" title="Reset" onclick="A.monAct('${r.siswa_id}','reset')"><i data-lucide="x" style="width:14px;height:14px"></i></button>` : ''}</td></tr>`; }).join('')}</tbody></table>`);
}
function monList() {
  const l = S.role === 'admin' ? S.data.ujian.map(u => ({ id: u.id, t: u.tanggal, label: `${u.mapel} - ${kName(u.kelas_id)} (${u.tanggal})` })) : ((S.pw && S.pw.exams) || []).map(u => ({ id: u.id, t: u.tanggal, label: `${u.mapel} - ${u.kelas} (${u.tanggal})` }));
  return l.sort((a, b) => b.t.localeCompare(a.t));
}

/* ===== REKAP UJIAN / BERITA ACARA (admin & pengawas) ===== */
function rekapStat() {
  const m = S.mon; if (!m) return null;
  const c = { total: m.rows.length, hadir: 0, belum: 0, selesai: 0, terkunci: 0, pel: 0 };
  m.rows.forEach(r => { if (r.mulai_at) c.hadir++; else c.belum++; if (r.selesai) c.selesai++; if (r.terkunci) c.terkunci++; c.pel += r.pelanggaran || 0; });
  return c;
}
const rkTime = (t) => t ? new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
function rekapBody() {
  if (!S.monId) return empty('Pilih ujian terlebih dahulu.'); if (!S.mon) return empty('Memuat data...');
  const c = rekapStat(), m = S.mon;
  const chip = (n, l, cl) => `<div class="rounded-xl px-3 py-2 text-center ${cl}"><div class="text-xl font-extrabold">${n}</div><div class="text-[10px] font-bold uppercase">${l}</div></div>`;
  const head = `<div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">${chip(c.total, 'Peserta', 'bg-indigo-50 text-indigo-700')}${chip(c.hadir, 'Hadir', 'bg-emerald-50 text-emerald-700')}${chip(c.belum, 'Belum Masuk', 'bg-slate-100 text-slate-500')}${chip(c.selesai, 'Selesai', 'bg-sky-50 text-sky-700')}${chip(c.terkunci, 'Terkunci', 'bg-red-50 text-red-700')}${chip(c.pel, 'Pelanggaran', 'bg-amber-50 text-amber-700')}</div>`;
  if (!m.rows.length) return head + empty('Tidak ada siswa pada kelas ujian ini.');
  return head + tableWrap(`<table class="tbl"><thead><tr><th>#</th><th>Nama</th><th>Ruang</th><th>Status</th><th>Mulai</th><th>Pelanggaran</th></tr></thead><tbody>${m.rows.map((r, i) => { const b = MON_BADGE[monState(r)]; return `<tr><td>${i + 1}</td><td class="font-semibold">${esc(r.nama)}<div class="text-[11px] text-slate-400">${esc(r.username)}</div></td><td>${esc(r.ruang)}</td><td><span class="badge ${b[1]}">${b[0]}</span></td><td>${rkTime(r.mulai_at)}</td><td><b class="${r.pelanggaran ? 'text-amber-600' : 'text-slate-500'}">${r.pelanggaran}/${m.maks}</b></td></tr>`; }).join('')}</tbody></table>`);
}
function pgRekap() {
  const l = monList();
  return pageTitle('Rekap Ujian', 'Ringkasan kehadiran dan pelanggaran per ujian. Bisa dicetak sebagai berita acara atau diekspor ke Excel.') +
    card('Pilih Ujian', `<select class="inp" onchange="A.monSelect(this.value)"><option value="">- Pilih Ujian -</option>${l.map(x => `<option value="${x.id}" ${x.id === S.monId ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select>`) +
    card('Rekap', `<div id="rekap-body">${rekapBody()}</div>`, `<div class="flex gap-2 flex-wrap"><button class="btn btn-g btn-sm" onclick="A.loadMon()"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Segarkan</button><button class="btn btn-g btn-sm" onclick="A.rekapXlsx()"><i data-lucide="download" style="width:14px;height:14px"></i> Excel</button><button class="btn btn-p btn-sm" onclick="A.rekapPrint()"><i data-lucide="printer" style="width:14px;height:14px"></i> Cetak Berita Acara</button></div>`);
}

/* ===== Monitor: sisa waktu, tambah waktu, peringatan ===== */
function monEnd() {
  if (!S.monId) return null;
  if (S.role === 'admin') { const u = byId(S.data.ujian, S.monId), sx = u && byId(S.data.sesi, u.sesi_id); if (!sx) return null; return { end: new Date(`${u.tanggal}T${hhmm(sx.jam_berakhir)}:00`).getTime() + (u.extra_menit || 0) * 60000, extra: u.extra_menit || 0, status: u.status }; }
  const e = ((S.pw && S.pw.exams) || []).find(x => x.id === S.monId); return e ? { end: new Date(e.end_at).getTime(), extra: e.extra_menit || 0, status: e.status } : null;
}
function monClockText() { const e = monEnd(); if (!e) return ''; if (e.status !== 'Aktif') return 'Sudah diakhiri'; const d = e.end - now(); return d > 0 ? fmtDur(d) : 'Waktu habis'; }
function monClock() {
  const e = monEnd(); if (!e) return '';
  const b = [5, 10, 15, 30].map(m => `<button class="btn btn-g btn-sm" onclick="A.monExtend(${m})">+${m} menit</button>`).join('');
  return card('Sisa Waktu', `<div class="flex items-center justify-between gap-4 flex-wrap"><div><div id="mon-cd" class="text-4xl font-extrabold tabular-nums text-slate-800">${monClockText()}</div><div class="text-xs text-slate-500 mt-1">${e.extra ? 'Sudah ditambah ' + e.extra + ' menit. ' : ''}Tambahan waktu berlaku untuk semua peserta ujian ini.</div></div><div class="flex gap-2 flex-wrap">${b}</div></div>`);
}
function beep(n) {
  if (S.snd === false) return;
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!window.__ac) window.__ac = new C(); const ac = window.__ac; if (ac.state === 'suspended') ac.resume();
    for (let i = 0; i < n; i++) { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.28; o.frequency.value = n > 1 ? 880 : 640; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.start(t); o.stop(t + 0.22); }
  } catch (e) {}
}
function monAlert(m) {
  const cur = {}; m.rows.forEach(r => cur[r.siswa_id] = { p: r.pelanggaran || 0, k: !!r.terkunci });
  if (S.monPrev && S.monPrev.id === S.monId) m.rows.forEach(r => {
    const o = S.monPrev.d[r.siswa_id]; if (!o) return;
    if (r.terkunci && !o.k) { toast(`${r.nama} terkunci (${r.pelanggaran}/${m.maks} pelanggaran).`, 'err'); beep(2); }
    else if ((r.pelanggaran || 0) > o.p) { toast(`${r.nama}: ${VIOL_LABEL[r.last_jenis] || 'pelanggaran'} (${r.pelanggaran}/${m.maks}).`, 'warn'); beep(1); }
  });
  S.monPrev = { id: S.monId, d: cur };
}

function pgMonitor() {
  const l = monList();
  return pageTitle('Monitoring Ujian', 'Pantau peserta secara langsung: status, pelanggaran, dan kunci ujian. Diperbarui otomatis tiap 8 detik.') +
    card('Pilih Ujian', `<select class="inp" onchange="A.monSelect(this.value)"><option value="">- Pilih Ujian -</option>${l.map(x => `<option value="${x.id}" ${x.id === S.monId ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select>`) +
    '<div id="mon-clock">' + monClock() + '</div>' + card('Peserta', `<div id="mon-table">${monTable()}</div>`, `<button class="btn btn-g btn-sm" onclick="A.toggleSnd()">Suara: ${S.snd === false ? 'Mati' : 'Aktif'}</button> <button class="btn btn-g btn-sm" onclick="A.loadMon()"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Segarkan</button>`);
}
