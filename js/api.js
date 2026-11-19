'use strict';
/* =====================================================================
   DATA LAYER - PREVIEW (memori) & LIVE (Supabase)
===================================================================== */
const M = { kelas: [], users: [], sesi: [], ruang: [], ruang_siswa: [], ruang_pengawas: [], ujian: [], peserta: [], pelanggaran: [], settings: null, seeded: false };

function mView(u, secret) {
  const s = byId(M.sesi, u.sesi_id), k = byId(M.kelas, u.kelas_id);
  const st = new Date(`${u.tanggal}T${hhmm(s.jam_mulai)}:00`).getTime();
  const en = new Date(`${u.tanggal}T${hhmm(s.jam_berakhir)}:00`).getTime() + u.extra_menit * 60000;
  const o = { id: u.id, kelas_id: u.kelas_id, kelas: k ? k.nama_kelas : '-', mapel: u.mapel, tanggal: u.tanggal, sesi_id: u.sesi_id, sesi: s.nama_sesi,
    jam_mulai: s.jam_mulai, jam_berakhir: s.jam_berakhir, status: u.status, extra_menit: u.extra_menit, start_at: new Date(st).toISOString(), end_at: new Date(en).toISOString() };
  if (secret) { o.token = u.token; o.token_updated_at = u.token_updated_at; }
  return o;
}
function mRotate() { M.ujian.forEach(u => { if (u.status === 'Aktif' && Date.now() - new Date(u.token_updated_at).getTime() > 300000) { u.token = rndToken(); u.token_updated_at = new Date().toISOString(); } }); }
function mAuth(c, role) { const u = M.users.find(x => x.username === c.u && x._pw === c.p); if (!u || (role && u.role !== role)) throw new Error('Akses ditolak'); return u; }
function mCascade(table, id) {
  if (table === 'kelas') { M.users.forEach(u => { if (u.kelas_id === id) u.kelas_id = null; }); M.ujian = M.ujian.filter(x => x.kelas_id !== id); }
  if (table === 'users') { M.ruang_siswa = M.ruang_siswa.filter(x => x.siswa_id !== id); M.ruang_pengawas = M.ruang_pengawas.filter(x => x.pengawas_id !== id); }
  if (table === 'ruang') { M.ruang_siswa = M.ruang_siswa.filter(x => x.ruang_id !== id); M.ruang_pengawas = M.ruang_pengawas.filter(x => x.ruang_id !== id); }
  if (table === 'sesi') { M.ujian = M.ujian.filter(x => x.sesi_id !== id); M.ruang_pengawas = M.ruang_pengawas.filter(x => x.sesi_id !== id); }
}

