'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination } from '@/components/ui/Pagination';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { DataTable, IconButton, type DataColumn } from '@/components/data/DataTable';
import { DateRangePicker, ExportButton, FilterChips, SearchInput, type DateRange } from '@/components/data/Filters';
import { DetailGrid } from '@/components/data/Detail';
import { apiGet } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Page } from '@/services/admin';
import type { Metric } from '@/services/dashboard';
import { cleanParams, downloadFile } from '@/lib/download';
import { LOG_ACTION, options } from '@/lib/labels';
import { faDateTime, faNumber, faTimeAgo } from '@/lib/format';

interface LogRow {
  id: number;
  user_id?: number | null;
  actor_mobile?: string | null;
  actor_name?: string | null;
  action: string;
  section?: string | null;
  section_title?: string | null;
  description?: string | null;
  method?: string | null;
  path?: string | null;
  status_code?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

interface Summary {
  today: Metric;
  logins: Metric;
  activeAdmins: Metric;
  deletes: Metric;
  actors: { id: number; name: string }[];
  sections: { code: string; title: string }[];
}

export default function AdminActivityLogsPage() {
  const [action, setAction] = useState('');
  const [section, setSection] = useState('');
  const [user, setUser] = useState('');
  const [q, setQ] = useState('');
  const [range, setRange] = useState<DateRange>({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(15);
  const [open, setOpen] = useState<LogRow | null>(null);

  const summary = useQuery({ queryKey: ['admin', 'activity-logs', 'summary'], queryFn: () => apiGet<Summary>('/admin/activity-logs/summary') });
  const filters = { action, section, userId: user, q, from: range.from, to: range.to };
  const list = useQuery({
    queryKey: ['admin', 'activity-logs', 'list', filters, page, size],
    queryFn: () => apiGet<Page<LogRow>>('/admin/activity-logs', cleanParams({ ...filters, page, size })),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const s = summary.data;
  const compare = 'نسبت به دیروز';

  const columns: DataColumn<LogRow>[] = [
    {
      key: 'time',
      label: 'زمان',
      render: (l) => (
        <div>
          <div className="font-bold">{faTimeAgo(l.created_at)}</div>
          <div className="text-[12px] text-muted">{faDateTime(l.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'actor',
      label: 'کاربر',
      render: (l) => (
        <div>
          <div className="font-bold">{l.actor_name ?? '—'}</div>
          {l.actor_mobile && <div dir="ltr" className="text-right text-[12px] text-muted">{l.actor_mobile}</div>}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'عملیات',
      center: true,
      render: (l) => {
        const st = statusOf(LOG_ACTION, l.action);
        return <StatusPill tone={st.tone}>{st.label}</StatusPill>;
      },
    },
    { key: 'section', label: 'بخش', center: true, render: (l) => l.section_title ?? '—' },
    { key: 'desc', label: 'شرح', render: (l) => <span className="line-clamp-2 max-w-[380px]">{l.description ?? '—'}</span> },
    { key: 'ip', label: 'آی‌پی', center: true, render: (l) => <span dir="ltr" className="font-mono text-[12px] text-muted">{l.ip_address ?? '—'}</span> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader title="لاگ فعالیت‌ها" crumbs={['تنظیمات و زیرساخت', 'لاگ فعالیت‌ها']} action={<ExportButton onExport={() => downloadFile('/admin/activity-logs/export', filters, 'activity-log.csv')} />} />

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <StatTile title="فعالیت‌های امروز" value={faNumber(s?.today.value)} unit="رویداد ثبت‌شده" icon="admin/audit-log" color="blue" changePercent={s?.today.changePercent} compareLabel={compare} loading={summary.isLoading} />
          <StatTile title="ورودهای امروز" value={faNumber(s?.logins.value)} unit="ورود به پنل" icon="common/shield-check" color="green" changePercent={s?.logins.changePercent} compareLabel={compare} loading={summary.isLoading} />
          <StatTile title="مدیران فعال امروز" value={faNumber(s?.activeAdmins.value)} unit="نفر" icon="admin/admins" color="purple" changePercent={s?.activeAdmins.changePercent} compareLabel={compare} loading={summary.isLoading} />
          <StatTile title="حذف‌های ۷ روز اخیر" value={faNumber(s?.deletes.value)} unit="مورد حذف" icon="status/danger" color="red" changePercent={s?.deletes.changePercent} compareLabel="نسبت به ۷ روز قبل" loading={summary.isLoading} />
        </div>

        <Card className="space-y-3 p-3 sm:p-4">
          <FilterChips value={action} onChange={reset(setAction)} allLabel="همه عملیات" options={options(LOG_ACTION)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SearchInput value={q} onChange={reset(setQ)} placeholder="شرح، نام، موبایل یا آی‌پی..." />
            <FilterSelect value={user} onChange={reset(setUser)} options={(s?.actors ?? []).map((a) => ({ value: a.id, label: a.name }))} allLabel="همه کاربران" />
            <FilterSelect value={section} onChange={reset(setSection)} options={(s?.sections ?? []).map((x) => ({ value: x.code, label: x.title }))} allLabel="همه بخش‌ها" />
          </div>
          <DateRangePicker value={range} onChange={reset(setRange)} allowAll />
        </Card>

        <Card className="p-3 sm:p-4">
          <DataTable
            columns={columns}
            rows={list.data?.items}
            rowKey={(l) => l.id}
            loading={list.isFetching}
            error={list.isError ? errorMessage(list.error, 'دریافت لاگ‌ها با خطا مواجه شد.') : null}
            onRetry={() => list.refetch()}
            emptyMessage="فعالیتی مطابق فیلترها ثبت نشده است."
            onRowClick={setOpen}
            actions={(l) => (
              <IconButton label="جزئیات" onClick={() => setOpen(l)}>
                <Eye className="size-5" />
              </IconButton>
            )}
          />
          {!!list.data?.total && <Pagination page={page} pageSize={size} total={list.data.total} onPage={setPage} onPageSize={reset(setSize)} unit="رویداد" sizes={[15, 30, 50, 100]} />}
        </Card>
      </div>

      <Modal open={!!open} title="جزئیات فعالیت" onClose={() => setOpen(null)} className="sm:max-w-2xl">
        {open && (
          <DetailGrid
            items={[
              ['زمان', faDateTime(open.created_at)],
              ['کاربر', `${open.actor_name ?? '—'} ${open.actor_mobile ? `(${open.actor_mobile})` : ''}`],
              ['عملیات', statusOf(LOG_ACTION, open.action).label],
              ['بخش', open.section_title ?? '—'],
              ['شرح', open.description ?? '—'],
              ['درخواست', open.method ? <span key="r" dir="ltr" className="font-mono text-[12px]">{open.method} {open.path}</span> : '—'],
              ['نتیجه', open.status_code ? faNumber(open.status_code) : '—'],
              ['آی‌پی', <span key="ip" dir="ltr" className="font-mono">{open.ip_address ?? '—'}</span>],
              ['مرورگر', <span key="ua" dir="ltr" className="break-all text-[12px] font-normal">{open.user_agent ?? '—'}</span>],
            ]}
          />
        )}
      </Modal>
    </AdminLayout>
  );
}
