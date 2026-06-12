import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';
import { chatService, ChatConversation, ChatMessage } from '../services/chatService';

interface ChatStoreState {
  socket: Socket | null;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  onlineUserIds: string[];
  typingStatus: Record<string, boolean>; // userId -> isTyping
  unreadTotal: number;
  isOpen: boolean;
  isLoading: boolean;

  // Actions
  setIsOpen: (open: boolean) => void;
  initSocket: () => void;
  disconnectSocket: () => void;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  startNewConversation: (adminId: string) => Promise<void>;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file', attachmentUrl?: string | null) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
}

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')
  .replace('/api/v1', '');

export const useChatStore = create<ChatStoreState>((set, get) => {
  return {
    socket: null,
    conversations: [],
    activeConversationId: null,
    messages: [],
    onlineUserIds: [],
    typingStatus: {},
    unreadTotal: 0,
    isOpen: false,
    isLoading: false,

    setIsOpen: (open) => {
      set({ isOpen: open });
      if (open) {
        // Fetch conversations when opening chat
        get().fetchConversations();
        // Also fetch total unread
        chatService.getUnreadCount().then((count) => set({ unreadTotal: count }));
      }
    },

    initSocket: () => {
      // Prevent double initialization - check if socket already exists (not just connected)
      const existingSocket = get().socket;
      if (existingSocket) {
        // If already connected or connecting, skip
        if (existingSocket.connected || existingSocket.active) return;
        // If disconnected, clean it up first
        existingSocket.disconnect();
      }

      const token = useAuthStore.getState().accessToken;
      if (!token) return;

      const socket = io(`${SOCKET_URL}/chat`, {
        auth: { token },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('Socket.IO chat connection established');
        // Fetch current online users
        socket.emit('get-online-users', (userIds: string[]) => {
          set({ onlineUserIds: userIds });
        });
      });

      socket.on('user-online', ({ userId }) => {
        set((state) => ({
          onlineUserIds: state.onlineUserIds.includes(userId)
            ? state.onlineUserIds
            : [...state.onlineUserIds, userId]
        }));
      });

      socket.on('user-offline', ({ userId }) => {
        set((state) => ({
          onlineUserIds: state.onlineUserIds.filter((id) => id !== userId)
        }));
      });

      socket.on('receive-message', (msg: ChatMessage) => {
        const { activeConversationId, conversations } = get();

        // Append message to active conversation if open (with atomic dedup)
        if (activeConversationId === msg.conversation_id) {
          set((state) => {
            // Deduplicate inside set() so it's atomic with state update
            if (state.messages.some((m) => m.id === msg.id)) return state;
            return { messages: [...state.messages, msg] };
          });

          // Automatically mark as read if current conversation is open
          chatService.readMessages(msg.conversation_id).catch(() => {});
          socket.emit('mark-read', {
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
          });
        }

        // Update last message in the conversations list
        const updatedConversations = conversations.map((c) => {
          if (c.id === msg.conversation_id) {
            const isMe = msg.sender_id === useAuthStore.getState().user?.id;
            return {
              ...c,
              last_message: msg.message,
              last_message_time: msg.created_at,
              unread_count: activeConversationId === msg.conversation_id || isMe
                ? 0
                : c.unread_count + 1,
            };
          }
          return c;
        });

        // Re-sort conversations by last_message_time/updated_at
        updatedConversations.sort((a, b) => {
          const timeA = new Date(a.last_message_time || a.updated_at).getTime();
          const timeB = new Date(b.last_message_time || b.updated_at).getTime();
          return timeB - timeA;
        });

        set({ conversations: updatedConversations });

        // Update overall unread counter if message is for us and conversation is not active
        const isReceiverMe = msg.receiver_id === useAuthStore.getState().user?.id;
        if (isReceiverMe && activeConversationId !== msg.conversation_id) {
          set((state) => ({ unreadTotal: state.unreadTotal + 1 }));
        }

        // Show browser toast notification for new messages
        if (isReceiverMe && (activeConversationId !== msg.conversation_id || !get().isOpen)) {
          // Find the sender's name from conversations
          const senderConv = updatedConversations.find(c => c.id === msg.conversation_id);
          let senderName = 'Someone';
          if (senderConv) {
            const userRole = useAuthStore.getState().user?.role;
            senderName = userRole === 'Super Admin'
              ? senderConv.admin_name || 'Admin'
              : senderConv.super_admin_name || 'Super Admin';
          }

          // Show a custom toast notification
          if (typeof window !== 'undefined') {
            const toastContainer = document.getElementById('chat-toast-container') || (() => {
              const container = document.createElement('div');
              container.id = 'chat-toast-container';
              container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
              document.body.appendChild(container);
              return container;
            })();

            const toast = document.createElement('div');
            toast.style.cssText = 'pointer-events:auto;display:flex;align-items:center;gap:12px;padding:12px 16px;background:linear-gradient(135deg,#1a1a2e,#16162a);border:1px solid rgba(255,255,255,0.08);border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.4);color:white;font-family:Inter,system-ui,sans-serif;max-width:340px;animation:slideIn 0.3s ease-out;cursor:pointer;transition:transform 0.2s,opacity 0.3s;';
            const msgPreview = msg.message_type === 'text' ? ((msg.message ?? '').length > 50 ? (msg.message ?? '').substring(0, 50) + '...' : (msg.message ?? '')) : (msg.message_type === 'image' ? '📷 Image' : '📎 File: ' + (msg.message ?? ''));
            toast.innerHTML = `
              <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(245,158,11,0.3);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:12px;font-weight:700;margin-bottom:2px;">${senderName}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${msgPreview}</div>
              </div>
              <div style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;white-space:nowrap;">now</div>
            `;
            toast.onmouseenter = () => { toast.style.transform = 'scale(1.02)'; };
            toast.onmouseleave = () => { toast.style.transform = 'scale(1)'; };
            toast.onclick = () => {
              get().setIsOpen(true);
              get().selectConversation(msg.conversation_id);
              toast.style.opacity = '0';
              setTimeout(() => toast.remove(), 300);
            };

            // Add animation styles if not already present
            if (!document.getElementById('chat-toast-styles')) {
              const style = document.createElement('style');
              style.id = 'chat-toast-styles';
              style.textContent = '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
              document.head.appendChild(style);
            }

            toastContainer.appendChild(toast);
            // Auto remove after 5 seconds
            setTimeout(() => {
              toast.style.opacity = '0';
              toast.style.transform = 'translateX(100%)';
              setTimeout(() => toast.remove(), 300);
            }, 5000);
          }
        }
      });

      socket.on('typing', ({ conversationId, senderId, isTyping }) => {
        const { activeConversationId } = get();
        if (activeConversationId === conversationId) {
          set((state) => ({
            typingStatus: {
              ...state.typingStatus,
              [senderId]: isTyping
            }
          }));
        }
      });

      socket.on('message-read', ({ conversationId, readerId }) => {
        // Update all our messages in active list to is_read = true
        if (get().activeConversationId === conversationId) {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.sender_id !== readerId ? { ...m, is_read: true } : m
            ),
          }));
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });

      set({ socket });
    },

    disconnectSocket: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ socket: null });
      }
    },

    fetchConversations: async () => {
      try {
        set({ isLoading: true });
        const conversations = await chatService.listConversations();
        const count = await chatService.getUnreadCount();
        set({ conversations, unreadTotal: count });
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        set({ isLoading: false });
      }
    },

    selectConversation: async (conversationId) => {
      const { socket } = get();
      set({ activeConversationId: conversationId, typingStatus: {} });
      
      try {
        const messages = await chatService.listMessages(conversationId);
        set({ messages });

        // Mark read
        await chatService.readMessages(conversationId);

        // Notify server/sender we read
        if (socket) {
          socket.emit('join-chat', { conversationId });
          
          // Find the other user
          const conv = get().conversations.find((c) => c.id === conversationId);
          if (conv) {
            const currentUserId = useAuthStore.getState().user?.id;
            const otherUserId = conv.admin_id === currentUserId ? conv.super_admin_id : conv.admin_id;
            socket.emit('mark-read', { conversationId, senderId: otherUserId });
          }
        }

        // Update unread count for this conversation in our local list
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
          )
        }));

        // Re-fetch total unread
        const count = await chatService.getUnreadCount();
        set({ unreadTotal: count });
      } catch (err) {
        console.error('Error selecting conversation:', err);
      }
    },

    startNewConversation: async (adminId) => {
      try {
        set({ isLoading: true });
        const newConv = await chatService.startConversation({ adminId });
        
        // Refresh conversations list
        const conversations = await chatService.listConversations();
        set({ conversations });

        // Select the newly started conversation
        await get().selectConversation(newConv.id);
      } catch (err) {
        console.error('Error starting conversation:', err);
      } finally {
        set({ isLoading: false });
      }
    },

    sendMessage: async (content, type = 'text', attachmentUrl = null) => {
      const { socket, activeConversationId, conversations } = get();
      if (!activeConversationId) return;

      const activeConv = conversations.find((c) => c.id === activeConversationId);
      if (!activeConv) return;

      const currentUserId = useAuthStore.getState().user?.id;
      if (!currentUserId) return;

      // Find receiver ID
      const receiverId = activeConv.admin_id === currentUserId
        ? activeConv.super_admin_id
        : activeConv.admin_id;

      if (socket) {
        // Turn off typing
        get().sendTyping(false);

        // Emit through WebSocket with callback to add message locally
        socket.emit('send-message', {
          conversationId: activeConversationId,
          receiverId,
          message: content,
          messageType: type,
          attachmentUrl
        }, (response: { success: boolean; message?: ChatMessage; error?: string }) => {
          if (response?.success && response.message) {
            const sentMsg = response.message;

            // Add message to the current view (with atomic dedup inside set)
            if (get().activeConversationId === sentMsg.conversation_id) {
              set((state) => {
                if (state.messages.some((m) => m.id === sentMsg.id)) return state;
                return { messages: [...state.messages, sentMsg] };
              });
            }

            // Update conversation list
            set((state) => ({
              conversations: state.conversations
                .map((c) =>
                  c.id === sentMsg.conversation_id
                    ? { ...c, last_message: sentMsg.message, last_message_time: sentMsg.created_at, unread_count: 0 }
                    : c
                )
                .sort((a, b) => {
                  const timeA = new Date(a.last_message_time || a.updated_at).getTime();
                  const timeB = new Date(b.last_message_time || b.updated_at).getTime();
                  return timeB - timeA;
                })
            }));
          }
        });
      }
    },

    sendTyping: (isTyping) => {
      const { socket, activeConversationId, conversations } = get();
      if (!socket || !activeConversationId) return;

      const activeConv = conversations.find((c) => c.id === activeConversationId);
      if (!activeConv) return;

      const currentUserId = useAuthStore.getState().user?.id;
      if (!currentUserId) return;

      const receiverId = activeConv.admin_id === currentUserId
        ? activeConv.super_admin_id
        : activeConv.admin_id;

      const event = isTyping ? 'typing-start' : 'typing-stop';
      socket.emit(event, { conversationId: activeConversationId, receiverId });
    }
  };
});
