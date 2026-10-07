'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Calendar, Plus, Trash2, Edit, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';

export default function AdminEventsManagerPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    organizer_name: 'مرکز جوان',
    min_price: 150000,
    banner_url: '/hero-banner.jpg',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/cms/events');
      setEvents(res?.data || []);
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/admin/cms/events', formData);
      setShowModal(false);
      fetchEvents();
    } catch (e) {
      alert('خطا در ثبت رویداد');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('آیا از حذف این رویداد اطمینان دارید؟')) return;
    try {
      await api.delete(`/admin/cms/events/${id}`);
      fetchEvents();
    } catch (e) {
      alert('خطا در حذف رویداد');
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 dir-rtl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">مدیریت رویدادها</h1>
            <p className="text-xs text-slate-400 mt-1">افزایش، ویرایش و مدیریت انتشار برنامه‌ها در سامانه</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف رویداد جدید</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span>در حال دریافت لیست رویدادها...</span>
          </div>
        ) : (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-900/80 text-slate-400 text-xs border-b border-slate-700/80">
                <tr>
                  <th className="p-4">عنوان رویداد</th>
                  <th className="p-4">برگزارکننده</th>
                  <th className="p-4">شروع قیمت</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-bold">{ev.title}</td>
                    <td className="p-4 text-slate-400">{ev.organizer_name}</td>
                    <td className="p-4 font-mono text-emerald-400">{ev.min_price} تومان</td>
                    <td className="p-4">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        منتشر شده
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
              <h3 className="font-bold text-lg text-white">ایجاد رویداد جدید</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">عنوان رویداد</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">توضیحات</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">برگزارکننده</label>
                    <input
                      type="text"
                      value={formData.organizer_name}
                      onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">کف قیمت (تومان)</label>
                    <input
                      type="number"
                      value={formData.min_price}
                      onChange={(e) => setFormData({ ...formData, min_price: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono"
                    />
                  </div>
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
                    ثبت و انتشار
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
