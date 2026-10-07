'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import UserNavbar from '@/components/UserNavbar';
import UserFooter from '@/components/UserFooter';
import {
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  Flame,
  Star,
  Users,
  Baby,
  Music,
  Building,
  Cpu,
  Bot,
  CheckCircle2,
  Ticket,
} from 'lucide-react';
import { api } from '@/services/api';

const categoryIcons: Record<string, any> = {
  Baby,
  Users,
  Sparkles,
  Music,
  Building,
  Cpu,
  Bot,
};

export default function UserHomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, eventRes]: [any, any] = await Promise.all([
          api.get('/public/categories'),
          api.get('/public/events'),
        ]);
        setCategories(catRes?.data || []);
        setEvents(eventRes?.data || []);
      } catch (e) {
        // Mock fallback if API offline
        setCategories([
          { id: 1, name: 'کودک', slug: 'child', icon: 'Baby' },
          { id: 2, name: 'خانواده', slug: 'family', icon: 'Users' },
          { id: 3, name: 'سیرک', slug: 'circus', icon: 'Sparkles' },
          { id: 4, name: 'کنسرت', slug: 'concert', icon: 'Music' },
          { id: 5, name: 'شهروندی', slug: 'citizenship', icon: 'Building' },
          { id: 6, name: 'تکنولوژی', slug: 'technology', icon: 'Cpu' },
          { id: 7, name: 'هوش مصنوعی', slug: 'ai', icon: 'Bot' },
        ]);
        setEvents([
          {
            id: 1,
            title: 'سیرک بزرگ بین‌المللی تهران',
            slug: 'circus-tehran',
            description: 'هیجان‌انگیزترین نمایش سیرک سال با حضور هنرمندان بین‌المللی',
            organizer_name: 'گروه فرهنگی آفتاب',
            min_price: 150000,
            featured: true,
            popular: true,
            category_name: 'سیرک',
            city_name: 'تهران',
            hall_name: 'برج میلاد',
          },
          {
            id: 2,
            title: 'جنگ خنده و شادی کودک و نوجوان',
            slug: 'kids-laugh-show',
            description: 'برنامه‌ای شاد و آموزنده ویژه کودکان و خانواده‌ها',
            organizer_name: 'موسسه کودک شاد',
            min_price: 100000,
            featured: true,
            popular: false,
            category_name: 'کودک',
            city_name: 'تهران',
            hall_name: 'تالار وحدت',
          },
          {
            id: 3,
            title: 'همایش ملی هوش مصنوعی و آینده جوانان',
            slug: 'ai-youth-conference',
            description: 'بررسی فرصت‌های شغلی و تکنولوژی‌های جدید در حوزه هوش مصنوعی',
            organizer_name: 'آکادمی هوش مصنوعی ایران',
            min_price: 200000,
            featured: false,
            popular: true,
            category_name: 'هوش مصنوعی',
            city_name: 'تهران',
            hall_name: 'برج میلاد',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <UserNavbar />

      <main className="flex-1 space-y-16 pb-20">
        {/* Hero Banner Slider */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 border border-slate-800 p-8 sm:p-12 lg:p-16 flex flex-col justify-end min-h-[420px] shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>برنامه ویژه این هفته</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                سیرک بزرگ بین‌المللی تهران
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-2">
                تجربه‌ای هیجان‌انگیز و فراموش‌نشدنی برای تمام اعضای خانواده با حضور برترین آکروبات‌بازان جهان در سالن همایش‌های برج میلاد.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/events/circus-tehran"
                  className="min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>انتخاب سانس و خرید بلیت</span>
                </Link>

                <span className="text-xs text-slate-400 font-mono">
                  شروع قیمت از ۱۵۰,۰۰۰ تومان
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>دسته‌بندی رویدادها</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((cat) => {
              const IconComp = categoryIcons[cat.icon] || Sparkles;
              return (
                <Link
                  key={cat.id}
                  href={`/events?category=${cat.slug}`}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 rounded-2xl p-4 text-center transition-all group flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Events */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>رویدادهای پیشنهادی و ویژه</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">پرطرفدارترین برنامه‌های حال حاضر</p>
            </div>

            <Link
              href="/events"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>مشاهده همه</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden transition-all flex flex-col group"
              >
                {/* Banner Placeholder */}
                <div className="h-48 bg-gradient-to-tr from-slate-800 to-slate-700 relative p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="bg-slate-900/80 backdrop-blur-md text-blue-400 text-xs font-semibold px-3 py-1 rounded-xl border border-slate-700">
                      {ev.category_name || 'رویداد'}
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-xl border border-amber-500/30 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>۴.۹</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                      {ev.organizer_name}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors mb-2">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-800 pt-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{ev.city_name} - {ev.hall_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">شروع قیمت</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {formatPrice(ev.min_price)}
                      </span>
                    </div>

                    <Link
                      href={`/events/${ev.slug}`}
                      className="min-h-[44px] bg-slate-800 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-700 hover:border-blue-500 flex items-center gap-1"
                    >
                      <span>خرید بلیت</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">تضمین اصالت بلیت</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تمامی بلیت‌ها همراه با QR Code اختصاصی و قابلیت اعتبارسنجی در گیت ورودی صادر می‌شوند.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">انتخاب آنلاین صندلی</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  مشاهده نقشه ۲ بعدی سالن‌ها و انتخاب دقیق موقعیت صندلی به صورت لحظه‌ای.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">رزرو گروهی مدارس و سازمان‌ها</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  امکان دریافت پیش‌فاکتور رسمی و تخفیف ویژه برای گروه‌ها و مدارس کشور.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <UserFooter />
    </div>
  );
}
