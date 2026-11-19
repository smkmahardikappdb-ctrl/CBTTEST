'use strict';
/* =====================================================================
   STATE
===================================================================== */
const S = {
  role: null, user: null, cred: null, page: '', offset: 0,
  data: { kelas: [], users: [], sesi: [], ruang: [], ruang_siswa: [], ruang_pengawas: [], ujian: [] },
  settings: { nama_app: 'Portal Ujian Digital', nama_sekolah: 'Sekolah Nusantara', alamat: '', logo: '', zona_waktu: 'Asia/Jakarta', maks_pelanggaran: 3 },
  monId: '', mon: null, userTab: 'siswa', userQ: '', userKelas: '', ruangTab: 'ruang', plotRuang: '', plotKelas: '',
  editUjian: null, pw: null, sw: null, room: null, installEvt: null, loginTab: 'user'
};
const now = () => Date.now() + S.offset;
const sync = (serverNow) => { if (serverNow) S.offset = new Date(serverNow).getTime() - Date.now(); };
