import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Terminal, 
  Globe2, 
  AlertTriangle,
  Play,
  RefreshCw,
  Server
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  setCustomSupabaseConfig, 
  clearCustomSupabaseConfig, 
  testSupabaseConnection, 
  ConnectionTestResult,
  SupabaseConfigInfo
} from '../lib/supabase';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfigInfo;
  onConfigUpdated: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'tester' | 'sql' | 'env' | 'vercel'>('tester');
  const [inputUrl, setInputUrl] = useState(config.url || '');
  const [inputKey, setInputKey] = useState(config.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Jalankan pengujian koneksi ke Supabase
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(inputUrl, inputKey);
    setTestResult(result);
    setTesting(false);

    if (result.connected) {
      // Simpan konfigurasi
      setCustomSupabaseConfig(inputUrl, inputKey);
      onConfigUpdated();
    }
  };

  const handleResetConfig = () => {
    clearCustomSupabaseConfig();
    setInputUrl('');
    setInputKey('');
    setTestResult(null);
    onConfigUpdated();
  };

  const sqlMigrationCode = `-- ============================================================================
-- SQL MIGRATION RESMI: KEUANGAN REMAKO DABORIBO
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL ADMIN ROLES
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'bendahara', 'ketua')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
    OR (auth.jwt() ->> 'email' = 'cs.sapalewa@gmail.com');
$$;

-- Otomatis masukkan cs.sapalewa@gmail.com ke admin_roles
CREATE OR REPLACE FUNCTION public.handle_admin_auth_user()
RETURNS trigger AS $$
BEGIN
    IF NEW.email = 'cs.sapalewa@gmail.com' THEN
        INSERT INTO public.admin_roles (user_id, email, role)
        VALUES (NEW.id, NEW.email, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_admin_auth_user ON auth.users;
CREATE TRIGGER trg_admin_auth_user
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_auth_user();

-- 2. TABEL ANGGOTA
CREATE TABLE IF NOT EXISTS public.anggota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    nomor_telepon TEXT,
    jabatan TEXT NOT NULL DEFAULT 'Anggota',
    target_iuran_bulanan NUMERIC(12, 2) NOT NULL DEFAULT 50000 CHECK (target_iuran_bulanan >= 0),
    tanggal_bergabung DATE NOT NULL DEFAULT CURRENT_DATE,
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABEL IURAN PEMBAYARAN
CREATE TABLE IF NOT EXISTS public.iuran_pembayaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anggota_id UUID NOT NULL REFERENCES public.anggota(id) ON DELETE CASCADE,
    periode_bulan INT NOT NULL CHECK (periode_bulan BETWEEN 1 AND 12),
    periode_tahun INT NOT NULL CHECK (periode_tahun >= 2020),
    nominal NUMERIC(12, 2) NOT NULL CHECK (nominal > 0),
    tanggal_bayar DATE NOT NULL DEFAULT CURRENT_DATE,
    metode_pembayaran TEXT NOT NULL DEFAULT 'Transfer Bank' CHECK (metode_pembayaran IN ('Transfer Bank', 'QRIS', 'Tunai', 'Lainnya')),
    nomor_bukti TEXT,
    status TEXT NOT NULL DEFAULT 'lunas' CHECK (status IN ('lunas', 'pending', 'dibatalkan')),
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. TABEL TRANSAKSI KAS
CREATE TABLE IF NOT EXISTS public.transaksi_kas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipe TEXT NOT NULL CHECK (tipe IN ('pemasukan', 'pengeluaran')),
    kategori TEXT NOT NULL CHECK (kategori IN ('iuran', 'donasi', 'usaha', 'kegiatan', 'operasional', 'konsumsi', 'sosial', 'lainnya')),
    nominal NUMERIC(12, 2) NOT NULL CHECK (nominal > 0),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    keterangan TEXT NOT NULL,
    sumber_penerima TEXT,
    referensi_iuran_id UUID REFERENCES public.iuran_pembayaran(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'dibatalkan')),
    metode_pembayaran TEXT NOT NULL DEFAULT 'Transfer Bank',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5. TABEL PENGUMUMAN
CREATE TABLE IF NOT EXISTS public.pengumuman (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    isi TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    penulis TEXT NOT NULL DEFAULT 'Pengurus Remako Daboribo',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABEL PENGATURAN ORGANISASI
CREATE TABLE IF NOT EXISTS public.pengaturan_organisasi (
    id TEXT PRIMARY KEY DEFAULT 'utama',
    nama_organisasi TEXT NOT NULL DEFAULT 'Remako Daboribo',
    target_iuran_bulanan NUMERIC(12, 2) NOT NULL DEFAULT 50000,
    nomor_rekening TEXT NOT NULL DEFAULT 'BCA 1234567890 a.n Remako Daboribo',
    qris_keterangan TEXT NOT NULL DEFAULT 'Scan QRIS Kas Remako Daboribo',
    kontak_bendahara TEXT NOT NULL DEFAULT '0812-3456-7890 (Bendahara Remako)',
    pesan_sambutan TEXT NOT NULL DEFAULT 'Portal Transparansi Kas & Iuran Anggota Remako Daboribo',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TRIGGER INTEGRITAS SINKRONISASI IURAN DENGAN KAS
CREATE OR REPLACE FUNCTION public.fn_sync_iuran_to_transaksi()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_nama_anggota TEXT;
    v_bulan_nama TEXT;
BEGIN
    v_bulan_nama := CASE NEW.periode_bulan
        WHEN 1 THEN 'Januari' WHEN 2 THEN 'Februari' WHEN 3 THEN 'Maret'
        WHEN 4 THEN 'April' WHEN 5 THEN 'Mei' WHEN 6 THEN 'Juni'
        WHEN 7 THEN 'Juli' WHEN 8 THEN 'Agustus' WHEN 9 THEN 'September'
        WHEN 10 THEN 'Oktober' WHEN 11 THEN 'November' WHEN 12 THEN 'Desember'
        ELSE 'Bulan ' || NEW.periode_bulan
    END;

    SELECT nama INTO v_nama_anggota FROM public.anggota WHERE id = NEW.anggota_id;
    IF v_nama_anggota IS NULL THEN v_nama_anggota := 'Anggota'; END IF;

    IF TG_OP = 'INSERT' AND NEW.status = 'lunas' THEN
        INSERT INTO public.transaksi_kas (
            tipe, kategori, nominal, tanggal, keterangan, sumber_penerima,
            referensi_iuran_id, status, metode_pembayaran
        ) VALUES (
            'pemasukan', 'iuran', NEW.nominal, NEW.tanggal_bayar,
            'Iuran ' || v_bulan_nama || ' ' || NEW.periode_tahun || ' - ' || v_nama_anggota,
            v_nama_anggota, NEW.id, 'aktif', NEW.metode_pembayaran
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'dibatalkan' THEN
            UPDATE public.transaksi_kas SET status = 'dibatalkan' WHERE referensi_iuran_id = NEW.id;
        ELSIF NEW.status = 'lunas' THEN
            UPDATE public.transaksi_kas SET status = 'aktif', nominal = NEW.nominal WHERE referensi_iuran_id = NEW.id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM public.transaksi_kas WHERE referensi_iuran_id = OLD.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_iuran_transaksi ON public.iuran_pembayaran;
CREATE TRIGGER trg_sync_iuran_transaksi
AFTER INSERT OR UPDATE OR DELETE ON public.iuran_pembayaran
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_iuran_to_transaksi();

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iuran_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_kas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan_organisasi ENABLE ROW LEVEL SECURITY;

-- Publik Read-Only Policies
CREATE POLICY "Public can view active anggota" ON public.anggota FOR SELECT USING (true);
CREATE POLICY "Public can view iuran" ON public.iuran_pembayaran FOR SELECT USING (true);
CREATE POLICY "Public can view active transaksi" ON public.transaksi_kas FOR SELECT USING (status = 'aktif' OR public.is_admin());
CREATE POLICY "Public can view pengumuman" ON public.pengumuman FOR SELECT USING (status_aktif = true OR public.is_admin());
CREATE POLICY "Public can read settings" ON public.pengaturan_organisasi FOR SELECT USING (true);

-- Admin Write Policies (Diverifikasi di level Database)
CREATE POLICY "Admin write anggota" ON public.anggota FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write iuran" ON public.iuran_pembayaran FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write transaksi" ON public.transaksi_kas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write pengumuman" ON public.pengumuman FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write settings" ON public.pengaturan_organisasi FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9. REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.transaksi_kas, public.iuran_pembayaran, public.anggota, public.pengumuman;`;

  const envSnippet = `# File: .env (di root project)
VITE_SUPABASE_URL="${inputUrl || 'https://xyzcompany.supabase.co'}"
VITE_SUPABASE_ANON_KEY="${inputKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}"`;

  const copyToClipboard = (text: string, type: 'sql' | 'env') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSQL(true);
      setTimeout(() => setCopiedSQL(false), 2000);
    } else {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Integrasi Supabase & Panduan Database
              </h3>
              <p className="text-xs text-slate-400">
                Hubungkan database online agar seluruh anggota melihat data keuangan yang sama.
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

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 shrink-0">
          <button
            onClick={() => setActiveTab('tester')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'tester'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Uji & Simpan Koneksi
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            📜 SQL Migration & RLS
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'env'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🔑 Environment Variables
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'vercel'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🚀 Panduan Deploy Vercel
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: TESTER & CREDENTIALS */}
          {activeTab === 'tester' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>Masukkan Kredensial Supabase Anda</span>
                  </h4>
                  {config.isConfigured && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Tersimpan ({config.source === 'env' ? '.env' : 'Browser Config'})
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Supabase Project URL:
                    </label>
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Didapatkan dari Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Supabase Anon / Public Key:
                    </label>
                    <textarea
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      rows={2}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Kunci publik aman untuk browser (dilindungi oleh Row Level Security). Jangan gunakan <code className="text-rose-400">service_role</code>!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing || !inputUrl || !inputKey}
                    className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow transition flex items-center justify-center gap-2"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menguji Koneksi ke Database...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Uji Koneksi & Simpan</span>
                      </>
                    )}
                  </button>

                  {config.isConfigured && (
                    <button
                      onClick={handleResetConfig}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                    >
                      Reset Kredensial
                    </button>
                  )}
                </div>
              </div>

              {/* Hasil Uji Koneksi */}
              {testResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 ${
                    testResult.connected
                      ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
                      : 'bg-rose-950/70 border-rose-600 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.connected ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>KONEKSI BERHASIL! (Latensi: {testResult.latencyMs} ms)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                        <span>KONEKSI GAGAL ATAU TABEL BELUM LENGKAP</span>
                      </>
                    )}
                  </div>

                  <p className="leading-relaxed">{testResult.message}</p>

                  {testResult.tablesFound && testResult.tablesFound.length > 0 && (
                    <div className="text-xs pt-1">
                      <span className="font-semibold">Tabel terdeteksi: </span>
                      <span className="font-mono text-emerald-300">
                        {testResult.tablesFound.join(', ')}
                      </span>
                    </div>
                  )}

                  {testResult.missingTables && testResult.missingTables.length > 0 && (
                    <div className="p-3 bg-rose-900/40 rounded-xl border border-rose-800/80 text-xs text-rose-200 space-y-1">
                      <p className="font-bold">Tabel berikut belum ditemukan di Supabase Anda:</p>
                      <p className="font-mono">{testResult.missingTables.join(', ')}</p>
                      <p className="pt-1">
                        👉 Klik tab <strong>"📜 SQL Migration & RLS"</strong> di atas, salin kodenya, dan jalankan di SQL Editor Supabase Anda!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Ringkasan Status Database */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 space-y-2">
                <h5 className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Jaminan Sinkronisasi Antar-Anggota:</span>
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Semua perangkat (HP, laptop, browser lain, mode Incognito) terhubung ke database Supabase yang sama.</li>
                  <li>Realtime Replication aktif: saat bendahara mencatat iuran, saldo kas dan status pelunasan terupdate seketika.</li>
                  <li>Integritas kas: pembayaran iuran otomatis tersinkron ke buku kas tanpa penghitungan dobel.</li>
                  <li>Pembayaran yang dibatalkan tidak lagi dihitung dalam saldo aktif.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: SQL MIGRATION */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Skrip SQL Lengkap (Tabel, RLS, Views, & Trigger)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Buka Supabase Dashboard &gt; <strong>SQL Editor</strong> &gt; Buat New Query &gt; Tempel (Paste) &gt; Klik <strong>Run</strong>.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(sqlMigrationCode, 'sql')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shrink-0"
                >
                  {copiedSQL ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>SQL Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Semua SQL (1-Click)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed select-all">
                  {sqlMigrationCode}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/40 text-xs text-teal-300">
                ✅ Skrip ini aman dijalankan ulang (idempotent dengan <code className="font-mono">CREATE TABLE IF NOT EXISTS</code> dan <code className="font-mono">ON CONFLICT DO NOTHING</code>) sehingga tidak akan menghapus data yang sudah ada sebelumnya.
              </div>
            </div>
          )}

          {/* TAB 3: ENVIRONMENT VARIABLES */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Konfigurasi File .env
                </h4>
                <p className="text-xs text-slate-400">
                  Simpan variabel berikut pada file <code className="text-emerald-400 font-mono">.env</code> di root direktori project Anda.
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {envSnippet}
                </pre>
                <button
                  onClick={() => copyToClipboard(envSnippet, 'env')}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Salin isi .env"
                >
                  {copiedEnv ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
                <h5 className="font-bold text-white">Aturan Keamanan:</h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Gunakan hanya <strong>anon / public key</strong> untuk frontend.</li>
                  <li>Jangan pernah mempublikasikan <code className="text-rose-400 font-mono">service_role key</code> ke repo atau kode yang dikirim ke browser!</li>
                  <li>Keamanan data seluruh anggota dijaga langsung oleh Row Level Security (RLS) PostgreSQL di server Supabase.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: DEPLOY VERCEL */}
          {activeTab === 'vercel' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <h4 className="font-bold text-white text-base">
                Langkah Deploy ke Vercel agar Database Tetap Berfungsi:
              </h4>

              <ol className="list-decimal pl-5 space-y-3 text-slate-300">
                <li className="leading-relaxed">
                  <strong>Push Kode ke Repository GitHub / GitLab</strong>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pastikan file <code className="font-mono text-emerald-400">.env</code> tidak ikut di-commit (sudah ada di .gitignore).
                  </p>
                </li>

                <li className="leading-relaxed">
                  <strong>Import Project di Vercel Dashboard</strong>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Buka vercel.com &gt; Add New Project &gt; Import repositori Keuangan Remako Daboribo.
                  </p>
                </li>

                <li className="leading-relaxed">
                  <strong>Isi Environment Variables di Vercel (Wajib!)</strong>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pada menu <strong>Environment Variables</strong> di Vercel, tambahkan dua kunci:
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-400 mt-1 border border-slate-800 space-y-1">
                    <p>Key: <strong>VITE_SUPABASE_URL</strong></p>
                    <p>Value: <em>URL project Supabase Anda</em></p>
                    <div className="border-t border-slate-800 my-1"></div>
                    <p>Key: <strong>VITE_SUPABASE_ANON_KEY</strong></p>
                    <p>Value: <em>Anon public key Supabase Anda</em></p>
                  </div>
                </li>

                <li className="leading-relaxed">
                  <strong>Deploy & Uji Antarperangkat</strong>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Setelah build sukses, buka link Vercel di browser HP, komputer lain, atau Incognito. Semua anggota akan langsung melihat rekap kas yang sama secara real-time!
                  </p>
                </li>
              </ol>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
                🎉 Aplikasi ini dibangun dengan Vite SPA modern sehingga kompatibel 100% dengan hosting serverless Vercel, Netlify, maupun Cloud Run.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Sistem Keuangan Remako Daboribo • Supabase PostgreSQL Engine
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
