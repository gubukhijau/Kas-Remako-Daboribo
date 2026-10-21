import React from 'react';
import { 
  Building2, 
  Wallet, 
  FileText, 
  Users, 
  TrendingUp, 
  Megaphone, 
  Lock, 
  Database, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles
} from 'lucide-react';
import { SupabaseConfigInfo } from '../lib/supabase';

interface NavbarProps {
  activeTab: 'ringkasan' | 'transaksi' | 'iuran' | 'laporan' | 'pengumuman';
  setActiveTab: (tab: 'ringkasan' | 'transaksi' | 'iuran' | 'laporan' | 'pengumuman') => void;
  config: SupabaseConfigInfo;
  isConnected: boolean;
  isRealtimeActive: boolean;
  isAdmin: boolean;
  adminEmail?: string;
  onOpenAdminModal: () => void;
  onOpenSetupModal: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  onAdminLogout: () => void;
  orgName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  isConnected,
  isRealtimeActive,
  isAdmin,
  adminEmail = '',
  onOpenAdminModal,
  onOpenSetupModal,
  onRefreshData,
  isRefreshing,
  onAdminLogout,
  orgName = 'Remako Daboribo'
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Org Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-950 text-white font-black text-xl tracking-wider">
              RD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  {orgName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Keuangan Online
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden xs:block">
                Portal Transparansi Kas & Rekap Iuran Anggota
              </p>
            </div>
          </div>

          {/* Right Action Section: Status & Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Connection Indicator - Hanya tampil jika admin masuk */}
            {isAdmin && (
              <button
                onClick={onOpenSetupModal}
                title="Klik untuk melihat status koneksi Supabase & panduan database"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isConnected
                    ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-amber-950/70 border border-amber-700/60 text-amber-300 hover:bg-amber-900/60'
                }`}
              >
                {isConnected ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="hidden md:inline">Supabase Online</span>
                    <span className="md:hidden">Online</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="hidden md:inline">Setup Supabase</span>
                    <span className="md:hidden">Setup</span>
                  </>
                )}
              </button>
            )}

            {/* Manual Refresh Button - Hanya tampil jika admin masuk */}
            {isAdmin && (
              <button
                onClick={onRefreshData}
                disabled={isRefreshing}
                title="Sinkronkan data terbaru dari server Supabase"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            )}

            {/* Admin Badge or Login Button */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-emerald-900/40 border border-emerald-600/40 rounded-xl p-1 pl-2.5 text-xs text-emerald-200">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="hidden sm:inline font-mono text-[11px] text-emerald-300">
                    {adminEmail || 'Bendahara Kas'}
                  </span>
                  <span className="sm:hidden font-semibold">Admin</span>
                </span>
                <button
                  onClick={onOpenAdminModal}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium ml-1 transition shadow-sm"
                >
                  Kelola
                </button>
                <button
                  onClick={onAdminLogout}
                  title="Keluar dari akun admin"
                  className="p-1 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-950/50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium shadow-sm transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              activeTab === 'ringkasan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Ringkasan Kas</span>
          </button>

          <button
            onClick={() => setActiveTab('transaksi')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              activeTab === 'transaksi'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Buku Kas & Transaksi</span>
          </button>

          <button
            onClick={() => setActiveTab('iuran')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              activeTab === 'iuran'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rekap Iuran Anggota</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              activeTab === 'laporan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Laporan & Cetak PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('pengumuman')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              activeTab === 'pengumuman'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Info & Rekening Kas</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
