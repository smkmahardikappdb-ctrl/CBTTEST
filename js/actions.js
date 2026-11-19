'use strict';
/* =====================================================================
   AKSI (dipanggil dari onclick/onsubmit lewat objek A)
===================================================================== */
const A = window.A = {
  loginTab(t) { S.loginTab = t; renderLogin(); },
  togglePw() { const i = $('lg-p'); i.type = i.type === 'password' ? 'text' : 'password'; },
  async doLogin(ev) {
    ev.preventDefault();
    const u = $('lg-u').value.trim(), p = $('lg-p').value;
    await run(async () => {
      if (S.loginTab === 'admin') {
        const au = await API.adminLogin(u, p);
        await enter('admin', { nama: 'Administrator', username: au.email || u }, null);
      } else {
        const r = await API.loginUser(u, p);
        if (!r || !r.success) { toast((r && r.message) || 'Login gagal!', 'err'); return; }
        if (r.user.role === 'siswa' && !r.user.kelas_id) { toast('Akun Anda belum memiliki kelas. Hubungi admin.', 'warn'); return; }
        const cred = { u, p };
        sessionStorage.setItem('cbt_sess', JSON.stringify({ cred, user: r.user }));
        await enter(r.user.role, r.user, cred);
      }
    }, 'Memeriksa akun...');
    return false;
  },
  async logout() {
    if (!(await ask({ title: 'Keluar', text: 'Yakin ingin keluar dari aplikasi?', ok: 'Keluar', danger: true }))) return;
    clearInterval(S.poll); if (S.room) closeRoom(true);
    sessionStorage.removeItem('cbt_sess'); sessionStorage.removeItem('cbt_room');
    try { if (S.role === 'admin') await API.adminLogout(); } catch (e) {}
    S.role = null; S.user = null; S.cred = null; S.loginTab = 'user'; render();
  },
  navToggle(n) { S.navOpen = S.navOpen || {}; const g = (NAV_GROUPS[S.role] || []).find(x => x.n === n); const cur = S.navOpen[n] !== undefined ? S.navOpen[n] : !!(g && g.p.includes(S.page)); S.navOpen[n] = !cur; render(); },
  go(p) { S.navOpen = {}; S.page = p; render(); if (p === 'monitor' || p === 'p_monitor' || p === 'rekap' || p === 'p_rekap') { if (!S.monId) { const l = monList(); const t = todayStr(); const d = l.find(x => x.t === t) || l[0]; if (d) S.monId = d.id; } if (S.monId) { S.mon = null; render(); A.loadMon(true); } } if (S.role === 'admin' && ['dashboard', 'ujian'].includes(p)) A.reload(true); if (S.role === 'pengawas' && p === 'p_jadwal') { API.getPengawas(S.cred).then(r => { S.pw = r; sync(r.server_now); if (S.page === 'p_jadwal') render(); }).catch(() => {}); } if (S.role === 'siswa' && p === 's_ujian') { API.getExams(S.cred).then(r => { S.sw = r; sync(r.server_now); if (S.page === 's_ujian') render(); }).catch(() => {}); } },
  async reload(silent) { const f = async () => { await refresh(); render(); }; if (silent) { try { await f(); } catch (e) {} } else await run(f, 'Menyegarkan...'); },
  install() { const e = S.installEvt; if (!e) return; e.prompt(); e.userChoice.finally(() => { S.installEvt = null; render(); }); },

  async del(t, id) {
    const msg = { kelas: 'Menghapus kelas juga menghapus jadwal ujian kelas tersebut.', users: 'Pengguna akan dihapus dari ruang & penugasan.', ruang: 'Plotting siswa & penugasan pengawas ruang ini ikut terhapus.', sesi: 'Jadwal ujian & penugasan yang memakai sesi ini ikut terhapus.' }[t] || '';
    if (!(await ask({ title: 'Hapus data?', text: 'Data yang dihapus tidak dapat dikembalikan. ' + msg, ok: 'Hapus', danger: true }))) return;
    await run(async () => { await API.del(t, id); await refresh(); render(); toast('Data dihapus.'); });
  },
  async addKelas(ev) { ev.preventDefault(); const n = $('f-kelas').value.trim(); await run(async () => { await API.ins('kelas', { nama_kelas: n }); await refresh(); render(); toast('Kelas disimpan.'); }); return false; },
  userTab(t) { S.userTab = t; S.userQ = ''; S.userKelas = ''; render(); },
  userSearch(v) { S.userQ = v; $('user-table').innerHTML = userTable(); icons(); },
  userKelasFilter(v) { S.userKelas = v; $('user-table').innerHTML = userTable(); icons(); },
  async addUser(ev) {
    ev.preventDefault();
    const pw = rndPass();
    const row = { username: $('f-user').value.trim(), password_hash: pw, role: S.userTab, nama: $('f-nama').value.trim(), kelas_id: S.userTab === 'siswa' ? $('f-kls').value : null };
    await run(async () => {
      await API.ins('users', row); await refresh();
      S.lastImport = [{ nama: row.nama, kelas: row.kelas_id ? kName(row.kelas_id) : '', username: row.username, password: pw, role: row.role }];
      render(); importDone(S.lastImport, 0);
    }); return false;
  },
  async changePw(id) {
    const u = byId(S.data.users, id);
    const v = await ask({ title: 'Ganti Password', text: `Password baru untuk <b>${esc(u.nama)}</b>:`, input: { value: '', placeholder: 'Password baru' }, ok: 'Simpan' });
    if (!v) return;
    await run(async () => { await API.upd('users', id, { password_hash: v }); toast('Password diperbarui.'); });
  },
  template() {
    const ws = XLSX.utils.aoa_to_sheet([['nama', 'nis', 'kelas'], ['Contoh Siswa Satu', '1234567890', 'X-A'], ['Contoh Siswa Dua', '1234567891', 'X-A']]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Siswa'); XLSX.writeFile(wb, 'template_import_siswa.xlsx');
  },
  importFile(inp) {
    const f = inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        const have = new Set(S.data.users.map(u => String(u.username).toLowerCase())), seen = new Set(), rows = []; let skip = 0;
        raw.map(r => { const o = {}; Object.keys(r).forEach(k => o[k.toLowerCase().trim()] = String(r[k]).trim()); return o; }).forEach(o => {
          const un = o.username || o.nis || o.nisn || '', role = (o.role || 'siswa').toLowerCase(), key = un.toLowerCase();
          if (!un || !o.nama || !['siswa', 'pengawas'].includes(role)) return;
          if (have.has(key) || seen.has(key)) { skip++; return; }
          seen.add(key); rows.push({ username: un, password: o.password || rndPass(), nama: o.nama, role, kelas: o.kelas || '' });
        });
        if (!rows.length) { toast(skip ? `Semua ${skip} baris dilewati karena NIS sudah terdaftar.` : 'Tidak ada baris valid. Kolom yang dibutuhkan: nama, nis, kelas.', 'err'); inp.value = ''; return; }
        await run(async () => { await API.importUsers(rows); await refresh(); S.lastImport = rows; render(); importDone(rows, skip); }, 'Mengimport...');
      } catch (er) { toast('File tidak dapat dibaca: ' + er.message, 'err'); }
      inp.value = '';
    };
    rd.readAsArrayBuffer(f);
  },
  unduhImport() {
    const rows = [['Nama', 'Kelas', 'Username', 'Password']].concat((S.lastImport || []).map(r => [r.nama, r.kelas, r.username, r.password]));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Akun'); XLSX.writeFile(wb, 'akun-baru.xlsx');
  },
  cetakImport() {
    const d = S.data, list = (S.lastImport || []).slice().sort((a, b) => (a.kelas || '').localeCompare(b.kelas || '') || a.nama.localeCompare(b.nama));
    const cards = list.map(r => { if (r.role === 'pengawas') { const u = d.users.find(x => x.username === r.username); return u ? kartuPengawasHtml(u, r.password) : ''; } return kartuSiswaHtml(r.nama, r.kelas, null, r.username, r.password); }).join('');
    printDoc('Kartu Akun Baru', `<div class="grid">${cards}</div>`);
  },
  async cetakKartuUser(id) {
    const u = byId(S.data.users, id); if (!u) return;
    if (!(await ask({ title: 'Cetak kartu ' + u.nama + '?', text: 'Password akun ini akan diganti dengan password acak baru lalu dicetak. Password lama tidak berlaku lagi. Akun lain tidak terpengaruh.', ok: 'Reset & Cetak' }))) return;
    await run(async () => {
      const pw = rndPass(); await API.resetPasswords([{ id: u.id, password: pw }]);
      let c;
      if (u.role === 'siswa') { const rs = S.data.ruang_siswa.find(r => r.siswa_id === u.id); c = kartuSiswaHtml(u.nama, kName(u.kelas_id), rs ? (byId(S.data.ruang, rs.ruang_id) || {}).nama_ruang || '-' : '-', u.username, pw); }
      else c = kartuPengawasHtml(u, pw);
      printDoc('Kartu ' + u.nama, `<div class="grid">${c}</div>`);
    }, 'Menyiapkan kartu...');
  },
  async cetakKartu() {
    const kid = $('f-kartu').value;
    const sis = S.data.users.filter(u => u.role === 'siswa' && (!kid || u.kelas_id === kid)).sort((a, b) => kName(a.kelas_id).localeCompare(kName(b.kelas_id)) || a.nama.localeCompare(b.nama));
    if (!sis.length) { toast('Tidak ada siswa untuk dicetak.', 'warn'); return; }
    if (!(await ask({ title: 'Reset password & cetak?', text: `Password <b>${sis.length} siswa</b> akan diganti dengan password acak baru, lalu dicetak di kartu. Lanjutkan?`, ok: 'Reset & Cetak' }))) return;
    await run(async () => {
      const list = sis.map(s => ({ id: s.id, password: rndPass() }));
      await API.resetPasswords(list);
      const pm = {}; list.forEach(l => pm[l.id] = l.password);
      const cards = sis.map(s => { const rs = S.data.ruang_siswa.find(r => r.siswa_id === s.id); const rn = rs ? (byId(S.data.ruang, rs.ruang_id) || {}).nama_ruang : '-';
        return `<div class="card"><h4>KARTU PESERTA UJIAN<br><small>${esc(S.settings.nama_sekolah)}</small></h4><table><tr><td>Nama</td><td>: <b>${esc(s.nama)}</b></td></tr><tr><td>Kelas</td><td>: ${esc(kName(s.kelas_id))}</td></tr><tr><td>Ruang</td><td>: ${esc(rn || '-')}</td></tr><tr><td>Username</td><td>: <b>${esc(s.username)}</b></td></tr><tr><td>Password</td><td>: <b>${esc(pm[s.id])}</b></td></tr></table></div>`; }).join('');
      printDoc('Kartu Peserta', `<div class="grid">${cards}</div>`);
    }, 'Menyiapkan kartu...');
  },

  async addSesi(ev) {
    ev.preventDefault(); const jm = $('f-jm').value, jb = $('f-jb').value;
    if (jb <= jm) { toast('Jam berakhir harus setelah jam mulai.', 'warn'); return false; }
    await run(async () => { await API.ins('sesi', { nama_sesi: $('f-sesi').value.trim(), jam_mulai: jm + ':00', jam_berakhir: jb + ':00' }); await refresh(); render(); toast('Sesi disimpan.'); }); return false;
  },

  ruangTab(t) { S.ruangTab = t; render(); },
  async addRuang(ev) { ev.preventDefault(); await run(async () => { await API.ins('ruang', { nama_ruang: $('f-ruang').value.trim() }); await refresh(); render(); toast('Ruang disimpan.'); }); return false; },
  plotRuang(v) { S.plotRuang = v; $('plot-list').innerHTML = plotList(); icons(); },
  plotKelas(v) { S.plotKelas = v; $('plot-list').innerHTML = plotList(); icons(); },
  async toggleSiswa(siswaId, on) {
    await run(async () => { if (on) await API.ins('ruang_siswa', { ruang_id: S.plotRuang, siswa_id: siswaId }); else await API.delPair(S.plotRuang, siswaId); await refresh(); $('plot-list').innerHTML = plotList(); icons(); }, 'Menyimpan...');
  },
  async removeSiswa(r, s) { await run(async () => { await API.delPair(r, s); await refresh(); render(); toast('Siswa dikeluarkan dari ruang.'); }); },
  async addRuangPengawas(ev) {
    ev.preventDefault();
    await run(async () => { await API.ins('ruang_pengawas', { ruang_id: $('f-rp-ruang').value, sesi_id: $('f-rp-sesi').value, pengawas_id: $('f-rp-pw').value, tanggal: $('f-rp-tgl').value }); await refresh(); render(); toast('Penugasan disimpan.'); }); return false;
  },
  cetakSiswaRuang(rid) {
    const d = S.data, rs = d.ruang.filter(r => !rid || r.id === rid);
    const body = rs.map(r => { const sis = d.ruang_siswa.filter(x => x.ruang_id === r.id).map(x => byId(d.users, x.siswa_id)).filter(Boolean).sort((a, b) => a.nama.localeCompare(b.nama));
      return `<div class="ruang"><div class="kop"><h2>${esc(S.settings.nama_sekolah)}</h2><div>${esc(S.settings.alamat)}</div></div><h3 style="text-align:center">DAFTAR PESERTA UJIAN - ${esc(r.nama_ruang).toUpperCase()}</h3><table><thead><tr><th>No</th><th>Nama</th><th>Kelas</th><th>Username</th><th>Tanda Tangan</th></tr></thead><tbody>${sis.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.nama)}</td><td>${esc(kName(s.kelas_id))}</td><td>${esc(s.username)}</td><td style="width:140px"></td></tr>`).join('') || '<tr><td colspan="5">Belum ada siswa</td></tr>'}</tbody></table></div>`; }).join('');
    printDoc('Daftar Siswa per Ruang', body);
  },
  cetakJadwal() {
    const d = S.data, jm = (u) => String((byId(d.sesi, u.sesi_id) || {}).jam_mulai || '');
    const rows = d.ujian.slice().sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)) || jm(a).localeCompare(jm(b)) || kName(a.kelas_id).localeCompare(kName(b.kelas_id)));
    if (!rows.length) { toast('Belum ada jadwal ujian.', 'warn'); return; }
    printDoc('Jadwal Ujian', `<div class="kop"><h2>${esc(S.settings.nama_sekolah)}</h2><div>${esc(S.settings.alamat)}</div></div><h3 style="text-align:center">JADWAL PELAKSANAAN UJIAN</h3><table><thead><tr><th>No</th><th>Hari / Tanggal</th><th>Sesi</th><th>Waktu</th><th>Kelas</th><th>Mata Pelajaran</th></tr></thead><tbody>${rows.map((u, i) => { const s = byId(d.sesi, u.sesi_id) || {}; return `<tr><td>${i + 1}</td><td>${fmtDate(u.tanggal)}</td><td>${esc(s.nama_sesi || '')}</td><td>${hhmm(s.jam_mulai)}-${hhmm(s.jam_berakhir)}</td><td>${esc(kName(u.kelas_id))}</td><td>${esc(u.mapel)}</td></tr>`; }).join('')}</tbody></table>`);
  },
  cetakTempel(rid) {
    const d = S.data, rs = d.ruang.filter(r => !rid || r.id === rid);
    if (!rs.length) { toast('Belum ada ruang.', 'warn'); return; }
    const body = rs.map(r => {
      const sis = d.ruang_siswa.filter(x => x.ruang_id === r.id).map(x => byId(d.users, x.siswa_id)).filter(Boolean).sort((a, b) => kName(a.kelas_id).localeCompare(kName(b.kelas_id)) || a.nama.localeCompare(b.nama));
      const kl = new Set(sis.map(x => x.kelas_id));
      const jd = d.ruang_pengawas.filter(x => x.ruang_id === r.id).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal))).map(x => { const sx = byId(d.sesi, x.sesi_id) || {}; const mp = d.ujian.filter(u => u.tanggal === x.tanggal && u.sesi_id === x.sesi_id && kl.has(u.kelas_id)).map(u => `${esc(u.mapel)} (${esc(kName(u.kelas_id))})`).join(', '); return `<div>${fmtDate(x.tanggal)} &middot; ${esc(sx.nama_sesi || '')} ${hhmm(sx.jam_mulai)}-${hhmm(sx.jam_berakhir)}${mp ? ' &middot; ' + mp : ''}</div>`; }).join('');
      return `<div class="ruang"><div style="text-align:center;border-bottom:3px double #111;padding-bottom:10px;margin-bottom:12px"><div style="font-size:14px">${esc(S.settings.nama_sekolah)}</div><div style="font-size:44px;font-weight:700;margin:4px 0">${esc(r.nama_ruang).toUpperCase()}</div><div style="font-size:16px;letter-spacing:.08em">DAFTAR PESERTA UJIAN</div></div>${jd ? `<div style="font-size:14px;margin-bottom:10px">${jd}</div>` : ''}<table class="big"><thead><tr><th style="width:50px">No</th><th>Nama</th><th style="width:90px">Kelas</th></tr></thead><tbody>${sis.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.nama)}</td><td>${esc(kName(x.kelas_id))}</td></tr>`).join('') || '<tr><td colspan="3">Belum ada peserta</td></tr>'}</tbody></table></div>`;
    }).join('');
    printDoc('Daftar Peserta Ruang', `<style>.big td,.big th{font-size:18px!important;padding:8px 10px!important}</style>${body}`);
  },
  async cetakKartuPengawas() {
    const id = $('f-kartu-pw').value, d = S.data;
    const pw = d.users.filter(u => u.role === 'pengawas' && (!id || u.id === id)).sort((a, b) => a.nama.localeCompare(b.nama));
    if (!pw.length) { toast('Tidak ada pengawas untuk dicetak.', 'warn'); return; }
    if (!(await ask({ title: 'Reset password & cetak?', text: `Password <b>${pw.length} pengawas</b> akan diganti dengan password acak baru, lalu dicetak di kartu. Lanjutkan?`, ok: 'Reset & Cetak' }))) return;
    await run(async () => {
      const list = pw.map(u => ({ id: u.id, password: rndPass() })); await API.resetPasswords(list);
      const pm = {}; list.forEach(l => pm[l.id] = l.password);
      const cards = pw.map(u => {
        const tg = d.ruang_pengawas.filter(x => x.pengawas_id === u.id).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal))).slice(0, 4).map(x => { const sx = byId(d.sesi, x.sesi_id) || {}; return `<div>${fmtDate(x.tanggal)} - ${esc((byId(d.ruang, x.ruang_id) || {}).nama_ruang || '')} (${esc(sx.nama_sesi || '')} ${hhmm(sx.jam_mulai)}-${hhmm(sx.jam_berakhir)})</div>`; }).join('');
        return `<div class="card"><h4>KARTU PENGAWAS UJIAN<br><small>${esc(S.settings.nama_sekolah)}</small></h4><table><tr><td>Nama</td><td>: <b>${esc(u.nama)}</b></td></tr><tr><td>Username</td><td>: <b>${esc(u.username)}</b></td></tr><tr><td>Password</td><td>: <b>${esc(pm[u.id])}</b></td></tr><tr><td>Alamat</td><td>: ${esc(location.origin)}</td></tr></table>${tg ? `<div style="margin-top:6px;font-size:11px;border-top:1px dashed #333;padding-top:4px"><b>Tugas:</b>${tg}</div>` : ''}<div style="margin-top:6px;font-size:10px">Masuk lewat tab Peserta / Pengawas.</div></div>`;
      }).join('');
      printDoc('Kartu Pengawas', `<div class="grid">${cards}</div>`);
    }, 'Menyiapkan kartu...');
  },
  cetakPengawas() {
    const d = S.data, rows = d.ruang_pengawas.slice().sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
    printDoc('Jadwal Pengawas', `<div class="kop"><h2>${esc(S.settings.nama_sekolah)}</h2><div>${esc(S.settings.alamat)}</div></div><h3 style="text-align:center">JADWAL TUGAS PENGAWAS UJIAN</h3><table><thead><tr><th>No</th><th>Tanggal</th><th>Sesi</th><th>Jam</th><th>Ruang</th><th>Pengawas</th></tr></thead><tbody>${rows.map((r, i) => { const s = byId(d.sesi, r.sesi_id) || {}; return `<tr><td>${i + 1}</td><td>${fmtDate(r.tanggal)}</td><td>${esc(s.nama_sesi || '')}</td><td>${hhmm(s.jam_mulai)}-${hhmm(s.jam_berakhir)}</td><td>${esc((byId(d.ruang, r.ruang_id) || {}).nama_ruang || '')}</td><td>${esc(uName(r.pengawas_id))}</td></tr>`; }).join('') || '<tr><td colspan="6">Belum ada penugasan</td></tr>'}</tbody></table>`);
  },

  async saveUjian(ev) {
    ev.preventDefault();
    const row = { kelas_id: $('f-uj-kls').value, mapel: $('f-uj-map').value.trim(), tanggal: $('f-uj-tgl').value, sesi_id: $('f-uj-sesi').value, link: $('f-uj-link').value.trim() };
    await run(async () => {
      if (S.editUjian) { await API.upd('ujian', S.editUjian, row); toast('Jadwal diperbarui.'); }
      else { await API.ins('ujian', { ...row, token: rndToken() }); toast('Jadwal disimpan.'); }
      S.editUjian = null; await refresh(); render();
    }); return false;
  },
  editUjian(id) { S.editUjian = id; render(); $('cbt-root').scrollTo({ top: 0, behavior: 'smooth' }); },
  resetUjian() { S.editUjian = null; render(); },
  async tokenManual(id) { await run(async () => { await API.upd('ujian', id, { token: rndToken(), token_updated_at: new Date().toISOString() }); await refresh(); render(); toast('Token diperbarui.'); }); },
  async toggleStatus(id) { const u = byId(S.data.ujian, id); await run(async () => { await API.upd('ujian', id, { status: u.status === 'Aktif' ? 'Selesai' : 'Aktif', token_updated_at: new Date().toISOString() }); await refresh(); render(); toast('Status diperbarui.'); }); },

  logoFile(inp) {
    const f = inp.files[0]; if (!f) return;
    const img = new Image(), rd = new FileReader();
    rd.onload = e => { img.onload = () => { const m = 200, r = Math.min(1, m / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); $('st-logo').value = c.toDataURL('image/png'); $('st-logo-prev').innerHTML = `<img src="${$('st-logo').value}" style="width:56px;height:56px;object-fit:contain;border-radius:10px">`; }; img.src = e.target.result; };
    rd.readAsDataURL(f);
  },
  logoClear() { $('st-logo').value = ''; $('st-logo-prev').innerHTML = '<div style="width:56px;height:56px" class="rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Kosong</div>'; },
  async saveSettings(ev) {
    ev.preventDefault();
    const s = { nama_app: $('st-app').value.trim(), nama_sekolah: $('st-sch').value.trim(), alamat: $('st-alm').value.trim(), logo: $('st-logo').value, zona_waktu: $('st-tz').value, maks_pelanggaran: Math.min(10, Math.max(1, parseInt($('st-mx').value, 10) || 3)) };
    await run(async () => { await API.saveSettings(s); S.settings = { ...S.settings, ...s }; document.title = s.nama_app; render(); toast('Pengaturan disimpan.'); }); return false;
  },

  async pNewToken(id) { await run(async () => { const r = await API.newToken(S.cred, id); if (!r.success) throw new Error(r.message); S.pw = await API.getPengawas(S.cred); sync(S.pw.server_now); render(); toast('Token baru: ' + r.token); }); },
  async pExtend(id) {
    const v = await ask({ title: 'Tambah Waktu', text: 'Berapa menit waktu ujian ingin ditambahkan? (1-180)', input: { type: 'number', value: '15' }, ok: 'Tambah' });
    const m = parseInt(v, 10); if (!v || !(m > 0)) return;
    await run(async () => { await API.extend(S.cred, id, m); S.pw = await API.getPengawas(S.cred); sync(S.pw.server_now); render(); toast(`Waktu ditambah ${Math.min(m, 180)} menit.`); });
  },
  async pEnd(id) {
    if (!(await ask({ title: 'Akhiri Ujian?', text: 'Semua peserta akan otomatis keluar dari ruang ujian. Tindakan ini tidak bisa dibatalkan oleh pengawas.', ok: 'Akhiri Ujian', danger: true }))) return;
    await run(async () => { await API.endExam(S.cred, id); S.pw = await API.getPengawas(S.cred); sync(S.pw.server_now); render(); toast('Ujian diakhiri.'); });
  },

  async prepareExam(id) {
    const u = ((S.sw && S.sw.exams) || []).find(x => x.id === id); if (!u) return;
    const v = await ask({ title: u.mapel, text: 'Masukkan <b>token ujian</b> dari pengawas:', input: { type: 'tel', placeholder: '5 digit token' }, ok: 'Masuk Ruang Ujian' });
    if (!v) return;
    await run(async () => {
      const sid = newSid();
      const r = await API.checkToken(S.cred, id, v, sid);
      if (!r.success) { toast(r.message, 'err'); return; }
      sync(r.server_now); startRoom(u, r.link, r.end_at, { sid });
    }, 'Memeriksa token...');
  },
  async finishExam() {
    const R = S.room; if (!R) return;
    if (R.over) { closeRoom(); return; }
    if (await ask({ title: 'Selesai Ujian?', text: 'Pastikan Anda sudah mengirim (submit) jawaban pada formulir. Setelah keluar, Anda <b>tidak dapat masuk kembali</b> ke ujian ini kecuali diizinkan pengawas.', ok: 'Ya, Selesai', danger: true })) {
      await run(async () => { try { await API.finishExam(S.cred, R.ex.id, R.sid); } catch (e) {} });
      closeRoom();
    }
  },
  roomAck() { roomOvHide(); if (FS_OK && !isFs()) goFs(); },
  roomFs() { goFs().then(() => { if (isFs() || !FS_OK) roomOvHide(); }); },
  closeRoom,

  /* ---- Monitoring ---- */
  pMon(id) { S.monId = id; A.go('p_monitor'); },
  rekapXlsx() {
    if (!S.mon || !S.monId) { toast('Pilih ujian dan tunggu data termuat.', 'warn'); return; }
    const lb = (monList().find(x => x.id === S.monId) || {}).label || 'ujian';
    const rows = [['No', 'Nama', 'Username', 'Ruang', 'Status', 'Mulai', 'Pelanggaran', 'Pelanggaran Terakhir']].concat(S.mon.rows.map((r, i) => [i + 1, r.nama, r.username, r.ruang, MON_BADGE[monState(r)][0], rkTime(r.mulai_at), r.pelanggaran, VIOL_LABEL[r.last_jenis] || r.last_jenis || '']));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Rekap');
    XLSX.writeFile(wb, 'rekap-' + lb.replace(/[^\w\-]+/g, '_').slice(0, 60) + '.xlsx');
  },
  rekapPrint() {
    if (!S.mon || !S.monId) { toast('Pilih ujian dan tunggu data termuat.', 'warn'); return; }
    const lb = (monList().find(x => x.id === S.monId) || {}).label || '', c = rekapStat(), st = S.settings || {};
    const who = S.role === 'admin' ? 'Administrator' : ((S.user && S.user.nama) || '');
    printDoc('Berita Acara Ujian', `<div class="kop"><h2>BERITA ACARA PELAKSANAAN UJIAN</h2><h3>${esc(st.nama_sekolah || '')}</h3><div>${esc(st.alamat || '')}</div></div>
      <p><b>Ujian:</b> ${esc(lb)}</p>
      <table><tr><th>Peserta</th><th>Hadir</th><th>Belum Masuk</th><th>Selesai</th><th>Terkunci</th><th>Total Pelanggaran</th></tr><tr><td>${c.total}</td><td>${c.hadir}</td><td>${c.belum}</td><td>${c.selesai}</td><td>${c.terkunci}</td><td>${c.pel}</td></tr></table>
      <table style="margin-top:14px"><tr><th>No</th><th>Nama</th><th>Ruang</th><th>Status</th><th>Mulai</th><th>Pelanggaran</th></tr>${S.mon.rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.nama)}</td><td>${esc(r.ruang)}</td><td>${MON_BADGE[monState(r)][0]}</td><td>${rkTime(r.mulai_at)}</td><td>${r.pelanggaran}</td></tr>`).join('')}</table>
      <p style="margin-top:16px"><b>Catatan kejadian:</b></p><div style="border:1px solid #333;height:90px"></div>
      <div style="margin-top:30px;text-align:right">Pengawas,<br><br><br><br><b>${esc(who)}</b></div>`);
  },
  toggleSnd() { S.snd = S.snd === false; if (S.snd) beep(1); render(); },
  async monExtend(m) {
    if (!S.monId || !confirm(`Tambah waktu ${m} menit untuk semua peserta ujian ini?`)) return;
    await run(async () => {
      if (S.role === 'admin') { const u = byId(S.data.ujian, S.monId); await API.upd('ujian', S.monId, { extra_menit: (u.extra_menit || 0) + m }); await refresh(); }
      else { await API.extend(S.cred, S.monId, m); S.pw = await API.getPengawas(S.cred); sync(S.pw.server_now); }
      const mc = $('mon-clock'); if (mc) mc.innerHTML = monClock(); toast(`Waktu ditambah ${m} menit.`);
    }, 'Menyimpan...');
  },
  monSelect(id) { S.monId = id; S.mon = null; S.monPrev = null; const mc = $('mon-clock'); if (mc) mc.innerHTML = monClock(); const el = $('mon-table'); if (el) el.innerHTML = monTable(); const rb = $('rekap-body'); if (rb) rb.innerHTML = rekapBody(); A.loadMon(); },
  async loadMon(silent) {
    if (!S.monId) return;
    const f = async () => { S.mon = await API.getMonitor(S.role === 'admin' ? null : S.cred, S.monId); sync(S.mon.server_now); const el = $('mon-table'); if (el) { el.innerHTML = monTable(); icons(); } const rb = $('rekap-body'); if (rb) { rb.innerHTML = rekapBody(); icons(); } monAlert(S.mon); };
    if (silent) { try { await f(); } catch (e) {} } else await run(f, 'Memuat...');
  },
  async monAct(siswaId, aksi) {
    const txt = { buka_kunci: 'Buka kunci siswa ini? Pelanggaran berikutnya akan langsung mengunci kembali.', masuk_ulang: 'Izinkan siswa ini masuk ulang (misalnya setelah pindah perangkat)? Siswa perlu memasukkan token lagi.', reset: 'Reset seluruh status dan riwayat pelanggaran siswa ini pada ujian ini?' }[aksi];
    if (!(await ask({ title: 'Konfirmasi', text: txt, ok: 'Ya, Lanjutkan', danger: aksi === 'reset' }))) return;
    await run(async () => { await API.monitorAction(S.role === 'admin' ? null : S.cred, S.monId, siswaId, aksi); await A.loadMon(true); toast('Berhasil diperbarui.'); });
  },
  monDetail(siswaId) {
    const r = S.mon && S.mon.rows.find(x => x.siswa_id === siswaId); if (!r) return;
    openModal(`<h3 class="text-lg font-bold mb-1">Riwayat Pelanggaran</h3><p class="text-sm text-slate-500 mb-3">${esc(r.nama)} (${r.pelanggaran}/${S.mon.maks})</p>${!r.riwayat.length ? empty('Tidak ada catatan.') : `<div class="space-y-2">${r.riwayat.map(x => `<div class="flex justify-between gap-3 p-2.5 rounded-xl bg-red-50 text-sm"><span class="font-semibold text-red-700">${esc(VIOL_LABEL[x.jenis] || x.jenis)}${x.detail ? ' <span class="text-red-400">(' + esc(x.detail) + ')</span>' : ''}</span><span class="text-xs text-slate-500 whitespace-nowrap">${new Date(x.waktu).toLocaleTimeString('id-ID')}</span></div>`).join('')}</div>`}<div class="flex justify-end mt-4"><button class="btn btn-p" onclick="document.getElementById('modal').style.display='none';document.getElementById('modal').innerHTML=''">Tutup</button></div>`);
  }
};
