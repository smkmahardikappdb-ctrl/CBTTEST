'use strict';
/* =====================================================================
   ADMIN PAGES
===================================================================== */
function pgDashboard() {
  const d = S.data, t = todayStr();
  const stat = (n, l, ic, c) => `<div class="glass rounded-2xl p-5 flex items-center gap-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center ${c}"><i data-lucide="${ic}"></i></div><div><div class="text-3xl font-extrabold text-slate-800">${n}</div><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">${l}</div></div></div>`;
  const list = (arr) => !arr.length ? empty('Tidak ada ujian.') : tableWrap(`<table class="tbl"><thead><tr><th>Mapel</th><th>Kelas</th><th>Tanggal</th><th>Sesi</th><th>Token</th><th>Status</th></tr></thead><tbody>${arr.map(u => { const s = byId(d.sesi, u.sesi_id) || {}; return `<tr><td class="font-semibold">${esc(u.mapel)}</td><td>${esc(kName(u.kelas_id))}</td><td>${fmtDate(u.tanggal)}</td><td>${esc(s.nama_sesi || '-')} <span class="text-slate-400">${hhmm(s.jam_mulai)}-${hhmm(s.jam_berakhir)}</span></td><td><b class="font-mono tracking-widest text-indigo-700">${esc(u.token)}</b></td><td>${statusBadge(u.status)}</td></tr>`; }).join('')}</tbody></table>`);
  const hari = d.ujian.filter(u => u.tanggal === t), depan = d.ujian.filter(u => u.tanggal > t).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  return pageTitle('Dashboard', `Selamat datang, ${esc(S.user.nama)}`) + `<div class="hero-strip"><div><div class="hs-d">${fmtDate(t)}</div><div class="hs-t">${hari.length ? hari.length + ' ujian hari ini' : 'Tidak ada ujian hari ini'}</div></div><div class="hs-n">${depan.length}<small>ujian mendatang</small></div></div>` +
    `<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">${stat(d.kelas.length, 'Kelas', 'school', 'bg-indigo-100 text-indigo-600')}${stat(d.users.filter(u => u.role === 'siswa').length, 'Siswa', 'users', 'bg-sky-100 text-sky-600')}${stat(d.ruang.length, 'Ruang', 'door-open', 'bg-violet-100 text-violet-600')}${stat(d.ujian.length, 'Ujian', 'calendar-check', 'bg-emerald-100 text-emerald-600')}</div>` +
    card('Ujian Hari Ini', list(hari), `<button class="btn btn-g btn-sm" onclick="A.reload()"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Segarkan</button>`) +
    card('Ujian Mendatang', list(depan)) + `<p class="text-xs text-slate-400">Token berganti otomatis setiap 5 menit. Tekan Segarkan untuk melihat token terbaru.</p>`;
}
const statusBadge = (s) => s === 'Aktif' ? '<span class="badge bg-emerald-100 text-emerald-700">Aktif</span>' : '<span class="badge bg-slate-200 text-slate-600">Selesai</span>';

function pgKelas() {
  const rows = S.data.kelas.slice().sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas));
  return pageTitle('Kelas', 'Kelola daftar kelas.') + `<div class="grid lg:grid-cols-3 gap-5"><div>${card('Tambah Kelas', `<form onsubmit="return A.addKelas(event)" class="space-y-3"><div><label class="lbl">Nama Kelas</label><input id="f-kelas" class="inp" required placeholder="mis. X-A"></div><button class="btn btn-p w-full"><i data-lucide="plus" style="width:16px;height:16px"></i> Simpan</button></form>`)}</div>
    <div class="lg:col-span-2">${card('Daftar Kelas', !rows.length ? empty() : tableWrap(`<table class="tbl"><thead><tr><th>#</th><th>Nama Kelas</th><th>Jumlah Siswa</th><th></th></tr></thead><tbody>${rows.map((k, i) => `<tr><td>${i + 1}</td><td class="font-semibold">${esc(k.nama_kelas)}</td><td>${S.data.users.filter(u => u.kelas_id === k.id && u.role === 'siswa').length}</td><td class="text-right">${delBtn('kelas', k.id)}</td></tr>`).join('')}</tbody></table>`))}</div></div>`;
}

