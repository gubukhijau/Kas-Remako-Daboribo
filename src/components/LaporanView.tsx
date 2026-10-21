import React, { useMemo, useState } from 'react';
import { 
  Printer, 
  Download, 
  FileCheck, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Building2,
  PieChart,
  BarChart3
} from 'lucide-react';
import { TransaksiKas, IuranPembayaran, Anggota, PengaturanOrganisasi } from '../types/database';
import { formatRupiah, NAMA_BULAN } from '../lib/supabaseService';

interface LaporanViewProps {
  transaksiList: TransaksiKas[];
  iuranList: IuranPembayaran[];
  anggotaList: Anggota[];
  pengaturan: PengaturanOrganisasi;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  transaksiList,
  iuranList,
  anggotaList,
  pengaturan,
  selectedYear,
  setSelectedYear,
  availableYears
}) => {
  const [laporanPeriode, setLaporanPeriode] = useState<'tahunan' | number>('tahunan');

  // Filter transaksi aktif untuk tahun terpilih
  const transaksiTahun = useMemo(() => {
    return transaksiList.filter(t => {
      if (t.status !== 'aktif') return false;
      const d = new Date(t.tanggal);
      if (d.getFullYear() !== selectedYear) return false;
      if (laporanPeriode !== 'tahunan' && (d.getMonth() + 1) !== laporanPeriode) return false;
      return true;
    });
  }, [transaksiList, selectedYear, laporanPeriode]);

  // Breakdown Pemasukan berdasarkan kategori
  const breakdownPemasukan = useMemo(() => {
    const map: { [cat: string]: number } = {};
    let total = 0;
    transaksiTahun.filter(t => t.tipe === 'pemasukan').forEach(t => {
      const nom = Number(t.nominal) || 0;
      map[t.kategori] = (map[t.kategori] || 0) + nom;
      total += nom;
    });
    return { map, total };
  }, [transaksiTahun]);

  // Breakdown Pengeluaran berdasarkan kategori
  const breakdownPengeluaran = useMemo(() => {
    const map: { [cat: string]: number } = {};
    let total = 0;
    transaksiTahun.filter(t => t.tipe === 'pengeluaran').forEach(t => {
      const nom = Number(t.nominal) || 0;
      map[t.kategori] = (map[t.kategori] || 0) + nom;
      total += nom;
    });
    return { map, total };
  }, [transaksiTahun]);

  const saldoBersihPeriode = breakdownPemasukan.total - breakdownPengeluaran.total;

  // Breakdown Bulanan untuk tahun terpilih (1-12)
  const monthlyFlow = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      bulan: i + 1,
      nama: NAMA_BULAN[i],
      pemasukan: 0,
      pengeluaran: 0,
      net: 0
    }));

    transaksiList
      .filter(t => t.status === 'aktif' && new Date(t.tanggal).getFullYear() === selectedYear)
      .forEach(t => {
        const m = new Date(t.tanggal).getMonth();
        const nom = Number(t.nominal) || 0;
        if (t.tipe === 'pemasukan') months[m].pemasukan += nom;
        if (t.tipe === 'pengeluaran') months[m].pengeluaran += nom;
      });

    months.forEach(m => {
      m.net = m.pemasukan - m.pengeluaran;
    });

    return months;
  }, [transaksiList, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls (Hidden on Print) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <span>Laporan Keuangan & Akuntabilitas Kas</span>
          </h3>
          <p className="text-xs text-slate-400">
            Dapat dicetak langsung atau disimpan ke format PDF resmi bertandatangan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-3 py-2 font-medium"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Tahun {yr}</option>
            ))}
          </select>

          {/* Period selector */}
          <select
            value={laporanPeriode}
            onChange={(e) => setLaporanPeriode(e.target.value === 'tahunan' ? 'tahunan' : Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-3 py-2 font-medium"
          >
            <option value="tahunan">Laporan 1 Tahun Penuh</option>
            {NAMA_BULAN.map((bln, idx) => (
              <option key={idx} value={idx + 1}>Bulan {bln}</option>
            ))}
          </select>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div className="bg-slate-900 print:bg-white print:text-black border border-slate-800 print:border-none rounded-2xl p-6 sm:p-10 shadow-lg space-y-8">
        
        {/* Document Header (Kop Laporan) */}
        <div className="border-b-2 border-emerald-500 pb-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 print:bg-gray-100 print:text-black font-mono text-xs uppercase font-bold tracking-widest mb-1">
              Dokumen Keuangan Resmi
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white print:text-black">
              {pengaturan.nama_organisasi}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 print:text-gray-600">
              Laporan Pertanggungjawaban Arus Kas & Rekapitulasi Iuran Anggota
            </p>
          </div>
          <div className="text-right text-xs text-slate-400 print:text-gray-600 font-mono">
            <p>Periode: <strong>{laporanPeriode === 'tahunan' ? `Tahun ${selectedYear}` : `${NAMA_BULAN[laporanPeriode - 1]} ${selectedYear}`}</strong></p>
            <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          </div>
        </div>

        {/* 3 Main Summary Figures */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-200">
            <span className="text-xs text-slate-400 print:text-gray-600 block uppercase font-semibold">Total Pemasukan</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 print:text-emerald-700">
              {formatRupiah(breakdownPemasukan.total)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-200">
            <span className="text-xs text-slate-400 print:text-gray-600 block uppercase font-semibold">Total Pengeluaran</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400 print:text-rose-700">
              {formatRupiah(breakdownPengeluaran.total)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-200">
            <span className="text-xs text-slate-400 print:text-gray-600 block uppercase font-semibold">Surplus / Defisit Kas</span>
            <span className={`text-xl sm:text-2xl font-bold font-mono ${saldoBersihPeriode >= 0 ? 'text-teal-300 print:text-teal-700' : 'text-rose-400 print:text-rose-700'}`}>
              {formatRupiah(saldoBersihPeriode)}
            </span>
          </div>
        </div>

        {/* Category Breakdown (Pemasukan vs Pengeluaran) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pemasukan Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-800 flex items-center gap-1.5 border-b border-slate-800 print:border-gray-300 pb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Rincian Pemasukan Kas</span>
            </h4>
            {Object.keys(breakdownPemasukan.map).length === 0 ? (
              <p className="text-xs text-slate-500 italic">Tidak ada catatan pemasukan pada periode ini.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(breakdownPemasukan.map).map(([kategori, nominal]) => {
                  const pct = breakdownPemasukan.total > 0 ? Math.round((nominal / breakdownPemasukan.total) * 100) : 0;
                  return (
                    <div key={kategori} className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="capitalize text-slate-300 print:text-gray-800">
                        {kategori} <span className="text-slate-500 font-mono text-xs">({pct}%)</span>
                      </div>
                      <div className="font-mono font-semibold text-emerald-400 print:text-emerald-700">
                        {formatRupiah(nominal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pengeluaran Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-rose-400 print:text-rose-800 flex items-center gap-1.5 border-b border-slate-800 print:border-gray-300 pb-2">
              <TrendingDown className="w-4 h-4" />
              <span>Rincian Pengeluaran Kas</span>
            </h4>
            {Object.keys(breakdownPengeluaran.map).length === 0 ? (
              <p className="text-xs text-slate-500 italic">Tidak ada catatan pengeluaran pada periode ini.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(breakdownPengeluaran.map).map(([kategori, nominal]) => {
                  const pct = breakdownPengeluaran.total > 0 ? Math.round((nominal / breakdownPengeluaran.total) * 100) : 0;
                  return (
                    <div key={kategori} className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="capitalize text-slate-300 print:text-gray-800">
                        {kategori} <span className="text-slate-500 font-mono text-xs">({pct}%)</span>
                      </div>
                      <div className="font-mono font-semibold text-rose-400 print:text-rose-700">
                        {formatRupiah(nominal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend Table (Annual Summary) */}
        {laporanPeriode === 'tahunan' && (
          <div className="space-y-3 pt-4 border-t border-slate-800 print:border-gray-300">
            <h4 className="text-sm font-bold text-white print:text-black flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Rekap Arus Kas Bulanan (Tahun {selectedYear})</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 print:text-black">
                <thead className="bg-slate-950/60 print:bg-gray-100 uppercase text-[10px] text-slate-400 print:text-gray-600 font-semibold border-b border-slate-800 print:border-gray-300">
                  <tr>
                    <th className="py-2.5 px-3">Bulan</th>
                    <th className="py-2.5 px-3 text-right">Pemasukan</th>
                    <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                    <th className="py-2.5 px-3 text-right">Selisih Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                  {monthlyFlow.map(m => (
                    <tr key={m.bulan} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-medium">{m.nama}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-400 print:text-emerald-700">
                        {m.pemasukan > 0 ? formatRupiah(m.pemasukan) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-400 print:text-rose-700">
                        {m.pengeluaran > 0 ? formatRupiah(m.pengeluaran) : '-'}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-semibold ${m.net >= 0 ? 'text-teal-300 print:text-teal-700' : 'text-rose-400 print:text-rose-700'}`}>
                        {formatRupiah(m.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signature placeholders for Ketua & Bendahara */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs text-slate-400 print:text-black">
          <div>
            <p className="mb-14">Mengetahui,<br /><strong>Ketua Organisasi</strong></p>
            <p className="font-bold underline text-white print:text-black">Budi Santoso</p>
            <p className="text-[10px]">Ketua Remako Daboribo</p>
          </div>
          <div>
            <p className="mb-14">Dibuat oleh,<br /><strong>Bendahara Kas</strong></p>
            <p className="font-bold underline text-white print:text-black">Siti Rahmawati</p>
            <p className="text-[10px]">Pengelola Keuangan Kas</p>
          </div>
        </div>

      </div>
    </div>
  );
};
