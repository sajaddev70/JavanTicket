'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { CrudPage } from '@/components/crud/CrudPage';
import { ActiveBadge, ColorDot } from '@/components/crud/cells';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { faNumber } from '@/lib/format';

export default function AdminCategoriesPage() {
  return (
    <AdminLayout>
      <CrudPage
        title="دسته‌بندی رویدادها"
        entity="دسته‌بندی"
        description="دسته‌بندی‌های صفحه اصلی و صفحه رویدادها، رنگ برچسب رویدادها و رنگ تقویم چرخشی از این بخش می‌آیند."
        queryKey={['admin', 'categories']}
        listUrl="/admin/categories"
        itemUrl={(id) => `/admin/categories/${id}`}
        searchText={(r) => `${r.name} ${r.slug}`}
        fields={[
          { name: 'name', label: 'نام', type: 'text', required: true },
          { name: 'slug', label: 'نامک', type: 'text', required: true, dir: 'ltr' },
          { name: 'tagline', label: 'شعار کوتاه', type: 'text', wide: true },
          { name: 'color', label: 'رنگ', type: 'color' },
          { name: 'sort_order', label: 'ترتیب نمایش', type: 'number', defaultValue: '0' },
          { name: 'icon_url', label: 'آیکون (SVG خطی)', type: 'image', wide: true, hint: 'با رنگ دسته‌بندی نمایش داده می‌شود.' },
          { name: 'image_url', label: 'تصویر کارت دسته‌بندی', type: 'image', wide: true },
          { name: 'cover_url', label: 'تصویر پیش‌فرض رویدادها', type: 'image', wide: true },
          { name: 'active', label: 'نمایش در سایت', type: 'switch', defaultValue: true },
        ]}
        columns={[
          { key: 'name', label: 'نام' },
          { key: 'icon_url', label: 'آیکون', render: (r) => <SvgIcon src={String(r.icon_url ?? '')} className="size-7" style={{ color: String(r.color ?? '#2f80f5') }} /> },
          { key: 'tagline', label: 'شعار' },
          { key: 'color', label: 'رنگ', render: (r) => <ColorDot color={r.color} /> },
          { key: 'events_count', label: 'رویدادها', render: (r) => faNumber(Number(r.events_count ?? 0)) },
          { key: 'sort_order', label: 'ترتیب', render: (r) => faNumber(Number(r.sort_order ?? 0)) },
          { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
        ]}
      />
    </AdminLayout>
  );
}
