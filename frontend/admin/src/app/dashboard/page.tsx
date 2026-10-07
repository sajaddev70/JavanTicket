'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  DollarSign,
  Ticket,
  Building,
  School,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowUpRight,
  MapPin,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, provRes, alertRes]: [any, any, any] = await Promise.all([
          api.get('/public/dashboard/stats'),
          api.get('/public/regional-stats'),
          api.get('/public/system-alerts'),
        ]);

        if (statsRes?.data) setStats(statsRes.data);
        if (provRes?.data) setProvinces(provRes.data);
        if (alertRes?.data) setAlerts(alertRes.data);
      } catch (e) {
        // Ignored
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  return (
    <AdminLayout>
      <div className="space-y-8 dir-rtl">
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">داشبورد مدیریتی جوان تیکت</h1>
            <p className="text-sm text-slate-400 mt-1">
              خلاصه وضعیت فروش، سانس‌های آنلاین و پراکندگی جغرافیایی رویدادها
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-xl text-slate-300 shadow-sm">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>امروز: ۱۴۰۳/۰۷/۱۶</span>
            </div>
            <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>سیستم آنلاین</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>در حال دریافت اطلاعات از سرور...</span>
          </div>
        ) : (
          <>
            {/* 4 Key Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">فروش امروز</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats?.todaySalesAmount ? formatPrice(stats.todaySalesAmount) : '۰ تومان'}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>۱۲٪ افزایش نسبت به دیروز</span>
                </div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">تعداد بلیت فروخته‌شده</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats?.ticketsSoldToday ? `${stats.ticketsSoldToday} بلیت` : '۰ بلیت'}
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>۴ سانس تکمیل ظرفیت شد</span>
                </div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">درصد پرشدگی سالن‌ها</span>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats?.hallOccupancyPercent ? `${stats.hallOccupancyPercent}٪` : '۰٪'}
                </div>
                <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats?.hallOccupancyPercent || 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">رزرو مدارس و سازمان‌ها</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <School className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats?.schoolReservationsCount ? `${stats.schoolReservationsCount} رزرو` : '۰ رزرو'}
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <span>۳ درخواست جدید منتظر تایید</span>
                </div>
              </div>
            </div>

            {/* Sales Chart & Iran Regional Map Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Sales Chart (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-white text-base">روند فروش ۷ روز گذشته</h3>
                    <p className="text-xs text-slate-400 mt-0.5">آمار مقایسه‌ای تراکنش‌ها بر حسب تومان</p>
                  </div>
                  <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1 rounded-lg">
                    هفتگی
                  </span>
                </div>

                <div className="h-72 w-full dir-ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.salesChart || []}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Regional Sales Iran Map View Container */}
              <div className="lg:col-span-5 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative min-h-[340px] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <span>پراکندگی فروش استان‌ها</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">مراکز فعال همایش و نمایش جوان در کشور</p>
                  </div>
                </div>

                <div className="relative w-full h-56 bg-slate-900/80 rounded-xl border border-slate-700/60 overflow-hidden flex items-center justify-center p-4">
                  <img
                    src="/iran-map.svg"
                    alt="نقشه استانی ایران"
                    className="w-full h-full object-contain opacity-30"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {provinces.map((prov, i) => (
                    <div
                      key={i}
                      style={{ top: prov.top, left: prov.left }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    >
                      <span className="relative flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${prov.active ? 'bg-blue-400' : 'bg-slate-500'}`} />
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${prov.active ? 'bg-blue-500' : 'bg-slate-600'}`} />
                      </span>

                      <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg border border-slate-700 whitespace-nowrap shadow-xl z-20">
                        <div className="font-bold">{prov.name}</div>
                        <div className="text-blue-400 font-mono text-[11px]">{prov.sales || prov.sales_amount} تومان</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-700/50">
                    <span className="block text-xs text-slate-400">تهران</span>
                    <span className="text-xs font-bold text-blue-400">۲۴.۵ میلیون</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-700/50">
                    <span className="block text-xs text-slate-400">اصفهان</span>
                    <span className="text-xs font-bold text-emerald-400">۸.۲ میلیون</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-700/50">
                    <span className="block text-xs text-slate-400">مشهد</span>
                    <span className="text-xs font-bold text-purple-400">۶.۱ میلیون</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row: Today's Sessions & System Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Today's Sessions */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span>سانس‌های فعال امروز</span>
                  </h3>
                  <span className="text-xs text-slate-400">برج میلاد تهران</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">سیرک بین‌المللی ایران - آیتم اول</p>
                      <p className="text-xs text-slate-400 mt-1">سالن اصلی - ساعت ۱۸:۰۰ تا ۲۰:۰۰</p>
                    </div>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-semibold">
                      تکمیل ظرفیت
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">کنسرت حمید هیراد</p>
                      <p className="text-xs text-slate-400 mt-1">سالن همایش‌ها - ساعت ۲۱:۳۰</p>
                    </div>
                    <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-500/20 font-semibold">
                      در حال بلیت‌فروشی
                    </span>
                  </div>
                </div>
              </div>

              {/* System Alerts */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span>اعلا‌ن‌ها و هشدارهای مدیریت</span>
                  </h3>
                  <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {alerts.length} مورد جدید
                  </span>
                </div>

                <div className="space-y-3">
                  {alerts.map((al, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-200 text-xs leading-relaxed"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>{al.message}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
