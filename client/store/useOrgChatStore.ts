import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
  role_name: string;
  department_id?: string;
  department_name?: string;
  isOnline?: boolean;
}

export interface OrgMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_photo?: string;
  message: string;
  type: string;
  attachment_url?: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  reactions: { reaction: string; user_id: string }[];
  // present only in search results
  conversation_name?: string;
  conversation_type?: string;
}

export interface OrgConversation {
  id: string;
  type: 'direct' | 'group' | 'department';
  name?: string;
  group_name?: string;
  department_id?: string;
  department_name?: string;
  last_message?: string;
  last_message_sender?: string;
  last_message_at?: string;
  message_count?: string;
  unread_count?: string;
  peer_id?: string;
  peer_name?: string;
  peer_role?: string;
  created_at: string;
}

export interface OrgAnnouncement {
  id: string;
  tenant_id: string;
  sender_id: string;
  sender_name?: string;
  sender_photo?: string;
  message: string;
  target: 'all' | 'department' | 'role';
  target_label?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface TypingIndicator {
  conversationId: string;
  senderId: string;
  senderName: string;
}

interface OrgChatState {
  socket: Socket | null;
  users: OrgUser[];
  onlineUserIds: Set<string>;
  conversations: OrgConversation[];
  activeConversationId: string | null;
  messages: Record<string, OrgMessage[]>;
  departments: Department[];
  unreadCounts: Record<string, number>;
  typingUsers: TypingIndicator[];
  announcements: OrgAnnouncement[];
  searchResults: OrgMessage[];
  isSearching: boolean;

  connect: (token: string) => void;
  disconnect: () => void;
  fetchUsers: (token: string) => Promise<void>;
  fetchConversations: (token: string) => Promise<void>;
  fetchDepartments: (token: string) => Promise<void>;
  fetchAnnouncements: (token: string) => Promise<void>;
  setActiveConversation: (id: string, token: string) => Promise<void>;
  sendMessage: (message: string, type?: string, attachmentUrl?: string) => void;
  editMessage: (messageId: string, newMessage: string) => void;
  deleteMessage: (messageId: string) => void;
  sendReaction: (messageId: string, reaction: string) => void;
  markAsRead: (conversationId: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  startDirectConversation: (peerId: string, token: string) => Promise<string | null>;
  createGroupConversation: (name: string, participantIds: string[], token: string) => Promise<string | null>;
  sendBroadcast: (message: string, target: string, targetId?: string, targetLabel?: string) => void;
  searchMessages: (q: string, token: string) => Promise<void>;
  clearSearch: () => void;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const SOCKET_URL = BASE.replace('/api/v1', '');

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const useOrgChatStore = create<OrgChatState>((set, get) => ({
  socket: null,
  users: [],
  onlineUserIds: new Set(),
  conversations: [],
  activeConversationId: null,
  messages: {},
  departments: [],
  unreadCounts: {},
  typingUsers: [],
  announcements: [],
  searchResults: [],
  isSearching: false,

  connect: (token: string) => {
    if (get().socket?.connected) return;

    const socket = io(`${SOCKET_URL}/org-chat`, {
      path: '/org-socket.io',
      auth: { token },
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('get-online-users', (resp: { userIds: string[] }) => {
        if (resp?.userIds) {
          set({ onlineUserIds: new Set(resp.userIds) });
        }
      });
    });

    socket.on('online-users', ({ userIds }: { userIds: string[] }) => {
      set({ onlineUserIds: new Set(userIds) });
    });

    socket.on('user-online', ({ userId }: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUserIds);
        next.add(userId);
        return {
          onlineUserIds: next,
          users: state.users.map((u) => (u.id === userId ? { ...u, isOnline: true } : u)),
        };
      });
    });

    socket.on('user-offline', ({ userId }: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUserIds);
        next.delete(userId);
        return {
          onlineUserIds: next,
          users: state.users.map((u) => (u.id === userId ? { ...u, isOnline: false } : u)),
        };
      });
    });

    socket.on('receive-message', (msg: OrgMessage) => {
      set((state) => {
        const existing = state.messages[msg.conversation_id] || [];
        const unread = state.activeConversationId !== msg.conversation_id
          ? (state.unreadCounts[msg.conversation_id] || 0) + 1
          : 0;
        return {
          messages: { ...state.messages, [msg.conversation_id]: [...existing, msg] },
          unreadCounts: { ...state.unreadCounts, [msg.conversation_id]: unread },
          conversations: state.conversations.map((c) =>
            c.id === msg.conversation_id
              ? { ...c, last_message: msg.message, last_message_at: msg.created_at }
              : c
          ),
        };
      });
    });

