"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, MapPin } from "lucide-react";
import { useProfile, useUpdateProfile } from "./queries";
import { useCities, useNavigation } from "@/hooks/useContent";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SmartLink } from "@/components/ui/SmartLink";
import { useAuthStore } from "@/stores/useAuthStore";
import { AccountShell } from "@/features/account/AccountShell";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { errorMessage } from "@/services/api";
import { faNumber, formatMobile } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { UserProfile } from "@/types/user";

const schema = z.object({
  first_name: z.string().trim().min(1, "نام را وارد کنید.").max(50, "نام حداکثر ۵۰ کاراکتر است."),
  last_name: z.string().trim().min(1, "نام خانوادگی را وارد کنید.").max(50, "نام خانوادگی حداکثر ۵۰ کاراکتر است."),
  email: z.union([z.literal(""), z.string().trim().email("ایمیل واردشده معتبر نیست.").max(100, "ایمیل حداکثر ۱۰۰ کاراکتر است.")]),
  city_id: z.string(),
});
type ProfileForm = z.infer<typeof schema>;

type Page = "menu" | "edit" | "discounts" | "settings";

const rowClass = "card flex min-h-14 items-center gap-2 px-4 text-[13px] font-medium text-ink";

/** 17 پروفایل: عادی، حالت ویرایش، ذخیره موفق; plus the menu's کدهای تخفیف and تنظیمات و امنیت pages. */
export function ProfileView() {
  const profile = useProfile();
  const [page, setPage] = useState<Page>("menu");
  const p = profile.data;
  const back = () => setPage("menu");

  return (
    <AccountShell title="پروفایل" noBack={page === "menu"} onBack={back}>
      {profile.isError ? (
        <ErrorState message={errorMessage(profile.error)} onRetry={() => profile.refetch()} />
      ) : !p ? (
        <Skeleton className="h-[420px] rounded-[20px]" />
      ) : page === "edit" ? (
        <ProfileEdit p={p} onDone={back} />
      ) : page === "discounts" ? (
        <EmptyState
          symbol={SYMBOL.tag}
          message="کد تخفیف را هنگام خرید وارد کنید"
          description="اگر کد تخفیف دارید، آن را در مرحله «اطلاعات خریدار» وارد کنید تا مبلغ سفارش دوباره محاسبه شود."
          action={<ButtonLink href="/events" size="xl">مشاهده رویدادها</ButtonLink>}
        />
      ) : page === "settings" ? (
        <SettingsPage />
      ) : (
        <ProfileMenu p={p} open={setPage} />
      )}
    </AccountShell>
  );
}

function ProfileMenu({ p, open }: { p: UserProfile; open: (page: Page) => void }) {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "کاربر";
  return (
    <>
      <div className="text-center">
        <div aria-hidden className="text-[64px] leading-[1.25]">
          {SYMBOL.user}
        </div>
        <h2 className="mt-1 text-[19px] font-black text-ink">{name}</h2>
        <p dir="ltr" className="text-[12px] leading-[2] text-muted">
          {formatMobile(p.mobile)}
        </p>
      </div>
      <ul className="mt-3 space-y-3">
        <MenuRow label="اطلاعات کاربری" onClick={() => open("edit")} />
        <MenuRow label="سفارش‌های من" href="/orders" count={p.orders_count} />
        <MenuRow label="بلیت‌های من" href="/tickets" count={p.upcoming_tickets_count} />
        <MenuRow label="علاقه‌مندی‌ها" href="/favorites" count={p.favorites_count} />
        <MenuRow label="کدهای تخفیف" onClick={() => open("discounts")} />
        <MenuRow label="تنظیمات و امنیت" onClick={() => open("settings")} />
      </ul>
    </>
  );
}

function MenuRow({ label, href, count, onClick }: { label: string; href?: string; count?: number; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex-1">{label}</span>
      {!!count && <span className="text-[12px] font-bold text-muted">{faNumber(count)}</span>}
      <ChevronLeft className="size-4 shrink-0" />
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className={rowClass}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={cn(rowClass, "w-full text-right")}>
          {body}
        </button>
      )}
    </li>
  );
}

