'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { CrudPage } from '@/components/crud/CrudPage';
import { ActiveBadge, Badge } from '@/components/crud/cells';
import { faDateTime } from '@/lib/format';

const ALERT_TYPES: Record<string, { label: string; tone: 'brand' | 'warning' | 'success' | 'danger' }> = {
  INFO: { label: 'اطلاع‌رسانی', tone: 'brand' },
  WARNING: { label: 'هشدار', tone: 'warning' },
  SUCCESS: { label: 'موفق', tone: 'success' },
  DANGER: { label: 'بحرانی', tone: 'danger' },
};

export default function AdminAlertsPage() {
  return (
    <AdminLayout>
      <CrudPage
        title="هشدارها و اعلان‌ها"
        entity="هشدار"
        description="هشدارهای فعال در داشبورد و شمارنده اعلان‌های سربرگ پنل نمایش داده می‌شوند."
        queryKey={['admin', 'alerts']}
        listUrl="/admin/alerts"
        itemUrl={(id) => `/admin/alerts/${id}`}
        invalidate={[['dashboard', 'alerts']]}
        searchText={(r) => `${r.title} ${r.message}`}
        fields={[
          { name: 'title', label: 'عنوان', type: 'text', required: true },
          { name: 'alert_type', label: 'نوع', type: 'select', required: true, defaultValue: 'INFO', options: Object.entries(ALERT_TYPES).map(([value, t]) => ({ value, label: t.label })) },
          { name: 'message', label: 'متن', type: 'textarea', required: true, wide: true },
          { name: 'active', label: 'فعال', type: 'switch', defaultValue: true },
        ]}
        columns={[
          { key: 'title', label: 'عنوان' },
          { key: 'alert_type', label: 'نوع', render: (r) => { const t = ALERT_TYPES[String(r.alert_type)]; return <Badge tone={t?.tone}>{t?.label ?? String(r.alert_type)}</Badge>; } },
          { key: 'message', label: 'متن', className: 'max-w-md' },
          { key: 'created_at', label: 'زمان ثبت', render: (r) => (r.created_at ? faDateTime(String(r.created_at)) : '—') },
          { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
        ]}
      />
    </AdminLayout>
  );
}