function kartuSiswaHtml(nama, kelas, ruang, un, pw) {
  return `<div class="card"><h4>KARTU PESERTA UJIAN<br><small>${esc(S.settings.nama_sekolah)}</small></h4><table><tr><td>Nama</td><td>: <b>${esc(nama)}</b></td></tr><tr><td>Kelas</td><td>: ${esc(kelas || '-')}</td></tr>${ruang === null ? '' : `<tr><td>Ruang</td><td>: ${esc(ruang)}</td></tr>`}<tr><td>Username</td><td>: <b>${esc(un)}</b></td></tr><tr><td>Password</td><td>: <b>${esc(pw)}</b></td></tr><tr><td>Alamat</td><td>: ${esc(location.origin)}</td></tr></table></div>`;
}
function kartuPengawasHtml(u, pw) {
  const d = S.data, tg = d.ruang_pengawas.filter(x => x.pengawas_id === u.id).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal))).slice(0, 4).map(x => { const sx = byId(d.sesi, x.sesi_id) || {}; return `<div>${fmtDate(x.tanggal)} - ${esc((byId(d.ruang, x.ruang_id) || {}).nama_ruang || '')} (${esc(sx.nama_sesi || '')} ${hhmm(sx.jam_mulai)}-${hhmm(sx.jam_berakhir)})</div>`; }).join('');
  return `<div class="card"><h4>KARTU PENGAWAS UJIAN<br><small>${esc(S.settings.nama_sekolah)}</small></h4><table><tr><td>Nama</td><td>: <b>${esc(u.nama)}</b></td></tr><tr><td>Username</td><td>: <b>${esc(u.username)}</b></td></tr><tr><td>Password</td><td>: <b>${esc(pw)}</b></td></tr><tr><td>Alamat</td><td>: ${esc(location.origin)}</td></tr></table>${tg ? `<div style="margin-top:6px;font-size:11px;border-top:1px dashed #333;padding-top:4px"><b>Tugas:</b>${tg}</div>` : ''}</div>`;
}
function importDone(rows, skip) {
  openModal(`<h3 class="text-lg font-bold mb-1">Import selesai</h3><p class="text-sm text-slate-600">${rows.length} akun dibuat${skip ? `, ${skip} dilewati karena NIS sudah terdaftar` : ''}. Password acak hanya terlihat sekarang, jadi cetak atau unduh sebelum menutup. Nanti kartu bisa dicetak ulang per akun dari tabel pengguna.</p>
    <div class="flex gap-2 justify-end mt-5 flex-wrap"><button class="btn btn-g" id="im-x">Tutup</button><button class="btn btn-g" id="im-xl">Unduh Excel</button><button class="btn btn-p" id="im-pr">Cetak Kartu</button></div>`);
  $('im-x').onclick = closeModal; $('im-xl').onclick = () => A.unduhImport(); $('im-pr').onclick = () => A.cetakImport();
}
function userRows() {
  const q = S.userQ.toLowerCase();
  return S.data.users.filter(u => u.role === S.userTab && (!S.userKelas || u.kelas_id === S.userKelas) && (!q || (u.nama + ' ' + u.username).toLowerCase().includes(q)));
}
function userTable() {
  const rows = userRows();
  if (!rows.length) return empty('Tidak ada pengguna.');
  const sw = S.userTab === 'siswa';
  return tableWrap(`<table class="tbl"><thead><tr><th>#</th><th>Nama</th><th>Username</th>${sw ? '<th>Kelas</th>' : ''}<th></th></tr></thead><tbody>${rows.map((u, i) => `<tr><td>${i + 1}</td><td class="font-semibold">${esc(u.nama)}</td><td><code>${esc(u.username)}</code></td>${sw ? `<td>${esc(kName(u.kelas_id))}</td>` : ''}<td class="text-right whitespace-nowrap"><button class="btn btn-g btn-sm" title="Ganti password" onclick="A.changePw('${u.id}')"><i data-lucide="key" style="width:14px;height:14px"></i></button> <button class="btn btn-g btn-sm" title="Cetak kartu (password baru)" onclick="A.cetakKartuUser('${u.id}')"><i data-lucide="printer" style="width:14px;height:14px"></i></button> ${delBtn('users', u.id)}</td></tr>`).join('')}</tbody></table>`);
}
function pgUsers() {
  const sw = S.userTab === 'siswa';
  return pageTitle('Pengguna', 'Kelola akun siswa dan pengawas.') +
    `<div class="flex gap-2 mb-5"><button class="btn ${sw ? 'btn-p' : 'btn-g'}" onclick="A.userTab('siswa')">Siswa</button><button class="btn ${!sw ? 'btn-p' : 'btn-g'}" onclick="A.userTab('pengawas')">Pengawas</button></div>
    <div class="grid lg:grid-cols-3 gap-5"><div>
      ${card('Tambah ' + (sw ? 'Siswa' : 'Pengawas'), `<form onsubmit="return A.addUser(event)" class="space-y-3">
        <div><label class="lbl">Nama Lengkap</label><input id="f-nama" class="inp" required></div>
        <div><label class="lbl">${sw ? 'NIS / NISN (jadi username)' : 'Username / ID'}</label><input id="f-user" class="inp" required autocomplete="off"></div>
        <p class="text-xs text-slate-500">Password dibuat otomatis setelah disimpan, lalu bisa langsung dicetak di kartu.</p>
        ${sw ? `<div><label class="lbl">Kelas</label><select id="f-kls" class="inp" required>${kelasOpts()}</select></div>` : ''}
        <button class="btn btn-p w-full"><i data-lucide="plus" style="width:16px;height:16px"></i> Simpan</button></form>`)}
      ${card('Import Excel', `<p class="text-xs text-slate-500 mb-3">Kolom: <b>nama, nis, kelas</b>. NIS/NISN dipakai sebagai username, password dibuat acak otomatis. NIS yang sudah terdaftar dilewati. Kelas baru dibuat otomatis. Format kolom nis sebagai Teks agar angka 0 di depan tidak hilang.</p>
        <div class="flex flex-col gap-2"><button class="btn btn-g" onclick="A.template()"><i data-lucide="download" style="width:16px;height:16px"></i> Unduh Template</button>
        <input type="file" id="f-import" accept=".xlsx,.xls,.csv" class="hidden" onchange="A.importFile(this)"><button class="btn btn-s" onclick="document.getElementById('f-import').click()"><i data-lucide="upload" style="width:16px;height:16px"></i> Import File</button></div>`)}
      ${sw ? card('Cetak Kartu Peserta', `<p class="text-xs text-slate-500 mb-3">Password disimpan terenkripsi, sehingga saat mencetak password siswa akan <b>direset ke password acak baru</b> lalu dicetak pada kartu.</p><select id="f-kartu" class="inp mb-3">${kelasOpts('', true)}</select><button class="btn btn-p w-full" onclick="A.cetakKartu()"><i data-lucide="printer" style="width:16px;height:16px"></i> Cetak Kartu</button>`) : card('Cetak Kartu Pengawas', `<p class="text-xs text-slate-500 mb-3">Kartu berisi username, password, alamat aplikasi, dan jadwal tugas. Password pengawas yang dipilih akan <b>direset ke password acak baru</b> lalu dicetak.</p><select id="f-kartu-pw" class="inp mb-3"><option value="">Semua pengawas</option>${S.data.users.filter(u => u.role === 'pengawas').map(u => `<option value="${u.id}">${esc(u.nama)}</option>`).join('')}</select><button class="btn btn-p w-full" onclick="A.cetakKartuPengawas()"><i data-lucide="printer" style="width:16px;height:16px"></i> Cetak Kartu</button>`)}
    </div>
    <div class="lg:col-span-2">${card('Data ' + (sw ? 'Siswa' : 'Pengawas') + ` <span class="text-sm font-medium text-slate-400">(${userRows().length})</span>`,
      `<div class="flex gap-2 mb-3 flex-wrap"><input class="inp" style="flex:1;min-width:160px" placeholder="Cari nama / username..." value="${esc(S.userQ)}" oninput="A.userSearch(this.value)">${sw ? `<select class="inp" style="width:auto" onchange="A.userKelasFilter(this.value)">${kelasOpts(S.userKelas, true)}</select>` : ''}</div><div id="user-table">${userTable()}</div>`)}</div></div>`;
}

