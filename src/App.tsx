import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ConnectionBanner } from './components/ConnectionBanner';
import { StatCards } from './components/StatCards';
import { TransaksiView } from './components/TransaksiView';
import { IuranMatrixView } from './components/IuranMatrixView';
import { LaporanView } from './components/LaporanView';
import { PengumumanView } from './components/PengumumanView';
import { AdminModal } from './components/AdminModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { 
  getSupabase,
  getSupabaseConfig, 
  testSupabaseConnection, 
  SupabaseConfigInfo 
} from './lib/supabase';
import {
  fetchAnggotaList,
  fetchTransaksiKasList,
  fetchIuranList,
  fetchPengumumanList,
  fetchPengaturan,
  subscribeToKeuanganChanges,
  calculateRekapSummary,
  cancelIuranPayment,
  cancelTransaksiKas,
  updateTransaksiKas,
  deleteTransaksiKas,
  updatePengumuman,
  deletePengumuman,
  updateAnggota,
  deleteAnggota,
  DEFAULT_PENGATURAN
} from './lib/supabaseService';
import { 
  Anggota, 
  TransaksiKas, 
  IuranPembayaran, 
  Pengumuman, 
  PengaturanOrganisasi 
} from './types/database';
import { AlertCircle, RefreshCw, Sparkles, Heart } from 'lucide-react';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'transaksi' | 'iuran' | 'laporan' | 'pengumuman'>('ringkasan');
  
  // Date filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  // Supabase connection & config
  const [config, setConfig] = useState<SupabaseConfigInfo>(getSupabaseConfig());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [preselectedAnggotaId, setPreselectedAnggotaId] = useState<string | undefined>(undefined);

  // Data states
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [transaksiList, setTransaksiList] = useState<TransaksiKas[]>([]);
  const [iuranList, setIuranList] = useState<IuranPembayaran[]>([]);
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [pengaturan, setPengaturan] = useState<PengaturanOrganisasi>(DEFAULT_PENGATURAN);
  
  // Loading & refresh
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load all data from Supabase
  const loadData = useCallback(async (showRefreshingSpinner: boolean = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    setConnectionError(null);

    try {
      const [angRes, trxRes, iuranRes, pengRes, setRes] = await Promise.all([
        fetchAnggotaList(),
        fetchTransaksiKasList(),
        fetchIuranList(),
        fetchPengumumanList(),
        fetchPengaturan()
      ]);

      if (angRes.data) setAnggotaList(angRes.data);
      if (trxRes.data) setTransaksiList(trxRes.data);
      if (iuranRes.data) setIuranList(iuranRes.data);
      if (pengRes.data) setPengumumanList(pengRes.data);
      if (setRes.data) setPengaturan(setRes.data);

      if (angRes.error || trxRes.error) {
        setConnectionError(angRes.error || trxRes.error || 'Terjadi gangguan saat memuat data');
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setConnectionError(err.message || 'Gagal memuat data keuangan');
    } finally {
      setIsLoading(false);
      if (showRefreshingSpinner) setIsRefreshing(false);
    }
  }, []);

  // Check connection status
  const checkConnection = useCallback(async () => {
    const curConfig = getSupabaseConfig();
    setConfig(curConfig);

    if (curConfig.isConfigured) {
      const test = await testSupabaseConnection();
      setIsConnected(test.connected);
      setLatencyMs(test.latencyMs);
      if (!test.connected) {
        setConnectionError(test.message);
      }
    } else {
      setIsConnected(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    checkConnection();
    loadData();
  }, [checkConnection, loadData]);

  // Supabase Auth session listener (Persists login for cs.sapalewa@gmail.com)
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAdmin(true);
        setAdminEmail(session.user.email || 'cs.sapalewa@gmail.com');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAdmin(true);
        setAdminEmail(session.user.email || 'cs.sapalewa@gmail.com');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [config]);

  // Realtime subscription & background polling
  useEffect(() => {
    const unsubscribe = subscribeToKeuanganChanges(() => {
      // Trigger update when any table changes
      loadData(false);
    });
    setIsRealtimeActive(true);

    // Background interval check every 45s
    const interval = setInterval(() => {
      loadData(false);
    }, 45000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      setIsRealtimeActive(false);
    };
  }, [loadData]);

  // Summary calculations
  const summary = useMemo(() => {
    const curMonth = selectedMonth === 'all' ? (new Date().getMonth() + 1) : selectedMonth;
    return calculateRekapSummary(
      transaksiList,
      iuranList,
      anggotaList,
      curMonth,
      selectedYear
    );
  }, [transaksiList, iuranList, anggotaList, selectedMonth, selectedYear]);

  // Handler cancel iuran
  const handleCancelIuran = async (iuranId: string) => {
    const res = await cancelIuranPayment(iuranId);
    if (res.success) {
      loadData(true);
    } else {
      alert('Gagal membatalkan iuran: ' + res.error);
    }
  };

  // Handler cancel transaksi
  const handleCancelTransaksi = async (transaksiId: string) => {
    const res = await cancelTransaksiKas(transaksiId);
    if (res.success) {
      loadData(true);
    } else {
      alert('Gagal membatalkan transaksi: ' + res.error);
    }
  };

  // Handler update transaksi
  const handleUpdateTransaksi = async (id: string, payload: Partial<TransaksiKas>) => {
    const res = await updateTransaksiKas(id, payload);
    if (res.success) {
      loadData(true);
    } else {
      alert('Gagal memperbarui transaksi: ' + res.error);
    }
  };

  // Handler delete transaksi
  const handleDeleteTransaksi = async (id: string) => {
    const res = await deleteTransaksiKas(id);
    if (res.success) {
      loadData(true);
    } else {
      alert('Gagal menghapus transaksi: ' + res.error);
    }
  };

  // Handler update pengumuman
  const handleUpdatePengumuman = async (id: string, payload: Partial<Pengumuman>) => {
    const res = await updatePengumuman(id, payload);
    if (res.success) {
      loadData(true);
    } else {
      alert('Gagal memperbarui pengumuman: ' + res.error);
    }
  };

  // Handler delete pengumuman
  const handleDeletePengumuman = async (id: string) => {
    const res = await deletePengumuman(id);
    if (res.success) {
      loadData(true);
    } else {
      alert('Gagal menghapus pengumuman: ' + res.error);
    }
  };

  // Handler update anggota
  const handleUpdateAnggota = async (id: string, payload: Partial<Anggota>) => {
    const res = await updateAnggota(id, payload);
    if (res.success) {
      loadData(true);
    } else {
      alert('Gagal memperbarui data anggota: ' + res.error);
    }
  };

  // Handler delete anggota
  const handleDeleteAnggota = async (id: string, _nama: string) => {
    const res = await deleteAnggota(id);
    if (res.success) {
      loadData(true);
    } else {
      alert('Gagal menghapus anggota: ' + res.error);
    }
  };

  // Open record iuran for specific member
  const handleOpenRecordIuran = (anggotaId?: string) => {
    setPreselectedAnggotaId(anggotaId);
    setIsAdminModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Navbar with tabs and status */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        isConnected={isConnected}
        isRealtimeActive={isRealtimeActive}
        isAdmin={isAdmin}
        adminEmail={adminEmail}
        onOpenAdminModal={() => {
          setPreselectedAnggotaId(undefined);
          setIsAdminModalOpen(true);
        }}
        onOpenSetupModal={() => setIsSetupModalOpen(true)}
        onRefreshData={() => loadData(true)}
        isRefreshing={isRefreshing}
        onAdminLogout={() => setIsAdmin(false)}
        orgName={pengaturan.nama_organisasi}
      />

      {/* Supabase Status Banner (Hanya terlihat saat admin login) */}
      {isAdmin && (
        <ConnectionBanner
          config={config}
          isConnected={isConnected}
          onOpenSetup={() => setIsSetupModalOpen(true)}
          latencyMs={latencyMs}
        />
      )}

      {/* Error alert if any (Hanya terlihat saat admin login) */}
      {isAdmin && connectionError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-xs sm:text-sm text-rose-200 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{connectionError}</span>
            </div>
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
            >
              Cek SQL & Kredensial
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TAB 1: RINGKASAN KAS */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <StatCards
              summary={summary}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              availableYears={availableYears}
            />

            {/* Quick Preview: 5 Transaksi Terbaru & Matriks Iuran Ringkas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 5 Transaksi Terakhir */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>Mutasi Kas Terkini</span>
                    <span className="text-xs text-slate-400 font-normal">
                      (5 Transaksi Terakhir)
                    </span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('transaksi')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
                  >
                    Buka Buku Kas &rarr;
                  </button>
                </div>

                <div className="space-y-2">
                  {transaksiList.slice(0, 5).map(t => (
                    <div 
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-white">{t.keterangan}</p>
                        <p className="text-[11px] text-slate-400">
                          {t.tanggal} • <span className="capitalize text-teal-300">{t.kategori}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${t.tipe === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.tipe === 'pemasukan' ? '+' : '-'} {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.nominal)}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {t.sumber_penerima || '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Iuran Ringkas */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    Status Iuran Anggota
                  </h3>
                  <button
                    onClick={() => setActiveTab('iuran')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
                  >
                    Lihat Matriks 12 Bulan &rarr;
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {anggotaList.slice(0, 6).map(ang => {
                    const lunasCount = iuranList.filter(i => 
                      i.anggota_id === ang.id && 
                      i.periode_tahun === selectedYear && 
                      i.status === 'lunas'
                    ).length;

                    return (
                      <div 
                        key={ang.id} 
                        className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{ang.nama}</p>
                          <p className="text-[11px] text-slate-400">{ang.jabatan}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            lunasCount >= 10 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {lunasCount}/12 Bln Lunas
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Rekening Kas & Pengumuman Singkat */}
            <PengumumanView
              pengumumanList={pengumumanList.slice(0, 2)}
              pengaturan={pengaturan}
              isAdmin={isAdmin}
              onOpenAddPengumuman={() => {
                setIsAdminModalOpen(true);
              }}
              onUpdatePengumuman={handleUpdatePengumuman}
              onDeletePengumuman={handleDeletePengumuman}
            />
          </div>
        )}

        {/* TAB 2: TRANSAKSI KAS */}
        {activeTab === 'transaksi' && (
          <div className="animate-fadeIn">
            <TransaksiView
              transaksiList={transaksiList}
              isAdmin={isAdmin}
              onCancelTransaksi={handleCancelTransaksi}
              onUpdateTransaksi={handleUpdateTransaksi}
              onDeleteTransaksi={handleDeleteTransaksi}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          </div>
        )}

        {/* TAB 3: IURAN ANGGOTA */}
        {activeTab === 'iuran' && (
          <div className="animate-fadeIn">
            <IuranMatrixView
              anggotaList={anggotaList}
              iuranList={iuranList}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              availableYears={availableYears}
              isAdmin={isAdmin}
              onOpenRecordIuran={handleOpenRecordIuran}
              onCancelIuran={handleCancelIuran}
              onOpenAddAnggota={() => setIsAdminModalOpen(true)}
              onUpdateAnggota={handleUpdateAnggota}
              onDeleteAnggota={handleDeleteAnggota}
            />
          </div>
        )}

        {/* TAB 4: LAPORAN KEUANGAN */}
        {activeTab === 'laporan' && (
          <div className="animate-fadeIn">
            <LaporanView
              transaksiList={transaksiList}
              iuranList={iuranList}
              anggotaList={anggotaList}
              pengaturan={pengaturan}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              availableYears={availableYears}
            />
          </div>
        )}

        {/* TAB 5: PENGUMUMAN & SALURAN KAS */}
        {activeTab === 'pengumuman' && (
          <div className="animate-fadeIn">
            <PengumumanView
              pengumumanList={pengumumanList}
              pengaturan={pengaturan}
              isAdmin={isAdmin}
              onOpenAddPengumuman={() => setIsAdminModalOpen(true)}
              onUpdatePengumuman={handleUpdatePengumuman}
              onDeletePengumuman={handleDeletePengumuman}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-8 px-4 text-center space-y-2 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">{pengaturan.nama_organisasi}</span>
            <span>•</span>
            <span>Sistem Informasi Keuangan Online</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsSetupModalOpen(true)}
                  className="hover:text-emerald-400 transition underline underline-offset-2"
                >
                  Status Supabase & SQL
                </button>
                <span>•</span>
              </>
            )}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="hover:text-emerald-400 transition underline underline-offset-2"
            >
              {isAdmin ? 'Panel Pengurus' : 'Login Bendahara'}
            </button>
          </div>
        </div>

        {isAdmin && (
          <p className="text-[11px] text-slate-600 pt-2">
            Seluruh data mutasi kas, saldo, dan status iuran tersinkronisasi secara real-time melalui database PostgreSQL Supabase dengan Row Level Security (RLS).
          </p>
        )}
      </footer>

      {/* Admin Management Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        adminEmail={adminEmail}
        setAdminEmail={setAdminEmail}
        anggotaList={anggotaList}
        transaksiList={transaksiList}
        pengumumanList={pengumumanList}
        pengaturan={pengaturan}
        onRefreshData={() => loadData(true)}
        initialAnggotaId={preselectedAnggotaId}
      />

      {/* Setup Guide & Database Config Modal */}
      <SetupGuideModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        config={config}
        onConfigUpdated={() => {
          checkConnection();
          loadData(true);
        }}
      />

    </div>
  );
}