const P = {
  async seed() {
    if (M.seeded) return; M.seeded = true;
    const mk = (n) => ({ id: uid(), nama_kelas: n });
    const kA = mk('X-A'), kB = mk('X-B'), kC = mk('XI-IPA');
    M.kelas = [kA, kB, kC];
    const s1 = { id: uid(), nama_sesi: 'Sesi 1', jam_mulai: '07:30:00', jam_berakhir: '09:30:00' };
    const s2 = { id: uid(), nama_sesi: 'Sesi 2', jam_mulai: '10:00:00', jam_berakhir: '12:00:00' };
    const sU = { id: uid(), nama_sesi: 'Sesi Uji Coba (Seharian)', jam_mulai: '00:00:00', jam_berakhir: '23:59:00' };
    M.sesi = [s1, s2, sU];
    const r1 = { id: uid(), nama_ruang: 'Ruang 1' }, r2 = { id: uid(), nama_ruang: 'Ruang 2' };
    M.ruang = [r1, r2];
    const U = (username, pw, role, nama, kelas_id = null) => ({ id: uid(), username, _pw: pw, role, nama, kelas_id });
    const p1 = U('pengawas01', 'pengawas123', 'pengawas', 'Budi Santoso, S.Pd'), p2 = U('pengawas02', 'pengawas123', 'pengawas', 'Siti Aminah, S.Pd');
    const sw = [U('siswa001', 'siswa123', 'siswa', 'Ahmad Fauzi', kA.id), U('siswa002', 'siswa123', 'siswa', 'Dewi Lestari', kA.id), U('siswa003', 'siswa123', 'siswa', 'Rizky Pratama', kA.id),
      U('siswa004', 'siswa123', 'siswa', 'Putri Ayu', kB.id), U('siswa005', 'siswa123', 'siswa', 'Bagas Wicaksono', kB.id), U('siswa006', 'siswa123', 'siswa', 'Nadia Rahma', kC.id)];
    M.users = [p1, p2, ...sw];
    M.ruang_siswa = [sw[0], sw[1], sw[2]].map(x => ({ id: uid(), ruang_id: r1.id, siswa_id: x.id })).concat([sw[3], sw[4], sw[5]].map(x => ({ id: uid(), ruang_id: r2.id, siswa_id: x.id })));
    M.ruang_pengawas = [{ id: uid(), ruang_id: r1.id, sesi_id: sU.id, pengawas_id: p1.id, tanggal: todayStr() }, { id: uid(), ruang_id: r2.id, sesi_id: sU.id, pengawas_id: p2.id, tanggal: todayStr() }];
    const link = 'https://example.com/';
    const ts = new Date().toISOString();
    M.ujian = [
      { id: uid(), kelas_id: kA.id, mapel: 'Matematika', tanggal: todayStr(), sesi_id: sU.id, link, token: rndToken(), token_updated_at: ts, status: 'Aktif', extra_menit: 0 },
      { id: uid(), kelas_id: kB.id, mapel: 'Bahasa Indonesia', tanggal: todayStr(), sesi_id: sU.id, link, token: rndToken(), token_updated_at: ts, status: 'Aktif', extra_menit: 0 },
      { id: uid(), kelas_id: kA.id, mapel: 'IPA', tanggal: addDays(1), sesi_id: s1.id, link, token: rndToken(), token_updated_at: ts, status: 'Aktif', extra_menit: 0 }];
    M.settings = { nama_app: 'Portal Ujian Digital', nama_sekolah: 'Sekolah Nusantara', alamat: 'Jl. Pendidikan No. 1', logo: '', zona_waktu: 'Asia/Jakarta', maks_pelanggaran: 3 };
  },
  async getSettings() { return { ...M.settings }; },
  async saveSettings(s) { M.settings = { ...M.settings, ...s }; },
  async adminLogin(email, pw) { if (email === 'admin@demo.com' && pw === 'admin123') return { email }; throw new Error('Email atau password admin salah!'); },
  async adminSession() { return null; },
  async adminLogout() {},
  async loginUser(u, p) {
    const x = M.users.find(a => a.username === u && a._pw === p);
    if (!x) return { success: false, message: 'Username atau Password salah!' };
    const k = byId(M.kelas, x.kelas_id);
    return { success: true, user: { id: x.id, username: x.username, role: x.role, nama: x.nama, kelas_id: x.kelas_id, kelas: k ? k.nama_kelas : '' } };
  },
  async loadAll() {
    mRotate();
    const c = (a) => a.map(x => { const { _pw, ...r } = x; return { ...r }; });
    return { kelas: c(M.kelas), users: c(M.users), sesi: c(M.sesi), ruang: c(M.ruang), ruang_siswa: c(M.ruang_siswa), ruang_pengawas: c(M.ruang_pengawas), ujian: c(M.ujian) };
  },
  async ins(t, row) {
    if (t === 'users') { if (M.users.some(u => u.username === row.username)) throw new Error('Username sudah dipakai!'); const { password_hash, ...r } = row; const n = { id: uid(), ...r, _pw: password_hash }; M.users.push(n); return n; }
    if (t === 'kelas' && M.kelas.some(k => k.nama_kelas === row.nama_kelas)) throw new Error('Nama kelas sudah ada!');
    if (t === 'ruang' && M.ruang.some(k => k.nama_ruang === row.nama_ruang)) throw new Error('Nama ruang sudah ada!');
    const n = { id: uid(), ...row }; if (t === 'ujian') { n.token = row.token || rndToken(); n.token_updated_at = new Date().toISOString(); n.status = 'Aktif'; n.extra_menit = 0; }
    M[t].push(n); return n;
  },
  async upd(t, id, patch) { const x = byId(M[t], id); if (!x) throw new Error('Data tidak ditemukan'); if (t === 'users' && 'password_hash' in patch) { patch._pw = patch.password_hash; delete patch.password_hash; } Object.assign(x, patch); },
  async del(t, id) { M[t] = M[t].filter(x => x.id !== id); mCascade(t, id); M.peserta = M.peserta.filter(p => byId(M.ujian, p.ujian_id) && byId(M.users, p.siswa_id)); },
  async delPair(ruang_id, siswa_id) { M.ruang_siswa = M.ruang_siswa.filter(x => !(x.ruang_id === ruang_id && x.siswa_id === siswa_id)); },
  async importUsers(rows) {
    let n = 0;
    for (const r of rows) {
      let kid = null;
      if (r.role === 'siswa' && r.kelas) { let k = M.kelas.find(x => x.nama_kelas === r.kelas); if (!k) { k = { id: uid(), nama_kelas: r.kelas }; M.kelas.push(k); } kid = k.id; }
      const ex = M.users.find(u => u.username === r.username);
      if (ex) Object.assign(ex, { _pw: r.password, role: r.role, nama: r.nama, kelas_id: kid });
      else M.users.push({ id: uid(), username: r.username, _pw: r.password, role: r.role, nama: r.nama, kelas_id: kid });
      n++;
    }
    return n;
  },
  async resetPasswords(list) { list.forEach(x => { const u = byId(M.users, x.id); if (u) u._pw = x.password; }); },
  async refreshTokens() { mRotate(); },
  async getExams(c) { const u = mAuth(c, 'siswa'); return { server_now: new Date().toISOString(), exams: M.ujian.filter(x => x.kelas_id === u.kelas_id).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map(x => mView(x, false)) }; },
  async checkToken(c, id, token, sid) {
    const u = mAuth(c, 'siswa'); mRotate();
    const x = M.ujian.find(a => a.id === id && a.kelas_id === u.kelas_id);
    if (!x) return { success: false, message: 'Ujian tidak ditemukan!' };
    if (x.status !== 'Aktif') return { success: false, message: 'Ujian sudah diakhiri.' };
    if (x.token !== String(token).trim()) return { success: false, message: 'Token salah atau sudah berganti!' };
    const v = mView(x, false);
    if (Date.now() < new Date(v.start_at).getTime()) return { success: false, message: 'Ujian belum dimulai.' };
    if (Date.now() >= new Date(v.end_at).getTime()) return { success: false, message: 'Waktu ujian sudah berakhir.' };
    const pu = M.peserta.find(p => p.ujian_id === id && p.siswa_id === u.id);
    if (pu) {
      if (pu.terkunci) return { success: false, message: 'Ujian Anda terkunci karena pelanggaran. Hubungi pengawas.' };
      if (pu.selesai) return { success: false, message: 'Anda sudah menyelesaikan ujian ini.' };
      if (pu.session_id && pu.session_id !== sid && Date.now() - pu.last_seen < 45000) return { success: false, message: 'Ujian sedang dibuka di perangkat/tab lain. Tunggu 45 detik lalu coba lagi.' };
      pu.session_id = sid; pu.last_seen = Date.now(); pu.mulai_at = pu.mulai_at || Date.now();
    } else M.peserta.push({ ujian_id: id, siswa_id: u.id, session_id: sid, mulai_at: Date.now(), last_seen: Date.now(), pelanggaran: 0, terkunci: false, selesai: false, last_jenis: null });
    return { success: true, link: x.link, end_at: v.end_at, server_now: new Date().toISOString() };
  },
  async examState(c, id, sid) {
    const u = mAuth(c, 'siswa'); const x = byId(M.ujian, id); const v = mView(x, false);
    const pu = M.peserta.find(p => p.ujian_id === id && p.siswa_id === u.id);
    if (pu && pu.session_id === sid) pu.last_seen = Date.now();
    return { status: x.status, end_at: v.end_at, server_now: new Date().toISOString(), duplicate: !pu || pu.session_id !== sid, terkunci: !!(pu && pu.terkunci), pelanggaran: pu ? pu.pelanggaran : 0, maks: M.settings.maks_pelanggaran, selesai: !!(pu && pu.selesai) };
  },
  async logViolation(c, id, sid, jenis, detail) {
    const u = mAuth(c, 'siswa'); const pu = M.peserta.find(p => p.ujian_id === id && p.siswa_id === u.id); const mx = M.settings.maks_pelanggaran;
    if (!pu || pu.session_id !== sid) return { ok: false, duplicate: true };
    if (!pu.selesai) { pu.pelanggaran++; pu.terkunci = pu.pelanggaran >= mx; pu.last_jenis = jenis; pu.last_seen = Date.now(); M.pelanggaran.push({ ujian_id: id, siswa_id: u.id, jenis, detail: detail || '', created_at: new Date().toISOString() }); }
    return { ok: true, pelanggaran: pu.pelanggaran, maks: mx, terkunci: pu.terkunci };
  },
  async finishExam(c, id, sid) { const u = mAuth(c, 'siswa'); const pu = M.peserta.find(p => p.ujian_id === id && p.siswa_id === u.id && p.session_id === sid); if (pu) pu.selesai = true; return { success: true }; },
  async getMonitor(c, id) {
    if (c) mAuth(c, 'pengawas'); const x = byId(M.ujian, id);
    const rows = M.users.filter(s => s.role === 'siswa' && s.kelas_id === x.kelas_id).sort((a, b) => a.nama.localeCompare(b.nama)).map(s => {
      const pu = M.peserta.find(p => p.ujian_id === id && p.siswa_id === s.id); const rs = M.ruang_siswa.find(r => r.siswa_id === s.id);
      return { siswa_id: s.id, nama: s.nama, username: s.username, ruang: rs ? byId(M.ruang, rs.ruang_id).nama_ruang : '-', pelanggaran: pu ? pu.pelanggaran : 0, terkunci: !!(pu && pu.terkunci), selesai: !!(pu && pu.selesai),
        mulai_at: pu && pu.mulai_at ? new Date(pu.mulai_at).toISOString() : null, last_seen: pu && pu.last_seen ? new Date(pu.last_seen).toISOString() : null, last_jenis: pu ? pu.last_jenis : null,
        riwayat: M.pelanggaran.filter(p => p.ujian_id === id && p.siswa_id === s.id).slice().reverse().slice(0, 10).map(p => ({ jenis: p.jenis, detail: p.detail, waktu: p.created_at })) };
    });
    return { server_now: new Date().toISOString(), maks: M.settings.maks_pelanggaran, rows };
  },
  async monitorAction(c, id, siswaId, aksi) {
    if (c) mAuth(c, 'pengawas'); const pu = M.peserta.find(p => p.ujian_id === id && p.siswa_id === siswaId); if (!pu) return { success: true };
    if (aksi === 'buka_kunci') pu.terkunci = false;
    else if (aksi === 'masuk_ulang') { pu.selesai = false; pu.terkunci = false; pu.session_id = null; pu.last_seen = 0; }
    else if (aksi === 'reset') { pu.pelanggaran = 0; pu.selesai = false; pu.terkunci = false; pu.session_id = null; pu.last_seen = 0; M.pelanggaran = M.pelanggaran.filter(p => !(p.ujian_id === id && p.siswa_id === siswaId)); }
    return { success: true };
  },
  async getPengawas(c) {
    const u = mAuth(c, 'pengawas'); mRotate();
    return { server_now: new Date().toISOString(), exams: M.ujian.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map(x => mView(x, true)),
      tugas: M.ruang_pengawas.filter(r => r.pengawas_id === u.id).map(r => { const s = byId(M.sesi, r.sesi_id); return { tanggal: r.tanggal, ruang: byId(M.ruang, r.ruang_id).nama_ruang, sesi: s.nama_sesi, jam_mulai: s.jam_mulai, jam_berakhir: s.jam_berakhir }; }) };
  },
  async newToken(c, id) { mAuth(c, 'pengawas'); const x = byId(M.ujian, id); x.token = rndToken(); x.token_updated_at = new Date().toISOString(); return { success: true, token: x.token }; },
  async extend(c, id, m) { mAuth(c, 'pengawas'); byId(M.ujian, id).extra_menit += Math.min(Math.max(m, 1), 180); return { success: true }; },
  async endExam(c, id) { mAuth(c, 'pengawas'); byId(M.ujian, id).status = 'Selesai'; return { success: true }; }
};