function pgSesi() {
  const rows = S.data.sesi.slice().sort((a, b) => hhmm(a.jam_mulai).localeCompare(hhmm(b.jam_mulai)));
  return pageTitle('Sesi Ujian', 'Atur jam mulai dan berakhir tiap sesi.') + `<div class="grid lg:grid-cols-3 gap-5"><div>${card('Tambah Sesi', `<form onsubmit="return A.addSesi(event)" class="space-y-3">
    <div><label class="lbl">Nama Sesi</label><input id="f-sesi" class="inp" required placeholder="mis. Sesi 1"></div>
    <div class="grid grid-cols-2 gap-3"><div><label class="lbl">Jam Mulai</label><input id="f-jm" type="time" class="inp" required></div><div><label class="lbl">Jam Berakhir</label><input id="f-jb" type="time" class="inp" required></div></div>
    <button class="btn btn-p w-full"><i data-lucide="plus" style="width:16px;height:16px"></i> Simpan</button></form>`)}</div>
    <div class="lg:col-span-2">${card('Daftar Sesi', !rows.length ? empty() : tableWrap(`<table class="tbl"><thead><tr><th>Sesi</th><th>Mulai</th><th>Berakhir</th><th></th></tr></thead><tbody>${rows.map(s => `<tr><td class="font-semibold">${esc(s.nama_sesi)}</td><td>${hhmm(s.jam_mulai)}</td><td>${hhmm(s.jam_berakhir)}</td><td class="text-right">${delBtn('sesi', s.id)}</td></tr>`).join('')}</tbody></table>`))}</div></div>`;
}

