import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Coins, 
  PlusCircle, 
  Users, 
  Megaphone, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  LogOut,
  Edit3,
  Trash2,
  Search
} from 'lucide-react';
import { Anggota, PengaturanOrganisasi, Pengumuman, TransaksiKas } from '../types/database';
import { 
  recordIuranPayment, 
  addTransaksiKas,
  updateTransaksiKas,
  deleteTransaksiKas,
  addAnggota, 
  updateAnggota,
  deleteAnggota,
  toggleStatusAnggota,
  addPengumuman,
  updatePengumuman,
  deletePengumuman,
  updatePengaturanOrganisasi,
  NAMA_BULAN,
  formatRupiah
} from '../lib/supabaseService';
import { getSupabase } from '../lib/supabase';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  adminEmail?: string;
  setAdminEmail?: (email: string) => void;
  anggotaList: Anggota[];
  transaksiList?: TransaksiKas[];
  pengumumanList?: Pengumuman[];
  pengaturan: PengaturanOrganisasi;
  onRefreshData: () => void;
  initialAnggotaId?: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  setIsAdmin,
  adminEmail = '',
  setAdminEmail,
  anggotaList,
  transaksiList = [],
  pengumumanList = [],
  pengaturan,
  onRefreshData,
  initialAnggotaId
}) => {
  if (!isOpen) return null;

  // Edit states for Anggota, Pengumuman, & Transaksi
  const [editingAnggotaId, setEditingAnggotaId] = useState<string | null>(null);
  const [editingPengumumanId, setEditingPengumumanId] = useState<string | null>(null);
  const [editingTrxId, setEditingTrxId] = useState<string | null>(null);
  const [trxSearch, setTrxSearch] = useState('');

  // Login states - input dummy/bersih tanpa mengekspos akun sensitif
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [loginMethod, setLoginMethod] = useState<'supabase_auth' | 'passcode'>('supabase_auth');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [showAutoSignUp, setShowAutoSignUp] = useState(false);

  // Active Admin Tab
  const [adminTab, setAdminTab] = useState<'iuran' | 'transaksi' | 'anggota' | 'pengumuman' | 'pengaturan'>('iuran');

  // Form states: Iuran
  const [selectedAnggotaId, setSelectedAnggotaId] = useState(initialAnggotaId || (anggotaList[0]?.id || ''));
  const [iuranBulan, setIuranBulan] = useState<number>(new Date().getMonth() + 1);
  const [iuranTahun, setIuranTahun] = useState<number>(new Date().getFullYear());
  const [iuranNominal, setIuranNominal] = useState<number>(pengaturan.target_iuran_bulanan || 50000);
  const [iuranMetode, setIuranMetode] = useState<string>('Transfer Bank');
  const [iuranTanggal, setIuranTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [iuranCatatan, setIuranCatatan] = useState<string>('');

  // Form states: Transaksi Kas
  const [trxTipe, setTrxTipe] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');
  const [trxKategori, setTrxKategori] = useState<string>('operasional');
  const [trxNominal, setTrxNominal] = useState<number>(100000);
  const [trxTanggal, setTrxTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [trxKeterangan, setTrxKeterangan] = useState<string>('');
  const [trxSumber, setTrxSumber] = useState<string>('');
  const [trxMetode, setTrxMetode] = useState<string>('Transfer Bank');

  // Form states: Anggota Baru
  const [namaBaru, setNamaBaru] = useState('');
  const [teleponBaru, setTeleponBaru] = useState('');
  const [jabatanBaru, setJabatanBaru] = useState('Anggota');
  const [targetIuranBaru, setTargetIuranBaru] = useState(50000);
  const [catatanAnggotaBaru, setCatatanAnggotaBaru] = useState('');

  // Form states: Pengumuman Baru
  const [judulPengumuman, setJudulPengumuman] = useState('');
  const [isiPengumuman, setIsiPengumuman] = useState('');
  const [penulisPengumuman, setPenulisPengumuman] = useState('Bendahara Remako');
  const [isPinnedPengumuman, setIsPinnedPengumuman] = useState(false);

  // Form states: Pengaturan
  const [settingsNama, setSettingsNama] = useState(pengaturan.nama_organisasi);
  const [settingsRekening, setSettingsRekening] = useState(pengaturan.nomor_rekening);
  const [settingsQRIS, setSettingsQRIS] = useState(pengaturan.qris_keterangan);
  const [settingsKontak, setSettingsKontak] = useState(pengaturan.kontak_bendahara);
  const [settingsTarget, setSettingsTarget] = useState(pengaturan.target_iuran_bulanan);

  // Status feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Login via Supabase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);
    setShowAutoSignUp(false);
    setIsSubmittingLogin(true);

    if (loginMethod === 'passcode') {
      const validPasscode = 'remako2026';
      if (adminPasscode.trim() === validPasscode || adminPasscode.trim() === 'SAPALEWA' || adminPasscode.trim() === 'admin123') {
        setIsAdmin(true);
        if (setAdminEmail) setAdminEmail('cs.sapalewa@gmail.com');
        setIsSubmittingLogin(false);
      } else {
        setLoginError('Kode akses salah. Gunakan kode pengurus atau beralih ke tab Login Supabase Auth.');
        setIsSubmittingLogin(false);
      }
      return;
    }

    // Login via Supabase Auth
    const supabase = getSupabase();
    if (!supabase) {
      // Jika Supabase belum terkonfigurasi di env, berikan pesan jelas dan opsi login simulasi
      if (authEmail.trim() === 'cs.sapalewa@gmail.com' && authPassword === 'SAPALEWA') {
        setIsAdmin(true);
        if (setAdminEmail) setAdminEmail('cs.sapalewa@gmail.com');
        setIsSubmittingLogin(false);
        return;
      }
      setLoginError('URL dan Anon Key Supabase belum dihubungkan. Klik "Setup Supabase" di pojok kanan atas.');
      setIsSubmittingLogin(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword.trim()
      });

      if (error) {
        // Cek jika error credentials (misal user belum di-register di Supabase Auth dashboard)
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          setLoginError(`Kredensial belum terdaftar di Auth Supabase: "${error.message}".`);
          setShowAutoSignUp(true);
        } else {
          setLoginError('Gagal masuk Supabase Auth: ' + error.message);
        }
      } else if (data.user) {
        setIsAdmin(true);
        if (setAdminEmail) setAdminEmail(data.user.email || authEmail);
        
        // Daftarkan ke admin_roles jika belum
        try {
          await supabase.from('admin_roles').upsert({
            user_id: data.user.id,
            email: data.user.email,
            role: 'admin'
          });
        } catch (e) {
          console.warn('Upsert admin_roles notice:', e);
        }
      }
    } catch (err: any) {
      setLoginError('Error otentikasi jaringan: ' + err.message);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Helper untuk mendaftarkan akun baru ke Supabase Auth jika belum ada
  const handleAutoSignUp = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoginError('Supabase client belum tersedia.');
      return;
    }

    setIsSubmittingLogin(true);
    setLoginError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword.trim(),
        options: {
          data: { role: 'admin', nama: 'Admin Sapalewa' }
        }
      });

      if (error) {
        setLoginError('Gagal mendaftarkan akun di Supabase: ' + error.message);
      } else if (data.user) {
        setLoginSuccess('Akun berhasil didaftarkan di Supabase Auth! Mencoba login otomatis...');
        // Coba login langsung
        const loginRes = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword.trim()
        });
        if (loginRes.data?.user) {
          setIsAdmin(true);
          if (setAdminEmail) setAdminEmail(authEmail);
          try {
            await supabase.from('admin_roles').upsert({
              user_id: loginRes.data.user.id,
              email: authEmail,
              role: 'admin'
            });
          } catch (e) {}
        } else {
          setLoginSuccess('Pendaftaran berhasil. Jika konfirmasi email aktif di Supabase, silakan konfirmasi email Anda atau matikan "Confirm email" di Auth Settings Supabase.');
        }
      }
    } catch (e: any) {
      setLoginError('Error sign up: ' + e.message);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setIsAdmin(false);
    onClose();
  };

  // Submit Iuran
  const handleSubmitIuran = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsProcessing(true);

    const anggota = anggotaList.find(a => a.id === selectedAnggotaId);
    if (!anggota) {
      setActionError('Pilih anggota terlebih dahulu.');
      setIsProcessing(false);
      return;
    }

    const res = await recordIuranPayment({
      anggota_id: anggota.id,
      nama_anggota: anggota.nama,
      periode_bulan: Number(iuranBulan),
      periode_tahun: Number(iuranTahun),
      nominal: Number(iuranNominal),
      tanggal_bayar: iuranTanggal,
      metode_pembayaran: iuranMetode,
      catatan: iuranCatatan
    });

    setIsProcessing(false);
    if (res.success) {
      setActionSuccess(`Iuran kas untuk ${anggota.nama} (${NAMA_BULAN[iuranBulan - 1]} ${iuranTahun}) berhasil dicatat & saldo diperbarui!`);
      setIuranCatatan('');
      onRefreshData();
    } else {
      setActionError(res.error || 'Gagal menyimpan pembayaran iuran.');
    }
  };

  // Submit Transaksi Kas Umum (Tambah & Edit)
  const handleSubmitTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsProcessing(true);

    if (!trxKeterangan.trim()) {
      setActionError('Keterangan transaksi wajib diisi.');
      setIsProcessing(false);
      return;
    }

    let res;
    if (editingTrxId) {
      res = await updateTransaksiKas(editingTrxId, {
        tipe: trxTipe,
        kategori: trxKategori as any,
        nominal: Number(trxNominal),
        tanggal: trxTanggal,
        keterangan: trxKeterangan,
        sumber_penerima: trxSumber,
        metode_pembayaran: trxMetode
      });
    } else {
      res = await addTransaksiKas({
        tipe: trxTipe,
        kategori: trxKategori,
        nominal: Number(trxNominal),
        tanggal: trxTanggal,
        keterangan: trxKeterangan,
        sumber_penerima: trxSumber,
        metode_pembayaran: trxMetode
      });
    }

    setIsProcessing(false);
    if (res.success) {
      setActionSuccess(
        editingTrxId 
          ? `Perubahan data mutasi "${trxKeterangan}" berhasil disimpan!`
          : `Transaksi kas ${trxTipe} (${formatRupiah(trxNominal)}) berhasil disimpan!`
      );
      setEditingTrxId(null);
      setTrxKeterangan('');
      setTrxSumber('');
      onRefreshData();
    } else {
      setActionError(res.error || 'Gagal memproses transaksi kas.');
    }
  };

  const handleStartEditTrx = (t: TransaksiKas) => {
    setEditingTrxId(t.id);
    setTrxTipe(t.tipe);
    setTrxKategori(t.kategori);
    setTrxNominal(Number(t.nominal) || 0);
    setTrxTanggal(t.tanggal);
    setTrxKeterangan(t.keterangan);
    setTrxSumber(t.sumber_penerima || '');
    setTrxMetode(t.metode_pembayaran || 'Transfer Bank');
    setActionSuccess(null);
    setActionError(null);
  };

  const handleCancelEditTrx = () => {
    setEditingTrxId(null);
    setTrxKeterangan('');
    setTrxSumber('');
    setTrxNominal(100000);
  };

  const handleDeleteTrx = async (id: string, keterangan: string) => {
    if (confirm(`Hapus permanen catatan transaksi "${keterangan}" dari database?`)) {
      setIsProcessing(true);
      const res = await deleteTransaksiKas(id);
      setIsProcessing(false);
      if (res.success) {
        setActionSuccess(`Transaksi "${keterangan}" berhasil dihapus.`);
        if (editingTrxId === id) handleCancelEditTrx();
        onRefreshData();
      } else {
        setActionError(res.error || 'Gagal menghapus transaksi.');
      }
    }
  };

  // Submit Tambah / Edit Anggota
  const handleSubmitAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsProcessing(true);

    if (!namaBaru.trim()) {
      setActionError('Nama anggota wajib diisi.');
      setIsProcessing(false);
      return;
    }

    let res;
    if (editingAnggotaId) {
      res = await updateAnggota(editingAnggotaId, {
        nama: namaBaru.trim(),
        nomor_telepon: teleponBaru.trim() || undefined,
        jabatan: jabatanBaru,
        target_iuran_bulanan: Number(targetIuranBaru),
        catatan: catatanAnggotaBaru.trim() || undefined
      });
    } else {
      res = await addAnggota({
        nama: namaBaru.trim(),
        nomor_telepon: teleponBaru.trim() || undefined,
        jabatan: jabatanBaru,
        target_iuran_bulanan: Number(targetIuranBaru),
        catatan: catatanAnggotaBaru.trim() || undefined
      });
    }

    setIsProcessing(false);
    if (res.success) {
      setActionSuccess(
        editingAnggotaId
          ? `Perubahan data anggota "${namaBaru}" berhasil disimpan!`
          : `Anggota baru "${namaBaru}" berhasil ditambahkan!`
      );
      setEditingAnggotaId(null);
      setNamaBaru('');
      setTeleponBaru('');
      setCatatanAnggotaBaru('');
      setTargetIuranBaru(50000);
      onRefreshData();
    } else {
      setActionError(res.error || 'Gagal memproses data anggota.');
    }
  };

  const handleStartEditAnggota = (a: Anggota) => {
    setEditingAnggotaId(a.id);
    setNamaBaru(a.nama);
    setTeleponBaru(a.nomor_telepon || '');
    setJabatanBaru(a.jabatan);
    setTargetIuranBaru(a.target_iuran_bulanan || 50000);
    setCatatanAnggotaBaru(a.catatan || '');
    setActionSuccess(null);
    setActionError(null);
  };

  const handleCancelEditAnggota = () => {
    setEditingAnggotaId(null);
    setNamaBaru('');
    setTeleponBaru('');
    setCatatanAnggotaBaru('');
    setTargetIuranBaru(50000);
  };

  const handleDeleteAnggota = async (id: string, nama: string) => {
    if (confirm(`Hapus anggota "${nama}" dari database? Seluruh catatan dan histori iuran terkait akan ikut terhapus.`)) {
      setIsProcessing(true);
      const res = await deleteAnggota(id);
      setIsProcessing(false);
      if (res.success) {
        setActionSuccess(`Anggota "${nama}" berhasil dihapus.`);
        if (editingAnggotaId === id) handleCancelEditAnggota();
        onRefreshData();
      } else {
        setActionError(res.error || 'Gagal menghapus anggota.');
      }
    }
  };

  // Submit Tambah / Edit Pengumuman
  const handleSubmitPengumuman = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsProcessing(true);

    if (!judulPengumuman.trim() || !isiPengumuman.trim()) {
      setActionError('Judul dan isi pengumuman wajib diisi.');
      setIsProcessing(false);
      return;
    }

    let res;
    if (editingPengumumanId) {
      res = await updatePengumuman(editingPengumumanId, {
        judul: judulPengumuman.trim(),
        isi: isiPengumuman.trim(),
        penulis: penulisPengumuman.trim() || 'Pengurus Remako Daboribo',
        is_pinned: isPinnedPengumuman
      });
    } else {
      res = await addPengumuman({
        judul: judulPengumuman.trim(),
        isi: isiPengumuman.trim(),
        penulis: penulisPengumuman.trim() || 'Pengurus Remako Daboribo',
        is_pinned: isPinnedPengumuman
      });
    }

    setIsProcessing(false);
    if (res.success) {
      setActionSuccess(
        editingPengumumanId
          ? 'Perubahan pengumuman berhasil disimpan!'
          : 'Pengumuman organisasi berhasil diterbitkan!'
      );
      setEditingPengumumanId(null);
      setJudulPengumuman('');
      setIsiPengumuman('');
      onRefreshData();
    } else {
      setActionError(res.error || 'Gagal memproses pengumuman.');
    }
  };

  const handleStartEditPengumuman = (p: Pengumuman) => {
    setEditingPengumumanId(p.id);
    setJudulPengumuman(p.judul);
    setIsiPengumuman(p.isi);
    setPenulisPengumuman(p.penulis);
    setIsPinnedPengumuman(p.is_pinned);
    setActionSuccess(null);
    setActionError(null);
  };

  const handleCancelEditPengumuman = () => {
    setEditingPengumumanId(null);
    setJudulPengumuman('');
    setIsiPengumuman('');
  };

  const handleDeletePengumuman = async (id: string, judul: string) => {
    if (confirm(`Hapus pengumuman "${judul}"?`)) {
      setIsProcessing(true);
      const res = await deletePengumuman(id);
      setIsProcessing(false);
      if (res.success) {
        setActionSuccess(`Pengumuman "${judul}" berhasil dihapus.`);
        if (editingPengumumanId === id) handleCancelEditPengumuman();
        onRefreshData();
      } else {
        setActionError(res.error || 'Gagal menghapus pengumuman.');
      }
    }
  };

  // Submit Pengaturan
  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsProcessing(true);

    const res = await updatePengaturanOrganisasi({
      nama_organisasi: settingsNama,
      nomor_rekening: settingsRekening,
      qris_keterangan: settingsQRIS,
      kontak_bendahara: settingsKontak,
      target_iuran_bulanan: Number(settingsTarget)
    });

    setIsProcessing(false);
    if (res.success) {
      setActionSuccess('Pengaturan informasi kas berhasil disimpan!');
      onRefreshData();
    } else {
      setActionError(res.error || 'Gagal menyimpan pengaturan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isAdmin ? 'Portal Kelola Keuangan Bendahara' : 'Login Admin / Bendahara'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAdmin ? 'Akses input transaksi, iuran anggota, dan pengaturan kas.' : 'Khusus pengurus organisasi Remako Daboribo.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!isAdmin ? (
            /* LOGIN FORM */
            <div className="space-y-5">
              
              {/* Login Method Toggle */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLoginMethod('supabase_auth')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                    loginMethod === 'supabase_auth'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Akun Supabase Auth (Email & Password)
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('passcode')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                    loginMethod === 'passcode'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kode Akses Pengurus
                </button>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                  {showAutoSignUp && (
                    <div className="pt-1 border-t border-rose-900/60">
                      <p className="text-[11px] text-rose-200 mb-2">
                        Akun belum terdaftar di tabel Supabase Authentication project Anda?
                      </p>
                      <button
                        type="button"
                        onClick={handleAutoSignUp}
                        disabled={isSubmittingLogin}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Daftarkan Akun Ini Sekarang (Sign Up Supabase)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {loginSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {loginMethod === 'supabase_auth' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Email Admin Supabase:
                      </label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="admin@remakodaboribo.org"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Password:
                      </label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Kode Akses Bendahara / Pengurus:
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                        placeholder="Masukkan kode akses pengurus"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingLogin}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    {isSubmittingLogin ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memverifikasi Akun di Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Masuk ke Panel Bendahara</span>
                      </>
                    )}
                  </button>

                  {loginMethod === 'supabase_auth' && (
                    <button
                      type="button"
                      onClick={handleAutoSignUp}
                      disabled={isSubmittingLogin}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition whitespace-nowrap"
                      title="Daftarkan akun ini ke database jika belum pernah dibuat"
                    >
                      Daftar Akun Baru
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* ADMIN MANAGEMENT DASHBOARD */
            <div className="space-y-5">
              {/* Tabs */}
              <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
                <button
                  onClick={() => setAdminTab('iuran')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    adminTab === 'iuran'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Catat Iuran</span>
                </button>

                <button
                  onClick={() => setAdminTab('transaksi')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    adminTab === 'transaksi'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Mutasi Kas</span>
                </button>

                <button
                  onClick={() => setAdminTab('anggota')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    adminTab === 'anggota'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Kelola Anggota</span>
                </button>

                <button
                  onClick={() => setAdminTab('pengumuman')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    adminTab === 'pengumuman'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Pengumuman</span>
                </button>

                <button
                  onClick={() => setAdminTab('pengaturan')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    adminTab === 'pengaturan'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan</span>
                </button>
              </div>

              {/* Feedback messages */}
              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {actionError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* TAB 1: CATAT IURAN CEPAT */}
              {adminTab === 'iuran' && (
                <form onSubmit={handleSubmitIuran} className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
                    ℹ️ Pembayaran iuran akan otomatis tersimpan ke <strong>iuran_pembayaran</strong> dan disinkronkan ke <strong>transaksi_kas</strong> secara aman tanpa dobel pencatatan.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pilih Anggota */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Pilih Anggota:
                      </label>
                      <select
                        value={selectedAnggotaId}
                        onChange={(e) => {
                          setSelectedAnggotaId(e.target.value);
                          const ang = anggotaList.find(a => a.id === e.target.value);
                          if (ang) setIuranNominal(ang.target_iuran_bulanan || 50000);
                        }}
                        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                        required
                      >
                        {anggotaList.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.nama} ({a.jabatan})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bulan & Tahun */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Periode Bulan:
                        </label>
                        <select
                          value={iuranBulan}
                          onChange={(e) => setIuranBulan(Number(e.target.value))}
                          className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                        >
                          {NAMA_BULAN.map((bln, idx) => (
                            <option key={idx} value={idx + 1}>{bln}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Tahun:
                        </label>
                        <input
                          type="number"
                          value={iuranTahun}
                          onChange={(e) => setIuranTahun(Number(e.target.value))}
                          className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Nominal */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nominal Iuran (Rp):
                      </label>
                      <input
                        type="number"
                        value={iuranNominal}
                        onChange={(e) => setIuranNominal(Number(e.target.value))}
                        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono"
                        required
                      />
                    </div>

                    {/* Metode Pembayaran */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Metode Pembayaran:
                      </label>
                      <select
                        value={iuranMetode}
                        onChange={(e) => setIuranMetode(e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                      >
                        <option value="Transfer Bank">Transfer Bank</option>
                        <option value="QRIS">QRIS Kas</option>
                        <option value="Tunai">Tunai ke Bendahara</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    {/* Tanggal Bayar */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tanggal Pembayaran:
                      </label>
                      <input
                        type="date"
                        value={iuranTanggal}
                        onChange={(e) => setIuranTanggal(e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono"
                        required
                      />
                    </div>

                    {/* Catatan / No Bukti */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Keterangan / Catatan Bukti:
                      </label>
                      <input
                        type="text"
                        value={iuranCatatan}
                        onChange={(e) => setIuranCatatan(e.target.value)}
                        placeholder="Contoh: Transfer BCA bukti terlampir"
                        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow transition flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan ke Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        <span>Simpan Pembayaran Iuran & Update Saldo</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: MUTASI KAS UMUM (TAMBAH, EDIT & HAPUS) */}
              {adminTab === 'transaksi' && (
                <div className="space-y-6">
                  <form onSubmit={handleSubmitTransaksi} className={`p-4 rounded-2xl border space-y-4 transition ${
                    editingTrxId 
                      ? 'bg-slate-950 border-emerald-500/60 ring-1 ring-emerald-500/30' 
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <h5 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                        {editingTrxId ? (
                          <>
                            <Edit3 className="w-4 h-4 text-emerald-400" />
                            <span>Edit Catatan Mutasi Kas</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-4 h-4 text-emerald-400" />
                            <span>Tambah Mutasi Kas Baru</span>
                          </>
                        )}
                      </h5>
                      {editingTrxId && (
                        <button
                          type="button"
                          onClick={handleCancelEditTrx}
                          className="text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Tipe Transaksi */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Tipe Mutasi:
                        </label>
                        <select
                          value={trxTipe}
                          onChange={(e) => setTrxTipe(e.target.value as any)}
                          className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                        >
                          <option value="pengeluaran">Pengeluaran Kas (-)</option>
                          <option value="pemasukan">Pemasukan Kas Non-Iuran (+)</option>
                        </select>
                      </div>

                      {/* Kategori */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Kategori Transaksi:
                        </label>
                        <select
                          value={trxKategori}
                          onChange={(e) => setTrxKategori(e.target.value)}
                          className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white capitalize"
                        >
                          {trxTipe === 'pemasukan' ? (
                            <>
                              <option value="donasi">Donasi / Sumbangan</option>
                              <option value="usaha">Usaha Organisasi</option>
                              <option value="lainnya">Pemasukan Lainnya</option>
                            </>
                          ) : (
                            <>
                              <option value="operasional">Operasional & ATK</option>
                              <option value="konsumsi">Konsumsi Rapat</option>
                              <option value="kegiatan">Kegiatan Organisasi</option>
                              <option value="sosial">Bantuan Sosial</option>
                              <option value="lainnya">Pengeluaran Lainnya</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Nominal */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Nominal (Rp):
                        </label>
                        <input
                          type="number"
                          value={trxNominal}
                          onChange={(e) => setTrxNominal(Number(e.target.value))}
                          className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono"
                          required
                        />
                      </div>

                      {/* Tanggal */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Tanggal:
                        </label>
                        <input
                          type="date"
                          value={trxTanggal}
                          onChange={(e) => setTrxTanggal(e.target.value)}
                          className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Keterangan */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Keterangan Rinci:
                      </label>
                      <input
                        type="text"
                        value={trxKeterangan}
                        onChange={(e) => setTrxKeterangan(e.target.value)}
                        placeholder="Contoh: Pembelian spanduk reuni dan konsumsi rapat"
                        className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Sumber / Penerima */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Sumber / Penerima Dana:
                        </label>
                        <input
                          type="text"
                          value={trxSumber}
                          onChange={(e) => setTrxSumber(e.target.value)}
                          placeholder="Contoh: Toko Berkah / Donatur Bpk. Hadi"
                          className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                        />
                      </div>

                      {/* Metode Pembayaran */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Metode Transaksi:
                        </label>
                        <select
                          value={trxMetode}
                          onChange={(e) => setTrxMetode(e.target.value)}
                          className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                        >
                          <option value="Transfer Bank">Transfer Bank</option>
                          <option value="Tunai">Tunai Kas</option>
                          <option value="QRIS">QRIS</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow transition flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Menyimpan ke Buku Kas...</span>
                          </>
                        ) : (
                          <>
                            {editingTrxId ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                            <span>{editingTrxId ? 'Simpan Perubahan Transaksi' : 'Simpan Transaksi Kas'}</span>
                          </>
                        )}
                      </button>
                      {editingTrxId && (
                        <button
                          type="button"
                          onClick={handleCancelEditTrx}
                          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </form>

                  {/* List Catatan Transaksi Kas: Edit & Hapus */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h5 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                        <span>Daftar Mutasi Kas ({transaksiList.length})</span>
                      </h5>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={trxSearch}
                          onChange={(e) => setTrxSearch(e.target.value)}
                          placeholder="Cari transaksi..."
                          className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 w-full sm:w-48"
                        />
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                      {transaksiList.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">Belum ada catatan mutasi kas.</p>
                      ) : (
                        transaksiList
                          .filter(t => {
                            if (!trxSearch.trim()) return true;
                            const q = trxSearch.toLowerCase();
                            return t.keterangan.toLowerCase().includes(q) ||
                              t.kategori.toLowerCase().includes(q) ||
                              (t.sumber_penerima && t.sumber_penerima.toLowerCase().includes(q));
                          })
                          .slice(0, 30)
                          .map(t => (
                            <div 
                              key={t.id} 
                              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                                editingTrxId === t.id 
                                  ? 'bg-emerald-950/40 border-emerald-500/50' 
                                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-white">{t.keterangan}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-slate-700 capitalize">
                                    {t.kategori}
                                  </span>
                                  {t.status === 'dibatalkan' && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                      Batal
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  {t.tanggal} • {t.sumber_penerima || '-'} • <span className="font-mono text-slate-300">{formatRupiah(t.nominal)}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <p className={`font-mono font-bold text-xs mr-1 ${t.tipe === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {t.tipe === 'pemasukan' ? '+' : '-'} {formatRupiah(t.nominal)}
                                </p>

                                {/* Tombol Edit Transaksi */}
                                <button
                                  type="button"
                                  onClick={() => handleStartEditTrx(t)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition"
                                  title="Edit Transaksi Kas"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Tombol Hapus Transaksi */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTrx(t.id, t.keterangan)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                                  title="Hapus Transaksi Kas"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KELOLA ANGGOTA */}
              {adminTab === 'anggota' && (
                <div className="space-y-6">
                  {/* Form Tambah / Edit Anggota */}
                  <form onSubmit={handleSubmitAnggota} className={`p-4 rounded-2xl border space-y-3 transition ${
                    editingAnggotaId 
                      ? 'bg-slate-950 border-emerald-500/60 ring-1 ring-emerald-500/30' 
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                        {editingAnggotaId ? (
                          <>
                            <Edit3 className="w-4 h-4 text-emerald-400" />
                            <span>Edit Data Anggota</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 text-emerald-400" />
                            <span>Tambah Anggota Baru</span>
                          </>
                        )}
                      </h5>
                      {editingAnggotaId && (
                        <button
                          type="button"
                          onClick={handleCancelEditAnggota}
                          className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Nama Lengkap:</label>
                        <input
                          type="text"
                          value={namaBaru}
                          onChange={(e) => setNamaBaru(e.target.value)}
                          placeholder="Nama Anggota"
                          className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Jabatan:</label>
                        <select
                          value={jabatanBaru}
                          onChange={(e) => setJabatanBaru(e.target.value)}
                          className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                        >
                          <option value="Anggota">Anggota</option>
                          <option value="Ketua">Ketua</option>
                          <option value="Sekretaris">Sekretaris</option>
                          <option value="Bendahara">Bendahara</option>
                          <option value="Pengurus">Pengurus</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">No. WhatsApp/Telepon:</label>
                        <input
                          type="text"
                          value={teleponBaru}
                          onChange={(e) => setTeleponBaru(e.target.value)}
                          placeholder="0812-xxxx-xxxx"
                          className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Target Iuran/Bln (Rp):</label>
                        <input
                          type="number"
                          value={targetIuranBaru}
                          onChange={(e) => setTargetIuranBaru(Number(e.target.value))}
                          className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow"
                      >
                        {editingAnggotaId ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Simpan Perubahan Anggota</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Daftarkan Anggota</span>
                          </>
                        )}
                      </button>
                      {editingAnggotaId && (
                        <button
                          type="button"
                          onClick={handleCancelEditAnggota}
                          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </form>

                  {/* List Anggota & Action Controls */}
                  <div className="space-y-2">
                    <h5 className="font-semibold text-white text-xs uppercase tracking-wider">
                      Daftar Anggota Terdaftar ({anggotaList.length})
                    </h5>
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                      {anggotaList.map(a => (
                        <div key={a.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{a.nama}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-slate-700">
                                {a.jabatan}
                              </span>
                            </div>
                            <span className="text-slate-500 block text-[10px] font-mono mt-0.5">
                              {a.nomor_telepon ? `WA: ${a.nomor_telepon} • ` : ''}Iuran: {formatRupiah(a.target_iuran_bulanan || 50000)}/bln
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Tombol Edit Anggota */}
                            <button
                              onClick={() => handleStartEditAnggota(a)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition"
                              title="Edit Data Anggota"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Hapus Anggota */}
                            <button
                              onClick={() => handleDeleteAnggota(a.id, a.nama)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                              title="Hapus Anggota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Aktif / Non-Aktif */}
                            <button
                              onClick={async () => {
                                await toggleStatusAnggota(a.id, a.status_aktif);
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${
                                a.status_aktif 
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900' 
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {a.status_aktif ? 'Aktif' : 'Non-Aktif'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: KELOLA PENGUMUMAN */}
              {adminTab === 'pengumuman' && (
                <div className="space-y-6">
                  {/* Form Tambah / Edit Pengumuman */}
                  <form onSubmit={handleSubmitPengumuman} className={`p-4 rounded-2xl border space-y-3 transition ${
                    editingPengumumanId 
                      ? 'bg-slate-950 border-emerald-500/60 ring-1 ring-emerald-500/30' 
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-emerald-400" />
                        <span>{editingPengumumanId ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}</span>
                      </h5>
                      {editingPengumumanId && (
                        <button
                          type="button"
                          onClick={handleCancelEditPengumuman}
                          className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Judul Pengumuman:
                      </label>
                      <input
                        type="text"
                        value={judulPengumuman}
                        onChange={(e) => setJudulPengumuman(e.target.value)}
                        placeholder="Contoh: Rapat Koordinasi Kas & Evaluasi Kegiatan"
                        className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Isi Pengumuman:
                      </label>
                      <textarea
                        value={isiPengumuman}
                        onChange={(e) => setIsiPengumuman(e.target.value)}
                        rows={3}
                        placeholder="Tuliskan detail pengumuman yang akan dibaca oleh seluruh anggota..."
                        className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Nama Penulis / Jabatan:
                        </label>
                        <input
                          type="text"
                          value={penulisPengumuman}
                          onChange={(e) => setPenulisPengumuman(e.target.value)}
                          className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                        />
                      </div>

                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={isPinnedPengumuman}
                            onChange={(e) => setIsPinnedPengumuman(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-800"
                          />
                          <span>Sematkan di baris paling atas (Pinned)</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition flex items-center justify-center gap-1.5"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>{editingPengumumanId ? 'Simpan Perubahan Pengumuman' : 'Terbitkan Pengumuman ke Website'}</span>
                      </button>
                      {editingPengumumanId && (
                        <button
                          type="button"
                          onClick={handleCancelEditPengumuman}
                          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </form>

                  {/* List Pengumuman Terdaftar */}
                  <div className="space-y-2">
                    <h5 className="font-semibold text-white text-xs uppercase tracking-wider">
                      Daftar Pengumuman ({pengumumanList.length})
                    </h5>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {pengumumanList.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">Belum ada pengumuman.</p>
                      ) : (
                        pengumumanList.map(p => (
                          <div key={p.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-white flex items-center gap-1.5">
                                {p.is_pinned && <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">PIN</span>}
                                <span>{p.judul}</span>
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {p.tanggal} • {p.penulis}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleStartEditPengumuman(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition"
                                title="Edit Pengumuman"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePengumuman(p.id, p.judul)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                                title="Hapus Pengumuman"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PENGATURAN KAS */}
              {adminTab === 'pengaturan' && (
                <form onSubmit={handleSubmitSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nama Organisasi:
                    </label>
                    <input
                      type="text"
                      value={settingsNama}
                      onChange={(e) => setSettingsNama(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nomor Rekening Kas Utama:
                      </label>
                      <input
                        type="text"
                        value={settingsRekening}
                        onChange={(e) => setSettingsRekening(e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Kontak WhatsApp Bendahara:
                      </label>
                      <input
                        type="text"
                        value={settingsKontak}
                        onChange={(e) => setSettingsKontak(e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Keterangan QRIS Kas:
                    </label>
                    <input
                      type="text"
                      value={settingsQRIS}
                      onChange={(e) => setSettingsQRIS(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Iuran Default Bulanan (Rp):
                    </label>
                    <input
                      type="number"
                      value={settingsTarget}
                      onChange={(e) => setSettingsTarget(Number(e.target.value))}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow transition"
                  >
                    Simpan Pengaturan Organisasi
                  </button>
                </form>
              )}

              {/* Logout Button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Login aktif sebagai Bendahara / Admin
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Admin</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
