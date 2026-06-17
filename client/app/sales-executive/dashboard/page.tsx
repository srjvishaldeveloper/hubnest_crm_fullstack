'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SalesExecutiveDashboardRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/sales/dashboard'); }, [router]);
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
