'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { InlineAlert, primaryButton, secondaryButton } from '@/components/ui/Field';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination } from '@/components/ui/Pagination';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { DataTable, IconButton, type DataColumn } from '@/components/data/DataTable';
import { FilterChips, SearchInput } from '@/components/data/Filters';
import { useAdminProfile } from '@/hooks/useAdmin';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Page } from '@/services/admin';
import type { Metric } from '@/services/dashboard';
import { cleanParams } from '@/lib/download';
import { USER_STATUS, USER_TYPE, options } from '@/lib/labels';
import { faDate, faNumber, faTimeAgo, normalizeIranMobile } from '@/lib/format';
import { cn } from '@/lib/cn';

interface UserRow {
  id: number;
  mobile: string;
  full_name?: string | null;
  email?: string | null;
  status: string;
  user_type: string;
  notes?: string | null;
  created_at: string;
  last_login_at?: string | null;
  role_titles?: string | null;
  role_ids: number[];
  orders_count: number;
  main_admin: boolean;
}

interface RoleRow {
  id: number;
  name: string;
  title_fa: string;
  description?: string | null;
  system_role: boolean;
  users_count: number;
  permissions: string[];
}

interface Summary {
  users: Metric;
  admins: Metric;
  newUsers: Metric;
  disabled: number;
  adminsOnlineToday: number;
}

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <Suspense>
        <UsersScreen />
      </Suspense>
    </AdminLayout>
  );
}

