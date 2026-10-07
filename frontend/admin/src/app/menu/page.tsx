'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  ShoppingBag,
  QrCode,
  Wallet,
  BarChart3,
  Settings,
  Users,
  Grid,
  Building2,
  Clock,
  Ticket,
  Percent,
  Receipt,
  ShieldCheck,
  Bell,
  History,
  FileText,
  School,
  ChevronLeft,
} from 'lucide-react';

interface MenuCardSection {
  title: string;
  description: string;
  icon: any;
  color: string;
  items: { title: string; href: string; badge?: string }[];
}

export default function AdminMenuStructurePage() {
  const menuSections: MenuCardSection[] = [
    {
      title: 'مدیریت رویدادها و برنامه‌ها',
      description: 'تعریف رویداد، تنظیم تقویم اجراها و مدیریت برنامه‌ها',
      icon: Calendar,
      color: 'from-blue-600 to-indigo-600',
      items: [
        { title: 'لیست تمام رویدادها', href: '/events' },
        { title: 'تعریف رویداد جدید', href: '/events/new', badge: 'جدید' },
        { title: 'تقویم چرخشی برنامه‌ها', href: '/rotation-calendar' },
      ],
    },
    {
      title: 'مدیریت مکان‌ها و سانس‌ها',
      description: 'مدیریت شهرها، سالن‌ها، نقشه صندلی‌ها و سانس‌های نمایش',
      icon: MapPin,
      color: 'from-emerald-600 to-teal-600',
      items: [
        { title: 'مدیریت شهرها', href: '/cities' },
        { title: 'مدیریت سالن‌ها و مجتمع‌ها', href: '/halls' },
        { title: 'طراحی و نقشه صندلی‌ها', href: '/seat-maps' },
        { title: 'تعریف و زمان‌بندی سانس‌ها', href: '/sessions' },
      ],
    },
    {
      title: 'فروش، بلیت و رزروها',
      description: 'مدیریت فروش، سفارشات کاربران، مدارس و رزروهای گروهی',
      icon: ShoppingBag,
      color: 'from-purple-600 to-violet-600',
      items: [
        { title: 'لیست کل سفارشات و بلیت‌ها', href: '/orders' },
        { title: 'رزرو مدارس و سازمان‌ها', href: '/organizations', badge: 'ویژه' },
        { title: 'مدیریت پیش‌فاکتورها', href: '/invoices' },
        { title: 'کدهای تخفیف و بازاریابی', href: '/discounts' },
      ],
    },
    {
      title: 'کنترل ورود و گیت (Scan)',
      description: 'مدیریت اسکنرها، کنترل بلیت ورودی و گیت‌های ورود سالن',
      icon: QrCode,
      color: 'from-amber-600 to-orange-600',
      items: [
        { title: 'داشبورد کنترل گیت', href: '/gates' },
        { title: 'دستگاه‌های اسکنر فعال', href: '/scanners' },
        { title: 'گزارش ورودهای لحظه‌ای', href: '/entry-logs' },
      ],
    },
    {
      title: 'مدیریت مالی و تسویه‌ها',
      description: 'گزارشات مالی، تراکنش‌های بانکی و تسویه حساب با تهیه‌کنندگان',
      icon: Wallet,
      color: 'from-rose-600 to-pink-600',
      items: [
        { title: 'تراکنش‌های مالی', href: '/finance' },
        { title: 'درخواست‌های تسویه حساب', href: '/settlements' },
        { title: 'گزارش سود و کمیسیون', href: '/commissions' },
      ],
    },
    {
      title: 'تنظیمات و دسترسی‌های سیستم',
      description: 'مدیریت کاربران، نقش‌های مدیریتی، لاگ‌ها و تنظیمات سامانه',
      icon: Settings,
      color: 'from-slate-700 to-slate-800',
      items: [
        { title: 'کاربران و مدیران سیستم', href: '/users' },
        { title: 'نقش‌ها و سطح دسترسی‌ها', href: '/roles' },
        { title: 'تنظیمات عمومی سامانه', href: '/settings' },
        { title: 'سوابق و لاگ‌های سیستم', href: '/audit-logs' },
      ],
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 dir-rtl">
        {/* Page Header */}
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-bold text-white">ساختار خدمات و منوهای مدیریت</h1>
          <p className="text-sm text-slate-400 mt-1">
            دسترسی سریع به تمام بخش‌های اجرایی و عملیاتی سامانه جوان تیکت
          </p>
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuSections.map((section, idx) => {
            const IconComponent = section.icon;
            return (
              <div
                key={idx}
                className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-600/80 transition-all group"
              >
                <div>
                  {/* Card Header with Gradient Icon */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${section.color} flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">
                        {section.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  {/* Links List */}
                  <div className="space-y-2 mt-6 pt-4 border-t border-slate-700/60">
                    {section.items.map((item, iIdx) => (
                      <Link
                        key={iIdx}
                        href={item.href}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors text-xs font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                          <span>{item.title}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronLeft className="w-4 h-4 text-slate-500" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
