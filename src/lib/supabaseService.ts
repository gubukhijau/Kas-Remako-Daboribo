import { getSupabase } from './supabase';
import {
  Anggota,
  IuranPembayaran,
  TransaksiKas,
  Pengumuman,
  PengaturanOrganisasi,
  RekapKeuanganSummary,
  AnggotaIuranRekap,
  KategoriTransaksi,
} from '../types/database';

// Default Organisasi
export const DEFAULT_PENGATURAN: PengaturanOrganisasi = {
  id: 'utama',
  nama_organisasi: 'Remako Daboribo',
  target_iuran_bulanan: 50000,
  nomor_rekening: 'BCA: 8901234567 a.n Kas Remako Daboribo',
  qris_keterangan: 'Scan QRIS Kas Resmi Remako Daboribo (Hubungi Bendahara)',
  kontak_bendahara: '0812-3456-7890 (Bendahara Remako)',
  pesan_sambutan: 'Portal Transparansi Kas, Rekap Iuran Anggota, dan Laporan Keuangan Organisasi Remako Daboribo.',
  updated_at: new Date().toISOString()
};

// Fallback seed data hanya digunakan jika Supabase belum terhubung sama sekali,
// agar antarmuka tetap interaktif dan user dapat melihat tampilan sebelum memasukkan kredensial Supabase.
export const DEMO_ANGGOTA: Anggota[] = [
  { id: '1', nama: 'Budi Santoso', nomor_telepon: '0812-1111-2222', jabatan: 'Ketua', target_iuran_bulanan: 50000, tanggal_bergabung: '2024-01-01', status_aktif: true },
  { id: '2', nama: 'Ahmad Dahlan', nomor_telepon: '0812-2222-3333', jabatan: 'Sekretaris', target_iuran_bulanan: 50000, tanggal_bergabung: '2024-01-01', status_aktif: true },
  { id: '3', nama: 'Siti Rahmawati', nomor_telepon: '0812-3333-4444', jabatan: 'Bendahara', target_iuran_bulanan: 50000, tanggal_bergabung: '2024-01-01', status_aktif: true },
  { id: '4', nama: 'Hendra Wijaya', nomor_telepon: '0812-4444-5555', jabatan: 'Anggota', target_iuran_bulanan: 50000, tanggal_bergabung: '2024-01-15', status_aktif: true },
  { id: '5', nama: 'Rizky Ramadhan', nomor_telepon: '0812-5555-6666', jabatan: 'Anggota', target_iuran_bulanan: 50000, tanggal_bergabung: '2024-02-01', status_aktif: true },
  { id: '6', nama: 'Dewi Lestari', nomor_telepon: '0812-6666-7777', jabatan: 'Anggota', target_iuran_bulanan: 50000, tanggal_bergabung: '2024-02-10', status_aktif: true },
  { id: '7', nama: 'Fajar Nugraha', nomor_telepon: '0812-7777-8888', jabatan: 'Anggota', target_iuran_bulanan: 50000, tanggal_bergabung: '2024-03-01', status_aktif: true },
  { id: '8', nama: 'Maya Putri', nomor_telepon: '0812-8888-9999', jabatan: 'Anggota', target_iuran_bulanan: 50000, tanggal_bergabung: '2024-03-15', status_aktif: true },
];

export const DEMO_PENGUMUMAN: Pengumuman[] = [
  {
    id: 'p1',
    judul: 'Transparansi Penuh Kas & Iuran Remako Daboribo',
    isi: 'Selamat datang di portal keuangan online organisasi Remako Daboribo. Seluruh anggota dapat memantau saldo kas terkini, rincian pengeluaran kegiatan, serta status pelunasan iuran bulanan dari perangkat masing-masing.',
    tanggal: '2026-10-15',
    penulis: 'Pengurus Remako Daboribo',
    is_pinned: true,
    status_aktif: true,
  },
  {
    id: 'p2',
    judul: 'Batas Pembayaran Iuran Kas Bulanan',
    isi: 'Iuran kas bulanan sebesar Rp50.000 wajib disetorkan paling lambat tanggal 10 setiap bulannya melalui transfer rekening kas atau scan QRIS kas ke Bendahara.',
    tanggal: '2026-10-01',
    penulis: 'Bendahara Remako',
    is_pinned: false,
    status_aktif: true,
  }
];

