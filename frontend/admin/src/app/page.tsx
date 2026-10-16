'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';
import { SplashScreen } from '@/components/ui/SplashScreen';

/** Entry point: signed-in admins go to the dashboard, everyone else to the login page. */
export default function AdminEntryPage() {
  const router = useRouter();
  const hydrated = useAdminAuthStore((s) => s.hydrated);
  const token = useAdminAuthStore((s) => s.token);

  useEffect(() => {
    if (hydrated) router.replace(token ? '/dashboard' : '/login');
  }, [hydrated, token, router]);

  return <SplashScreen />;
}
