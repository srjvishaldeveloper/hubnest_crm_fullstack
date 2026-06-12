import InternalChatUI from '../../../components/shared/InternalChatUI';

export default function FinanceChatPage() {
  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Team Chat</h1>
        <p className="text-sm text-muted-foreground">Communicate with your team and other departments.</p>
      </div>
      <InternalChatUI />
    </div>
  );
}
