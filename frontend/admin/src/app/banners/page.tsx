'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { CrudPage } from '@/components/crud/CrudPage';
import { ActiveBadge, Thumb } from '@/components/crud/cells';
import { useOptions } from '@/hooks/useOptions';
import { faNumber } from '@/lib/format';

export default function AdminBannersPage() {
  const events = useOptions(['admin', 'events'], '/admin/events', (r) => String(r.title));
  return (
    <AdminLayout>
      <CrudPage
        title="بنرهای صفحه اصلی"
        entity="بنر"
        crumbs={['محتوای سایت', 'بنرها']}
        description="اسلایدهای بالای صفحه اصلی سایت کاربران. اگر بنر به یک رویداد متصل باشد، تاریخ، سالن و شهر از همان رویداد خوانده می‌شود."
        queryKey={['admin', 'banners']}
        listUrl="/admin/banners"
        itemUrl={(id) => `/admin/banners/${id}`}
        searchText={(r) => `${r.title} ${r.subtitle ?? ''}`}
        fields={[
          { name: 'title', label: 'عنوان بنر', type: 'text', required: true, wide: true },
          { name: 'subtitle', label: 'زیرعنوان', type: 'text', wide: true, hint: 'وقتی بنر به رویدادی متصل نیست نمایش داده می‌شود.' },
          { name: 'event_id', label: 'رویداد متصل', type: 'select', numeric: true, options: events.options, emptyLabel: 'بدون رویداد' },
          { name: 'button_text', label: 'متن دکمه', type: 'text', placeholder: 'خرید بلیت' },
          { name: 'link_url', label: 'لینک دکمه', type: 'text', dir: 'ltr', hint: 'برای بنرهای بدون رویداد؛ مثلاً /events' },
          { name: 'sort_order', label: 'ترتیب نمایش', type: 'number', defaultValue: '0' },
          { name: 'image_url', label: 'تصویر بنر', type: 'image', wide: true },
          { name: 'active', label: 'نمایش در سایت', type: 'switch', defaultValue: true },
        ]}
        columns={[
          { key: 'title', label: 'عنوان' },
          { key: 'image_url', label: 'تصویر', render: (r) => <Thumb src={r.image_url} /> },
          { key: 'event_title', label: 'رویداد متصل' },
          { key: 'sort_order', label: 'ترتیب', render: (r) => faNumber(Number(r.sort_order ?? 0)) },
          { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
        ]}
      />
    </AdminLayout>
  );
}
