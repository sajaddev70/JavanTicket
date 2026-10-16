'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { CrudPage } from '@/components/crud/CrudPage';
import { ActiveBadge, Thumb } from '@/components/crud/cells';

const KEYS: Record<string, string> = {
  HOME_HERO: 'سربرگ صفحه اصلی',
  HOME_CTA: 'بنر دعوت به خرید (صفحه اصلی)',
  EVENTS_HERO: 'سربرگ صفحه رویدادها',
  SEAT_HERO: 'سربرگ صفحه انتخاب صندلی',
};

export default function AdminPageBlocksPage() {
  return (
    <AdminLayout>
      <CrudPage
        title="سربرگ‌ها و بنرهای صفحات"
        entity="بلوک"
        crumbs={['محتوای سایت', 'سربرگ‌ها']}
        description="متن و تصویر سربرگ صفحه اصلی، صفحه رویدادها، صفحه انتخاب صندلی و بنر «خرید بلیت، فقط چند کلیک فاصله دارد»."
        queryKey={['admin', 'page-blocks']}
        listUrl="/admin/page-blocks"
        itemUrl={(id) => `/admin/page-blocks/${id}`}
        fields={[
          { name: 'block_key', label: 'جایگاه', type: 'select', required: true, options: Object.entries(KEYS).map(([value, label]) => ({ value, label })) },
          { name: 'kicker', label: 'متن کوچک بالای عنوان', type: 'text' },
          { name: 'title', label: 'عنوان', type: 'text', wide: true },
          { name: 'subtitle', label: 'زیرعنوان', type: 'textarea', wide: true },
          { name: 'button_text', label: 'متن دکمه', type: 'text' },
          { name: 'button_url', label: 'لینک دکمه', type: 'text', dir: 'ltr' },
          { name: 'image_url', label: 'تصویر', type: 'image', wide: true },
          { name: 'active', label: 'فعال', type: 'switch', defaultValue: true },
        ]}
        columns={[
          { key: 'block_key', label: 'جایگاه', render: (r) => KEYS[String(r.block_key)] ?? String(r.block_key) },
          { key: 'title', label: 'عنوان' },
          { key: 'image_url', label: 'تصویر', render: (r) => <Thumb src={r.image_url} /> },
          { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
        ]}
      />
    </AdminLayout>
  );
}