function plotList() {
  if (!S.plotRuang) return empty('Pilih ruang terlebih dahulu.');
  const sis = S.data.users.filter(u => u.role === 'siswa' && (!S.plotKelas || u.kelas_id === S.plotKelas));
  if (!sis.length) return empty('Tidak ada siswa.');
  return `<div class="grid sm:grid-cols-2 gap-2">${sis.map(s => {
    const asg = S.data.ruang_siswa.find(r => r.siswa_id === s.id);
    const here = asg && asg.ruang_id === S.plotRuang, other = asg && !here;
    return `<label class="flex items-center gap-3 p-3 rounded-xl border ${here ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white/70'} ${other ? 'opacity-60' : 'cursor-pointer'}">
      <input type="checkbox" class="w-4 h-4 accent-indigo-600" ${here ? 'checked' : ''} ${other ? 'disabled' : ''} onchange="A.toggleSiswa('${s.id}',this.checked)">
      <div class="min-w-0"><div class="text-sm font-semibold truncate">${esc(s.nama)}</div><div class="text-[11px] text-slate-500">${esc(kName(s.kelas_id))}${other ? ' • ' + esc((byId(S.data.ruang, asg.ruang_id) || {}).nama_ruang || '') : ''}</div></div></label>`;
  }).join('')}</div>`;
}
function pgRuang() {
  const d = S.data, t = S.ruangTab;
  const tabs = [['ruang', 'Daftar Ruang'], ['plot', 'Plotting Siswa'], ['siswa', 'Siswa per Ruang'], ['pengawas', 'Pengawas Ruang']];
  let body = '';
  if (t === 'ruang') {
    body = `<div class="grid lg:grid-cols-3 gap-5"><div>${card('Tambah Ruang', `<form onsubmit="return A.addRuang(event)" class="space-y-3"><div><label class="lbl">Nama Ruang</label><input id="f-ruang" class="inp" required placeholder="mis. Ruang 1"></div><button class="btn btn-p w-full"><i data-lucide="plus" style="width:16px;height:16px"></i> Simpan</button></form>`)}</div>
      <div class="lg:col-span-2">${card('Daftar Ruang', !d.ruang.length ? empty() : tableWrap(`<table class="tbl"><thead><tr><th>Ruang</th><th>Jumlah Siswa</th><th></th></tr></thead><tbody>${d.ruang.map(r => `<tr><td class="font-semibold">${esc(r.nama_ruang)}</td><td>${d.ruang_siswa.filter(x => x.ruang_id === r.id).length}</td><td class="text-right">${delBtn('ruang', r.id)}</td></tr>`).join('')}</tbody></table>`))}</div></div>`;
  } else if (t === 'plot') {
    body = card('Plotting Siswa ke Ruang', `<div class="grid sm:grid-cols-2 gap-3 mb-4"><div><label class="lbl">Ruang</label><select class="inp" onchange="A.plotRuang(this.value)"><option value="">- Pilih Ruang -</option>${d.ruang.map(r => `<option value="${r.id}" ${r.id === S.plotRuang ? 'selected' : ''}>${esc(r.nama_ruang)}</option>`).join('')}</select></div>
      <div><label class="lbl">Filter Kelas</label><select class="inp" onchange="A.plotKelas(this.value)">${kelasOpts(S.plotKelas, true)}</select></div></div><div id="plot-list">${plotList()}</div>`);
  } else if (t === 'siswa') {
    body = card('Daftar Siswa Berdasarkan Ruang', !d.ruang.length ? empty('Belum ada ruang.') : d.ruang.map(r => {
      const sis = d.ruang_siswa.filter(x => x.ruang_id === r.id).map(x => byId(d.users, x.siswa_id)).filter(Boolean);
      return `<div class="mb-4"><div class="flex items-center justify-between mb-2"><b>${esc(r.nama_ruang)} <span class="text-slate-400 font-medium">(${sis.length})</span></b><span class="whitespace-nowrap"><button class="btn btn-p btn-sm" onclick="A.cetakTempel('${r.id}')"><i data-lucide="printer" style="width:14px;height:14px"></i> Cetak Tempel</button> <button class="btn btn-g btn-sm" onclick="A.cetakSiswaRuang('${r.id}')">Daftar Hadir</button></span></div>${!sis.length ? empty('Belum ada siswa.') : tableWrap(`<table class="tbl"><thead><tr><th>#</th><th>Nama</th><th>Kelas</th><th>Username</th><th></th></tr></thead><tbody>${sis.map((s, i) => `<tr><td>${i + 1}</td><td class="font-semibold">${esc(s.nama)}</td><td>${esc(kName(s.kelas_id))}</td><td><code>${esc(s.username)}</code></td><td class="text-right"><button class="btn btn-d btn-sm" onclick="A.removeSiswa('${r.id}','${s.id}')"><i data-lucide="x" style="width:14px;height:14px"></i></button></td></tr>`).join('')}</tbody></table>`)}</div>`;
    }).join(''), `<button class="btn btn-g btn-sm" onclick="A.cetakTempel('')"><i data-lucide="printer" style="width:14px;height:14px"></i> Tempel Semua Ruang</button> <button class="btn btn-g btn-sm" onclick="A.cetakSiswaRuang('')">Daftar Hadir Semua</button>`);
  } else {
    const pw = d.users.filter(u => u.role === 'pengawas');
    const rows = d.ruang_pengawas.slice().sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
    body = `<div class="grid lg:grid-cols-3 gap-5"><div>${card('Tugaskan Pengawas', `<form onsubmit="return A.addRuangPengawas(event)" class="space-y-3">
      <div><label class="lbl">Tanggal</label><input id="f-rp-tgl" type="date" class="inp" required value="${todayStr()}"></div>
      <div><label class="lbl">Sesi</label><select id="f-rp-sesi" class="inp" required><option value="">- Pilih Sesi -</option>${d.sesi.map(s => `<option value="${s.id}">${sesiLabel(s)}</option>`).join('')}</select></div>
      <div><label class="lbl">Ruang</label><select id="f-rp-ruang" class="inp" required><option value="">- Pilih Ruang -</option>${d.ruang.map(r => `<option value="${r.id}">${esc(r.nama_ruang)}</option>`).join('')}</select></div>
      <div><label class="lbl">Pengawas</label><select id="f-rp-pw" class="inp" required><option value="">- Pilih Pengawas -</option>${pw.map(p => `<option value="${p.id}">${esc(p.nama)}</option>`).join('')}</select></div>
      <button class="btn btn-p w-full"><i data-lucide="plus" style="width:16px;height:16px"></i> Simpan</button></form>`)}</div>
      <div class="lg:col-span-2">${card('Jadwal Tugas Pengawas', !rows.length ? empty() : tableWrap(`<table class="tbl"><thead><tr><th>Tanggal</th><th>Sesi</th><th>Ruang</th><th>Pengawas</th><th></th></tr></thead><tbody>${rows.map(r => { const s = byId(d.sesi, r.sesi_id) || {}; return `<tr><td>${fmtDate(r.tanggal)}</td><td>${esc(s.nama_sesi || '-')} <span class="text-slate-400">${hhmm(s.jam_mulai)}-${hhmm(s.jam_berakhir)}</span></td><td>${esc((byId(d.ruang, r.ruang_id) || {}).nama_ruang || '-')}</td><td class="font-semibold">${esc(uName(r.pengawas_id))}</td><td class="text-right">${delBtn('ruang_pengawas', r.id)}</td></tr>`; }).join('')}</tbody></table>`), `<button class="btn btn-g btn-sm" onclick="A.cetakPengawas()"><i data-lucide="printer" style="width:14px;height:14px"></i> Cetak</button>`)}</div></div>`;
  }
  return pageTitle('Ruang', 'Ruang ujian, plotting siswa, dan penempatan pengawas.') +
    `<div class="flex gap-2 mb-5 overflow-x-auto pb-1">${tabs.map(x => `<button class="btn ${t === x[0] ? 'btn-p' : 'btn-g'}" onclick="A.ruangTab('${x[0]}')">${x[1]}</button>`).join('')}</div>` + body;
}

