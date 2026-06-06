'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/support/dashboard');
  }, [router]);

  return null;
}
