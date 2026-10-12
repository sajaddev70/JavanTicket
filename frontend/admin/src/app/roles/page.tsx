'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { InlineAlert, primaryButton, secondaryButton } from '@/components/ui/Field';
import { useAdminProfile } from '@/hooks/useAdmin';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { faNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Role {
  id: number;
  name: string;
  title_fa: string;
  description?: string | null;
  system_role: boolean;
  users_count: number;
  permissions: string[];
}

interface PermissionGroup {
  title: string;
  items: { code: string; title: string; description?: string | null }[];
}

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const profile = useAdminProfile();
  const roles = useQuery({ queryKey: ['admin', 'roles'], queryFn: () => apiGet<Role[]>('/admin/roles') });
  const groups = useQuery({ queryKey: ['admin', 'permissions'], queryFn: () => apiGet<PermissionGroup[]>('/admin/permissions') });
  const [selected, setSelected] = useState<number | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const canEdit = !!profile.data?.superAdmin;

  const current = selected === 'new' ? null : (roles.data?.find((r) => r.id === selected) ?? roles.data?.[0] ?? null);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'me'] });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="نقش‌ها و دسترسی‌ها"
          crumbs={['نقش‌ها و دسترسی‌ها']}
          action={
            canEdit && (
              <button type="button" onClick={() => setSelected('new')} className={cn(primaryButton, 'h-12 px-6')}>
                <Plus className="size-5" />
                نقش جدید
              </button>
            )
          }
        />
        {!canEdit && profile.data && <InlineAlert tone="error">فقط مدیر ارشد می‌تواند نقش‌ها و دسترسی‌ها را تغییر دهد؛ این صفحه برای شما فقط قابل مشاهده است.</InlineAlert>}

        {roles.isError || groups.isError ? (
          <ErrorState message={errorMessage(roles.error ?? groups.error, 'دریافت نقش‌ها با خطا مواجه شد.')} onRetry={() => {
              roles.refetch();
              groups.refetch();
            }} />
        ) : roles.isLoading || groups.isLoading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="h-fit p-3">
              <ul className="space-y-1.5">
                {roles.data?.map((r) => {
                  const active = selected !== 'new' && current?.id === r.id;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(r.id)}
                        aria-current={active ? 'true' : undefined}
                        className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-right transition', active ? 'border-brand-600 bg-brand-50' : 'border-transparent hover:bg-field/60')}
                      >
                        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', r.system_role ? 'bg-warning/15 text-warning-fg' : 'bg-brand-50 text-brand-600')}>
                          {r.system_role ? <Lock className="size-5" /> : <ShieldCheck className="size-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-extrabold text-ink">{r.title_fa}</span>
                          <span dir="ltr" className="block text-right font-mono text-[11.5px] text-muted">{r.name}</span>
                          <span className="mt-1 flex items-center gap-3 text-[12px] text-muted">
                            <span className="flex items-center gap-1">
                              <Users className="size-3.5" />
                              {faNumber(r.users_count)} کاربر
                            </span>
                            <span>{r.system_role ? 'همه دسترسی‌ها' : `${faNumber(r.permissions.length)} دسترسی`}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <RoleEditor
              key={selected === 'new' ? 'new' : (current?.id ?? 'none')}
              role={current}
              groups={groups.data ?? []}
              canEdit={canEdit}
              onSaved={(id) => {
                refresh();
                if (id) setSelected(id);
              }}
              onDelete={(r) => setToDelete(r)}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="حذف نقش"
        message={deleteError || `آیا از حذف نقش «${toDelete?.title_fa}» اطمینان دارید؟`}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await apiDelete(`/admin/roles/${toDelete.id}`);
            setToDelete(null);
            setSelected(null);
            refresh();
          } catch (err) {
            setDeleteError(errorMessage(err, 'حذف نقش با خطا مواجه شد.'));
          }
        }}
        onClose={() => {
          setToDelete(null);
          setDeleteError('');
        }}
      />
    </AdminLayout>
  );
}

