'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { InlineAlert, primaryButton } from '@/components/ui/Field';
import { FieldInput, toFormValues, toRequestBody, type FieldDef, type FormValues } from '@/components/crud/fields';
import { apiGet, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { cn } from '@/lib/cn';

const FIELDS: FieldDef[] = [
  { name: 'site_name', label: 'نام رسمی سامانه', type: 'text', required: true },
  { name: 'short_name', label: 'نام کوتاه', type: 'text', hint: 'زیر آیکون برنامه نصب‌شده (PWA) نمایش داده می‌شود.' },
  { name: 'tagline', label: 'شعار سایت', type: 'text', wide: true, hint: 'در فوتر سایت کنار لوگو نمایش داده می‌شود.' },
  { name: 'meta_description', label: 'توضیح سایت برای موتورهای جستجو', type: 'textarea', wide: true },
  { name: 'logo_url', label: 'لوگو برای پس‌زمینه روشن', type: 'image', wide: true },
  { name: 'logo_dark_url', label: 'لوگو برای پس‌زمینه تیره', type: 'image', wide: true, hint: 'در تم تیره، فوتر سایت و منوی کناری پنل استفاده می‌شود.' },
  { name: 'contact_phone', label: 'تلفن پشتیبانی', type: 'text', dir: 'ltr' },
  { name: 'contact_email', label: 'ایمیل تماس', type: 'text', dir: 'ltr' },
  { name: 'address', label: 'نشانی', type: 'text', wide: true },
  { name: 'instagram_url', label: 'لینک اینستاگرام', type: 'text', dir: 'ltr' },
  { name: 'telegram_url', label: 'لینک تلگرام', type: 'text', dir: 'ltr' },
  { name: 'linkedin_url', label: 'لینک لینکدین', type: 'text', dir: 'ltr' },
  { name: 'aparat_url', label: 'لینک آپارات', type: 'text', dir: 'ltr' },
  { name: 'newsletter_title', label: 'عنوان خبرنامه فوتر', type: 'text' },
  { name: 'newsletter_text', label: 'متن خبرنامه فوتر', type: 'text' },
  { name: 'footer_text', label: 'متن فوتر', type: 'textarea', wide: true },
];

export default function AdminSettingsPage() {
  const settings = useQuery({ queryKey: ['admin', 'site-settings'], queryFn: () => apiGet<Record<string, unknown>>('/admin/site-settings') });

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-5">
        <PageHeader title="تنظیمات سامانه" crumbs={['تنظیمات سامانه']} />
        <p className="-mt-2 text-sm text-muted">نام، لوگو، اطلاعات تماس و متن‌های پایه سایت کاربران و پنل مدیریت.</p>

        <Card className="p-5 sm:p-7">
          {settings.isError ? (
            <ErrorState message="دریافت تنظیمات با خطا مواجه شد." onRetry={() => settings.refetch()} />
          ) : settings.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-[74px] rounded-xl" />
              ))}
            </div>
          ) : (
            // Mounted once the data is in, so the form starts from the saved values.
            <SettingsForm initial={toFormValues(FIELDS, settings.data)} />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

function SettingsForm({ initial }: { initial: FormValues }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<FormValues>(initial);
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPut('/admin/site-settings', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(toRequestBody(FIELDS, values));
      }}
      className="space-y-5"
    >
      {save.isSuccess && <InlineAlert tone="success">تنظیمات با موفقیت ذخیره شد.</InlineAlert>}
      {save.isError && <InlineAlert tone="error">{errorMessage(save.error, 'ذخیره تنظیمات با خطا مواجه شد.')}</InlineAlert>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {FIELDS.map((f) => (
          <FieldInput
            key={f.name}
            field={f}
            values={values}
            onChange={(name, v) => {
              setValues((s) => ({ ...s, [name]: v }));
              if (save.isSuccess || save.isError) save.reset();
            }}
          />
        ))}
      </div>

      <div className="flex justify-end border-t border-line pt-5">
        <button type="submit" disabled={save.isPending} className={cn(primaryButton, 'w-full sm:w-auto')}>
          <Save className="size-4" />
          {save.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </div>
    </form>
  );
}
