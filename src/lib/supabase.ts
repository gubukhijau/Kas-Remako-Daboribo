import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Baca dari environment variable Vite
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// LocalStorage key untuk testing cepat di browser sebelum deploy ke Vercel
const STORAGE_URL_KEY = 'remako_supabase_url_custom';
const STORAGE_ANON_KEY = 'remako_supabase_anon_custom';

export interface SupabaseConfigInfo {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'custom' | 'none';
}

export function getSupabaseConfig(): SupabaseConfigInfo {
  // Prioritaskan env variables
  if (ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY && !ENV_SUPABASE_URL.includes('your-project')) {
    return {
      url: ENV_SUPABASE_URL.trim(),
      anonKey: ENV_SUPABASE_ANON_KEY.trim(),
      isConfigured: true,
      source: 'env'
    };
  }

  // Cek localStorage jika user memasukkan via panduan in-app
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(STORAGE_URL_KEY);
    const customKey = localStorage.getItem(STORAGE_ANON_KEY);
    if (customUrl && customKey && customUrl.startsWith('http')) {
      return {
        url: customUrl.trim(),
        anonKey: customKey.trim(),
        isConfigured: true,
        source: 'custom'
      };
    }
  }

  return {
    url: ENV_SUPABASE_URL.trim(),
    anonKey: ENV_SUPABASE_ANON_KEY.trim(),
    isConfigured: false,
    source: 'none'
  };
}

export function setCustomSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
    // Invalidate cached client
    cachedClient = null;
  }
}

export function clearCustomSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
    cachedClient = null;
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.error('[Supabase Init Error]', err);
      return null;
    }
  }

  return cachedClient;
}

export interface ConnectionTestResult {
  connected: boolean;
  message: string;
  latencyMs?: number;
  tablesFound?: string[];
  missingTables?: string[];
}

export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  let client: SupabaseClient | null = null;

  if (overrideUrl && overrideKey) {
    try {
      client = createClient(overrideUrl.trim(), overrideKey.trim(), {
        auth: { persistSession: false }
      });
    } catch (e: any) {
      return { connected: false, message: 'Format URL atau Key tidak valid: ' + e.message };
    }
  } else {
    client = getSupabase();
  }

  if (!client) {
    return {
      connected: false,
      message: 'Kredensial Supabase belum diisi. Masukkan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.'
    };
  }

  const expectedTables = ['anggota', 'transaksi_kas', 'iuran_pembayaran', 'pengumuman', 'pengaturan_organisasi'];
  const foundTables: string[] = [];
  const missingTables: string[] = [];

  try {
    // Uji koneksi ke tabel anggota
    const { data: testData, error: anggotaErr } = await client
      .from('anggota')
      .select('id, nama')
      .limit(1);

    const latency = Date.now() - startTime;

    if (anggotaErr) {
      if (anggotaErr.code === 'PGRST205' || anggotaErr.message.includes('relation "public.anggota" does not exist') || anggotaErr.message.includes('404')) {
        return {
          connected: false,
          latencyMs: latency,
          message: 'Terkoneksi ke Supabase, namun tabel belum dibuat! Silakan jalankan file SQL Migration di Supabase SQL Editor.',
          missingTables: expectedTables
        };
      }
      return {
        connected: false,
        latencyMs: latency,
        message: `Gagal mengakses database: ${anggotaErr.message} (Code: ${anggotaErr.code || 'unknown'})`
      };
    }

    foundTables.push('anggota');

    // Cek tabel lainnya secara paralel
    const checks = await Promise.allSettled([
      client.from('transaksi_kas').select('id').limit(1),
      client.from('iuran_pembayaran').select('id').limit(1),
      client.from('pengumuman').select('id').limit(1),
      client.from('pengaturan_organisasi').select('id').limit(1)
    ]);

    const tableNames = ['transaksi_kas', 'iuran_pembayaran', 'pengumuman', 'pengaturan_organisasi'];
    checks.forEach((res, idx) => {
      if (res.status === 'fulfilled' && !res.value.error) {
        foundTables.push(tableNames[idx]);
      } else {
        missingTables.push(tableNames[idx]);
      }
    });

    return {
      connected: true,
      latencyMs: latency,
      message: 'Koneksi ke Supabase berhasil! Realtime database siap digunakan.',
      tablesFound: foundTables,
      missingTables: missingTables.length > 0 ? missingTables : undefined
    };
  } catch (err: any) {
    return {
      connected: false,
      message: 'Koneksi jaringan ke Supabase gagal: ' + (err.message || 'Network error')
    };
  }
}
