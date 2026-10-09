'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { CrudPage } from '@/components/crud/CrudPage';
import { ActiveBadge } from '@/components/crud/cells';
import { faDateTime } from '@/lib/format';

export default function AdminPagesPage() {
  return (
    <AdminLayout>
      <CrudPage
        title="صفحات محتوایی"
        entity="صفحه"
        crumbs={['محتوای سایت', 'صفحات']}
        description="هر صفحه در سایت با آدرس /نامک باز می‌شود (مثلاً /about). برای نمایش لینک صفحه در منو، آن را در «منوهای سایت» اضافه کنید."
        queryKey={['admin', 'pages']}
        listUrl="/admin/pages"
        itemUrl={(id) => `/admin/pages/${id}`}
        searchText={(r) => `${r.title} ${r.slug}`}
        fields={[
          { name: 'title', label: 'عنوان', type: 'text', required: true },
          { name: 'slug', label: 'نامک (آدرس)', type: 'text', required: true, dir: 'ltr', placeholder: 'about' },
          { name: 'content', label: 'متن صفحه', type: 'textarea', wide: true, hint: 'هر خط خالی یک پاراگراف جدید می‌سازد.' },
          { name: 'active', label: 'منتشر شده', type: 'switch', defaultValue: true },
        ]}
        columns={[
          { key: 'title', label: 'عنوان' },
          { key: 'slug', label: 'آدرس', render: (r) => <span dir="ltr">/{String(r.slug)}</span> },
          { key: 'updated_at', label: 'آخرین ویرایش', render: (r) => (r.updated_at ? faDateTime(String(r.updated_at)) : '—') },
          { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
        ]}
      />
    </AdminLayout>
  );
}
