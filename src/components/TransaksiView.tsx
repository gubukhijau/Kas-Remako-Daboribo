import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileSpreadsheet,
  Edit3,
  Trash2,
  X,
  Save,
  Ban
} from 'lucide-react';
import { TransaksiKas, TipeTransaksi, KategoriTransaksi } from '../types/database';
import { formatRupiah, NAMA_BULAN } from '../lib/supabaseService';

interface TransaksiViewProps {
  transaksiList: TransaksiKas[];
  isAdmin: boolean;
  onCancelTransaksi?: (id: string) => void;
  onUpdateTransaksi?: (id: string, payload: Partial<TransaksiKas>) => void;
  onDeleteTransaksi?: (id: string) => void;
  selectedYear: number;
  selectedMonth: number | 'all';
}

export const TransaksiView: React.FC<TransaksiViewProps> = ({
  transaksiList,
  isAdmin,
  onCancelTransaksi,
  onUpdateTransaksi,
  onDeleteTransaksi,
  selectedYear,
  selectedMonth
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipe, setFilterTipe] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');
  const [filterKategori, setFilterKategori] = useState<string>('semua');

  // Edit State
  const [editingItem, setEditingItem] = useState<TransaksiKas | null>(null);
  const [editTipe, setEditTipe] = useState<TipeTransaksi>('pengeluaran');
  const [editKategori, setEditKategori] = useState<string>('operasional');
  const [editNominal, setEditNominal] = useState<number>(0);
  const [editTanggal, setEditTanggal] = useState<string>('');
  const [editKeterangan, setEditKeterangan] = useState<string>('');
  const [editSumber, setEditSumber] = useState<string>('');
  const [editMetode, setEditMetode] = useState<string>('Transfer Bank');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Filter transaksi berdasarkan kriteria
  const filteredTransaksi = useMemo(() => {
    return transaksiList.filter(item => {
      const itemDate = new Date(item.tanggal);
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth() + 1;

      // Filter tahun
      if (selectedYear && itemYear !== selectedYear) return false;

      // Filter bulan
      if (selectedMonth !== 'all' && itemMonth !== selectedMonth) return false;

      // Filter tipe
      if (filterTipe !== 'semua' && item.tipe !== filterTipe) return false;

      // Filter kategori
      if (filterKategori !== 'semua' && item.kategori !== filterKategori) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = item.keterangan.toLowerCase().includes(query);
        const matchesSource = item.sumber_penerima?.toLowerCase().includes(query);
        const matchesCat = item.kategori.toLowerCase().includes(query);
        if (!matchesDesc && !matchesSource && !matchesCat) return false;
      }

      return true;
    });
  }, [transaksiList, selectedYear, selectedMonth, filterTipe, filterKategori, searchTerm]);

  // Hitung total dari hasil filter
  const { totalPemasukan, totalPengeluaran } = useMemo(() => {
    let pem = 0;
    let peng = 0;
    filteredTransaksi.forEach(t => {
      if (t.status === 'aktif') {
        const nom = Number(t.nominal) || 0;
        if (t.tipe === 'pemasukan') pem += nom;
        if (t.tipe === 'pengeluaran') peng += nom;
      }
    });
    return { totalPemasukan: pem, totalPengeluaran: peng };
  }, [filteredTransaksi]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Sumber/Penerima', 'Metode', 'Nominal (Rp)', 'Status'];
    const rows = filteredTransaksi.map(t => [
      t.id,
      t.tanggal,
      t.tipe.toUpperCase(),
      t.kategori,
      `"${t.keterangan.replace(/"/g, '""')}"`,
      `"${(t.sumber_penerima || '-').replace(/"/g, '""')}"`,
      t.metode_pembayaran || '-',
      t.nominal,
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Buku_Kas_Remako_Daboribo_${selectedYear}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEdit = (item: TransaksiKas) => {
    setEditingItem(item);
    setEditTipe(item.tipe);
    setEditKategori(item.kategori);
    setEditNominal(Number(item.nominal) || 0);
    setEditTanggal(item.tanggal);
    setEditKeterangan(item.keterangan);
    setEditSumber(item.sumber_penerima || '');
    setEditMetode(item.metode_pembayaran || 'Transfer Bank');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !onUpdateTransaksi) return;
    setIsSaving(true);
    await onUpdateTransaksi(editingItem.id, {
      tipe: editTipe,
      kategori: editKategori as KategoriTransaksi,
      nominal: Number(editNominal),
      tanggal: editTanggal,
      keterangan: editKeterangan,
      sumber_penerima: editSumber,
      metode_pembayaran: editMetode
    });
    setIsSaving(false);
    setEditingItem(null);
  };

  const getKategoriBadgeColor = (kategori: string) => {
    switch (kategori) {
      case 'iuran': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'donasi': return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'kegiatan': return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'operasional': return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'konsumsi': return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      case 'sosial': return 'bg-pink-500/10 text-pink-300 border-pink-500/30';
      default: return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Buku Kas & Riwayat Mutasi</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredTransaksi.length} Catatan
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Catatan mutasi pemasukan dan pengeluaran kas transparan untuk seluruh anggota.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition"
              title="Unduh data dalam format CSV/Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari transaksi, keterangan, atau nama..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Tipe */}
          <div className="sm:col-span-3">
            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="semua">Semua Tipe (Masuk & Keluar)</option>
              <option value="pemasukan">Hanya Pemasukan (+)</option>
              <option value="pengeluaran">Hanya Pengeluaran (-)</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div className="sm:col-span-4">
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="semua">Semua Kategori</option>
              <option value="iuran">Iuran Anggota</option>
              <option value="donasi">Donasi / Sumbangan</option>
              <option value="kegiatan">Kegiatan Organisasi</option>
              <option value="operasional">Operasional & ATK</option>
              <option value="konsumsi">Konsumsi Rapat</option>
              <option value="sosial">Bantuan Sosial</option>
              <option value="usaha">Usaha / Kas Lain</option>
            </select>
          </div>
        </div>

        {/* Small Summary Pill */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
          <span className="text-slate-400">Total Filter:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            + {formatRupiah(totalPemasukan)}
          </span>
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            - {formatRupiah(totalPengeluaran)}
          </span>
          <span className="text-slate-400">
            Net: <strong className="text-white">{formatRupiah(totalPemasukan - totalPengeluaran)}</strong>
          </span>
        </div>
      </div>

      {/* Table & Cards List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredTransaksi.length === 0 ? (
          <div className="text-center py-12 px-4">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-300">Belum Ada Transaksi</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Tidak ada catatan mutasi kas yang sesuai dengan filter atau kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Sumber / Penerima</th>
                  <th className="py-3.5 px-4 text-right">Nominal</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {isAdmin && <th className="py-3.5 px-4 text-center">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredTransaksi.map((item) => {
                  const isPemasukan = item.tipe === 'pemasukan';
                  const isCancelled = item.status === 'dibatalkan';

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-800/40 transition ${
                        isCancelled ? 'opacity-50 line-through bg-slate-950/30' : ''
                      }`}
                    >
                      {/* Tanggal */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                        {item.tanggal}
                      </td>

                      {/* Keterangan */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          {isPemasukan ? (
                            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-md bg-rose-500/10 text-rose-400 shrink-0">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                            {item.keterangan}
                          </span>
                        </div>
                        {item.referensi_iuran_id && (
                          <span className="text-[10px] text-teal-400/90 ml-6 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Tersinkron Iuran Anggota Resmi
                          </span>
                        )}
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getKategoriBadgeColor(item.kategori)}`}>
                          {item.kategori}
                        </span>
                      </td>

                      {/* Sumber / Penerima */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                        {item.sumber_penerima || '-'}
                        {item.metode_pembayaran && (
                          <span className="text-[10px] block text-slate-500 font-mono">
                            {item.metode_pembayaran}
                          </span>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className={`py-3.5 px-4 whitespace-nowrap text-right font-bold font-mono ${
                        isCancelled 
                          ? 'text-slate-500 line-through' 
                          : isPemasukan 
                            ? 'text-emerald-400' 
                            : 'text-rose-400'
                      }`}>
                        {isPemasukan ? '+' : '-'} {formatRupiah(item.nominal)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/50">
                            <XCircle className="w-3 h-3" />
                            Dibatalkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        )}
                      </td>

                      {/* Admin Actions: Edit & Hapus / Batalkan */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Tombol Edit */}
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition"
                              title="Edit Transaksi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Batalkan (Jika aktif) */}
                            {!isCancelled && onCancelTransaksi && (
                              <button
                                onClick={() => {
                                  if (confirm(`Batalkan transaksi "${item.keterangan}" (${formatRupiah(item.nominal)})? Nominal tidak akan dihitung di saldo kas aktif.`)) {
                                    onCancelTransaksi(item.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/60 text-slate-400 hover:text-amber-400 transition"
                                title="Batalkan Transaksi (Status Dibatalkan)"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tombol Hapus Permanen */}
                            {onDeleteTransaksi && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus permanen transaksi "${item.keterangan}" (${formatRupiah(item.nominal)}) dari database? Tindakan ini tidak dapat dibatalkan.`)) {
                                    onDeleteTransaksi(item.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                                title="Hapus Permanen Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Transaksi Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Edit Catatan Mutasi Kas</span>
              </h4>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipe Mutasi:</label>
                  <select
                    value={editTipe}
                    onChange={(e) => setEditTipe(e.target.value as TipeTransaksi)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="pengeluaran">Pengeluaran (-)</option>
                    <option value="pemasukan">Pemasukan (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Kategori:</label>
                  <select
                    value={editKategori}
                    onChange={(e) => setEditKategori(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white capitalize"
                  >
                    <option value="iuran">Iuran Anggota</option>
                    <option value="donasi">Donasi / Sumbangan</option>
                    <option value="kegiatan">Kegiatan Organisasi</option>
                    <option value="operasional">Operasional & ATK</option>
                    <option value="konsumsi">Konsumsi Rapat</option>
                    <option value="sosial">Bantuan Sosial</option>
                    <option value="usaha">Usaha / Kas Lain</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nominal (Rp):</label>
                  <input
                    type="number"
                    value={editNominal}
                    onChange={(e) => setEditNominal(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tanggal:</label>
                  <input
                    type="date"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Keterangan:</label>
                <input
                  type="text"
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sumber / Penerima:</label>
                  <input
                    type="text"
                    value={editSumber}
                    onChange={(e) => setEditSumber(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Metode:</label>
                  <select
                    value={editMetode}
                    onChange={(e) => setEditMetode(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai">Tunai Kas</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