let sb = null;
const L = {
  rpc: async (n, a) => { const { data, error } = await sb.rpc(n, a); if (error) throw new Error(error.message); return data; },
  cr: (c) => (c ? { p_username: c.u, p_password: c.p } : { p_username: null, p_password: null }),
  async seed() { /* data awal dibuat oleh autoSetupDatabase() lewat RPC setup_initial_data */ },
  async getSettings() { const { data, error } = await sb.from('settings').select('*').eq('id', 1).maybeSingle(); if (error) throw new Error(error.message); return data; },
  async saveSettings(s) { const { error } = await sb.from('settings').update(s).eq('id', 1); if (error) throw new Error(error.message); },
  async adminLogin(email, pw) { const { data, error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) throw new Error('Email atau password admin salah!'); return data.user; },
  async adminSession() { const { data } = await sb.auth.getSession(); return data && data.session ? data.session.user : null; },
  async adminLogout() { await sb.auth.signOut(); },
  async loginUser(u, p) { return L.rpc('login_user', { p_username: u, p_password: p }); },
  async loadAll() {
    await sb.rpc('refresh_tokens');
    const tabs = ['kelas', 'sesi', 'ruang', 'ruang_siswa', 'ruang_pengawas', 'ujian'];
    const res = await Promise.all([sb.from('users').select('id,username,role,nama,kelas_id').order('nama'), ...tabs.map(t => sb.from(t).select('*'))]);
    const out = {};
    ['users', ...tabs].forEach((t, i) => { if (res[i].error) throw new Error(res[i].error.message); out[t] = res[i].data || []; });
    return out;
  },
  async ins(t, row) { const { data, error } = await sb.from(t).insert(row).select().single(); if (error) throw new Error(error.code === '23505' ? 'Data sudah ada (duplikat)!' : error.message); return data; },
  async upd(t, id, patch) { const { error } = await sb.from(t).update(patch).eq('id', id); if (error) throw new Error(error.message); },
  async del(t, id) { const { error } = await sb.from(t).delete().eq('id', id); if (error) throw new Error(error.message); },
  async delPair(ruang_id, siswa_id) { const { error } = await sb.from('ruang_siswa').delete().match({ ruang_id, siswa_id }); if (error) throw new Error(error.message); },
  async importUsers(rows) {
    const { data: kl, error: e1 } = await sb.from('kelas').select('*'); if (e1) throw new Error(e1.message);
    const map = {}; kl.forEach(k => map[k.nama_kelas] = k.id);
    const need = [...new Set(rows.filter(r => r.role === 'siswa' && r.kelas && !map[r.kelas]).map(r => r.kelas))];
    if (need.length) { const { data, error } = await sb.from('kelas').insert(need.map(n => ({ nama_kelas: n }))).select(); if (error) throw new Error(error.message); data.forEach(k => map[k.nama_kelas] = k.id); }
    const payload = rows.map(r => ({ username: r.username, password_hash: r.password, role: r.role, nama: r.nama, kelas_id: r.role === 'siswa' && r.kelas ? map[r.kelas] : null }));
    for (let i = 0; i < payload.length; i += 200) { const { error } = await sb.from('users').upsert(payload.slice(i, i + 200), { onConflict: 'username' }); if (error) throw new Error(error.message); }
    return payload.length;
  },
  async resetPasswords(list) { await Promise.all(list.map(async x => { const { error } = await sb.from('users').update({ password_hash: x.password }).eq('id', x.id); if (error) throw new Error(error.message); })); },
  async refreshTokens() { await sb.rpc('refresh_tokens'); },
  async getExams(c) { return L.rpc('get_exams_siswa', L.cr(c)); },
  async checkToken(c, id, token, sid) { return L.rpc('check_token', { ...L.cr(c), p_ujian_id: id, p_token: String(token), p_session: sid }); },
  async examState(c, id, sid) { return L.rpc('exam_state', { ...L.cr(c), p_ujian_id: id, p_session: sid }); },
  async logViolation(c, id, sid, jenis, detail) { return L.rpc('log_violation', { ...L.cr(c), p_ujian_id: id, p_session: sid, p_jenis: jenis, p_detail: detail || '' }); },
  async finishExam(c, id, sid) { return L.rpc('finish_exam', { ...L.cr(c), p_ujian_id: id, p_session: sid }); },
  async getMonitor(c, id) { return L.rpc('get_monitor', { ...L.cr(c), p_ujian_id: id }); },
  async monitorAction(c, id, siswaId, aksi) { return L.rpc('monitor_action', { ...L.cr(c), p_ujian_id: id, p_siswa_id: siswaId, p_aksi: aksi }); },
  async getPengawas(c) { return L.rpc('get_pengawas_data', L.cr(c)); },
  async newToken(c, id) { return L.rpc('pengawas_new_token', { ...L.cr(c), p_ujian_id: id }); },
  async extend(c, id, m) { return L.rpc('extend_exam', { ...L.cr(c), p_ujian_id: id, p_menit: m }); },
  async endExam(c, id) { return L.rpc('end_exam', { ...L.cr(c), p_ujian_id: id }); }
};
let API = P;

// SETUP DATABASE OTOMATIS: cek tabel kosong -> isi data awal (preview: hanya di memori)
async function autoSetupDatabase() {
  if (IS_PREVIEW) { await P.seed(); return; }
  try {
    const { data, error } = await sb.rpc('setup_initial_data');
    if (error) throw error;
    if (data && data.seeded) toast('Data awal berhasil dibuat otomatis (akun contoh, kelas, sesi, ujian).');
  } catch (e) { console.warn('autoSetupDatabase:', e.message); }
}
