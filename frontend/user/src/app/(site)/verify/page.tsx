import type { Metadata } from "next";
import { VerifyView } from "@/features/auth/VerifyView";

export const metadata: Metadata = { title: "تأیید شماره موبایل", robots: { index: false } };

export default function VerifyPage() {
  return <VerifyView />;
}
