import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Users, 
  CheckCircle, 
  Calendar,
  Filter
} from 'lucide-react';
import { RekapKeuanganSummary } from '../types/database';
import { formatRupiah, NAMA_BULAN } from '../lib/supabaseService';

interface StatCardsProps {
  summary: RekapKeuanganSummary;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number | 'all';
  setSelectedMonth: (month: number | 'all') => void;
  availableYears: number[];
}

export const StatCards: React.FC<StatCardsProps> = ({
  summary,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  availableYears
}) => {
  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 sm:p-4 rounded-2xl backdrop-blur-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Ringkasan Keuangan Kas</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal border border-slate-700">
              Periode {selectedMonth === 'all' ? `Tahun ${selectedYear}` : `${NAMA_BULAN[selectedMonth - 1]} ${selectedYear}`}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Data tersinkronisasi terpusat dari database online Supabase secara transparan.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Year selector */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Tahun {yr}</option>
              ))}
            </select>
          </div>

          {/* Month selector */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="all">Semua Bulan</option>
              {NAMA_BULAN.map((bln, idx) => (
                <option key={idx} value={idx + 1}>{bln}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo Kas Bersih Aktif */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Saldo Kas Bersih
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatRupiah(summary.saldo_kas_aktif)}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">Dana Kas Riil</span> yang tersedia saat ini
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Card 2: Total Pemasukan Kas */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Total Pemasukan
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatRupiah(summary.total_pemasukan)}
            </p>
            <p className="text-xs text-slate-400">
              Iuran kas, donasi, & sumber dana masuk
            </p>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran Kas */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Total Pengeluaran
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatRupiah(summary.total_pengeluaran)}
            </p>
            <p className="text-xs text-slate-400">
              Operasional, konsumsi, kegiatan sosial
            </p>
          </div>
        </div>

        {/* Card 4: Total Iuran Terkumpul */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Iuran Terkumpul
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatRupiah(summary.total_iuran_terkumpul)}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>{summary.total_anggota_aktif} Anggota Terdaftar</span>
              <span className="text-cyan-400 font-medium">{summary.kepatuhan_bulan_ini}% Lunas Bln Ini</span>
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Progress Bar for Current Month Dues Compliance */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              Tingkat Kepatuhan Iuran Bulan Berjalan ({summary.kepatuhan_bulan_ini}%)
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Target per anggota: {formatRupiah(50000)} / bulan
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2.5 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(0, summary.kepatuhan_bulan_ini))}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
