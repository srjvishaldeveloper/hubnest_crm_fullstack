'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function TicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/support/tickets?id=${id}`);
    } else {
      router.replace('/support/tickets');
    }
  }, [id, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-500 font-semibold">
      Loading ticket workspace...
    </div>
  );
}
