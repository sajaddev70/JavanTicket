'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { SplashScreen } from "@/components/ui/SplashScreen";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const hydrated = useAdminAuthStore((s) => s.hydrated);
  const token = useAdminAuthStore((s) => s.token);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  if (!hydrated || !token) {
    return <SplashScreen />;
  }

  return (
    <div className="flex min-h-screen bg-page">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onOpenMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 px-3 py-5 sm:px-5 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
