import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponseData {
  reply: string;
  tokens_used: number;
}

export const aiService = {
  async health(): Promise<boolean> {
    try {
      const response = await api.get('/ai/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },

  async chat(messages: ChatMessage[], userRole?: string): Promise<ChatResponseData> {
    const response = await api.post<{ data: ChatResponseData }>('/ai/chat', { 
      messages,
      user_role: userRole 
    });
    return response.data.data;
  },

  async resetChat(): Promise<{ status: string }> {
    const response = await api.post<{ data: { status: string } }>('/ai/chat/reset');
    return response.data.data;
  }
};
