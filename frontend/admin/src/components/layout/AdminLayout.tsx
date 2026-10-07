'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  ShoppingBag,
  QrCode,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
  Bell,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';

interface SubMenuItem {
  title: string;
  href: string;
}

interface MenuGroup {
  groupTitle: string;
  icon: any;
  children: SubMenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    groupTitle: 'مدیریت رویدادها و برنامه‌ها',
    icon: Calendar,
    children: [
      { title: 'لیست رویدادها', href: '/events' },
      { title: 'بنرهای اسلایدر', href: '/banners' },
      { title: 'تقویم اجراها', href: '/rotation-calendar' },
    ],
  },
  {
    groupTitle: 'مدیریت مکان‌ها و سانس‌ها',
    icon: MapPin,
    children: [
      { title: 'مدیریت شهرها', href: '/cities' },
      { title: 'مدیریت سالن‌ها', href: '/halls' },
      { title: 'نقشه صندلی‌ها', href: '/seat-maps' },
      { title: 'زمان‌بندی سانس‌ها', href: '/sessions' },
    ],
  },
  {
    groupTitle: 'فروش، بلیت و رزروها',
    icon: ShoppingBag,
    children: [
      { title: 'سفارشات و بلیت‌ها', href: '/orders' },
      { title: 'رزرو مدارس و ارگان‌ها', href: '/organizations' },
      { title: 'پیش‌فاکتورها', href: '/invoices' },
      { title: 'کدهای تخفیف', href: '/discounts' },
    ],
  },
  {
    groupTitle: 'کنترل گیت و مالی',
    icon: Wallet,
    children: [
      { title: 'کنترل گیت ورود', href: '/gates' },
      { title: 'تراکنش‌های مالی', href: '/finance' },
      { title: 'تسویه‌ها', href: '/settlements' },
    ],
  },
  {
    groupTitle: 'تنظیمات و دسترسی‌ها',
    icon: Settings,
    children: [
      { title: 'کاربران و مدیران', href: '/users' },
      { title: 'نقش‌ها و دسترسی‌ها', href: '/roles' },
      { title: 'تنظیمات عمومی سامانه', href: '/settings' },
      { title: 'سوابق فعالیت‌ها', href: '/audit-logs' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'مدیریت رویدادها و برنامه‌ها': true,
  });

  const pathname = usePathname();
  const { user, logout } = useAdminAuthStore();

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row dir-rtl">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-50 h-screen w-72 bg-slate-800/95 border-l border-slate-700/80 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              جوان
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">پنل مدیریت جوان تیکت</h2>
              <p className="text-[10px] text-slate-400">سامانه جامع بلیت‌فروشی</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accordion Sidebar Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {/* Main Dashboard Link */}
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              pathname === '/dashboard'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <span>داشبورد اصلی</span>
          </Link>

          {/* Menu Card Quick Access Link */}
          <Link
            href="/menu"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              pathname === '/menu'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ساختار کلی خدمات</span>
          </Link>

          <div className="pt-2 border-t border-slate-700/60 space-y-2">
            {menuGroups.map((group, idx) => {
              const GroupIcon = group.icon;
              const isOpen = !!openGroups[group.groupTitle];

              return (
                <div key={idx} className="bg-slate-900/40 border border-slate-700/40 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group.groupTitle)}
                    className="w-full flex items-center justify-between px-3.5 py-3 text-slate-200 hover:text-white text-xs font-bold transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GroupIcon className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="truncate">{group.groupTitle}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-2 pt-1 space-y-1 bg-slate-900/60 border-t border-slate-800">
                      {group.children.map((sub, sIdx) => {
                        const isActive = pathname === sub.href;
                        return (
                          <Link
                            key={sIdx}
                            href={sub.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 font-bold border-r-2 border-blue-500'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
            })}
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-700/80 bg-slate-800/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 border border-slate-600">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.fullName || 'مدیر سامانه'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{user?.mobile || '09123456789'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
              title="خروج از حساب"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
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
                className="w-full bg-slate-900 border border-slate-700 text-xs rounded-xl py-2 px-3 pr-9 text-slate-200 focus:outline-none focus:border-blue-500"
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
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
