'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { CrudPage } from '@/components/crud/CrudPage';
import { ActiveBadge } from '@/components/crud/cells';
import { faDate, faNumber } from '@/lib/format';

export default function AdminDiscountsPage() {
  return (
    <AdminLayout>
      <CrudPage
        title="تخفیف و کد معرف"
        entity="کد تخفیف"
        description="کدهایی که کاربران هنگام انتخاب صندلی و پرداخت وارد می‌کنند."
        queryKey={['admin', 'discounts']}
        listUrl="/admin/discounts"
        itemUrl={(id) => `/admin/discounts/${id}`}
        searchText={(r) => `${r.code} ${r.title ?? ''}`}
        fields={[
          { name: 'code', label: 'کد', type: 'text', required: true, dir: 'ltr', placeholder: 'JAVAN20' },
          { name: 'title', label: 'عنوان', type: 'text' },
          { name: 'discount_type', label: 'نوع تخفیف', type: 'select', required: true, defaultValue: 'PERCENT', options: [{ value: 'PERCENT', label: 'درصدی' }, { value: 'AMOUNT', label: 'مبلغ ثابت (تومان)' }] },
          { name: 'value', label: 'مقدار', type: 'number', required: true },
          { name: 'max_uses', label: 'حداکثر تعداد استفاده', type: 'number', hint: 'خالی = نامحدود' },
          { name: 'active', label: 'فعال', type: 'switch', defaultValue: true },
          { name: 'valid_from', label: 'شروع اعتبار', type: 'datetime' },
          { name: 'valid_to', label: 'پایان اعتبار', type: 'datetime' },
        ]}
        columns={[
          { key: 'code', label: 'کد', render: (r) => <span dir="ltr" className="font-mono">{String(r.code)}</span> },
          { key: 'title', label: 'عنوان' },
          { key: 'value', label: 'مقدار', render: (r) => (r.discount_type === 'PERCENT' ? `${faNumber(Number(r.value))}٪` : `${faNumber(Number(r.value))} تومان`) },
          { key: 'used_count', label: 'استفاده', className: 'tabular', render: (r) => `${faNumber(Number(r.used_count))} / ${r.max_uses ? faNumber(Number(r.max_uses)) : '∞'}` },
          { key: 'valid_to', label: 'پایان اعتبار', render: (r) => (r.valid_to ? faDate(String(r.valid_to)) : '—') },
          { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
        ]}
      />
    </AdminLayout>
  );
}
