export type JabatanType = 'Ketua' | 'Sekretaris' | 'Bendahara' | 'Pengurus' | 'Anggota';

export type StatusIuranType = 'lunas' | 'pending' | 'dibatalkan';

export type TipeTransaksi = 'pemasukan' | 'pengeluaran';

export type KategoriTransaksi = 
  | 'iuran' 
  | 'donasi' 
  | 'usaha' 
  | 'kegiatan' 
  | 'operasional' 
  | 'konsumsi' 
  | 'sosial' 
  | 'lainnya';

export type MetodePembayaran = 'Transfer Bank' | 'QRIS' | 'Tunai' | 'Lainnya';

export interface Anggota {
  id: string;
  nama: string;
  nomor_telepon?: string | null;
  jabatan: JabatanType | string;
  target_iuran_bulanan: number;
  tanggal_bergabung: string;
  status_aktif: boolean;
  catatan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IuranPembayaran {
  id: string;
  anggota_id: string;
  periode_bulan: number; // 1-12
  periode_tahun: number;
  nominal: number;
  tanggal_bayar: string;
  metode_pembayaran: MetodePembayaran;
  nomor_bukti?: string | null;
  status: StatusIuranType;
  catatan?: string | null;
  created_at?: string;
  created_by?: string | null;
  anggota?: Anggota;
}

export interface TransaksiKas {
  id: string;
  tipe: TipeTransaksi;
  kategori: KategoriTransaksi;
  nominal: number;
  tanggal: string;
  keterangan: string;
  sumber_penerima?: string | null;
  referensi_iuran_id?: string | null;
  status: 'aktif' | 'dibatalkan';
  metode_pembayaran?: MetodePembayaran | string;
  created_at?: string;
  created_by?: string | null;
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  tanggal: string;
  penulis: string;
  is_pinned: boolean;
  status_aktif: boolean;
  created_at?: string;
  created_by?: string | null;
}

export interface PengaturanOrganisasi {
  id: string;
  nama_organisasi: string;
  target_iuran_bulanan: number;
  nomor_rekening: string;
  qris_keterangan: string;
  kontak_bendahara: string;
  pesan_sambutan: string;
  updated_at?: string;
}

export interface RekapKeuanganSummary {
  total_pemasukan: number;
  total_pengeluaran: number;
  saldo_kas_aktif: number;
  total_iuran_terkumpul: number;
  total_anggota_aktif: number;
  total_transaksi_aktif: number;
  kepatuhan_bulan_ini: number; // persentase 0-100
}

export interface AnggotaIuranRekap {
  anggota: Anggota;
  totalDibayar: number;
  targetTahunan: number;
  sisaKekurangan: number;
  statusBulan: { [bulan: number]: 'lunas' | 'belum' | 'dibatalkan' };
  jumlahBulanLunas: number;
}
