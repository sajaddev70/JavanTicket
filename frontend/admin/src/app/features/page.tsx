'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { CrudPage } from '@/components/crud/CrudPage';
import { ActiveBadge, Thumb } from '@/components/crud/cells';
import { faNumber } from '@/lib/format';

export default function AdminFeaturesPage() {
  return (
    <AdminLayout>
      <CrudPage
        title="مزایای خرید"
        entity="مزیت"
        crumbs={['محتوای سایت', 'مزایای خرید']}
        description="نوار مزایا در پایین صفحه اصلی سایت (مثل پرداخت امن و پشتیبانی)."
        queryKey={['admin', 'features']}
        listUrl="/admin/features"
        itemUrl={(id) => `/admin/features/${id}`}
        fields={[
          { name: 'title', label: 'عنوان', type: 'text', required: true },
          { name: 'sort_order', label: 'ترتیب نمایش', type: 'number', defaultValue: '0' },
          { name: 'description', label: 'توضیح کوتاه', type: 'text', wide: true },
          { name: 'icon_url', label: 'آیکون', type: 'image', wide: true },
          { name: 'active', label: 'نمایش در سایت', type: 'switch', defaultValue: true },
        ]}
        columns={[
          { key: 'title', label: 'عنوان' },
          { key: 'icon_url', label: 'آیکون', render: (r) => <Thumb src={r.icon_url} className="size-10" /> },
          { key: 'description', label: 'توضیح' },
          { key: 'sort_order', label: 'ترتیب', render: (r) => faNumber(Number(r.sort_order ?? 0)) },
          { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
        ]}
      />
    </AdminLayout>
  );
}
