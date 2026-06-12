import React from 'react';
import InternalChatUI from '../../../components/shared/InternalChatUI';

export default function AdminChatPage() {
  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Internal Organization Chat</h1>
        <p className="text-muted-foreground text-sm">Communicate with your team and departments.</p>
      </div>
      <InternalChatUI />
    </div>
  );
}
