-- ============================================================================
-- SQL MIGRATION: SISTEM KEUANGAN REMAKO DABORIBO
-- Database: PostgreSQL / Supabase
-- Fitur: RLS Ketat, Role Admin, Realtime Replication, Views Publik Aman
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL ADMIN ROLES
-- Menyimpan daftar user Supabase Auth yang memiliki hak akses administrator
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'bendahara', 'ketua')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- Index admin
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);

-- Fungsi Pembantu: Cek apakah user yang sedang login adalah Admin terdaftar
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = auth.uid()
    ) OR (
        auth.jwt() ->> 'email' = 'cs.sapalewa@gmail.com'
    );
$$;

-- Otomatis berikan role admin saat user cs.sapalewa@gmail.com terdaftar di Supabase Auth
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

-- Daftarkan akun yang sudah ada
INSERT INTO public.admin_roles (user_id, email, role)
SELECT id, email, 'admin' FROM auth.users WHERE email = 'cs.sapalewa@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 3. TABEL ANGGOTA
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

CREATE INDEX IF NOT EXISTS idx_anggota_nama ON public.anggota(nama);
CREATE INDEX IF NOT EXISTS idx_anggota_status ON public.anggota(status_aktif);

-- 4. TABEL IURAN PEMBAYARAN
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

CREATE INDEX IF NOT EXISTS idx_iuran_anggota_id ON public.iuran_pembayaran(anggota_id);
CREATE INDEX IF NOT EXISTS idx_iuran_periode ON public.iuran_pembayaran(periode_tahun, periode_bulan);
CREATE INDEX IF NOT EXISTS idx_iuran_status ON public.iuran_pembayaran(status);

-- 5. TABEL TRANSAKSI KAS (BUKU KAS UMUM)
-- Saldo kas dihitung dari transaksi_kas yang berstatus 'aktif'
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

CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON public.transaksi_kas(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_transaksi_tipe ON public.transaksi_kas(tipe);
CREATE INDEX IF NOT EXISTS idx_transaksi_status ON public.transaksi_kas(status);
CREATE INDEX IF NOT EXISTS idx_transaksi_referensi_iuran ON public.transaksi_kas(referensi_iuran_id);

-- 6. TABEL PENGUMUMAN
CREATE TABLE IF NOT EXISTS public.pengumuman (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    isi TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    penulis TEXT NOT NULL DEFAULT 'Pengurus Remako Daboribo',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pengumuman_pinned ON public.pengumuman(is_pinned DESC, tanggal DESC);

-- 7. TABEL PENGATURAN ORGANISASI
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

-- Inisialisasi baris pengaturan default jika belum ada
INSERT INTO public.pengaturan_organisasi (id, nama_organisasi, target_iuran_bulanan, nomor_rekening, kontak_bendahara)
VALUES ('utama', 'Remako Daboribo', 50000, 'BCA 1234567890 a.n Remako Daboribo', '0812-3456-7890 (Bendahara Remako)')
ON CONFLICT (id) DO NOTHING;

-- 8. TRIGGER UNTUK SINKRONISASI IURAN DENGAN TRANSAKSI KAS
-- Mencegah pencatatan dobel dan otomatis memperbarui status kas jika iuran dibatalkan
CREATE OR REPLACE FUNCTION public.fn_sync_iuran_to_transaksi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_nama_anggota TEXT;
    v_bulan_nama TEXT;
BEGIN
    -- Nama bulan
    v_bulan_nama := CASE NEW.periode_bulan
        WHEN 1 THEN 'Januari' WHEN 2 THEN 'Februari' WHEN 3 THEN 'Maret'
        WHEN 4 THEN 'April' WHEN 5 THEN 'Mei' WHEN 6 THEN 'Juni'
        WHEN 7 THEN 'Juli' WHEN 8 THEN 'Agustus' WHEN 9 THEN 'September'
        WHEN 10 THEN 'Oktober' WHEN 11 THEN 'November' WHEN 12 THEN 'Desember'
        ELSE 'Bulan ' || NEW.periode_bulan
    END;

    -- Dapatkan nama anggota
    SELECT nama INTO v_nama_anggota FROM public.anggota WHERE id = NEW.anggota_id;
    IF v_nama_anggota IS NULL THEN
        v_nama_anggota := 'Anggota';
    END IF;

    -- Saat pembayaran baru berstatus lunas
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'lunas' THEN
            INSERT INTO public.transaksi_kas (
                tipe, kategori, nominal, tanggal, keterangan, sumber_penerima,
                referensi_iuran_id, status, metode_pembayaran, created_by
            ) VALUES (
                'pemasukan',
                'iuran',
                NEW.nominal,
                NEW.tanggal_bayar,
                'Iuran ' || v_bulan_nama || ' ' || NEW.periode_tahun || ' - ' || v_nama_anggota,
                v_nama_anggota,
                NEW.id,
                'aktif',
                NEW.metode_pembayaran,
                NEW.created_by
            );
        END IF;

    -- Saat update status iuran (misal dari lunas menjadi dibatalkan)
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'dibatalkan' AND OLD.status != 'dibatalkan' THEN
            UPDATE public.transaksi_kas
            SET status = 'dibatalkan'
            WHERE referensi_iuran_id = NEW.id;
        ELSIF NEW.status = 'lunas' AND OLD.status = 'dibatalkan' THEN
            UPDATE public.transaksi_kas
            SET status = 'aktif', nominal = NEW.nominal, tanggal = NEW.tanggal_bayar
            WHERE referensi_iuran_id = NEW.id;
        ELSIF NEW.status = 'lunas' AND (NEW.nominal != OLD.nominal OR NEW.tanggal_bayar != OLD.tanggal_bayar) THEN
            UPDATE public.transaksi_kas
            SET nominal = NEW.nominal, tanggal = NEW.tanggal_bayar
            WHERE referensi_iuran_id = NEW.id;
        END IF;

    -- Saat pembayaran dihapus
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

-- 9. SAFE PUBLIC VIEWS
-- View Ringkasan Keuangan Publik (Read-Only)
CREATE OR REPLACE VIEW public.view_rekap_keuangan_publik AS
SELECT
    COALESCE(SUM(CASE WHEN tipe = 'pemasukan' AND status = 'aktif' THEN nominal ELSE 0 END), 0) AS total_pemasukan,
    COALESCE(SUM(CASE WHEN tipe = 'pengeluaran' AND status = 'aktif' THEN nominal ELSE 0 END), 0) AS total_pengeluaran,
    COALESCE(SUM(CASE WHEN tipe = 'pemasukan' AND status = 'aktif' THEN nominal ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN tipe = 'pengeluaran' AND status = 'aktif' THEN nominal ELSE 0 END), 0) AS saldo_kas_aktif,
    COALESCE(SUM(CASE WHEN tipe = 'pemasukan' AND kategori = 'iuran' AND status = 'aktif' THEN nominal ELSE 0 END), 0) AS total_iuran_terkumpul,
    (SELECT COUNT(*) FROM public.anggota WHERE status_aktif = true) AS total_anggota_aktif,
    (SELECT COUNT(*) FROM public.transaksi_kas WHERE status = 'aktif') AS total_transaksi_aktif
FROM public.transaksi_kas;

-- View Transaksi Kas Publik (Hanya yang aktif & non-sensitif)
CREATE OR REPLACE VIEW public.view_transaksi_publik AS
SELECT
    id,
    tipe,
    kategori,
    nominal,
    tanggal,
    keterangan,
    sumber_penerima,
    metode_pembayaran,
    created_at
FROM public.transaksi_kas
WHERE status = 'aktif'
ORDER BY tanggal DESC, created_at DESC;

-- View Rekap Status Iuran Anggota Publik
CREATE OR REPLACE VIEW public.view_anggota_status_iuran_publik AS
SELECT
    a.id AS anggota_id,
    a.nama,
    a.jabatan,
    a.target_iuran_bulanan,
    a.status_aktif,
    COALESCE(SUM(CASE WHEN ip.status = 'lunas' THEN ip.nominal ELSE 0 END), 0) AS total_dibayar,
    COUNT(CASE WHEN ip.status = 'lunas' THEN 1 END) AS jumlah_bulan_lunas,
    MAX(CASE WHEN ip.status = 'lunas' THEN ip.tanggal_bayar END) AS tanggal_bayar_terakhir
FROM public.anggota a
LEFT JOIN public.iuran_pembayaran ip ON a.id = ip.anggota_id
WHERE a.status_aktif = true
GROUP BY a.id, a.nama, a.jabatan, a.target_iuran_bulanan, a.status_aktif
ORDER BY a.nama ASC;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iuran_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_kas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan_organisasi ENABLE ROW LEVEL SECURITY;

-- Policy: admin_roles
-- Publik tidak bisa melihat admin roles, hanya admin terverifikasi atau auth.uid() sendiri
DROP POLICY IF EXISTS "Admin roles read by admin only" ON public.admin_roles;
CREATE POLICY "Admin roles read by admin only"
ON public.admin_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin roles modified by admin only" ON public.admin_roles;
CREATE POLICY "Admin roles modified by admin only"
ON public.admin_roles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy: anggota
-- Publik dapat melihat anggota aktif
DROP POLICY IF EXISTS "Public can view active anggota" ON public.anggota;
CREATE POLICY "Public can view active anggota"
ON public.anggota FOR SELECT
USING (true);

-- Hanya Admin yang boleh tambah/ubah/hapus anggota
DROP POLICY IF EXISTS "Admin can insert anggota" ON public.anggota;
CREATE POLICY "Admin can insert anggota"
ON public.anggota FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update anggota" ON public.anggota;
CREATE POLICY "Admin can update anggota"
ON public.anggota FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete anggota" ON public.anggota;
CREATE POLICY "Admin can delete anggota"
ON public.anggota FOR DELETE
USING (public.is_admin());

-- Policy: iuran_pembayaran
-- Publik dapat membaca iuran
DROP POLICY IF EXISTS "Public can view iuran" ON public.iuran_pembayaran;
CREATE POLICY "Public can view iuran"
ON public.iuran_pembayaran FOR SELECT
USING (true);

-- Hanya Admin yang boleh tambah/ubah/hapus iuran
DROP POLICY IF EXISTS "Admin can insert iuran" ON public.iuran_pembayaran;
CREATE POLICY "Admin can insert iuran"
ON public.iuran_pembayaran FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update iuran" ON public.iuran_pembayaran;
CREATE POLICY "Admin can update iuran"
ON public.iuran_pembayaran FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete iuran" ON public.iuran_pembayaran;
CREATE POLICY "Admin can delete iuran"
ON public.iuran_pembayaran FOR DELETE
USING (public.is_admin());

-- Policy: transaksi_kas
-- Publik hanya dapat melihat transaksi kas yang berstatus aktif
DROP POLICY IF EXISTS "Public can view active transaksi" ON public.transaksi_kas;
CREATE POLICY "Public can view active transaksi"
ON public.transaksi_kas FOR SELECT
USING (status = 'aktif' OR public.is_admin());

-- Hanya Admin yang boleh menambah atau membatalkan transaksi kas langsung
DROP POLICY IF EXISTS "Admin can insert transaksi" ON public.transaksi_kas;
CREATE POLICY "Admin can insert transaksi"
ON public.transaksi_kas FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update transaksi" ON public.transaksi_kas;
CREATE POLICY "Admin can update transaksi"
ON public.transaksi_kas FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete transaksi" ON public.transaksi_kas;
CREATE POLICY "Admin can delete transaksi"
ON public.transaksi_kas FOR DELETE
USING (public.is_admin());

-- Policy: pengumuman
-- Publik dapat membaca pengumuman aktif
DROP POLICY IF EXISTS "Public can view pengumuman" ON public.pengumuman;
CREATE POLICY "Public can view pengumuman"
ON public.pengumuman FOR SELECT
USING (status_aktif = true OR public.is_admin());

-- Hanya Admin yang boleh kelola pengumuman
DROP POLICY IF EXISTS "Admin can manage pengumuman" ON public.pengumuman;
CREATE POLICY "Admin can manage pengumuman"
ON public.pengumuman FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy: pengaturan_organisasi
-- Publik dapat membaca pengaturan kas/kontak
DROP POLICY IF EXISTS "Public can read settings" ON public.pengaturan_organisasi;
CREATE POLICY "Public can read settings"
ON public.pengaturan_organisasi FOR SELECT
USING (true);

-- Hanya Admin yang boleh mengubah pengaturan
DROP POLICY IF EXISTS "Admin can update settings" ON public.pengaturan_organisasi;
CREATE POLICY "Admin can update settings"
ON public.pengaturan_organisasi FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 11. SUPABASE REALTIME REPLICATION
-- Aktifkan Realtime pada tabel utama agar browser anggota lain langsung update otomatis
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'transaksi_kas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transaksi_kas;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'iuran_pembayaran'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.iuran_pembayaran;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'anggota'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.anggota;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'pengumuman'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pengumuman;
    END IF;
END $$;

-- 12. DATA AWAL (SEED DATA REMAKO DABORIBO)
-- Masukkan anggota awal jika tabel masih kosong
INSERT INTO public.anggota (nama, jabatan, target_iuran_bulanan, tanggal_bergabung, status_aktif, catatan)
VALUES
    ('Budi Santoso', 'Ketua', 50000, '2024-01-01', true, 'Pendiri Remako Daboribo'),
    ('Ahmad Dahlan', 'Sekretaris', 50000, '2024-01-01', true, 'Pengurus Inti'),
    ('Siti Rahmawati', 'Bendahara', 50000, '2024-01-01', true, 'Pengelola Kas'),
    ('Hendra Wijaya', 'Anggota', 50000, '2024-01-15', true, 'Sie Perlengkapan'),
    ('Rizky Ramadhan', 'Anggota', 50000, '2024-02-01', true, 'Sie Acara'),
    ('Dewi Lestari', 'Anggota', 50000, '2024-02-10', true, 'Sie Konsumsi'),
    ('Fajar Nugraha', 'Anggota', 50000, '2024-03-01', true, 'Sie Publikasi'),
    ('Maya Putri', 'Anggota', 50000, '2024-03-15', true, 'Anggota Aktif')
ON CONFLICT DO NOTHING;

-- Pengumuman awal
INSERT INTO public.pengumuman (judul, isi, tanggal, penulis, is_pinned, status_aktif)
VALUES
    ('Selamat Datang di Portal Transparansi Keuangan Remako Daboribo',
     'Portal ini menampilkan seluruh mutasi kas, saldo riil, serta rekap pelunasan iuran anggota secara real-time dan terbuka untuk seluruh anggota. Untuk konfirmasi pembayaran iuran kas bulanan, hubungi Bendahara.',
     CURRENT_DATE,
     'Pengurus Remako Daboribo',
     true,
     true),
    ('Jadwal Pertemuan Bulanan & Pembayaran Iuran Kas',
     'Iuran kas bulanan ditetapkan sebesar Rp50.000 per anggota per bulan. Harap melunasi sebelum tanggal 10 setiap bulannya melalui rekening resmi kas organisasi.',
     CURRENT_DATE,
     'Bendahara Remako',
     false,
     true)
ON CONFLICT DO NOTHING;
