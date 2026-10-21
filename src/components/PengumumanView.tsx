import React, { useState } from 'react';
import { 
  Megaphone, 
  Pin, 
  Calendar, 
  User, 
  CreditCard, 
  QrCode, 
  Phone, 
  Copy, 
  Check, 
  Plus, 
  Trash2,
  Edit3,
  Save,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Pengumuman, PengaturanOrganisasi } from '../types/database';

interface PengumumanViewProps {
  pengumumanList: Pengumuman[];
  pengaturan: PengaturanOrganisasi;
  isAdmin: boolean;
  onOpenAddPengumuman?: () => void;
  onDeletePengumuman?: (id: string) => void;
  onUpdatePengumuman?: (id: string, payload: Partial<Pengumuman>) => void;
}

export const PengumumanView: React.FC<PengumumanViewProps> = ({
  pengumumanList,
  pengaturan,
  isAdmin,
  onOpenAddPengumuman,
  onDeletePengumuman,
  onUpdatePengumuman
}) => {
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [editingItem, setEditingItem] = useState<Pengumuman | null>(null);

  // Form states for editing
  const [editJudul, setEditJudul] = useState('');
  const [editIsi, setEditIsi] = useState('');
  const [editPenulis, setEditPenulis] = useState('');
  const [editTanggal, setEditTanggal] = useState('');
  const [editPinned, setEditPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(pengaturan.nomor_rekening);
    setCopiedRekening(true);
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  const handleStartEdit = (item: Pengumuman) => {
    setEditingItem(item);
    setEditJudul(item.judul);
    setEditIsi(item.isi);
    setEditPenulis(item.penulis);
    setEditTanggal(item.tanggal);
    setEditPinned(item.is_pinned);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !onUpdatePengumuman) return;
    setIsSaving(true);
    await onUpdatePengumuman(editingItem.id, {
      judul: editJudul,
      isi: editIsi,
      penulis: editPenulis,
      tanggal: editTanggal,
      is_pinned: editPinned
    });
    setIsSaving(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Official Treasury Channels Box */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Saluran Pembayaran Iuran & Donasi Kas</span>
            </h3>
            <p className="text-xs text-slate-400">
              Gunakan saluran resmi berikut untuk menyetorkan iuran bulanan atau donasi kegiatan.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Rekening Kas Resmi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card Rekening Bank */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Rekening Kas Utama
              </span>
              <p className="font-mono text-sm sm:text-base font-bold text-white break-all">
                {pengaturan.nomor_rekening}
              </p>
            </div>
            <button
              onClick={handleCopyRekening}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition"
            >
              {copiedRekening ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Nomor Rekening</span>
                </>
              )}
            </button>
          </div>

          {/* Card QRIS Kas */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                QRIS Pembayaran Kas
              </span>
              <p className="text-xs text-slate-300">
                {pengaturan.qris_keterangan}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-teal-400 bg-teal-950/50 p-2 rounded-lg border border-teal-800/40">
              <QrCode className="w-4 h-4 shrink-0" />
              <span>Tersedia scan barcode di bendahara saat pertemuan</span>
            </div>
          </div>

          {/* Card Kontak Bendahara */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Konfirmasi Pembayaran
              </span>
              <p className="font-mono text-xs sm:text-sm font-semibold text-white">
                {pengaturan.kontak_bendahara}
              </p>
            </div>
            <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Kirimkan bukti transfer untuk pencatatan instan.
            </p>
          </div>
        </div>
      </div>

      {/* Announcements Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" />
            <span>Pengumuman & Agenda Organisasi</span>
          </h3>
          <p className="text-xs text-slate-400">
            Informasi penting terkait keuangan, jadwal iuran, dan agenda kegiatan Remako Daboribo.
          </p>
        </div>

        {isAdmin && onOpenAddPengumuman && (
          <button
            onClick={onOpenAddPengumuman}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengumuman</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {pengumumanList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
            Belum ada pengumuman organisasi saat ini.
          </div>
        ) : (
          pengumumanList.map(item => (
            <div
              key={item.id}
              className={`rounded-2xl p-5 sm:p-6 transition border ${
                item.is_pinned
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {item.is_pinned && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <Pin className="w-3 h-3 rotate-45" />
                      Disematkan
                    </span>
                  )}
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {item.judul}
                  </h4>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.tanggal}
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <User className="w-3.5 h-3.5" />
                    {item.penulis}
                  </span>

                  {/* Admin Actions: Edit & Hapus */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition"
                        title="Edit Pengumuman"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {onDeletePengumuman && (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus pengumuman "${item.judul}"?`)) {
                              onDeletePengumuman(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                          title="Hapus Pengumuman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {item.isi}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Pengumuman Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Edit Pengumuman Organisasi</span>
              </h4>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Judul Pengumuman:</label>
                <input
                  type="text"
                  value={editJudul}
                  onChange={(e) => setEditJudul(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Isi Pengumuman:</label>
                <textarea
                  value={editIsi}
                  onChange={(e) => setEditIsi(e.target.value)}
                  rows={4}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Penulis:</label>
                  <input
                    type="text"
                    value={editPenulis}
                    onChange={(e) => setEditPenulis(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
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

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editPinned}
                    onChange={(e) => setEditPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800"
                  />
                  <span>Sematkan di baris paling atas (Pinned)</span>
                </label>
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
