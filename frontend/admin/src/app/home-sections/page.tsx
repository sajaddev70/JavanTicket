'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { CrudPage } from '@/components/crud/CrudPage';
import { ActiveBadge } from '@/components/crud/cells';
import { useOptions } from '@/hooks/useOptions';
import { faNumber } from '@/lib/format';

const SECTION_TYPES: Record<string, string> = {
  THIS_WEEK: 'رویدادهای این هفته',
  FEATURED: 'رویدادهای ویژه',
  POPULAR: 'رویدادهای محبوب',
  LATEST: 'جدیدترین رویدادها',
  CATEGORY: 'رویدادهای یک دسته‌بندی',
};

export default function AdminHomeSectionsPage() {
  const categories = useOptions(['admin', 'categories'], '/admin/categories', (r) => String(r.name));
  return (
    <AdminLayout>
      <CrudPage
        title="بخش‌های صفحه اصلی"
        entity="بخش"
        crumbs={['محتوای سایت', 'بخش‌های صفحه اصلی']}
        description="ردیف‌های رویداد صفحه اصلی سایت، به همان ترتیبی که اینجا تعیین می‌کنید نمایش داده می‌شوند."
        queryKey={['admin', 'home-sections']}
        listUrl="/admin/home-sections"
        itemUrl={(id) => `/admin/home-sections/${id}`}
        fields={[
          { name: 'title', label: 'عنوان', type: 'text', required: true },
          { name: 'subtitle', label: 'زیرعنوان', type: 'text' },
          {
            name: 'section_type',
            label: 'رویدادهای این بخش',
            type: 'select',
            required: true,
            defaultValue: 'LATEST',
            options: Object.entries(SECTION_TYPES).map(([value, label]) => ({ value, label })),
          },
          { name: 'category_id', label: 'دسته‌بندی', type: 'select', numeric: true, required: true, options: categories.options, visible: (v) => v.section_type === 'CATEGORY' },
          { name: 'item_limit', label: 'تعداد رویداد', type: 'number', defaultValue: '5', hint: 'بین ۱ تا ۲۰' },
          { name: 'sort_order', label: 'ترتیب نمایش', type: 'number', defaultValue: '0' },
          { name: 'active', label: 'نمایش در سایت', type: 'switch', defaultValue: true },
        ]}
        columns={[
          { key: 'title', label: 'عنوان' },
          { key: 'section_type', label: 'نوع', render: (r) => SECTION_TYPES[String(r.section_type)] + (r.category_name ? ` (${r.category_name})` : '') },
          { key: 'item_limit', label: 'تعداد', render: (r) => faNumber(Number(r.item_limit ?? 0)) },
          { key: 'sort_order', label: 'ترتیب', render: (r) => faNumber(Number(r.sort_order ?? 0)) },
          { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
        ]}
      />
    </AdminLayout>
  );
}