function ProfileEdit({ p, onDone }: { p: UserProfile; onDone: () => void }) {
  const update = useUpdateProfile();
  const cities = useCities().data ?? [];
  const [saved, setSaved] = useState(false);
  const form = useForm<ProfileForm>({ resolver: zodResolver(schema), defaultValues: { first_name: "", last_name: "", email: "", city_id: "" } });

  // Fill the form with the profile (and again after it is saved).
  useEffect(() => {
    form.reset({ first_name: p.first_name ?? "", last_name: p.last_name ?? "", email: p.email ?? "", city_id: p.city_id ? String(p.city_id) : "" });
  }, [p, form]);

  const errors = form.formState.errors;
  return (
    <form
      noValidate
      className="space-y-[11px]"
      onSubmit={form.handleSubmit((v) =>
        update.mutate({ first_name: v.first_name.trim(), last_name: v.last_name.trim(), email: v.email.trim() || null, city_id: v.city_id ? Number(v.city_id) : null }, { onSuccess: () => setSaved(true) }),
      )}
    >
      <h2 className="text-[15px] font-black text-ink">ویرایش پروفایل</h2>
      <Field label="نام" required error={errors.first_name?.message}>
        {(a) => <Input {...a} autoComplete="given-name" {...form.register("first_name")} />}
      </Field>
      <Field label="نام خانوادگی" required error={errors.last_name?.message}>
        {(a) => <Input {...a} autoComplete="family-name" {...form.register("last_name")} />}
      </Field>
      <Field label="شماره موبایل" hint="شماره موبایل همان شناسه ورود شماست و قابل تغییر نیست.">
        {(a) => <Input {...a} value={formatMobile(p.mobile)} readOnly disabled dir="ltr" className="text-right" />}
      </Field>
      <Field label="ایمیل" error={errors.email?.message}>
        {(a) => <Input {...a} type="email" dir="ltr" autoComplete="email" className="text-right" {...form.register("email")} />}
      </Field>
      <Select label="شهر" icon={<MapPin className="size-[18px]" />} {...form.register("city_id")}>
        <option value="">انتخاب نشده</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      {update.isError && (
        <p role="alert" className="rounded-[13px] bg-danger-bg px-4 py-3 text-[13px] font-semibold text-danger-fg">
          {errorMessage(update.error)}
        </p>
      )}
      <Button type="submit" size="xl" block loading={update.isPending} disabled={!form.formState.isDirty}>
        ذخیره تغییرات
      </Button>
      {saved && <StateDialog symbol={SYMBOL.success} title="تغییرات ذخیره شد" message="اطلاعات حساب شما با موفقیت به‌روز شد." onAction={onDone} />}
    </form>
  );
}

/** Appearance, the site's information pages (phones have no site footer) and sign out. */
function SettingsPage() {
  const router = useRouter();
  const footer = useNavigation().data?.footer ?? [];
  const signOut = useAuthStore((s) => s.signOut);
  return (
    <div className="space-y-3">
      <h2 className="text-[15px] font-black text-ink">تنظیمات و امنیت</h2>
      <div className={rowClass}>
        <span className="flex-1">حالت نمایش (روشن / تیره)</span>
        <ThemeToggle className="bg-field" />
      </div>
      {footer.map((col) => (
        <nav key={col.id} aria-label={col.title} className="card p-4">
          <p className="text-[12px] font-bold text-muted">{col.title}</p>
          <ul className="mt-1">
            {col.links.map((l) => (
              <li key={l.id}>
                <SmartLink link={l} className="flex min-h-11 items-center text-[13px] text-ink" />
              </li>
            ))}
          </ul>
        </nav>
      ))}
      <button
        type="button"
        onClick={() => {
          signOut();
          router.push("/");
        }}
        className={cn(rowClass, "w-full text-right !text-danger-fg")}
      >
        خروج از حساب
      </button>
      <p className="text-[12px] leading-[2] text-muted">ورود شما فقط با کد پیامکی انجام می‌شود و رمز عبوری ذخیره نمی‌شود.</p>
    </div>
  );
}
