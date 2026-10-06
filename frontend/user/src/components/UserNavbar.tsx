'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  User,
  Ticket,
  Menu,
  X,
  Phone,
  LogOut,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { useUserAuthStore } from '@/stores/useUserAuthStore';

export default function UserNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('تهران');
  const { user, logout } = useUserAuthStore();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              یوت
            </div>
            <div>
              <span className="font-bold text-lg text-white block leading-tight">
                رویدادهای جوانان
              </span>
              <span className="text-[10px] text-slate-400 block">سامانه رسمی خرید بلیت</span>
            </div>
          </Link>

          {/* City Selector */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600 cursor-pointer transition-colors">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>شهر: {selectedCity}</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="جستجوی رویداد، سیرک، کنسرت یا سالن..."
            className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-sm text-slate-200 placeholder:text-slate-500 rounded-xl py-2.5 px-4 pr-10 focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        {/* Actions / Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/tickets"
                className="hidden sm:flex items-center gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                <Ticket className="w-4 h-4" />
                <span>بلیت‌های من</span>
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 font-medium px-3.5 py-2.5 rounded-xl transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">{user.fullName || user.mobile}</span>
              </Link>

              <button
                onClick={logout}
                className="p-2.5 text-slate-400 hover:text-red-400 bg-slate-800 border border-slate-700 rounded-xl transition-colors"
                title="خروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>ورود / ثبت‌نام</span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-xl md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="جستجوی رویداد..."
              className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 py-2.5 px-4 pr-10 rounded-xl"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          <div className="flex items-center justify-between py-2 border-y border-slate-800 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>شهر منتخب:</span>
            </div>
            <span className="font-semibold text-white">{selectedCity}</span>
          </div>

          <nav className="space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              صفحه اصلی
            </Link>
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              همه رویدادها
            </Link>
            {user && (
              <>
                <Link
                  href="/tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  بلیت‌های من
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  پروفایل کاربری
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