function pgUjian() {
  const d = S.data, e = S.editUjian ? byId(d.ujian, S.editUjian) : null;
  const rows = d.ujian.slice().sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  return pageTitle('Jadwal Ujian', 'Atur jadwal, link Google Form, dan token ujian.') + `<div class="grid xl:grid-cols-3 gap-5"><div>${card(e ? 'Edit Jadwal Ujian' : 'Tambah Jadwal Ujian', `<form onsubmit="return A.saveUjian(event)" class="space-y-3">
      <div><label class="lbl">Kelas</label><select id="f-uj-kls" class="inp" required>${kelasOpts(e ? e.kelas_id : '')}</select></div>
      <div><label class="lbl">Mata Pelajaran</label><input id="f-uj-map" class="inp" required value="${esc(e ? e.mapel : '')}"></div>
      <div><label class="lbl">Tanggal</label><input id="f-uj-tgl" type="date" class="inp" required value="${e ? e.tanggal : todayStr()}"></div>
      <div><label class="lbl">Sesi</label><select id="f-uj-sesi" class="inp" required><option value="">- Pilih Sesi -</option>${d.sesi.map(s => `<option value="${s.id}" ${e && e.sesi_id === s.id ? 'selected' : ''}>${sesiLabel(s)}</option>`).join('')}</select></div>
      <div><label class="lbl">Link Ujian (Google Form / lainnya)</label><input id="f-uj-link" type="url" class="inp" required placeholder="https://..." value="${esc(e ? e.link : '')}"></div>
      <div class="flex gap-2"><button class="btn btn-p flex-1"><i data-lucide="check" style="width:16px;height:16px"></i> ${e ? 'Perbarui' : 'Simpan'}</button>${e ? `<button type="button" class="btn btn-g" onclick="A.resetUjian()">Batal</button>` : ''}</div></form>`)}</div>
    <div class="xl:col-span-2">${card('Daftar Jadwal Ujian', !rows.length ? empty() : tableWrap(`<table class="tbl"><thead><tr><th>Mapel</th><th>Kelas</th><th>Waktu</th><th>Token</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(u => { const s = byId(d.sesi, u.sesi_id) || {}; return `<tr><td class="font-semibold">${esc(u.mapel)}<div class="text-[11px] text-slate-400 max-w-[180px] truncate">${esc(u.link)}</div></td><td>${esc(kName(u.kelas_id))}</td><td>${fmtDate(u.tanggal)}<div class="text-xs text-slate-500">${esc(s.nama_sesi || '-')} ${hhmm(s.jam_mulai)}-${hhmm(s.jam_berakhir)}${u.extra_menit ? ` (+${u.extra_menit}m)` : ''}</div></td><td><b class="font-mono tracking-widest text-indigo-700">${esc(u.token)}</b></td><td>${statusBadge(u.status)}</td>
      <td class="text-right whitespace-nowrap"><button class="btn btn-g btn-sm" title="Token baru" onclick="A.tokenManual('${u.id}')"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i></button> <button class="btn btn-g btn-sm" title="Edit" onclick="A.editUjian('${u.id}')"><i data-lucide="pencil" style="width:14px;height:14px"></i></button> <button class="btn btn-g btn-sm" title="${u.status === 'Aktif' ? 'Akhiri' : 'Aktifkan'}" onclick="A.toggleStatus('${u.id}')"><i data-lucide="${u.status === 'Aktif' ? 'x' : 'play'}" style="width:14px;height:14px"></i></button> ${delBtn('ujian', u.id)}</td></tr>`; }).join('')}</tbody></table>`), `<button class="btn btn-g btn-sm" onclick="A.reload()"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Segarkan</button> <button class="btn btn-p btn-sm" onclick="A.cetakJadwal()"><i data-lucide="printer" style="width:14px;height:14px"></i> Cetak Jadwal</button>`)}</div></div>`;
}

