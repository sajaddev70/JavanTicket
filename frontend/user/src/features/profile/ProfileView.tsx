"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, LogOut, MapPin, Save, Settings, UserRound } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { mediaUrl } from "@/lib/media";
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
  const fullName = p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : "";
  const menu = p
    ? [
        { href: "#edit", icon: <UserRound className="size-6" />, label: "اطلاعات کاربری" },
        { href: "/orders", icon: <Icon name="common/orders" className="size-6" />, label: "سفارش‌های من", count: p.orders_count },
        { href: "/tickets", icon: <Icon name="common/ticket" className="size-6" />, label: "بلیت‌های من", count: p.upcoming_tickets_count },
        { href: "/favorites", icon: <Icon name="common/heart" className="size-6 text-ticket" />, label: "علاقه‌مندی‌ها", count: p.favorites_count },
        { href: "#settings", icon: <Settings className="size-6" />, label: "تنظیمات و امنیت" },
      ]
    : [];

  return (
    <AccountShell
      title="حساب کاربری"
      header={
        /* Reference 12: avatar on the violet wave, the name and the mobile number in white */
        <div className="relative -mx-4 overflow-hidden px-4 pb-2 pt-1 text-center text-white sm:mx-0 sm:px-0">
          <ProfileWave />
          <div className="relative mx-auto flex size-[104px] items-center justify-center overflow-hidden rounded-full border-4 border-white/90 bg-gradient-to-b from-[#dbe7ff] to-[#b9ccff] text-navy-800 shadow-[0_10px_30px_rgb(10_20_80/0.4)]">
            {p?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatar from the backend
              <img src={mediaUrl(p.avatar_url) ?? ""} alt="" className="size-full object-cover" />
            ) : (
              <UserRound className="size-12" />
            )}
          </div>
          <h1 className="relative mt-3 text-[22px] font-black">{p ? fullName || "کاربر" : <Skeleton className="mx-auto h-6 w-32 bg-white/20" />}</h1>
          {p && (
            <p className="relative mt-0.5 text-[16px] font-bold text-white/90" dir="ltr">
              {formatMobile(p.mobile)}
            </p>
          )}
        </div>
      }
    >
      {profile.isError ? (
        <ErrorState message={errorMessage(profile.error)} onRetry={() => profile.refetch()} />
      ) : !p ? (
        <Skeleton className="h-[420px] rounded-[22px]" />
      ) : (
        <>
          <nav aria-label="حساب کاربری" className="card overflow-hidden p-1.5">
            <ul className="divide-y divide-line">
              {menu.map((m) => (
                <li key={m.href}>
                  <Link href={m.href} className="flex min-h-[60px] items-center gap-3.5 rounded-2xl px-3.5 text-ink transition hover:bg-surface-2">
                    <span className="text-ink-2">{m.icon}</span>
                    <span className="flex-1 text-[16px] font-black">{m.label}</span>
                    {!!m.count && <span className="rounded-full bg-purple-bg px-2.5 py-0.5 text-[12px] font-black text-purple">{faNumber(m.count)}</span>}
                    <ChevronLeft className="size-6 text-ink-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <form
            id="edit"
            noValidate
            className="card scroll-mt-24 p-4 sm:p-6"
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
          <section id="settings" aria-labelledby="more-title" className="card scroll-mt-24 p-4">
            <h2 id="more-title" className="sr-only">
              تنظیمات و اطلاعات
            </h2>
            <h3 className="mb-1 text-[17px] font-black text-ink">تنظیمات</h3>
            <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line pb-2">
              <span className="text-[14.5px] font-bold text-ink">حالت نمایش (روشن / تیره)</span>
              <ThemeToggle className="bg-field" />
            </div>
            {footer.map((col) => (
              <nav key={col.id} aria-label={col.title} className="mt-3 lg:hidden">
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

/** Violet light waves behind the avatar (reference 12). */
function ProfileWave() {
  return (
    <svg aria-hidden viewBox="0 0 400 160" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-2 h-[120px] w-full">
      <defs>
        <linearGradient id="profile-wave" x1="0" x2="1">
          <stop offset="0" stopColor="#AE66FF" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#8E45FF" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FF5EC8" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {[0, 6, 12, 18, 24, 30].map((d) => (
        <path key={d} d={`M0 ${110 - d} C 90 ${30 - d}, 170 ${150 - d}, 260 ${70 - d} S 380 ${20 + d}, 400 ${50 + d}`} fill="none" stroke="url(#profile-wave)" strokeWidth={1.4} opacity={1 - d / 40} />
      ))}
    </svg>
  );
}
