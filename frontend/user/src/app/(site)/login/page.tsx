import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/features/auth/LoginView";

export const metadata: Metadata = { title: "ورود / ثبت‌نام", robots: { index: false } };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
