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
  ShieldCheck,
  Ticket,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { api } from '@/services/api';

const categoryIconMap: Record<string, any> = {
  Music,
  Building,
  Sparkles,
  Baby,
  Cpu,
  Bot,
  Users,
};

export default function UserHomePage() {
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [settingsRes, bannersRes, categoriesRes, eventsRes]: [any, any, any, any] = await Promise.all([
          api.get('/public/site-settings'),
          api.get('/public/banners'),
          api.get('/public/categories'),
          api.get('/public/events'),
        ]);

        if (settingsRes?.data) setSiteSettings(settingsRes.data);
        if (bannersRes?.data) setBanners(bannersRes.data);
        if (categoriesRes?.data) setCategories(categoriesRes.data);
        if (eventsRes?.data) setEvents(eventsRes.data);
      } catch (e) {
        // Ignored
      } finally {
        setLoading(false);
      }
    }
    loadLiveData();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const activeHero = banners.length > 0 ? banners[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col dir-rtl">
      <UserNavbar />

      <main className="flex-1 space-y-12 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-medium">در حال دریافت رویدادها و اطلاعات از سرور...</span>
          </div>
        ) : (
          <>
            {/* Main Hero Section: Loaded from Banners API */}
            {activeHero ? (
              <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6">
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-slate-800/80 p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[440px] shadow-2xl">
                  <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 max-w-2xl space-y-5">
                    <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>{activeHero.subtitle || 'کنسرت بزرگ و ویژه'}</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                      {activeHero.title}
                    </h1>

                    <div className="space-y-2 text-slate-300 text-sm sm:text-base">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>تهران - سالن همایش‌های بین‌المللی برج میلاد</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>۱۰ و ۱۱ مهر ماه ۱۴۰۳ - سانس‌های ۱۸:۰۰ و ۲۱:۳۰</span>
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
                      اجرای زنده برترین قطعات و خاطره‌انگیزترین ترانه‌ها همراه با ارکستر بزرگ. انتخاب صندلی به‌صورت آنلاین با نقشه اختصاصی.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-4">
                      <Link
                        href={activeHero.link_url || '/events'}
                        className="min-h-[44px] bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm px-7 py-3.5 rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center gap-2"
                      >
                        <Ticket className="w-5 h-5" />
                        <span>{activeHero.button_text || 'انتخاب سانس و خرید بلیت'}</span>
                      </Link>

                      <div className="bg-slate-900/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl text-xs text-slate-300">
                        شروع قیمت بلیت از <span className="font-bold text-emerald-400 font-mono text-sm">۲۵۰,۰۰۰</span> تومان
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Categories Bar */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>دسته‌بندی‌های اصلی برنامه</span>
                </h2>
              </div>

              {categories.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <span>هیچ دسته‌بندی فعالی ثبت نشده است.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {categories.map((cat, idx) => {
                    const IconComp = categoryIconMap[cat.icon] || Sparkles;
                    return (
                      <Link
                        key={idx}
                        href={`/events?category=${cat.slug}`}
                        className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 rounded-2xl p-4 text-center transition-all group flex flex-col items-center justify-center gap-2.5 shadow-md"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
                          <IconComp className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-200 group-hover:text-white">
                          {cat.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Weekly Recommended Events Grid */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <span>رویدادهای برجسته این هفته</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">پرترددترین اجراهای تاییدشده {siteSettings?.site_name || 'مرکز همایش‌های جوان'}</p>
                </div>

                <Link
                  href="/events"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>مشاهده لیست کامل</span>
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
                  <FolderOpen className="w-8 h-8 text-slate-600" />
                  <span>در حال حاضر هیچ رویدادی برای نمایش ثبت نشده است.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((ev, i) => (
                    <div
                      key={i}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden transition-all flex flex-col group shadow-xl"
                    >
                      <div className="h-44 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 relative p-4 flex flex-col justify-between border-b border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-xl border border-blue-500/30 backdrop-blur-md">
                            {ev.category_name || 'رویداد'}
                          </span>
                          <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-xl border border-amber-500/30 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>۴.۹</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800 backdrop-blur-sm font-medium">
                            {ev.organizer_name || 'سامانه جوان تیکت'}
                          </span>
                          {ev.featured && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              ویژه
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors mb-2">
                            {ev.title}
                          </h3>
                          <div className="space-y-1.5 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                              <span className="truncate">{ev.city_name} - {ev.hall_name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-500 block">قیمت بلیت</span>
                            <span className="text-sm font-bold text-emerald-400 font-mono">
                              {formatPrice(ev.min_price || 150000)}
                            </span>
                          </div>

                          <Link
                            href={`/events/${ev.slug}`}
                            className="min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1"
                          >
                            <span>رزرو صندلی</span>
                            <ChevronLeft className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Key Platform Features / Badges */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">صدور بلیت آنلاین با QR بارکد</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      تضمین عدم تشابه بلیت و ورود سریع به سالن از طریق گیت‌های هوشمند.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">انتخاب هوشمند صندلی</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      مشاهده موقعیت سن، زوایای دید و رزرو مستقیم صندلی به صورت آنلاین.
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
                      ارائه پیش‌فاکتور رسمی و تخفیف‌های ویژه ارگان‌ها و مدارس کشور.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <UserFooter />
    </div>
  );
}