function UsersScreen() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const me = useAdminProfile();
  const [type, setType] = useState(params.get('type') ?? 'ADMIN');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [editing, setEditing] = useState<UserRow | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);
  const [error, setError] = useState('');

  const summary = useQuery({ queryKey: ['admin', 'users', 'summary'], queryFn: () => apiGet<Summary>('/admin/users/summary') });
  const roles = useQuery({ queryKey: ['admin', 'roles'], queryFn: () => apiGet<RoleRow[]>('/admin/roles') });
  const filters = { type, status, roleId: role, q };
  const list = useQuery({
    queryKey: ['admin', 'users', 'list', filters, page, size],
    queryFn: () => apiGet<Page<UserRow>>('/admin/users', cleanParams({ ...filters, page, size })),
    placeholderData: keepPreviousData,
  });
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'crm'] });
  };
  async function toggle(u: UserRow) {
    setError('');
    try {
      await apiPost(`/admin/users/${u.id}/status`, { status: u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' });
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'تغییر وضعیت با خطا مواجه شد.'));
    }
  }

  const columns: DataColumn<UserRow>[] = [
    {
      key: 'name',
      label: 'کاربر',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold', u.user_type === 'ADMIN' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300' : 'bg-brand-50 text-brand-600')}>
            {u.user_type === 'ADMIN' ? <ShieldCheck className="size-5" /> : (u.full_name ?? '؟').trim().slice(0, 1)}
          </span>
          <div className="min-w-0">
            <div className="truncate font-extrabold">
              {u.full_name || 'بدون نام'}
              {u.main_admin && <span className="mr-2 rounded-md bg-warning/15 px-1.5 py-0.5 text-[11px] font-bold text-warning-fg">مدیر اصلی</span>}
              {me.data?.id === u.id && <span className="mr-2 rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-600">شما</span>}
            </div>
            <div dir="ltr" className="text-right text-[12px] text-muted">{u.mobile}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'نوع حساب',
      center: true,
      render: (u) => {
        const st = statusOf(USER_TYPE, u.user_type);
        return <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>;
      },
    },
    { key: 'roles', label: type === 'USER' ? 'سفارش‌ها' : 'نقش‌ها', render: (u) => (u.user_type === 'ADMIN' ? <span className="text-[13px]">{u.role_titles ?? '—'}</span> : `${faNumber(u.orders_count)} سفارش`) },
    { key: 'email', label: 'ایمیل', render: (u) => <span dir="ltr" className="text-[13px]">{u.email ?? '—'}</span> },
    { key: 'login', label: 'آخرین ورود', center: true, render: (u) => (u.last_login_at ? faTimeAgo(u.last_login_at) : '—') },
    { key: 'created', label: 'تاریخ ایجاد', center: true, render: (u) => faDate(u.created_at) },
    {
      key: 'status',
      label: 'وضعیت',
      center: true,
      render: (u) => {
        const st = statusOf(USER_STATUS, u.status);
        return <StatusPill tone={st.tone}>{st.label}</StatusPill>;
      },
    },
  ];
  const s = summary.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="کاربران و مدیران"
        crumbs={['کاربران و مدیران']}
        action={
          <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12 px-6')}>
            <Plus className="size-5" />
            افزودن حساب
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatTile title="کاربران سایت" value={faNumber(s?.users.value)} unit="حساب کاربری" icon="admin/crm" color="blue" changePercent={s?.users.changePercent} loading={summary.isLoading} />
        <StatTile title="عضویت‌های این ماه" value={faNumber(s?.newUsers.value)} unit="کاربر جدید" icon="common/profile" color="green" changePercent={s?.newUsers.changePercent} loading={summary.isLoading} />
        <StatTile title="مدیران پنل" value={faNumber(s?.admins.value)} unit={`${faNumber(s?.adminsOnlineToday)} نفر امروز وارد شده‌اند`} icon="admin/admins" color="purple" changePercent={s?.admins.changePercent} loading={summary.isLoading} />
        <StatTile title="حساب‌های غیرفعال" value={faNumber(s?.disabled)} unit="کاربر و مدیر" icon="status/inactive" color="red" changePercent={null} loading={summary.isLoading} />
      </div>

      <Card className="space-y-3 p-3 sm:p-4">
        <FilterChips value={type} onChange={reset(setType)} allLabel="همه حساب‌ها" options={[{ value: 'ADMIN', label: 'مدیران پنل' }, { value: 'USER', label: 'کاربران سایت' }]} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SearchInput value={q} onChange={reset(setQ)} placeholder="نام، موبایل یا ایمیل..." />
          <FilterSelect value={status} onChange={reset(setStatus)} options={options(USER_STATUS)} allLabel="همه وضعیت‌ها" />
          <FilterSelect value={role} onChange={reset(setRole)} options={(roles.data ?? []).map((r) => ({ value: r.id, label: r.title_fa }))} allLabel="همه نقش‌ها" />
        </div>
      </Card>

      {error && <InlineAlert tone="error">{error}</InlineAlert>}

      <Card className="p-3 sm:p-4">
        <DataTable
          columns={columns}
          rows={list.data?.items}
          rowKey={(u) => u.id}
          loading={list.isFetching}
          error={list.isError ? errorMessage(list.error, 'دریافت کاربران با خطا مواجه شد.') : null}
          onRetry={() => list.refetch()}
          emptyMessage="حسابی مطابق فیلترها پیدا نشد."
          minWidth={1000}
          actions={(u) => (
            <>
              <IconButton label="ویرایش" onClick={() => setEditing(u)}>
                <Pencil className="size-5" />
              </IconButton>
              <IconButton
                label={u.status === 'ACTIVE' ? 'غیرفعال کردن' : 'فعال کردن'}
                tone={u.status === 'ACTIVE' ? 'muted' : 'success'}
                onClick={() => toggle(u)}
                disabled={u.main_admin || me.data?.id === u.id}
              >
                {u.status === 'ACTIVE' ? <Ban className="size-5" /> : <CheckCircle2 className="size-5" />}
              </IconButton>
              <IconButton label="حذف" tone="danger" onClick={() => setToDelete(u)} disabled={u.main_admin || me.data?.id === u.id}>
                <Trash2 className="size-5" />
              </IconButton>
            </>
          )}
        />
        {!!list.data?.total && <Pagination page={page} pageSize={size} total={list.data.total} onPage={setPage} onPageSize={reset(setSize)} unit="حساب" sizes={[10, 20, 50]} />}
      </Card>

      {editing && (
        <UserForm key={editing === 'new' ? 'new' : editing.id} user={editing === 'new' ? null : editing} defaultType={type || 'ADMIN'} roles={roles.data ?? []} onClose={() => setEditing(null)} onSaved={refresh} />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف حساب"
        message={`آیا از حذف حساب «${toDelete?.full_name || toDelete?.mobile}» اطمینان دارید؟ حساب‌های دارای سفارش فقط غیرفعال می‌شوند.`}
        onConfirm={async () => {
          if (!toDelete) return;
          const u = toDelete;
          setToDelete(null);
          setError('');
          try {
            await apiDelete(`/admin/users/${u.id}`);
            refresh();
          } catch (err) {
            setError(errorMessage(err, 'حذف حساب با خطا مواجه شد.'));
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

function UserForm({ user, defaultType, roles, onClose, onSaved }: { user: UserRow | null; defaultType: string; roles: RoleRow[]; onClose: () => void; onSaved: () => void }) {
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [name, setName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [type, setType] = useState(user?.user_type ?? defaultType);
  const [status, setStatus] = useState(user?.status ?? 'ACTIVE');
  const [notes, setNotes] = useState(user?.notes ?? '');
  const [roleIds, setRoleIds] = useState<number[]>(user?.role_ids ?? []);
  const [localError, setLocalError] = useState('');

  const save = useMutation({
    mutationFn: () => {
      const body = { mobile: normalizeIranMobile(mobile), full_name: name, email: email || null, user_type: type, status, notes, role_ids: type === 'ADMIN' ? roleIds : [] };
      return user ? apiPut(`/admin/users/${user.id}`, body) : apiPost('/admin/users', body);
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });
  const control = 'h-12 w-full rounded-xl border border-line bg-field px-3.5 text-[15px] text-ink outline-none focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10 disabled:opacity-60';
  const label = 'mb-1.5 block text-[13px] font-semibold text-ink/80';

  return (
    <Modal open title={user ? `ویرایش حساب ${user.full_name || user.mobile}` : 'افزودن حساب'} onClose={onClose} className="sm:max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!normalizeIranMobile(mobile)) {
            setLocalError('شماره همراه معتبر نیست. (نمونه: 09123456789)');
            return;
          }
          if (type === 'ADMIN' && roleIds.length === 0) {
            setLocalError('برای حساب مدیر حداقل یک نقش انتخاب کنید.');
            return;
          }
          setLocalError('');
          save.mutate();
        }}
        className="space-y-4"
      >
        {(localError || save.isError) && <InlineAlert tone="error">{localError || errorMessage(save.error, 'ذخیره حساب با خطا مواجه شد.')}</InlineAlert>}
        {user?.main_admin && <InlineAlert tone="success">این حساب مدیر اصلی سامانه است؛ شماره، نوع، وضعیت و نقش مدیر ارشد آن ثابت می‌ماند.</InlineAlert>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className={label}>
              شماره همراه <span className="text-danger">*</span>
            </span>
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} required dir="ltr" placeholder="09123456789" disabled={user?.main_admin} className={cn(control, 'text-left')} />
            <span className="mt-1 block text-[12px] text-muted">ورود به پنل با کد یکبارمصرف به همین شماره انجام می‌شود.</span>
          </label>
          <label className="block">
            <span className={label}>نام و نام خانوادگی</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={control} />
          </label>
          <label className="block">
            <span className={label}>ایمیل</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" type="email" maxLength={100} className={cn(control, 'text-left')} />
          </label>
          <label className="block">
            <span className={label}>نوع حساب</span>
            <select value={type} onChange={(e) => setType(e.target.value)} disabled={user?.main_admin} className={control}>
              {options(USER_TYPE).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>وضعیت</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={user?.main_admin} className={control}>
              {options(USER_STATUS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {type === 'ADMIN' && (
          <fieldset>
            <legend className={label}>
              نقش‌ها <span className="text-danger">*</span>
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {roles.map((r) => {
                const checked = roleIds.includes(r.id);
                return (
                  <label key={r.id} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition', checked ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-500/40')}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setRoleIds((ids) => (e.target.checked ? [...ids, r.id] : ids.filter((x) => x !== r.id)))}
                      className="mt-1 size-4 accent-[var(--brand-600)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-bold text-ink">{r.title_fa}</span>
                      <span className="block text-[12px] leading-5 text-muted">{r.description ?? `${faNumber(r.permissions.length)} دسترسی`}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <label className="block">
          <span className={label}>یادداشت داخلی</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(control, 'h-auto min-h-20 py-3 leading-7')} />
        </label>

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButton}>
            انصراف
          </button>
          <button type="submit" disabled={save.isPending} className={primaryButton}>
            {save.isPending ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
