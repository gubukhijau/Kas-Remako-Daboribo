import React from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Globe2, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';
import { SupabaseConfigInfo } from '../lib/supabase';

interface ConnectionBannerProps {
  config: SupabaseConfigInfo;
  isConnected: boolean;
  onOpenSetup: () => void;
  latencyMs?: number;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
  config,
  isConnected,
  onOpenSetup,
  latencyMs
}) => {
  if (!isConnected) {
    return (
      <div className="bg-gradient-to-r from-amber-900/90 via-amber-800/80 to-orange-900/90 text-amber-100 border-b border-amber-600/40 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </span>
            <div>
              <p className="font-semibold text-white">
                Database Supabase Belum Terhubung (Mode Simulasi Data Lokal)
              </p>
              <p className="text-xs text-amber-200/90">
                Agar seluruh anggota melihat saldo dan rekap yang sama di perangkat masing-masing, hubungkan URL & Anon Key Supabase Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm shadow transition whitespace-nowrap"
          >
            <span>Hubungkan Supabase & SQL</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terhubung ke Database Terpusat Supabase
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 hidden sm:inline">
            URL: <code className="text-slate-300 font-mono">{config.url.replace(/^https?:\/\//, '').split('.')[0]}.supabase.co</code>
          </span>
          {latencyMs !== undefined && (
            <>
              <span className="text-slate-600 hidden md:inline">•</span>
              <span className="text-slate-400 hidden md:inline">
                Ping: <span className="text-emerald-400">{latencyMs} ms</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="flex items-center gap-1 text-teal-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Row Level Security (RLS) Aktif</span>
          </span>
          <span className="text-slate-600">•</span>
          <button
            onClick={onOpenSetup}
            className="text-slate-300 hover:text-emerald-400 underline underline-offset-2 transition"
          >
            Lihat Status Database
          </button>
        </div>
      </div>
    </div>
  );
};
