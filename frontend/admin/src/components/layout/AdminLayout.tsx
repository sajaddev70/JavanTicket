'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  MapPin,
  Building2,
  Grid,
  Clock,
  ShoppingBag,
  School,
  Users2,
  Receipt,
  Percent,
  QrCode,
  Wallet,
  Scale,
  Contact2,
  BarChart3,
  Users,
  ShieldAlert,
  MessageSquare,
  Settings,
  History,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
  Bell,
  User as UserIcon,
} from 'lucide-react';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';

interface MenuItem {
  title: string;
  href?: string;
  icon?: any;
  children?: { title: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    title: 'داشبورد',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'مدیریت رویدادها',
    icon: Calendar,
    children: [
      { title: 'رویدادها', href: '/events' },
      { title: 'تقویم چرخشی', href: '/rotation-calendar' },
    ],
  },
  {
    title: 'مدیریت مکان‌ها',
    icon: MapPin,
    children: [
      { title: 'شهرها', href: '/cities' },
      { title: 'سالن‌ها', href: '/halls' },
      { title: 'نقشه صندلی‌ها', href: '/seat-maps' },
      { title: 'سانس‌ها', href: '/sessions' },
    ],
  },
  {
    title: 'فروش و رزرو',
    icon: ShoppingBag,
    children: [
      { title: 'فروش و سفارشات', href: '/orders' },
      { title: 'مدارس و سازمان‌ها', href: '/organizations' },
      { title: 'رزروهای گروهی', href: '/group-reservations' },
      { title: 'پیش‌فاکتورها', href: '/invoices' },
      { title: 'تخفیف و کد معرف', href: '/discounts' },
    ],
  },
  {
    title: 'کنترل گیت',
    href: '/gates',
    icon: QrCode,
  },
  {
    title: 'مالی',
    icon: Wallet,
    children: [
      { title: 'امور مالی', href: '/finance' },
      { title: 'تسویه حساب‌ها', href: '/settlements' },
    ],
  },
  {
    title: 'مشتریان و گزارش‌ها',
    icon: BarChart3,
    children: [
      { title: 'CRM', href: '/crm' },
      { title: 'گزارش‌ها', href: '/reports' },
    ],
  },
  {
    title: 'مدیریت سیستم',
    icon: Settings,
    children: [
      { title: 'کاربران و مدیران', href: '/users' },
      { title: 'نقش‌ها و دسترسی‌ها', href: '/roles' },
      { title: 'پیامک و اعلان‌ها', href: '/notifications' },
      { title: 'تنظیمات سامانه', href: '/settings' },
      { title: 'لاگ فعالیت‌ها', href: '/audit-logs' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    'مدیریت رویدادها': true,
    'مدیریت مکان‌ها': true,
    'فروش و رزرو': true,
  });

  const pathname = usePathname();
  const { user, logout } = useAdminAuthStore();

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-50 h-screen w-72 bg-slate-800 border-l border-slate-700/80 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              رو
            </div>
            <div>
              <h2 className="font-bold text-base text-white">پنل مدیریت رویداد</h2>
              <p className="text-xs text-slate-400">سامانه جوانان کشور</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            if (item.children) {
              const isOpen = !!openSubmenus[item.title];
              return (
                <div key={idx} className="space-y-1">
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="w-5 h-5 text-slate-400" />}
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pr-8 space-y-1 border-r-2 border-slate-700/50 mr-4 my-1">
                      {item.children.map((sub, sIdx) => {
                        const isActive = pathname === sub.href;
                        return (
                          <Link
                            key={sIdx}
                            href={sub.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-xs transition-colors ${
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 font-semibold border-r-2 border-blue-500 -mr-0.5'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                            }`}
                          >
                            {sub.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={idx}
                href={item.href || '#'}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-700/80 bg-slate-800/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 border border-slate-600">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.fullName || 'مدیر سامانه'}
                </p>
                <p className="text-xs text-slate-400 font-mono truncate">{user?.mobile}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
              title="خروج از حساب"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-slate-800/90 border-b border-slate-700/80 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-700 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden sm:block w-72">
              <input
                type="text"
                placeholder="جستجو در سامانه..."
                className="w-full bg-slate-900 border border-slate-700 text-sm rounded-xl py-2 px-3 pr-9 text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>شهر فعال: تهران</span>
            </div>

            <button className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
