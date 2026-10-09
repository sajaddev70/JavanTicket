'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { CrudPage } from '@/components/crud/CrudPage';
import { faDateTime } from '@/lib/format';

export default function AdminNewsletterPage() {
  return (
    <AdminLayout>
      <CrudPage
        title="اعضای خبرنامه"
        entity="عضو"
        crumbs={['محتوای سایت', 'خبرنامه']}
        description="ایمیل‌هایی که از فرم خبرنامه فوتر سایت ثبت شده‌اند."
        queryKey={['admin', 'newsletter']}
        listUrl="/admin/newsletter"
        itemUrl={(id) => `/admin/newsletter/${id}`}
        searchText={(r) => String(r.email)}
        emptyMessage="هنوز کسی در خبرنامه عضو نشده است."
        columns={[
          { key: 'email', label: 'ایمیل', render: (r) => <span dir="ltr">{String(r.email)}</span> },
          { key: 'created_at', label: 'زمان عضویت', render: (r) => (r.created_at ? faDateTime(String(r.created_at)) : '—') },
        ]}
      />
    </AdminLayout>
  );
}