    socket.on('message-edited', ({ messageId, conversationId, message }: { messageId: string; conversationId: string; message: string }) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map((m) =>
            m.id === messageId ? { ...m, message, is_edited: true } : m
          ),
        },
      }));
    });

    socket.on('message-deleted', ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map((m) =>
            m.id === messageId ? { ...m, is_deleted: true, message: '' } : m
          ),
        },
      }));
    });

    socket.on('message-reaction', ({ messageId, userId, reaction, action }: { messageId: string; userId: string; reaction: string; action: string; conversationId: string }) => {
      set((state) => {
        const updated = { ...state.messages };
        for (const convId of Object.keys(updated)) {
          updated[convId] = updated[convId].map((m) => {
            if (m.id !== messageId) return m;
            let reactions = [...(m.reactions || [])];
            if (action === 'removed') {
              reactions = reactions.filter((r) => !(r.reaction === reaction && r.user_id === userId));
            } else {
              reactions = [...reactions, { reaction, user_id: userId }];
            }
            return { ...m, reactions };
          });
        }
        return { messages: updated };
      });
    });

    socket.on('typing', ({ conversationId, senderId, senderName, isTyping }: TypingIndicator & { isTyping: boolean }) => {
      set((state) => {
        const filtered = state.typingUsers.filter(
          (t) => !(t.conversationId === conversationId && t.senderId === senderId)
        );
        return {
          typingUsers: isTyping
            ? [...filtered, { conversationId, senderId, senderName }]
            : filtered,
        };
      });
    });

    socket.on('message-read', ({ conversationId, readerId }: { conversationId: string; readerId: string }) => {
      // Could mark messages as read for a specific reader — currently just an event hook
      void conversationId;
      void readerId;
    });

    socket.on('announcement-created', (announcement: OrgAnnouncement) => {
      set((state) => ({ announcements: [announcement, ...state.announcements] }));
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  fetchUsers: async (token: string) => {
    try {
      const res = await axios.get(`${BASE}/org-chat/users`, { headers: authHeader(token) });
      set({ users: res.data });
    } catch {
      /* silent */
    }
  },

  fetchConversations: async (token: string) => {
    try {
      const res = await axios.get(`${BASE}/org-chat/conversations`, { headers: authHeader(token) });
      set({ conversations: res.data });
    } catch {
      /* silent */
    }
  },

  fetchDepartments: async (token: string) => {
    try {
      const res = await axios.get(`${BASE}/org-chat/departments`, { headers: authHeader(token) });
      set({ departments: res.data });
    } catch {
      /* silent */
    }
  },

  fetchAnnouncements: async (token: string) => {
    try {
      const res = await axios.get(`${BASE}/org-chat/announcements`, { headers: authHeader(token) });
      set({ announcements: res.data });
    } catch {
      /* silent */
    }
  },

  setActiveConversation: async (conversationId: string, token: string) => {
    const prev = get().activeConversationId;
    if (prev && prev !== conversationId) {
      get().socket?.emit('leave-room', { conversationId: prev });
    }

    set({ activeConversationId: conversationId });
    get().socket?.emit('join-room', { conversationId });

    if (!get().messages[conversationId]) {
      try {
        const res = await axios.get(`${BASE}/org-chat/conversations/${conversationId}/messages`, {
          headers: authHeader(token),
        });
        set((state) => ({
          messages: { ...state.messages, [conversationId]: res.data },
        }));
      } catch {
        /* silent */
      }
    }

    get().markAsRead(conversationId);
  },

  sendMessage: (message: string, type = 'text', attachmentUrl?: string) => {
    const { socket, activeConversationId } = get();
    if (!socket || !activeConversationId) return;
    socket.emit('send-message', { conversationId: activeConversationId, message, type, attachmentUrl });
  },

  editMessage: (messageId: string, newMessage: string) => {
    const { socket, activeConversationId } = get();
    if (!socket || !activeConversationId) return;
    socket.emit('edit-message', { messageId, conversationId: activeConversationId, message: newMessage });
  },

  deleteMessage: (messageId: string) => {
    const { socket, activeConversationId } = get();
    if (!socket || !activeConversationId) return;
    socket.emit('delete-message', { messageId, conversationId: activeConversationId });
  },

  sendReaction: (messageId: string, reaction: string) => {
    const { socket, activeConversationId } = get();
    if (!socket || !activeConversationId) return;
    socket.emit('send-reaction', { messageId, conversationId: activeConversationId, reaction });
  },

  markAsRead: (conversationId: string) => {
    get().socket?.emit('mark-read', { conversationId });
    set((state) => ({ unreadCounts: { ...state.unreadCounts, [conversationId]: 0 } }));
  },

  startTyping: () => {
    const { socket, activeConversationId } = get();
    if (socket && activeConversationId) {
      socket.emit('typing-start', { conversationId: activeConversationId });
    }
  },

  stopTyping: () => {
    const { socket, activeConversationId } = get();
    if (socket && activeConversationId) {
      socket.emit('typing-stop', { conversationId: activeConversationId });
    }
  },

  startDirectConversation: async (peerId: string, token: string) => {
    try {
      const res = await axios.post(
        `${BASE}/org-chat/conversations`,
        { type: 'direct', peerId },
        { headers: authHeader(token) }
      );
      const convId: string = res.data.conversationId;
      await get().fetchConversations(token);
      await get().setActiveConversation(convId, token);
      return convId;
    } catch {
      return null;
    }
  },

  createGroupConversation: async (name: string, participantIds: string[], token: string) => {
    try {
      const res = await axios.post(
        `${BASE}/org-chat/conversations`,
        { type: 'group', name, participantIds },
        { headers: authHeader(token) }
      );
      const convId: string = res.data.conversationId;
      await get().fetchConversations(token);
      await get().setActiveConversation(convId, token);
      return convId;
    } catch {
      return null;
    }
  },

  sendBroadcast: (message: string, target: string, targetId?: string, targetLabel?: string) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('admin-broadcast', { message, target, targetId, targetLabel });
  },

  searchMessages: async (q: string, token: string) => {
    if (q.trim().length < 2) { set({ searchResults: [], isSearching: false }); return; }
    set({ isSearching: true });
    try {
      const res = await axios.get(`${BASE}/org-chat/search`, {
        params: { q },
        headers: authHeader(token),
      });
      set({ searchResults: res.data, isSearching: false });
    } catch {
      set({ searchResults: [], isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: [], isSearching: false }),
}));
