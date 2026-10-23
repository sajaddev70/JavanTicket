"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Heart, LogOut, MapPin, Receipt, Save, Ticket } from "lucide-react";
import { useProfile, useUpdateProfile } from "./queries";
import { useCities, useNavigation } from "@/hooks/useContent";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SmartLink } from "@/components/ui/SmartLink";
import { useAuthStore } from "@/stores/useAuthStore";
import { AccountShell } from "@/features/account/AccountShell";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/States";
import { errorMessage } from "@/services/api";
import { faDate, faNumber, formatMobile } from "@/lib/format";

const schema = z.object({
  first_name: z.string().trim().min(1, "نام را وارد کنید.").max(50, "نام حداکثر ۵۰ کاراکتر است."),
  last_name: z.string().trim().min(1, "نام خانوادگی را وارد کنید.").max(50, "نام خانوادگی حداکثر ۵۰ کاراکتر است."),
  email: z.union([z.literal(""), z.string().trim().email("ایمیل واردشده معتبر نیست.").max(100, "ایمیل حداکثر ۱۰۰ کاراکتر است.")]),
  city_id: z.string(),
});
type ProfileForm = z.infer<typeof schema>;

export function ProfileView() {
  const router = useRouter();
  const profile = useProfile();
  const update = useUpdateProfile();
  const cities = useCities().data ?? [];
  const footer = useNavigation().data?.footer ?? [];
  const signOut = useAuthStore((s) => s.signOut);
  const form = useForm<ProfileForm>({ resolver: zodResolver(schema), defaultValues: { first_name: "", last_name: "", email: "", city_id: "" } });
  const p = profile.data;

  // Fill the form once the profile arrives (and after it is saved).
  useEffect(() => {
    if (p) form.reset({ first_name: p.first_name ?? "", last_name: p.last_name ?? "", email: p.email ?? "", city_id: p.city_id ? String(p.city_id) : "" });
  }, [p, form]);

  const errors = form.formState.errors;
  const stats = p
    ? [
        { href: "/tickets", icon: Ticket, label: "بلیت‌های پیش رو", value: p.upcoming_tickets_count },
        { href: "/orders", icon: Receipt, label: "سفارش‌های پرداخت‌شده", value: p.orders_count },
        { href: "/favorites", icon: Heart, label: "علاقه‌مندی‌ها", value: p.favorites_count },
      ]
    : [];

  return (
    <AccountShell title="حساب کاربری" description="اطلاعات شخصی شما برای خرید و دریافت بلیت.">
      {profile.isError ? (
        <ErrorState message={errorMessage(profile.error)} onRetry={() => profile.refetch()} />
      ) : !p ? (
        <Skeleton className="h-[420px] rounded-[18px]" />
      ) : (
        <>
          <ul className="grid grid-cols-3 gap-2.5">
            {stats.map(({ href, icon: Icon, label, value }) => (
              <li key={href}>
                <Link href={href} className="card flex h-full flex-col items-center gap-1.5 px-2 py-3.5 text-center transition hover:border-brand-500/40 sm:flex-row sm:gap-3 sm:p-4 sm:text-right">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="size-[22px]" />
                  </span>
                  <span>
                    <span className="block text-[20px] font-black text-ink">{faNumber(value)}</span>
                    <span className="block text-[12px] leading-5 text-ink-2">{label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <form
            noValidate
            className="card p-4 sm:p-6"
            onSubmit={form.handleSubmit((v) =>
              update.mutate({ first_name: v.first_name.trim(), last_name: v.last_name.trim(), email: v.email.trim() || null, city_id: v.city_id ? Number(v.city_id) : null }),
            )}
          >
            <h2 className="mb-4 text-[17px] font-black text-ink">ویرایش اطلاعات</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="نام" required error={errors.first_name?.message}>
                {(a) => <Input {...a} autoComplete="given-name" {...form.register("first_name")} />}
              </Field>
              <Field label="نام خانوادگی" required error={errors.last_name?.message}>
                {(a) => <Input {...a} autoComplete="family-name" {...form.register("last_name")} />}
              </Field>
              <Field label="شماره موبایل" hint="شماره موبایل همان شناسه ورود شماست و قابل تغییر نیست.">
                {(a) => <Input {...a} value={formatMobile(p.mobile)} readOnly disabled dir="ltr" className="text-left" />}
              </Field>
              <Field label="ایمیل" error={errors.email?.message}>
                {(a) => <Input {...a} type="email" dir="ltr" autoComplete="email" className="text-left" {...form.register("email")} />}
              </Field>
              <Select label="شهر" icon={<MapPin className="size-[18px]" />} {...form.register("city_id")}>
                <option value="">انتخاب نشده</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <div className="flex items-end text-[13px] text-muted">عضو از {faDate(p.created_at)}</div>
            </div>
            {update.isError && (
              <p role="alert" className="mt-4 rounded-xl bg-danger-bg px-4 py-3 text-[13.5px] font-semibold text-danger-fg">
                {errorMessage(update.error)}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                variant="ghost"
                className="text-danger-fg hover:bg-danger-bg hover:text-danger-fg"
                onClick={() => {
                  signOut();
                  router.push("/");
                }}
              >
                <LogOut className="size-5" />
                خروج از حساب
              </Button>
              <Button type="submit" size="lg" loading={update.isPending} disabled={!form.formState.isDirty}>
                <Save className="size-5" />
                ذخیره تغییرات
              </Button>
            </div>
          </form>

          {/* Phones have no site footer: appearance and the site's information pages live here */}
          <section aria-labelledby="more-title" className="card p-4 lg:hidden">
            <h2 id="more-title" className="sr-only">
              تنظیمات و اطلاعات
            </h2>
            <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line pb-2">
              <span className="text-[14.5px] font-bold text-ink">حالت نمایش (روشن / تیره)</span>
              <ThemeToggle className="bg-field" />
            </div>
            {footer.map((col) => (
              <nav key={col.id} aria-label={col.title} className="mt-3">
                <p className="text-[12.5px] font-bold text-muted">{col.title}</p>
                <ul className="mt-1">
                  {col.links.map((l) => (
                    <li key={l.id}>
                      <SmartLink link={l} className="flex min-h-11 items-center text-[14px] font-semibold text-ink-2 hover:text-brand-600" />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </section>
        </>
      )}
    </AccountShell>
  );
}