export const DEMO_IURAN: IuranPembayaran[] = [
  { id: 'i1', anggota_id: '1', periode_bulan: 10, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-10-02', metode_pembayaran: 'Transfer Bank', status: 'lunas', catatan: 'Iuran Budi Oktober' },
  { id: 'i2', anggota_id: '2', periode_bulan: 10, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-10-03', metode_pembayaran: 'QRIS', status: 'lunas', catatan: 'Iuran Dahlan Oktober' },
  { id: 'i3', anggota_id: '3', periode_bulan: 10, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-10-04', metode_pembayaran: 'Transfer Bank', status: 'lunas', catatan: 'Iuran Siti Oktober' },
  { id: 'i4', anggota_id: '4', periode_bulan: 10, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-10-05', metode_pembayaran: 'Tunai', status: 'lunas', catatan: 'Iuran Hendra Oktober' },
  { id: 'i5', anggota_id: '5', periode_bulan: 10, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-10-06', metode_pembayaran: 'QRIS', status: 'lunas', catatan: 'Iuran Rizky Oktober' },
  { id: 'i6', anggota_id: '1', periode_bulan: 9, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-09-02', metode_pembayaran: 'Transfer Bank', status: 'lunas' },
  { id: 'i7', anggota_id: '2', periode_bulan: 9, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-09-03', metode_pembayaran: 'QRIS', status: 'lunas' },
  { id: 'i8', anggota_id: '3', periode_bulan: 9, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-09-04', metode_pembayaran: 'Transfer Bank', status: 'lunas' },
  { id: 'i9', anggota_id: '4', periode_bulan: 9, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-09-05', metode_pembayaran: 'Tunai', status: 'lunas' },
  { id: 'i10', anggota_id: '5', periode_bulan: 9, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-09-06', metode_pembayaran: 'QRIS', status: 'lunas' },
  { id: 'i11', anggota_id: '6', periode_bulan: 9, periode_tahun: 2026, nominal: 50000, tanggal_bayar: '2026-09-07', metode_pembayaran: 'Transfer Bank', status: 'lunas' },
];

export const DEMO_TRANSAKSI: TransaksiKas[] = [
  { id: 't1', tipe: 'pemasukan', kategori: 'iuran', nominal: 250000, tanggal: '2026-10-06', keterangan: 'Akumulasi Iuran Anggota Oktober 2026', sumber_penerima: 'Anggota Remako', referensi_iuran_id: null, status: 'aktif', metode_pembayaran: 'Transfer Bank' },
  { id: 't2', tipe: 'pemasukan', kategori: 'donasi', nominal: 1000000, tanggal: '2026-10-08', keterangan: 'Sumbangan Donatur Warga Peduli', sumber_penerima: 'Bpk. Hendro', referensi_iuran_id: null, status: 'aktif', metode_pembayaran: 'Transfer Bank' },
  { id: 't3', tipe: 'pengeluaran', kategori: 'konsumsi', nominal: 320000, tanggal: '2026-10-10', keterangan: 'Konsumsi Rapat Koordinasi Bulanan', sumber_penerima: 'Warung Bu Siti', referensi_iuran_id: null, status: 'aktif', metode_pembayaran: 'Tunai' },
  { id: 't4', tipe: 'pengeluaran', kategori: 'operasional', nominal: 150000, tanggal: '2026-10-12', keterangan: 'Pembelian Spanduk & ATK Organisasi', sumber_penerima: 'Percetakan Berkah', referensi_iuran_id: null, status: 'aktif', metode_pembayaran: 'QRIS' },
  { id: 't5', tipe: 'pemasukan', kategori: 'iuran', nominal: 300000, tanggal: '2026-09-07', keterangan: 'Akumulasi Iuran Anggota September 2026', sumber_penerima: 'Anggota Remako', referensi_iuran_id: null, status: 'aktif', metode_pembayaran: 'Transfer Bank' },
  { id: 't6', tipe: 'pengeluaran', kategori: 'kegiatan', nominal: 450000, tanggal: '2026-09-20', keterangan: 'Bantuan Sosial Anggota Sakit', sumber_penerima: 'Keluarga Anggota', referensi_iuran_id: null, status: 'aktif', metode_pembayaran: 'Tunai' },
];

// Helper: Nama Bulan Bahasa Indonesia
export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// ---------------- DATA FETCHING FUNCTIONS ----------------

export async function fetchAnggotaList(): Promise<{ data: Anggota[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: DEMO_ANGGOTA };
  }

  try {
    const { data, error } = await supabase
      .from('anggota')
      .select('*')
      .order('nama', { ascending: true });

    if (error) throw error;
    return { data: data || [] };
  } catch (err: any) {
    console.error('Error fetching anggota:', err);
    return { data: DEMO_ANGGOTA, error: err.message };
  }
}

export async function fetchTransaksiKasList(): Promise<{ data: TransaksiKas[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: DEMO_TRANSAKSI };
  }

  try {
    const { data, error } = await supabase
      .from('transaksi_kas')
      .select('*')
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (err: any) {
    console.error('Error fetching transaksi:', err);
    return { data: DEMO_TRANSAKSI, error: err.message };
  }
}

export async function fetchIuranList(): Promise<{ data: IuranPembayaran[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: DEMO_IURAN };
  }

  try {
    const { data, error } = await supabase
      .from('iuran_pembayaran')
      .select('*, anggota:anggota_id(*)')
      .order('tanggal_bayar', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (err: any) {
    console.error('Error fetching iuran:', err);
    return { data: DEMO_IURAN, error: err.message };
  }
}

export async function fetchPengumumanList(): Promise<{ data: Pengumuman[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: DEMO_PENGUMUMAN };
  }

  try {
    const { data, error } = await supabase
      .from('pengumuman')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('tanggal', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (err: any) {
    console.error('Error fetching pengumuman:', err);
    return { data: DEMO_PENGUMUMAN, error: err.message };
  }
}

export async function fetchPengaturan(): Promise<{ data: PengaturanOrganisasi; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: DEFAULT_PENGATURAN };
  }

  try {
    const { data, error } = await supabase
      .from('pengaturan_organisasi')
      .select('*')
      .eq('id', 'utama')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: data || DEFAULT_PENGATURAN };
  } catch (err: any) {
    console.error('Error fetching pengaturan:', err);
    return { data: DEFAULT_PENGATURAN, error: err.message };
  }
}

// ---------------- REKAP & KALKULASI INTEGRITAS KEUANGAN ----------------
// Perhitungan saldo kas berpedoman ketat pada:
// 1. Saldo Kas Aktif = Total Pemasukan Aktif - Total Pengeluaran Aktif
// 2. Transaksi yang berstatus 'dibatalkan' TIDAK BOLEH dihitung ke dalam saldo
// 3. Iuran yang tersinkron ke transaksi_kas memiliki referensi_iuran_id agar tidak dobel hitung
export function calculateRekapSummary(
  transaksi: TransaksiKas[],
  iuran: IuranPembayaran[],
  anggota: Anggota[],
  currentMonth: number = new Date().getMonth() + 1,
  currentYear: number = new Date().getFullYear()
): RekapKeuanganSummary {
  // Hanya hitung transaksi aktif
  const activeTransaksi = transaksi.filter(t => t.status === 'aktif');
  
  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  let totalIuranTerkumpul = 0;

  activeTransaksi.forEach(t => {
    const nominal = Number(t.nominal) || 0;
    if (t.tipe === 'pemasukan') {
      totalPemasukan += nominal;
      if (t.kategori === 'iuran') {
        totalIuranTerkumpul += nominal;
      }
    } else if (t.tipe === 'pengeluaran') {
      totalPengeluaran += nominal;
    }
  });

  // Jika transaksi iuran belum ter-input di transaksi kas (misal saat migrasi),
  // hitung iuran lunas aktif
  const activeLunasIuran = iuran.filter(i => i.status === 'lunas');
  const iuranLunasNominal = activeLunasIuran.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  
  // Gunakan yang paling akurat
  if (totalIuranTerkumpul === 0 && iuranLunasNominal > 0) {
    totalIuranTerkumpul = iuranLunasNominal;
  }

  const saldoKasAktif = totalPemasukan - totalPengeluaran;
  const activeAnggota = anggota.filter(a => a.status_aktif);

  // Kepatuhan iuran bulan ini
  const lunasBulanIni = activeLunasIuran.filter(i => 
    i.periode_bulan === currentMonth && i.periode_tahun === currentYear
  );
  const distinctAnggotaLunasBulanIni = new Set(lunasBulanIni.map(i => i.anggota_id)).size;
  const kepatuhan = activeAnggota.length > 0 
    ? Math.round((distinctAnggotaLunasBulanIni / activeAnggota.length) * 100) 
    : 0;

  return {
    total_pemasukan: totalPemasukan,
    total_pengeluaran: totalPengeluaran,
    saldo_kas_aktif: saldoKasAktif,
    total_iuran_terkumpul: totalIuranTerkumpul,
    total_anggota_aktif: activeAnggota.length,
    total_transaksi_aktif: activeTransaksi.length,
    kepatuhan_bulan_ini: kepatuhan
  };
}

// Rekap Matriks Iuran per Anggota untuk Tahun Tertentu
export function calculateAnggotaIuranRekap(
  anggotaList: Anggota[],
  iuranList: IuranPembayaran[],
  tahun: number
): AnggotaIuranRekap[] {
  return anggotaList.map(anggota => {
    const targetBulanan = Number(anggota.target_iuran_bulanan) || 50000;
    const targetTahunan = targetBulanan * 12;

    const statusBulan: { [bulan: number]: 'lunas' | 'belum' | 'dibatalkan' } = {};
    for (let m = 1; m <= 12; m++) {
      statusBulan[m] = 'belum';
    }

    let totalDibayar = 0;
    let jumlahBulanLunas = 0;

    // Filter iuran anggota ini untuk tahun terpilih
    const iuranAnggota = iuranList.filter(
      i => i.anggota_id === anggota.id && i.periode_tahun === tahun
    );

    iuranAnggota.forEach(item => {
      if (item.status === 'lunas') {
        statusBulan[item.periode_bulan] = 'lunas';
        totalDibayar += Number(item.nominal) || 0;
        jumlahBulanLunas += 1;
      } else if (item.status === 'dibatalkan') {
        if (statusBulan[item.periode_bulan] !== 'lunas') {
          statusBulan[item.periode_bulan] = 'dibatalkan';
        }
      }
    });

    const sisaKekurangan = Math.max(0, targetTahunan - totalDibayar);

    return {
      anggota,
      totalDibayar,
      targetTahunan,
      sisaKekurangan,
      statusBulan,
      jumlahBulanLunas
    };
  });
}

// ---------------- REALTIME SUBSCRIPTION ----------------
export function subscribeToKeuanganChanges(onUpdate: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel('remako-keuangan-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transaksi_kas' }, () => {
      onUpdate();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'iuran_pembayaran' }, () => {
      onUpdate();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'anggota' }, () => {
      onUpdate();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pengumuman' }, () => {
      onUpdate();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pengaturan_organisasi' }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------- ADMIN WRITE OPERATIONS ----------------

// Catat Iuran Anggota: Menyimpan ke iuran_pembayaran dan otomatis mencatat ke transaksi_kas (tanpa dobel)
export async function recordIuranPayment(payload: {
  anggota_id: string;
  nama_anggota: string;
  periode_bulan: number;
  periode_tahun: number;
  nominal: number;
  tanggal_bayar: string;
  metode_pembayaran: string;
  catatan?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Supabase belum terhubung.' };
  }

  try {
    // 1. Simpan pembayaran iuran
    const { data: iuranData, error: iuranErr } = await supabase
      .from('iuran_pembayaran')
      .insert({
        anggota_id: payload.anggota_id,
        periode_bulan: payload.periode_bulan,
        periode_tahun: payload.periode_tahun,
        nominal: payload.nominal,
        tanggal_bayar: payload.tanggal_bayar,
        metode_pembayaran: payload.metode_pembayaran,
        status: 'lunas',
        catatan: payload.catatan || null
      })
      .select()
      .single();

    if (iuranErr) throw iuranErr;

    // 2. Cek apakah trigger SQL sudah membuat transaksi_kas
    const { data: checkTrx } = await supabase
      .from('transaksi_kas')
      .select('id')
      .eq('referensi_iuran_id', iuranData.id)
      .maybeSingle();

    // Jika trigger belum aktif di database Supabase user, buat transaksi_kas secara terprogram agar saldo tetap sinkron
    if (!checkTrx) {
      const bulanNama = NAMA_BULAN[payload.periode_bulan - 1] || `Bulan ${payload.periode_bulan}`;
      await supabase.from('transaksi_kas').insert({
        tipe: 'pemasukan',
        kategori: 'iuran',
        nominal: payload.nominal,
        tanggal: payload.tanggal_bayar,
        keterangan: `Iuran ${bulanNama} ${payload.periode_tahun} - ${payload.nama_anggota}`,
        sumber_penerima: payload.nama_anggota,
        referensi_iuran_id: iuranData.id,
        status: 'aktif',
        metode_pembayaran: payload.metode_pembayaran
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error record iuran:', err);
    return { success: false, error: err.message };
  }
}

// Batalkan Pembayaran Iuran: status diubah jadi 'dibatalkan', dan transaksi kas terkait dinonaktifkan
export async function cancelIuranPayment(iuranId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Supabase belum terhubung.' };
  }

  try {
    const { error: iuranErr } = await supabase
      .from('iuran_pembayaran')
      .update({ status: 'dibatalkan' })
      .eq('id', iuranId);

    if (iuranErr) throw iuranErr;

    // Update transaksi kas terkait jika trigger belum menangani
    await supabase
      .from('transaksi_kas')
      .update({ status: 'dibatalkan' })
      .eq('referensi_iuran_id', iuranId);

    return { success: true };
  } catch (err: any) {
    console.error('Error cancel iuran:', err);
    return { success: false, error: err.message };
  }
}

// Tambah Transaksi Kas Umum (Pemasukan lain seperti Donasi/Sponsor atau Pengeluaran Operasional)
export async function addTransaksiKas(payload: {
  tipe: 'pemasukan' | 'pengeluaran';
  kategori: string;
  nominal: number;
  tanggal: string;
  keterangan: string;
  sumber_penerima?: string;
  metode_pembayaran?: string;
}): Promise<{ success: boolean; error?: string }> {
  const newTrx: TransaksiKas = {
    id: 'trx_' + Date.now(),
    tipe: payload.tipe,
    kategori: payload.kategori as KategoriTransaksi,
    nominal: payload.nominal,
    tanggal: payload.tanggal,
    keterangan: payload.keterangan,
    sumber_penerima: payload.sumber_penerima || null,
    referensi_iuran_id: null,
    status: 'aktif',
    metode_pembayaran: payload.metode_pembayaran || 'Transfer Bank',
    created_at: new Date().toISOString()
  };

  const supabase = getSupabase();
  if (!supabase) {
    DEMO_TRANSAKSI.unshift(newTrx);
    return { success: true };
  }

  try {
    const { data, error } = await supabase.from('transaksi_kas').insert({
      tipe: payload.tipe,
      kategori: payload.kategori,
      nominal: payload.nominal,
      tanggal: payload.tanggal,
      keterangan: payload.keterangan,
      sumber_penerima: payload.sumber_penerima || null,
      referensi_iuran_id: null,
      status: 'aktif',
      metode_pembayaran: payload.metode_pembayaran || 'Transfer Bank'
    }).select().maybeSingle();

    if (error) throw error;
    if (data) {
      DEMO_TRANSAKSI.unshift(data);
    } else {
      DEMO_TRANSAKSI.unshift(newTrx);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error add transaksi:', err);
    return { success: false, error: err.message };
  }
}

// Batalkan Transaksi Kas Umum
export async function cancelTransaksiKas(transaksiId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  // Update in-memory fallback
  const idx = DEMO_TRANSAKSI.findIndex(t => t.id === transaksiId);
  if (idx !== -1) {
    DEMO_TRANSAKSI[idx].status = 'dibatalkan';
  }

  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('transaksi_kas')
      .update({ status: 'dibatalkan' })
      .eq('id', transaksiId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error cancel transaksi:', err);
    return { success: false, error: err.message };
  }
}

// Tambah Anggota Baru
export async function addAnggota(payload: {
  nama: string;
  nomor_telepon?: string;
  jabatan: string;
  target_iuran_bulanan: number;
  catatan?: string;
}): Promise<{ success: boolean; error?: string }> {
  const newAnggota: Anggota = {
    id: 'ang_' + Date.now(),
    nama: payload.nama,
    nomor_telepon: payload.nomor_telepon || null,
    jabatan: payload.jabatan as any,
    target_iuran_bulanan: payload.target_iuran_bulanan,
    tanggal_bergabung: new Date().toISOString().split('T')[0],
    status_aktif: true,
    catatan: payload.catatan || null
  };

  const supabase = getSupabase();
  if (!supabase) {
    DEMO_ANGGOTA.push(newAnggota);
    return { success: true };
  }

  try {
    const { data, error } = await supabase.from('anggota').insert({
      nama: payload.nama,
      nomor_telepon: payload.nomor_telepon || null,
      jabatan: payload.jabatan,
      target_iuran_bulanan: payload.target_iuran_bulanan,
      tanggal_bergabung: new Date().toISOString().split('T')[0],
      status_aktif: true,
      catatan: payload.catatan || null
    }).select().maybeSingle();

    if (error) throw error;
    if (data) {
      DEMO_ANGGOTA.push(data);
    } else {
      DEMO_ANGGOTA.push(newAnggota);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error add anggota:', err);
    return { success: false, error: err.message };
  }
}

// Ubah Status Aktif Anggota
export async function toggleStatusAnggota(id: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> {
  const idx = DEMO_ANGGOTA.findIndex(a => a.id === id);
  if (idx !== -1) {
    DEMO_ANGGOTA[idx].status_aktif = !currentStatus;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('anggota')
      .update({ status_aktif: !currentStatus })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error update anggota:', err);
    return { success: false, error: err.message };
  }
}

// Tambah Pengumuman
export async function addPengumuman(payload: {
  judul: string;
  isi: string;
  penulis: string;
  is_pinned: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const newPengumuman: Pengumuman = {
    id: 'peng_' + Date.now(),
    judul: payload.judul,
    isi: payload.isi,
    penulis: payload.penulis,
    is_pinned: payload.is_pinned,
    tanggal: new Date().toISOString().split('T')[0],
    status_aktif: true
  };

  const supabase = getSupabase();
  if (!supabase) {
    if (payload.is_pinned) {
      DEMO_PENGUMUMAN.unshift(newPengumuman);
    } else {
      DEMO_PENGUMUMAN.push(newPengumuman);
    }
    return { success: true };
  }

  try {
    const { data, error } = await supabase.from('pengumuman').insert({
      judul: payload.judul,
      isi: payload.isi,
      penulis: payload.penulis,
      is_pinned: payload.is_pinned,
      tanggal: new Date().toISOString().split('T')[0],
      status_aktif: true
    }).select().maybeSingle();

    if (error) throw error;
    if (data) {
      DEMO_PENGUMUMAN.unshift(data);
    } else {
      DEMO_PENGUMUMAN.unshift(newPengumuman);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error add pengumuman:', err);
    return { success: false, error: err.message };
  }
}

// Perbarui Transaksi Kas (Edit Pemasukan & Pengeluaran)
export async function updateTransaksiKas(id: string, payload: Partial<TransaksiKas>): Promise<{ success: boolean; error?: string }> {
  // Update in-memory fallback
  const idx = DEMO_TRANSAKSI.findIndex(t => t.id === id);
  if (idx !== -1) {
    DEMO_TRANSAKSI[idx] = { ...DEMO_TRANSAKSI[idx], ...payload };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('transaksi_kas')
      .update({
        tipe: payload.tipe,
        kategori: payload.kategori,
        nominal: payload.nominal,
        tanggal: payload.tanggal,
        keterangan: payload.keterangan,
        sumber_penerima: payload.sumber_penerima || null,
        metode_pembayaran: payload.metode_pembayaran
      })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error update transaksi:', err);
    return { success: false, error: err.message };
  }
}

// Hapus Permanen Transaksi Kas
export async function deleteTransaksiKas(id: string): Promise<{ success: boolean; error?: string }> {
  // Update in-memory fallback
  const idx = DEMO_TRANSAKSI.findIndex(t => t.id === id);
  if (idx !== -1) {
    DEMO_TRANSAKSI.splice(idx, 1);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('transaksi_kas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error delete transaksi:', err);
    return { success: false, error: err.message };
  }
}

// Perbarui Data Anggota (Edit Nama, Jabatan, Nomor Telepon, Target Iuran)
export async function updateAnggota(id: string, payload: Partial<Anggota>): Promise<{ success: boolean; error?: string }> {
  // Update in-memory fallback
  const idx = DEMO_ANGGOTA.findIndex(a => a.id === id);
  if (idx !== -1) {
    DEMO_ANGGOTA[idx] = { ...DEMO_ANGGOTA[idx], ...payload };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('anggota')
      .update({
        nama: payload.nama,
        nomor_telepon: payload.nomor_telepon || null,
        jabatan: payload.jabatan,
        target_iuran_bulanan: payload.target_iuran_bulanan,
        catatan: payload.catatan || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error update anggota:', err);
    return { success: false, error: err.message };
  }
}

// Hapus Anggota (Hapus dari Daftar & Database)
export async function deleteAnggota(id: string): Promise<{ success: boolean; error?: string }> {
  // Update in-memory fallback
  const idx = DEMO_ANGGOTA.findIndex(a => a.id === id);
  if (idx !== -1) {
    DEMO_ANGGOTA.splice(idx, 1);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('anggota')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error delete anggota:', err);
    return { success: false, error: err.message };
  }
}

// Perbarui Pengumuman (Edit Judul, Isi, Penulis, Pinned)
export async function updatePengumuman(id: string, payload: Partial<Pengumuman>): Promise<{ success: boolean; error?: string }> {
  // Update in-memory fallback
  const idx = DEMO_PENGUMUMAN.findIndex(p => p.id === id);
  if (idx !== -1) {
    DEMO_PENGUMUMAN[idx] = { ...DEMO_PENGUMUMAN[idx], ...payload };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('pengumuman')
      .update({
        judul: payload.judul,
        isi: payload.isi,
        penulis: payload.penulis,
        is_pinned: payload.is_pinned,
        tanggal: payload.tanggal || new Date().toISOString().split('T')[0]
      })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error update pengumuman:', err);
    return { success: false, error: err.message };
  }
}

// Hapus Pengumuman (Hapus dari Pengumuman & Agenda Organisasi)
export async function deletePengumuman(id: string): Promise<{ success: boolean; error?: string }> {
  // Update in-memory fallback
  const idx = DEMO_PENGUMUMAN.findIndex(p => p.id === id);
  if (idx !== -1) {
    DEMO_PENGUMUMAN.splice(idx, 1);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('pengumuman')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error delete pengumuman:', err);
    return { success: false, error: err.message };
  }
}

// Perbarui Pengaturan Organisasi
export async function updatePengaturanOrganisasi(payload: Partial<PengaturanOrganisasi>): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    Object.assign(DEFAULT_PENGATURAN, payload);
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('pengaturan_organisasi')
      .upsert({
        id: 'utama',
        ...payload,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error update pengaturan:', err);
    return { success: false, error: err.message };
  }
}
