import Link from 'next/link';
import { ShieldCheck, Phone, Mail, MapPin, Heart } from 'lucide-react';

export default function UserFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                یوت
              </div>
              <span className="font-bold text-base text-white">سامانه بلیت‌فروشی جوانان</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              پلتفرم جامع رزرو آنلاین بلیت رویدادهای فرهنگی، سیرک بین‌المللی، همایش‌های علمی و کنسرت‌های شاد کشور.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">دسترسی سریع</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/events" className="hover:text-blue-400 transition-colors">لیست رویدادها</Link></li>
              <li><Link href="/tickets" className="hover:text-blue-400 transition-colors">بلیت‌های خریداریشده</Link></li>
              <li><Link href="/support" className="hover:text-blue-400 transition-colors">پشتیبانی و سوالات متداول</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">دسته‌بندی‌های محبوب</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/events?category=circus" className="hover:text-blue-400 transition-colors">سیرک بین‌المللی</Link></li>
              <li><Link href="/events?category=child" className="hover:text-blue-400 transition-colors">برنامه‌های کودک و نوجوان</Link></li>
              <li><Link href="/events?category=ai" className="hover:text-blue-400 transition-colors">همایش‌های تکنولوژی و هوش مصنوعی</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">ارتباط با ما</h4>
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>پشتیبانی: ۰۲۱-۸۸۸۸۹۹۹۹</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>ایمیل: info@youthevent.ir</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© تمامی حقوق مادی و معنوی متعلق به سامانه رویدادهای جوانان می‌باشد.</p>
          <p className="flex items-center gap-1">
            <span>طراحی‌شده با</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>برای جوانان ایران</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