function pgSettings() {
  const s = S.settings;
  return pageTitle('Pengaturan', 'Identitas aplikasi dan sekolah.') + `<div class="max-w-2xl">${card('Konfigurasi Identitas', `<form onsubmit="return A.saveSettings(event)" class="space-y-4">
    <div><label class="lbl">Nama Aplikasi</label><input id="st-app" class="inp" required value="${esc(s.nama_app)}"></div>
    <div><label class="lbl">Nama Sekolah</label><input id="st-sch" class="inp" required value="${esc(s.nama_sekolah)}"></div>
    <div><label class="lbl">Alamat</label><textarea id="st-alm" class="inp" rows="2">${esc(s.alamat)}</textarea></div>
    <div><label class="lbl">Zona Waktu Ujian</label><select id="st-tz" class="inp">${[['Asia/Jakarta', 'WIB (Asia/Jakarta)'], ['Asia/Makassar', 'WITA (Asia/Makassar)'], ['Asia/Jayapura', 'WIT (Asia/Jayapura)']].map(z => `<option value="${z[0]}" ${s.zona_waktu === z[0] ? 'selected' : ''}>${z[1]}</option>`).join('')}</select></div>
    <div><label class="lbl">Batas Pelanggaran Sebelum Ujian Terkunci</label><input id="st-mx" type="number" min="1" max="10" class="inp" required value="${esc(s.maks_pelanggaran || 3)}"></div>
    <div><label class="lbl">Logo (otomatis dikecilkan)</label><div class="flex items-center gap-3"><div id="st-logo-prev">${brand(56)}</div><input type="file" accept="image/*" class="text-sm" onchange="A.logoFile(this)"><button type="button" class="btn btn-d btn-sm" onclick="A.logoClear()">Hapus Logo</button></div><input type="hidden" id="st-logo" value="${esc(s.logo)}"></div>
    <button class="btn btn-p"><i data-lucide="check" style="width:16px;height:16px"></i> Simpan Pengaturan</button></form>`)}</div>`;
}
