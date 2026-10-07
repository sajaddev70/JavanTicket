'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Settings, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    site_name: 'مرکز همایش و نمایش جوان',
    contact_phone: '021-88888888',
    contact_email: 'info@youthevent.ir',
    address: 'تهران، برج میلاد، مرکز همایش‌ها',
    footer_text: 'سامانه رسمی بلیت‌فروشی و مدیریت رویدادهای فرهنگی کشور',
    logo_url: '/javan-logo.svg',
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res: any = await api.get('/admin/cms/site-settings');
        if (res?.data && Object.keys(res.data).length > 0) {
          setFormData((prev) => ({ ...prev, ...res.data }));
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/admin/cms/site-settings', formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 dir-rtl max-w-4xl">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-bold text-white">تنظیمات عمومی سامانه</h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت عنوان سایت، اطلاعات تماس و فوتر</p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span>در حال دریافت تنظیمات...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            {saved && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>تنظیمات با موفقیت در دیتابیس ذخیره شد.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">نام رسمی سامانه</label>
                <input
                  type="text"
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">تلفن پشتیبانی</label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">ایمیل تماس</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">آدرس فیزیکی</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">متن فوتر</label>
              <textarea
                rows={3}
                value={formData.footer_text}
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
              />
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-700">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره تغییرات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
