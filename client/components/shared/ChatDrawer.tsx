'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Image as ImageIcon, Paperclip, Search, Smile,
  Check, CheckCheck, Loader2, MessageSquare, UserPlus,
  FileText, Download, User, ArrowLeft, Sparkles, Shield, Hash
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { api } from '../../services/api';
import { ChatConversation, ChatMessage } from '../../services/chatService';

interface TenantAdmin {
  id: string;
  adminId: string;
  name: string;
  email: string;
  company: string;
  status: string;
}

export default function ChatDrawer() {
  const [downloadedMsgIds, setDownloadedMsgIds] = useState<Set<string>>(new Set());
  const {

    isOpen, setIsOpen, conversations, activeConversationId, messages,
    onlineUserIds, typingStatus, initSocket, selectConversation,
    startNewConversation, sendMessage, sendTyping
  } = useChatStore();

  const user = useAuthStore((s) => s.user);

  // Local UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showNewChatPanel, setShowNewChatPanel] = useState(false);
  const [tenantAdmins, setTenantAdmins] = useState<TenantAdmin[]>([]);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [mobileActivePanel, setMobileActivePanel] = useState<'list' | 'chat'>('list');

  // Refs for scroll and typing timeouts
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Quick emojis
  const quickEmojis = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '💡', '✨', '🚀', '💬'];

  // Initialize socket when user role is Admin or Super Admin
  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Super Admin') {
      initSocket();
    }
  }, [user, initSocket]);

  // Fetch tenant admins if Super Admin opens the "new chat" panel
  useEffect(() => {
    if (showNewChatPanel && user?.role === 'Super Admin') {
      api.get('/auth/tenant-admins')
        .then(({ data }) => {
          if (data?.success && data?.data?.admins) {
            setTenantAdmins(data.data.admins);
          }
        })
        .catch((err) => console.error('Failed to load tenant admins', err));
    }
  }, [showNewChatPanel, user]);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingStatus]);

  // Switch mobile view to chat when a conversation becomes active
  useEffect(() => {
    if (activeConversationId) {
      setMobileActivePanel('chat');
    } else {
      setMobileActivePanel('list');
    }
  }, [activeConversationId]);

  if (!isOpen) return null;

  // Find current active conversation details
  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const getActivePartnerName = () => {
    if (!activeConv) return '';
    return user?.role === 'Super Admin'
      ? activeConv.admin_name || 'Admin'
      : activeConv.super_admin_name || 'Super Admin';
  };

  const getActivePartnerEmail = () => {
    if (!activeConv) return '';
    return user?.role === 'Super Admin'
      ? activeConv.admin_email || ''
      : activeConv.super_admin_email || '';
  };

  const getActivePartnerId = () => {
    if (!activeConv) return '';
    return user?.role === 'Super Admin'
      ? activeConv.admin_id
      : activeConv.super_admin_id;
  };

  const isPartnerOnline = () => {
    const partnerId = getActivePartnerId();
    return partnerId ? onlineUserIds.includes(partnerId) : false;
  };

  const isPartnerTyping = () => {
    const partnerId = getActivePartnerId();
    return partnerId ? !!typingStatus[partnerId] : false;
  };

  // Filtered conversations list
  const filteredConversations = conversations.filter((c) => {
    const search = searchQuery.toLowerCase();
    if (user?.role === 'Super Admin') {
      return (
        c.admin_name?.toLowerCase().includes(search) ||
        c.tenant_name?.toLowerCase().includes(search)
      );
    } else {
      return c.super_admin_name?.toLowerCase().includes(search);
    }
  });

  // Filtered admin search for new conversations
  const filteredAdmins = tenantAdmins.filter((admin) => {
    const search = adminSearchQuery.toLowerCase();
    return (
      admin.name.toLowerCase().includes(search) ||
      admin.company.toLowerCase().includes(search) ||
      admin.email.toLowerCase().includes(search)
    );
  });

  // Actions
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    await sendMessage(messageText.trim(), 'text');
    setMessageText('');
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    // Emit typing indicator
    sendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const triggerFileUpload = (type: 'image' | 'file') => {
    if (type === 'image') {
      imageInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Url = event.target?.result as string;
        await sendMessage(file.name, type, base64Url);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload failed', err);
      setIsUploading(false);
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  const startChatWithAdmin = async (adminId: string) => {
    // Start or load conversation
    await startNewConversation(adminId);
    setShowNewChatPanel(false);
  };

  // Format time ago for conversation list
  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHrs < 24) return `${diffHrs}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Get avatar gradient based on name
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-amber-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-600',
      'from-fuchsia-500 to-pink-600',
      'from-teal-500 to-emerald-600',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          />

          {/* Main Drawer Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative z-10 w-full max-w-[900px] h-full flex flex-col overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0f18 50%, #0a0a12 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '-20px 0 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Animated background accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-[0.02]" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
            </div>

            {/* ═══════════ DRAWER HEADER ═══════════ */}
            <div className="relative flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }}>
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a0a0f]" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.5)' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    Messaging
                  </h2>
                  <p className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {user?.role === 'Super Admin' ? 'Admin Communications Hub' : 'Super Admin Support'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ═══════════ PANEL BODY ═══════════ */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* ─── LEFT PANEL: CONVERSATIONS LIST ─── */}
              <div
                className={`h-full flex flex-col shrink-0 ${
                  mobileActivePanel === 'chat' ? 'hidden md:flex' : 'flex'
                }`}
                style={{
                  width: '320px',
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                {/* Search & Actions */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Chats
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        {conversations.length}
                      </span>
                    </div>

                    {user?.role === 'Super Admin' ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowNewChatPanel(!showNewChatPanel)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', boxShadow: '0 2px 12px rgba(245,158,11,0.2)' }}
                      >
                        <UserPlus className="w-3 h-3" />
                        New Chat
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startNewConversation('')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', boxShadow: '0 2px 12px rgba(245,158,11,0.2)' }}
                      >
                        <MessageSquare className="w-3 h-3" />
                        Support
                      </motion.button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-[11px] rounded-xl outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.85)',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(245,158,11,0.3)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                    />
                  </div>
                </div>

                {/* Conversations list scrollable */}
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                  {showNewChatPanel ? (
                    // Super Admin New Chat Directory
                    <div className="space-y-2 px-1">
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" style={{ color: '#f59e0b' }} />
                          <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>Org Admins Directory</span>
                        </div>
                        <button
                          onClick={() => setShowNewChatPanel(false)}
                          className="text-[10px] font-medium transition-colors"
                          style={{ color: 'rgba(255,255,255,0.3)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                        >
                          ← Back
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search admins..."
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-[10px] rounded-lg outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.8)',
                        }}
                      />
                      <div className="space-y-0.5">
                        {filteredAdmins.length === 0 ? (
                          <p className="text-[10px] text-center py-6" style={{ color: 'rgba(255,255,255,0.25)' }}>No admins found</p>
                        ) : (
                          filteredAdmins.map((admin) => (
                            <motion.button
                              key={admin.id}
                              whileHover={{ x: 2 }}
                              onClick={() => startChatWithAdmin(admin.id)}
                              className="w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 transition-all group"
                              style={{ border: '1px solid transparent' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                            >
                              <div className={`relative w-8 h-8 rounded-xl bg-gradient-to-br ${getAvatarGradient(admin.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                {admin.name.charAt(0).toUpperCase()}
                                {onlineUserIds.includes(admin.id) && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0a0a0f]" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[11px] font-semibold text-white/80 truncate group-hover:text-white/95 transition-colors">
                                  {admin.name}
                                </h4>
                                <p className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                  {admin.company} • {admin.email}
                                </p>
                              </div>
                            </motion.button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    // Conversation items
                    <>
                      {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <MessageSquare className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.12)' }} />
                          </div>
                          <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            No conversations yet
                          </p>
                          <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
                            Start a new chat to begin
                          </p>
                        </div>
                      ) : (
                        filteredConversations.map((c) => {
                          const isActive = c.id === activeConversationId;
                          const partnerId = user?.role === 'Super Admin' ? c.admin_id : c.super_admin_id;
                          const partnerName = user?.role === 'Super Admin' ? c.admin_name : c.super_admin_name;
                          const partnerCompany = user?.role === 'Super Admin' ? c.tenant_name : 'System Administrator';
                          const isOnline = onlineUserIds.includes(partnerId);

                          return (
                            <motion.button
                              key={c.id}
                              whileHover={{ x: isActive ? 0 : 2 }}
                              onClick={() => selectConversation(c.id)}
                              className="w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-200"
                              style={{
                                background: isActive
                                  ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))'
                                  : 'transparent',
                                border: `1px solid ${isActive ? 'rgba(245,158,11,0.15)' : 'transparent'}`,
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderColor = 'transparent';
                                }
                              }}
                            >
                              {/* Avatar */}
                              <div className="relative shrink-0">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(partnerName || 'U')} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                                  {partnerName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#0a0a0f]"
                                  style={{
                                    background: isOnline ? '#34d399' : 'rgba(255,255,255,0.15)',
                                    boxShadow: isOnline ? '0 0 8px rgba(52,211,153,0.4)' : 'none',
                                  }}
                                />
                              </div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <h4 className="text-[11px] font-semibold truncate" style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)' }}>
                                    {partnerName}
                                  </h4>
                                  {c.last_message_time && (
                                    <span className="text-[9px] shrink-0 font-medium" style={{ color: isActive ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.2)' }}>
                                      {formatTimeAgo(c.last_message_time)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] truncate mb-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                  {partnerCompany}
                                </p>
                                <p className="text-[10px] truncate" style={{ color: isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)' }}>
                                  {c.last_message || 'Start chatting...'}
                                </p>
                              </div>

                              {/* Unread count */}
                              {c.unread_count > 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}
                                >
                                  {c.unread_count}
                                </motion.span>
                              )}
                            </motion.button>
                          );
                        })
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ─── RIGHT PANEL: CHAT AREA ─── */}
              <div
                className={`flex-1 h-full flex flex-col ${
                  mobileActivePanel === 'list' ? 'hidden md:flex' : 'flex'
                }`}
                style={{ background: 'rgba(0,0,0,0.15)' }}
              >
                {activeConversationId && activeConv ? (
                  <>
                    {/* Chat Panel Header */}
                    <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Back button on mobile */}
                        <button
                          onClick={() => setMobileActivePanel('list')}
                          className="p-1.5 rounded-lg md:hidden shrink-0 transition-all"
                          style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)' }}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>

                        <div className={`relative w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarGradient(getActivePartnerName())} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg`}>
                          {getActivePartnerName().charAt(0).toUpperCase()}
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#0a0a0f]"
                            style={{
                              background: isPartnerOnline() ? '#34d399' : 'rgba(255,255,255,0.15)',
                              boxShadow: isPartnerOnline() ? '0 0 8px rgba(52,211,153,0.4)' : 'none',
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-bold text-white/90 truncate leading-tight">
                            {getActivePartnerName()}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isPartnerTyping() ? (
                              <span className="text-[10px] font-medium" style={{ color: '#34d399' }}>typing...</span>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isPartnerOnline() ? '#34d399' : 'rgba(255,255,255,0.15)' }} />
                                <span className="text-[10px] font-medium" style={{ color: isPartnerOnline() ? '#34d399' : 'rgba(255,255,255,0.25)' }}>
                                  {isPartnerOnline() ? 'Online' : 'Offline'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[8px] font-extrabold uppercase px-2 py-1 rounded-lg tracking-[0.12em]" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            {user?.role === 'Super Admin' ? 'Admin' : 'System Admin'}
                          </div>
                        </span>
                      </div>
                    </div>

                    {/* ─── Messages stream ─── */}
                    <div
                      className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
                      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
                    >
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))', border: '1px solid rgba(245,158,11,0.08)' }}
                          >
                            <Sparkles className="w-9 h-9" style={{ color: 'rgba(245,158,11,0.4)' }} />
                          </motion.div>
                          <h4 className="text-sm font-bold text-white/80 mb-1">
                            Start the Conversation
                          </h4>
                          <p className="text-[11px] max-w-[260px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            Send a message to begin your secure, real-time communication.
                          </p>
                        </div>
                      ) : (
                        messages.map((msg, idx) => {
                          const isMe = msg.sender_id === user?.id;
                          const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });

                          // Show date separator
                          const showDateSep = idx === 0 || (
                            new Date(msg.created_at).toDateString() !==
                            new Date(messages[idx - 1].created_at).toDateString()
                          );

                          return (
                            <div key={`${msg.id}-${idx}`}>
                              {showDateSep && (
                                <div className="flex items-center gap-3 py-3">
                                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-2" style={{ color: 'rgba(255,255,255,0.15)' }}>
                                    {new Date(msg.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </span>
                                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                                </div>
                              )}

                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                              >
                                {/* Partner avatar for received messages */}
                                {!isMe && (
                                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarGradient(getActivePartnerName())} flex items-center justify-center text-white text-[9px] font-bold shrink-0 mr-2 mt-auto mb-5`}>
                                    {getActivePartnerName().charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div
                                  className="max-w-[72%] rounded-2xl px-3.5 py-2.5 relative"
                                  style={isMe ? {
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    borderBottomRightRadius: '6px',
                                    boxShadow: '0 4px 20px rgba(245,158,11,0.15)',
                                  } : {
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderBottomLeftRadius: '6px',
                                  }}
                                >
                                  {/* Message text */}
                                  {msg.message_type === 'text' && (
                                    <p className="text-[12.5px] leading-[1.6] break-words whitespace-pre-wrap" style={{ color: isMe ? 'white' : 'rgba(255,255,255,0.82)' }}>
                                      {msg.message}
                                    </p>
                                  )}

                                  {/* Image message */}
                                  {msg.message_type === 'image' && (
                                    <div className="space-y-1.5">
                                      <img
                                        src={msg.attachment_url || ''}
                                        alt={msg.message || 'Image attachment'}
                                        className="rounded-lg max-h-60 max-w-full object-cover cursor-zoom-in hover:brightness-90 transition-all"
                                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                                        onClick={() => window.open(msg.attachment_url || '', '_blank')}
                                      />
                                      {msg.message && (
                                        <p className="text-[10px] font-medium truncate" style={{ color: isMe ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)' }}>
                                          {msg.message}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* File message */}
                                  {msg.message_type === 'file' && (
                                    <a
                                      href={msg.attachment_url || ''}
                                      download={msg.message || 'file'}
                                      onClick={() => {
                                        setDownloadedMsgIds(prev => {
                                          const next = new Set(prev);
                                          next.add(msg.id);
                                          return next;
                                        });
                                      }}
                                      className="flex items-center gap-2.5 p-2 rounded-xl text-[11px] transition-all hover:scale-[1.01]"
                                      style={{
                                        background: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${isMe ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                                        color: isMe ? 'white' : 'rgba(255,255,255,0.7)',
                                      }}
                                    >
                                      <FileText className="w-5 h-5 shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold truncate">{msg.message}</p>
                                        <span className="text-[8px]" style={{ opacity: 0.6 }}>
                                          {downloadedMsgIds.has(msg.id) ? 'Downloaded' : 'Click to download'}
                                        </span>
                                      </div>
                                      {downloadedMsgIds.has(msg.id) ? (
                                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#34d399' }} />
                                      ) : (
                                        <Download className="w-3.5 h-3.5 shrink-0" />
                                      )}
                                    </a>
                                  )}

                                  {/* Timestamp & read receipt */}
                                  <div className={`flex items-center gap-1 justify-end mt-1`}>
                                    <span className="text-[8px] font-medium" style={{ color: isMe ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)' }}>
                                      {timeStr}
                                    </span>
                                    {isMe && (
                                      <span className="ml-0.5">
                                        {msg.is_read ? (
                                          <CheckCheck className="w-3 h-3" style={{ color: '#60a5fa' }} />
                                        ) : (
                                          <Check className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.45)' }} />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          );
                        })
                      )}

                      {/* Typing indicator */}
                      {isPartnerTyping() && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarGradient(getActivePartnerName())} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                              {getActivePartnerName().charAt(0).toUpperCase()}
                            </div>
                            <div className="rounded-2xl px-4 py-2.5 flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderBottomLeftRadius: '6px' }}>
                              <div className="flex items-center gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'rgba(255,255,255,0.3)', animationDelay: '0ms', animationDuration: '1.2s' }} />
                                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'rgba(255,255,255,0.3)', animationDelay: '200ms', animationDuration: '1.2s' }} />
                                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'rgba(255,255,255,0.3)', animationDelay: '400ms', animationDuration: '1.2s' }} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* ─── Quick Emoji Bar ─── */}
                    <div className="px-5 py-1.5 flex items-center gap-1 overflow-x-auto select-none" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <span className="text-[8px] font-bold uppercase tracking-[0.15em] mr-1 shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }}>
                        Quick
                      </span>
                      {quickEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setMessageText((prev) => prev + emoji)}
                          className="p-0.5 text-sm hover:scale-125 transition-transform shrink-0"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* ─── Bottom Input Area ─── */}
                    <div className="p-3.5 sm:p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        {/* Attachment triggers */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => triggerFileUpload('image')}
                            disabled={isUploading}
                            title="Upload Image"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
                            style={{ color: 'rgba(255,255,255,0.3)', background: 'transparent' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerFileUpload('file')}
                            disabled={isUploading}
                            title="Upload File"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
                            style={{ color: 'rgba(255,255,255,0.3)', background: 'transparent' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Hidden Inputs */}
                        <input
                          type="file"
                          ref={imageInputRef}
                          onChange={(e) => handleFileChange(e, 'image')}
                          accept="image/*"
                          className="hidden"
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleFileChange(e, 'file')}
                          className="hidden"
                        />

                        {/* Text Field */}
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={handleTextChange}
                            disabled={isUploading}
                            className="w-full px-4 py-2.5 text-[12px] rounded-xl outline-none transition-all duration-200 disabled:opacity-40"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              color: 'rgba(255,255,255,0.9)',
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'rgba(245,158,11,0.25)'; e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = '0 0 20px rgba(245,158,11,0.05)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>

                        {/* Submit Button */}
                        <motion.button
                          type="submit"
                          disabled={(!messageText.trim() && !isUploading) || isUploading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 disabled:opacity-20"
                          style={{
                            background: messageText.trim()
                              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                              : 'rgba(255,255,255,0.04)',
                            color: messageText.trim() ? 'white' : 'rgba(255,255,255,0.2)',
                            boxShadow: messageText.trim() ? '0 4px 15px rgba(245,158,11,0.25)' : 'none',
                          }}
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </motion.button>
                      </form>
                    </div>
                  </>
                ) : (
                  // ─── Empty State ───
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: 'spring' }}
                    >
                      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 mx-auto relative" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.03))', border: '1px solid rgba(245,158,11,0.06)' }}>
                        <MessageSquare className="w-10 h-10" style={{ color: 'rgba(245,158,11,0.35)' }} />
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 2px 10px rgba(139,92,246,0.3)' }}>
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </motion.div>

                    <h3 className="text-base font-bold text-white/85 mb-1.5">
                      Select a Conversation
                    </h3>
                    <p className="text-[11px] leading-relaxed max-w-[280px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      Choose an existing conversation from the sidebar or start a new one to begin real-time messaging.
                    </p>

                    {user?.role === 'Super Admin' ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowNewChatPanel(true)}
                        className="mt-6 flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold rounded-xl text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}
                      >
                        <UserPlus className="w-4 h-4" />
                        Open Org Admins Directory
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startNewConversation('')}
                        className="mt-6 flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold rounded-xl text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Start Chat with Support
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
