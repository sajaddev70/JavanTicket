'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

export default function AdminBannersManagerPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '/hero-banner.jpg',
    link_url: '/events',
    button_text: 'انتخاب سانس و خرید بلیت',
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/cms/banners');
      setBanners(res?.data || []);
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/admin/cms/banners', formData);
      setShowModal(false);
      fetchBanners();
    } catch (e) {
      alert('خطا در ثبت بنر');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('آیا از حذف این بنر اطمینان دارید؟')) return;
    try {
      await api.delete(`/admin/cms/banners/${id}`);
      fetchBanners();
    } catch (e) {
      alert('خطا در حذف بنر');
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 dir-rtl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">مدیریت بنرهای صفحه اصلی</h1>
            <p className="text-xs text-slate-400 mt-1">مدیریت اسلایدر بنر ویژه بالای صفحه اول کاربر</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن بنر جدید</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span>در حال دریافت اسلایدرها...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((bn) => (
              <div key={bn.id} className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">{bn.title}</h3>
                  <button
                    onClick={() => handleDelete(bn.id)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">{bn.subtitle}</p>
                <div className="text-xs font-mono text-blue-400 bg-slate-900 p-2 rounded-xl truncate">
                  لینک: {bn.link_url}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
              <h3 className="font-bold text-lg text-white">افزودن بنر جدید</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">عنوان بنر</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">زیرعنوان / مکان / تاریخ</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">لینک مقصد</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    افزودن اسلاید
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
