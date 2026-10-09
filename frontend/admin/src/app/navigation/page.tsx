'use client';

import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage, type Row } from '@/components/crud/CrudPage';
import { ActiveBadge, Badge } from '@/components/crud/cells';
import { apiGet } from '@/services/api';
import { faNumber } from '@/lib/format';

const PLACEMENTS: Record<string, string> = { HEADER: 'منوی بالای سایت', FOOTER: 'ستون فوتر' };

/** Link groups (header menu, footer columns) and their links. */
export default function AdminNavigationPage() {
  const groups = useQuery({ queryKey: ['admin', 'navigation'], queryFn: () => apiGet<(Row & { links: Row[] })[]>('/admin/navigation') });
  const groupOptions = (groups.data ?? []).map((g) => ({ value: g.id, label: `${g.title} (${PLACEMENTS[String(g.placement)]})` }));
  const groupTitle = new Map((groups.data ?? []).map((g) => [g.id, String(g.title)]));

  return (
    <AdminLayout>
      <PageHeader title="منوهای سایت" crumbs={['محتوای سایت', 'منوها']} />
      <p className="-mt-2 mb-6 text-sm leading-7 text-muted">
        گروهِ «منوی بالای سایت» لینک‌های سربرگ را می‌سازد و هر گروهِ «ستون فوتر» یک ستون در فوتر سایت است. گروه‌ها و لینک‌های غیرفعال نمایش داده نمی‌شوند.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="mb-3 text-lg font-extrabold text-ink">گروه‌ها</h2>
          <CrudPage
            embedded
            title="گروه‌ها"
            entity="گروه"
            queryKey={['admin', 'navigation']}
            listUrl="/admin/navigation"
            createUrl="/admin/link-groups"
            itemUrl={(id) => `/admin/link-groups/${id}`}
            fields={[
              { name: 'title', label: 'عنوان گروه', type: 'text', required: true },
              { name: 'placement', label: 'محل نمایش', type: 'select', required: true, defaultValue: 'FOOTER', options: Object.entries(PLACEMENTS).map(([value, label]) => ({ value, label })) },
              { name: 'sort_order', label: 'ترتیب', type: 'number', defaultValue: '0' },
              { name: 'active', label: 'فعال', type: 'switch', defaultValue: true },
            ]}
            columns={[
              { key: 'title', label: 'عنوان' },
              { key: 'placement', label: 'محل نمایش', render: (r) => <Badge tone="brand">{PLACEMENTS[String(r.placement)]}</Badge> },
              { key: 'links', label: 'لینک‌ها', render: (r) => faNumber((r.links as unknown[])?.length ?? 0) },
              { key: 'sort_order', label: 'ترتیب', render: (r) => faNumber(Number(r.sort_order ?? 0)) },
              { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold text-ink">لینک‌ها</h2>
          <CrudPage
            embedded
            title="لینک‌ها"
            entity="لینک"
            queryKey={['admin', 'navigation', 'links']}
            listUrl="/admin/navigation"
            createUrl="/admin/links"
            transform={(data) => (data as { links: Row[] }[]).flatMap((g) => g.links)}
            itemUrl={(id) => `/admin/links/${id}`}
            invalidate={[['admin', 'navigation']]}
            searchText={(r) => `${r.title} ${r.url}`}
            fields={[
              { name: 'group_id', label: 'گروه', type: 'select', numeric: true, required: true, options: groupOptions },
              { name: 'title', label: 'عنوان لینک', type: 'text', required: true },
              { name: 'url', label: 'آدرس', type: 'text', required: true, dir: 'ltr', placeholder: '/about', hint: 'آدرس داخلی با / یا آدرس کامل با https://' },
              { name: 'sort_order', label: 'ترتیب', type: 'number', defaultValue: '0' },
              { name: 'open_in_new_tab', label: 'باز شدن در زبانه جدید', type: 'switch' },
              { name: 'active', label: 'فعال', type: 'switch', defaultValue: true },
            ]}
            columns={[
              { key: 'title', label: 'عنوان' },
              { key: 'url', label: 'آدرس', render: (r) => <span dir="ltr">{String(r.url)}</span> },
              { key: 'group_id', label: 'گروه', render: (r) => groupTitle.get(Number(r.group_id)) ?? '—' },
              { key: 'sort_order', label: 'ترتیب', render: (r) => faNumber(Number(r.sort_order ?? 0)) },
              { key: 'active', label: 'وضعیت', render: (r) => <ActiveBadge active={r.active} /> },
            ]}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
