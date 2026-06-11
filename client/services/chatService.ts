import api from './api';

export interface ChatConversation {
  id: string;
  tenant_id: string | null;
  admin_id: string;
  super_admin_id: string;
  created_at: string;
  updated_at: string;
  admin_name?: string;
  admin_email?: string;
  tenant_name?: string;
  super_admin_name?: string;
  super_admin_email?: string;
  unread_count: number;
  last_message: string | null;
  last_message_time: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ChatDashboardMetrics {
  totalActiveChats: number;
  unreadMessages: number;
  recentConversations: Array<{
    id: string;
    admin_name: string;
    tenant_name: string | null;
    last_message: string | null;
    updated_at: string;
  }>;
}

export const chatService = {
  async listConversations(): Promise<ChatConversation[]> {
    const { data } = await api.get<{ data: { conversations: ChatConversation[] } }>('/chat/conversations');
    return data.data.conversations;
  },

  async startConversation(payload: { adminId?: string; superAdminId?: string }): Promise<ChatConversation> {
    const { data } = await api.post<{ data: { conversation: ChatConversation } }>('/chat/conversations', payload);
    return data.data.conversation;
  },

  async listMessages(conversationId: string, limit = 100): Promise<ChatMessage[]> {
    const { data } = await api.get<{ data: { messages: ChatMessage[] } }>(`/chat/messages/${conversationId}?limit=${limit}`);
    return data.data.messages;
  },

  async readMessages(conversationId: string): Promise<void> {
    await api.post(`/chat/messages/read/${conversationId}`);
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ data: { count: number } }>('/chat/unread-count');
    return data.data.count;
  },

  async getDashboardMetrics(): Promise<ChatDashboardMetrics> {
    const { data } = await api.get<ChatDashboardMetrics>('/chat/metrics');
    return data;
  }
};