function RoleEditor({
  role,
  groups,
  canEdit,
  onSaved,
  onDelete,
}: {
  role: Role | null;
  groups: PermissionGroup[];
  canEdit: boolean;
  onSaved: (id?: number) => void;
  onDelete: (r: Role) => void;
}) {
  const [name, setName] = useState(role?.name ?? '');
  const [title, setTitle] = useState(role?.title_fa ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [codes, setCodes] = useState<Set<string>>(new Set(role?.permissions ?? []));
  const [saved, setSaved] = useState(false);
  const system = !!role?.system_role;
  const locked = !canEdit || system;

  const save = useMutation({
    mutationFn: () => {
      const body = { name, title_fa: title, description, permissions: [...codes] };
      return role ? apiPut(`/admin/roles/${role.id}`, body).then(() => role.id) : apiPost<number>('/admin/roles', body);
    },
    onSuccess: (id) => {
      setSaved(true);
      onSaved(id);
    },
  });

  const toggle = (code: string, on: boolean) =>
    setCodes((s) => {
      const next = new Set(s);
      if (on) next.add(code);
      else next.delete(code);
      return next;
    });
  const control = 'h-12 w-full rounded-xl border border-line bg-field px-3.5 text-[15px] text-ink outline-none focus:border-brand-500/50 focus:bg-surface disabled:opacity-70';
  const label = 'mb-1.5 block text-[13px] font-semibold text-ink/80';

  return (
    <Card className="p-4 sm:p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          save.mutate();
        }}
        className="space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-ink">{role ? `نقش «${role.title_fa}»` : 'نقش جدید'}</h2>
          {role && role.users_count > 0 && (
            <Link href={`/users?type=ADMIN`} className="text-[13px] font-bold text-brand-600 hover:underline">
              {faNumber(role.users_count)} کاربر با این نقش
            </Link>
          )}
        </div>
        {save.isError && <InlineAlert tone="error">{errorMessage(save.error, 'ذخیره نقش با خطا مواجه شد.')}</InlineAlert>}
        {saved && !save.isError && <InlineAlert tone="success">نقش ذخیره شد. دسترسی کاربران این نقش بلافاصله به‌روز می‌شود.</InlineAlert>}
        {system && <InlineAlert tone="success">نقش مدیر ارشد همیشه به همه بخش‌ها دسترسی دارد؛ فقط عنوان و توضیح آن قابل تغییر است.</InlineAlert>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className={label}>
              عنوان نقش <span className="text-danger">*</span>
            </span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} disabled={!canEdit} className={control} />
          </label>
          <label className="block">
            <span className={label}>
              کد نقش (انگلیسی) <span className="text-danger">*</span>
            </span>
            <input value={name} onChange={(e) => setName(e.target.value.toUpperCase())} required dir="ltr" placeholder="SALES_AGENT" maxLength={50} disabled={locked} className={cn(control, 'text-left font-mono')} />
          </label>
          <label className="block md:col-span-2">
            <span className={label}>توضیح</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} disabled={!canEdit} className={control} />
          </label>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[15px] font-extrabold text-ink">دسترسی به بخش‌ها</span>
            {!locked && (
              <div className="flex gap-2 text-[13px]">
                <button type="button" onClick={() => setCodes(new Set(groups.flatMap((g) => g.items.map((i) => i.code))))} className="font-bold text-brand-600 hover:underline">
                  انتخاب همه
                </button>
                <span className="text-muted">|</span>
                <button type="button" onClick={() => setCodes(new Set())} className="font-bold text-muted hover:underline">
                  هیچ‌کدام
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {groups.map((g) => {
              const all = g.items.every((i) => system || codes.has(i.code));
              return (
                <fieldset key={g.title} className="rounded-2xl border border-line/80 p-3">
                  <legend className="flex w-full items-center justify-between gap-2 px-1">
                    <span className="text-[14px] font-extrabold text-ink">{g.title}</span>
                  </legend>
                  {!locked && (
                    <label className="mb-2 flex items-center gap-2 px-1 text-[12.5px] font-bold text-muted">
                      <input type="checkbox" checked={all} onChange={(e) => g.items.forEach((i) => toggle(i.code, e.target.checked))} className="size-4 accent-[var(--brand-600)]" />
                      همه موارد این بخش
                    </label>
                  )}
                  <div className="space-y-1">
                    {g.items.map((i) => (
                      <label key={i.code} className={cn('flex items-start gap-3 rounded-xl p-2', !locked && 'cursor-pointer hover:bg-field/60')}>
                        <input
                          type="checkbox"
                          checked={system || codes.has(i.code)}
                          disabled={locked}
                          onChange={(e) => toggle(i.code, e.target.checked)}
                          className="mt-1 size-4 accent-[var(--brand-600)]"
                        />
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-bold text-ink">{i.title}</span>
                          {i.description && <span className="block text-[12px] leading-5 text-muted">{i.description}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-between">
            {role && !system ? (
              <button type="button" onClick={() => onDelete(role)} className={cn(secondaryButton, 'text-danger-fg')}>
                <Trash2 className="size-4" />
                حذف نقش
              </button>
            ) : (
              <span />
            )}
            <button type="submit" disabled={save.isPending} className={primaryButton}>
              {save.isPending ? 'در حال ذخیره...' : 'ذخیره نقش'}
            </button>
          </div>
        )}
      </form>
    </Card>
  );
}
