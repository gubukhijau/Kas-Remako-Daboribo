import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Check, 
  X, 
  ChevronRight,
  Info,
  ShieldCheck,
  Receipt,
  Edit3,
  Trash2,
  UserPlus,
  Save
} from 'lucide-react';
import { Anggota, IuranPembayaran, AnggotaIuranRekap } from '../types/database';
import { calculateAnggotaIuranRekap, formatRupiah, NAMA_BULAN } from '../lib/supabaseService';

interface IuranMatrixViewProps {
  anggotaList: Anggota[];
  iuranList: IuranPembayaran[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  isAdmin: boolean;
  onOpenRecordIuran?: (anggotaId?: string) => void;
  onCancelIuran?: (iuranId: string) => void;
  onOpenAddAnggota?: () => void;
  onUpdateAnggota?: (id: string, payload: Partial<Anggota>) => Promise<any> | void;
  onDeleteAnggota?: (id: string, nama: string) => Promise<any> | void;
}

export const IuranMatrixView: React.FC<IuranMatrixViewProps> = ({
  anggotaList,
  iuranList,
  selectedYear,
  setSelectedYear,
  availableYears,
  isAdmin,
  onOpenRecordIuran,
  onCancelIuran,
  onOpenAddAnggota,
  onUpdateAnggota,
  onDeleteAnggota
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'lunas' | 'kurang'>('semua');
  const [selectedAnggotaDetail, setSelectedAnggotaDetail] = useState<Anggota | null>(null);

  // Edit states for Anggota
  const [editingAnggota, setEditingAnggota] = useState<Anggota | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editTelepon, setEditTelepon] = useState('');
  const [editJabatan, setEditJabatan] = useState('Anggota');
  const [editTargetIuran, setEditTargetIuran] = useState(50000);
  const [editCatatan, setEditCatatan] = useState('');
  const [isSavingAnggota, setIsSavingAnggota] = useState(false);

  const handleStartEditAnggota = (ang: Anggota) => {
    setEditingAnggota(ang);
    setEditNama(ang.nama);
    setEditTelepon(ang.nomor_telepon || '');
    setEditJabatan(ang.jabatan);
    setEditTargetIuran(ang.target_iuran_bulanan || 50000);
    setEditCatatan(ang.catatan || '');
  };

  const handleSaveEditAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnggota || !onUpdateAnggota) return;
    setIsSavingAnggota(true);
    await onUpdateAnggota(editingAnggota.id, {
      nama: editNama.trim(),
      nomor_telepon: editTelepon.trim() || undefined,
      jabatan: editJabatan as any,
      target_iuran_bulanan: Number(editTargetIuran),
      catatan: editCatatan.trim() || undefined
    });
    setIsSavingAnggota(false);
    setEditingAnggota(null);
  };

  // Kalkulasi rekap matriks iuran
  const rekapData: AnggotaIuranRekap[] = useMemo(() => {
    return calculateAnggotaIuranRekap(anggotaList, iuranList, selectedYear);
  }, [anggotaList, iuranList, selectedYear]);

  // Filter berdasarkan pencarian dan status
  const filteredRekap = useMemo(() => {
    return rekapData.filter(item => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.anggota.nama.toLowerCase().includes(query);
        const matchesJabatan = item.anggota.jabatan.toLowerCase().includes(query);
        if (!matchesName && !matchesJabatan) return false;
      }

      // Filter status
      if (filterStatus === 'lunas' && item.sisaKekurangan > 0) return false;
      if (filterStatus === 'kurang' && item.sisaKekurangan === 0) return false;

      return true;
    });
  }, [rekapData, searchTerm, filterStatus]);

  // Statistik Keseluruhan
  const stats = useMemo(() => {
    const totalWajib = rekapData.reduce((acc, c) => acc + c.targetTahunan, 0);
    const totalTerkumpul = rekapData.reduce((acc, c) => acc + c.totalDibayar, 0);
    const totalKurang = Math.max(0, totalWajib - totalTerkumpul);
    const totalLunasPenuh = rekapData.filter(c => c.sisaKekurangan === 0).length;

    return { totalWajib, totalTerkumpul, totalKurang, totalLunasPenuh };
  }, [rekapData]);

  // Riwayat pembayaran untuk anggota terpilih
  const riwayatAnggota = useMemo(() => {
    if (!selectedAnggotaDetail) return [];
    return iuranList.filter(i => 
      i.anggota_id === selectedAnggotaDetail.id && 
      i.periode_tahun === selectedYear
    );
  }, [selectedAnggotaDetail, iuranList, selectedYear]);

  return (
    <div className="space-y-4">
      {/* Overview Banner for Iuran */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Rekapitulasi Iuran Kas Anggota</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Tahun {selectedYear}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Setiap anggota dapat melihat status pelunasan 12 bulan dan rincian kekurangan secara transparan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Tahun {yr}</option>
              ))}
            </select>

            {isAdmin && onOpenRecordIuran && (
              <button
                onClick={() => onOpenRecordIuran()}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
              >
                + Catat Iuran
              </button>
            )}
          </div>
        </div>

        {/* 3 Metrics Mini Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Total Iuran Terkumpul ({selectedYear})</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {formatRupiah(stats.totalTerkumpul)}
            </span>
          </div>
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Total Tunggakan / Kekurangan</span>
            <span className="text-lg font-bold text-rose-400 font-mono">
              {formatRupiah(stats.totalKurang)}
            </span>
          </div>
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Anggota Lunas Setahun Penuh</span>
            <span className="text-lg font-bold text-teal-400">
              {stats.totalLunasPenuh} dari {rekapData.length} Anggota
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama anggota atau jabatan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === 'semua'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Semua ({rekapData.length})
            </button>
            <button
              onClick={() => setFilterStatus('lunas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === 'lunas'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Lunas ({stats.totalLunasPenuh})
            </button>
            <button
              onClick={() => setFilterStatus('kurang')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === 'kurang'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Ada Tunggakan ({rekapData.length - stats.totalLunasPenuh})
            </button>
            {isAdmin && onOpenAddAnggota && (
              <button
                onClick={onOpenAddAnggota}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition whitespace-nowrap ml-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Anggota</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Keterangan Status:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Lunas
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Belum Bayar
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Dibatalkan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4 min-w-[180px]">Nama Anggota</th>
                <th className="py-3 px-2 text-center" title="Januari">Jan</th>
                <th className="py-3 px-2 text-center" title="Februari">Feb</th>
                <th className="py-3 px-2 text-center" title="Maret">Mar</th>
                <th className="py-3 px-2 text-center" title="April">Apr</th>
                <th className="py-3 px-2 text-center" title="Mei">Mei</th>
                <th className="py-3 px-2 text-center" title="Juni">Jun</th>
                <th className="py-3 px-2 text-center" title="Juli">Jul</th>
                <th className="py-3 px-2 text-center" title="Agustus">Ags</th>
                <th className="py-3 px-2 text-center" title="September">Sep</th>
                <th className="py-3 px-2 text-center" title="Oktober">Okt</th>
                <th className="py-3 px-2 text-center" title="November">Nov</th>
                <th className="py-3 px-2 text-center" title="Desember">Des</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-right">Sisa Kurang</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredRekap.map((item) => {
                const isLunasPenuh = item.sisaKekurangan === 0;

                return (
                  <tr key={item.anggota.id} className="hover:bg-slate-800/30 transition">
                    {/* Nama & Jabatan */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">
                        {item.anggota.nama}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-slate-700">
                          {item.anggota.jabatan}
                        </span>
                        <span>• {item.jumlahBulanLunas}/12 Bln</span>
                      </div>
                    </td>

                    {/* 12 Bulan Status Indicator */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                      const st = item.statusBulan[m];
                      return (
                        <td key={m} className="py-3 px-1.5 text-center">
                          {st === 'lunas' ? (
                            <span 
                              title={`Bulan ${NAMA_BULAN[m-1]}: LUNAS`}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold"
                            >
                              ✓
                            </span>
                          ) : st === 'dibatalkan' ? (
                            <span 
                              title={`Bulan ${NAMA_BULAN[m-1]}: DIBATALKAN`}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]"
                            >
                              ✕
                            </span>
                          ) : (
                            <span 
                              title={`Bulan ${NAMA_BULAN[m-1]}: BELUM BAYAR`}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-800/80 text-slate-500 border border-slate-700 text-[10px]"
                            >
                              -
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Terbayar */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                      {formatRupiah(item.totalDibayar)}
                    </td>

                    {/* Sisa Kekurangan */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                      {item.sisaKekurangan === 0 ? (
                        <span className="text-slate-500">Rp0</span>
                      ) : (
                        <span className="text-rose-400">{formatRupiah(item.sisaKekurangan)}</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isLunasPenuh ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Lunas Penuh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                          <Clock className="w-3 h-3" />
                          Kurang {item.sisaKekurangan / (item.anggota.target_iuran_bulanan || 50000)} Bln
                        </span>
                      )}
                    </td>

                    {/* Action: Detail, Edit & Hapus Anggota */}
                    <td className="py-3.5 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedAnggotaDetail(item.anggota)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Lihat riwayat rincian pembayaran"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleStartEditAnggota(item.anggota)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition"
                              title="Edit Data Anggota"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus anggota "${item.anggota.nama}" dari database? Seluruh histori iuran terkait akan ikut terhapus.`)) {
                                  onDeleteAnggota?.(item.anggota.id, item.anggota.nama);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                              title="Hapus Anggota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal / Drawer */}
      {selectedAnggotaDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <span>Riwayat Iuran: {selectedAnggotaDetail.nama}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedAnggotaDetail.jabatan} • Tahun {selectedYear}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnggotaDetail(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Riwayat */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {riwayatAnggota.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Belum ada catatan pembayaran iuran untuk tahun {selectedYear}.
                </div>
              ) : (
                riwayatAnggota.map(item => (
                  <div 
                    key={item.id} 
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white text-sm">
                        Bulan {NAMA_BULAN[item.periode_bulan - 1]} {item.periode_tahun}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.tanggal_bayar} • Metode: <span className="text-teal-300">{item.metode_pembayaran}</span>
                      </p>
                      {item.catatan && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          "{item.catatan}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold text-sm ${item.status === 'lunas' ? 'text-emerald-400' : 'text-slate-500 line-through'}`}>
                        {formatRupiah(item.nominal)}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        item.status === 'lunas' 
                          ? 'bg-emerald-950 text-emerald-300' 
                          : 'bg-rose-950 text-rose-300'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                      {isAdmin && item.status === 'lunas' && onCancelIuran && (
                        <button
                          onClick={() => {
                            if (confirm('Batalkan pembayaran iuran ini? Saldo kas akan otomatis disesuaikan.')) {
                              onCancelIuran(item.id);
                              setSelectedAnggotaDetail(null);
                            }
                          }}
                          className="block text-[10px] text-rose-400 hover:underline mt-1 ml-auto"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Target: {formatRupiah(selectedAnggotaDetail.target_iuran_bulanan || 50000)} / bulan
              </span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        const ang = selectedAnggotaDetail;
                        setSelectedAnggotaDetail(null);
                        handleStartEditAnggota(ang);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Edit Anggota</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus anggota "${selectedAnggotaDetail.nama}"?`)) {
                          onDeleteAnggota?.(selectedAnggotaDetail.id, selectedAnggotaDetail.nama);
                          setSelectedAnggotaDetail(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedAnggotaDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Data Anggota */}
      {editingAnggota && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Edit Data Anggota</span>
              </h4>
              <button
                onClick={() => setEditingAnggota(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAnggota} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Jabatan:</label>
                  <select
                    value={editJabatan}
                    onChange={(e) => setEditJabatan(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Anggota">Anggota</option>
                    <option value="Ketua">Ketua</option>
                    <option value="Sekretaris">Sekretaris</option>
                    <option value="Bendahara">Bendahara</option>
                    <option value="Pengurus">Pengurus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Iuran (Rp):</label>
                  <input
                    type="number"
                    value={editTargetIuran}
                    onChange={(e) => setEditTargetIuran(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">No. WhatsApp/Telepon:</label>
                <input
                  type="text"
                  value={editTelepon}
                  onChange={(e) => setEditTelepon(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Catatan Tambahan:</label>
                <input
                  type="text"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  placeholder="Keterangan opsional"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAnggota(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingAnggota}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingAnggota ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
