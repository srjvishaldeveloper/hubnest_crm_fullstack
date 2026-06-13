"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useOrgChatStore, OrgMessage, OrgConversation } from '../../store/useOrgChatStore';
import { useAuthStore } from '../../store/authStore';
import {
  Search, Send, Hash, MessageSquare, Users, Bell, Plus, Smile,
  Edit2, Trash2, Pin, X, Megaphone, MoreHorizontal,
  Check, AlertCircle, AtSign, Zap, ChevronRight,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const EMOJI_LIST = ['👍','❤️','😂','😮','😢','🔥','🎉','👏','✅','🙏'];

const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-500',
  'from-sky-500 to-cyan-400',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
  'from-fuchsia-500 to-purple-500',
];

// ─── Emoji Picker ──────────────────────────────────────────────────────────────
function EmojiPicker({ onPick, above }: { onPick: (e: string) => void; above?: boolean }) {
  return (
    <div className={`absolute ${above ? 'bottom-9' : 'top-9'} left-0 z-50 flex gap-0.5 bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-white/10 rounded-2xl px-2.5 py-2 shadow-2xl shadow-slate-200/50 dark:shadow-black/40 backdrop-blur-xl`}>
      {EMOJI_LIST.map((e) => (
        <button
          key={e}
          onClick={() => onPick(e)}
          className="text-base w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:bg-white/10 hover:scale-110 transition-all duration-150"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({
  name, photo, size = 9, online,
}: { name?: string; photo?: string; size?: number; online?: boolean }) {
  const gradIdx = (name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  const sizeMap: Record<number, string> = {
    6: 'w-6 h-6 text-[9px]',
    7: 'w-7 h-7 text-[10px]',
    8: 'w-8 h-8 text-xs',
    9: 'w-9 h-9 text-sm',
    10: 'w-10 h-10 text-sm',
  };
  const cls = sizeMap[size] || sizeMap[9];
  const dotSize = size <= 7 ? 'w-2 h-2 border' : 'w-2.5 h-2.5 border-2';

  return (
    <div className="relative flex-shrink-0">
      {photo ? (
        <img src={photo} alt={name} className={`${cls} rounded-full object-cover ring-2 ring-white/10`} />
      ) : (
        <div className={`${cls} rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} flex items-center justify-center text-slate-900 dark:text-white font-bold ring-2 ring-white/10 shadow-lg`}>
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dotSize} rounded-full border-[#0f1117] ${online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`} />
      )}
    </div>
  );
}

// ─── Date Divider ──────────────────────────────────────────────────────────────
function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3">
      <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2">
        {date}
      </span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
interface MsgBubbleProps {
  msg: OrgMessage;
  isMe: boolean;
  showHeader: boolean;
  onEdit: (msg: OrgMessage) => void;
  onDelete: (id: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  onPin: (msgId: string) => void;
  currentUserId: string;
}

function MessageBubble({ msg, isMe, showHeader, onEdit, onDelete, onReact, onPin, currentUserId }: MsgBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const grouped = (msg.reactions || []).reduce<Record<string, string[]>>((acc, r) => {
    (acc[r.reaction] = acc[r.reaction] || []).push(r.user_id);
    return acc;
  }, {});

  if (msg.is_deleted) {
    return (
      <div className="px-6 py-0.5 flex gap-3 items-center">
        <div className="w-9 flex-shrink-0" />
        <span className="text-xs italic text-slate-600 select-none">Message deleted</span>
      </div>
    );
  }

  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`group relative flex gap-3 px-4 py-0.5 hover:bg-slate-100/50 dark:bg-white/[0.02] rounded-lg mx-2 transition-colors ${isMe ? 'flex-row-reverse' : ''}`}>
      {/* Avatar column */}
      <div className="flex-shrink-0 w-9">
        {showHeader ? <Avatar name={msg.sender_name} photo={msg.sender_photo} size={9} /> : null}
      </div>

      {/* Content */}
      <div className={`flex flex-col min-w-0 flex-1 ${isMe ? 'items-end' : 'items-start'}`}>
        {showHeader && (
          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
            <span className={`text-sm font-semibold ${isMe ? 'text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
              {isMe ? 'You' : msg.sender_name}
            </span>
            <span className="text-[10px] text-slate-600">{time}</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`relative group/bubble max-w-[min(520px,72%)] ${isMe ? '' : ''}`}>
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isMe
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-slate-900 dark:text-white rounded-tr-sm shadow-indigo-900/40'
              : 'bg-white dark:bg-[#1e2130] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-white/[0.06] rounded-tl-sm'
          }`}>
            <span>{msg.message}</span>
            {msg.is_edited && (
              <span className="ml-1.5 text-[10px] opacity-50">(edited)</span>
            )}
            {!showHeader && (
              <span className="ml-2 text-[10px] opacity-0 group-hover/bubble:opacity-40 transition-opacity">{time}</span>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(grouped).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(grouped).map(([emoji, uids]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(msg.id, emoji)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all ${
                    uids.includes(currentUserId)
                      ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300'
                      : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-400 hover:border-white/20 hover:bg-slate-200 dark:bg-white/10'
                  }`}
                >
                  <span className="text-sm leading-none">{emoji}</span>
                  <span className="font-medium leading-none">{uids.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover toolbar */}
      <div
        ref={ref}
        className={`absolute top-0 ${isMe ? 'left-12' : 'right-4'} z-20 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-0`}
      >
        <div className="flex items-center gap-0.5 bg-white dark:bg-[#1a1d28] border border-slate-200 dark:border-white/10 rounded-xl px-1 py-0.5 shadow-xl shadow-slate-200/50 dark:shadow-black/30">
          <div className="relative">
            <button
              onClick={() => { setShowEmoji(!showEmoji); setShowMenu(false); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-200 dark:bg-white/8 transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            {showEmoji && <EmojiPicker above onPick={(e) => { onReact(msg.id, e); setShowEmoji(false); }} />}
          </div>
          <button
            onClick={() => onPin(msg.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-200 dark:bg-white/8 transition-colors"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          {isMe && (
            <button
              onClick={() => { onEdit(msg); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-200 dark:bg-white/8 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => { setShowMenu(!showMenu); setShowEmoji(false); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:bg-white/8 transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {showMenu && (
              <div className={`absolute top-8 ${isMe ? 'left-0' : 'right-0'} z-50 bg-white dark:bg-[#1a1d28] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 py-1.5 w-44 overflow-hidden`}>
                <button
                  onClick={() => { onPin(msg.id); setShowMenu(false); }}
                  className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Pin className="w-4 h-4 text-amber-400" /> Pin message
                </button>
                {isMe && (
                  <>
                    <button
                      onClick={() => { onEdit(msg); setShowMenu(false); }}
                      className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-sky-400" /> Edit
                    </button>
                    <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-white/5" />
                    <button
                      onClick={() => { onDelete(msg.id); setShowMenu(false); }}
                      className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:bg-rose-500/10 text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ──────────────────────────────────────────────────────────
function TypingBar({ names }: { names: string[] }) {
  if (!names.length) return null;
  const label = names.length === 1 ? `${names[0]} is typing` : `${names.slice(0, 2).join(' & ')} are typing`;
  return (
    <div className="px-6 pb-2 flex items-center gap-2 text-xs text-slate-500">
      <div className="flex gap-0.5 items-center h-4">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
          />
        ))}
      </div>
      <span className="italic">{label}…</span>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-1">
        <MessageSquare className="w-7 h-7 text-indigo-400 opacity-60" />
      </div>
      <p className="text-base font-semibold text-slate-400">{title}</p>
      <p className="text-xs text-slate-600 leading-relaxed">{sub}</p>
    </div>
  );
}

// ─── Sidebar Conv Item ─────────────────────────────────────────────────────────
function ConvItem({
  conv, active, unread, online, displayName,
  onClick,
}: {
  conv: OrgConversation; active: boolean; unread: number; online?: boolean;
  displayName: string; onClick: () => void;
}) {
  const isGroup = conv.type !== 'direct';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-3 transition-all duration-150 group/item ${
        active
          ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 border border-indigo-500/30 shadow-sm'
          : 'hover:bg-slate-100 dark:bg-white/[0.04] border border-transparent'
      }`}
    >
      {isGroup ? (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          active ? 'bg-indigo-500/30' : 'bg-slate-100 dark:bg-white/5 group-hover/item:bg-slate-200 dark:bg-white/10'
        }`}>
          <Hash className={`w-4 h-4 ${active ? 'text-indigo-300' : 'text-slate-500'}`} />
        </div>
      ) : (
        <Avatar name={displayName} size={9} online={online} />
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
          {displayName}
        </div>
        {conv.last_message && (
          <div className={`text-[11px] truncate mt-0.5 ${active ? 'text-indigo-300/70' : 'text-slate-600'}`}>
            {conv.last_message}
          </div>
        )}
      </div>
      {unread > 0 && (
        <span className="flex-shrink-0 bg-indigo-500 text-slate-900 dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-indigo-500/30">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
type SidebarTab = 'dms' | 'groups' | 'announcements';

export default function InternalChatUI() {
  const { accessToken, user } = useAuthStore();
  const {
    connect, disconnect,
    fetchUsers, fetchConversations, fetchDepartments, fetchAnnouncements,
    users, conversations, activeConversationId, messages,
    unreadCounts, typingUsers, announcements, onlineUserIds,
    setActiveConversation, sendMessage, editMessage, deleteMessage,
    sendReaction, startTyping, stopTyping,
    startDirectConversation, createGroupConversation, sendBroadcast,
    searchMessages, searchResults, isSearching, clearSearch,
  } = useOrgChatStore();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('dms');
  const [inputMsg, setInputMsg] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [editingMsg, setEditingMsg] = useState<OrgMessage | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = user?.role === 'Tenant Admin' || user?.role === 'Admin';

  useEffect(() => {
    if (!accessToken) return;
    connect(accessToken);
    fetchUsers(accessToken);
    fetchConversations(accessToken);
    fetchDepartments(accessToken);
    fetchAnnouncements(accessToken);
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const activeMessages: OrgMessage[] = activeConversationId ? messages[activeConversationId] || [] : [];
  const activeTyping = typingUsers.filter(t => t.conversationId === activeConversationId && t.senderId !== user?.id);
  const dmConvs = conversations.filter(c => c.type === 'direct');
  const groupConvs = conversations.filter(c => c.type === 'group' || c.type === 'department');
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  function convDisplayName(c: OrgConversation) {
    if (c.type === 'direct') return c.peer_name || 'Direct Message';
    return c.group_name || c.name || 'Group';
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    if (editingMsg) { editMessage(editingMsg.id, inputMsg.trim()); setEditingMsg(null); }
    else sendMessage(inputMsg.trim());
    setInputMsg('');
    stopTyping();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMsg(e.target.value);
    startTyping();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, 2000);
  };

  const handleEdit = (msg: OrgMessage) => { setEditingMsg(msg); setInputMsg(msg.message); setTimeout(() => inputRef.current?.focus(), 50); };
  const handleCancelEdit = () => { setEditingMsg(null); setInputMsg(''); };
  const handlePin = (msgId: string) => {
    const { socket } = useOrgChatStore.getState();
    if (socket && activeConversationId) socket.emit('pin-message', { messageId: msgId, conversationId: activeConversationId });
  };

  const handleDMClick = useCallback(async (uid: string) => {
    if (!accessToken) return;
    await startDirectConversation(uid, accessToken);
    setSidebarTab('dms');
  }, [accessToken, startDirectConversation]);

  const handleBroadcast = () => {
    if (!broadcastMsg.trim()) return;
    sendBroadcast(broadcastMsg.trim(), 'all');
    setBroadcastMsg('');
    setShowBroadcast(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !accessToken) return;
    await createGroupConversation(newGroupName.trim(), selectedMembers, accessToken);
    setNewGroupName('');
    setSelectedMembers([]);
    setShowNewGroup(false);
  };

  const handleSearch = useCallback((q: string) => {
    setSearchQ(q);
    if (!accessToken) return;
    if (!q.trim()) { clearSearch(); return; }
    const t = setTimeout(() => searchMessages(q, accessToken), 400);
    return () => clearTimeout(t);
  }, [accessToken, clearSearch, searchMessages]);

  // Group messages by date
  let lastDate = '';
  function getDateLabel(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-slate-100 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.06] shadow-2xl">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="w-[270px] xl:w-[290px] flex flex-col bg-white dark:bg-[#13151f] border-r border-slate-200 dark:border-white/[0.06] flex-shrink-0">

        {/* Brand header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-200 dark:border-white/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Zap className="w-4 h-4 text-slate-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">HubNest Chat</h2>
                <p className="text-[10px] text-slate-600 leading-none">Internal workspace</p>
              </div>
            </div>
            {totalUnread > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-indigo-500/30">
                {totalUnread}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search messages…"
              className="w-full bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-white/[0.07] rounded-xl py-2 pl-8.5 pr-8 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-50 dark:bg-[#0f1117] transition-colors"
            />
            {searchQ && (
              <button onClick={() => { setSearchQ(''); clearSearch(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-700 dark:text-slate-300 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQ && (
          <div className="border-b border-slate-200 dark:border-white/[0.05] max-h-44 overflow-y-auto p-2 space-y-0.5 bg-slate-50 dark:bg-[#0f1117]/60">
            {isSearching && <p className="text-[11px] text-slate-600 text-center py-3">Searching…</p>}
            {!isSearching && !searchResults.length && (
              <p className="text-[11px] text-slate-700 text-center py-3">No results found</p>
            )}
            {searchResults.map(r => (
              <button
                key={r.id}
                onClick={() => accessToken && setActiveConversation(r.conversation_id, accessToken)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:bg-white/5 transition-colors"
              >
                <p className="text-[10px] text-slate-500 mb-0.5">{r.sender_name} · {r.conversation_name}</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{r.message}</p>
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex px-2 pt-2 gap-0.5">
          {([
            ['dms', 'Messages', AtSign],
            ['groups', 'Groups', Hash],
            ['announcements', 'Alerts', Bell],
          ] as const).map(([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                sidebarTab === tab
                  ? 'bg-slate-200 dark:bg-white/8 text-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Pane */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/5">

          {/* DMs */}
          {sidebarTab === 'dms' && (
            <>
              {dmConvs.length > 0 && (
                <>
                  <p className="px-2 pt-1 pb-1 text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em]">Recent</p>
                  {dmConvs.map(c => (
                    <ConvItem
                      key={c.id} conv={c}
                      active={c.id === activeConversationId}
                      unread={Number(c.unread_count) || unreadCounts[c.id] || 0}
                      online={c.peer_id ? onlineUserIds.has(c.peer_id) : undefined}
                      displayName={convDisplayName(c)}
                      onClick={() => accessToken && setActiveConversation(c.id, accessToken)}
                    />
                  ))}
                </>
              )}
              <p className="px-2 pt-2 pb-1 text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em]">All Members</p>
              {users.filter(u => u.id !== user?.id).map(u => (
                <button
                  key={u.id}
                  onClick={() => handleDMClick(u.id)}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:bg-white/[0.04] flex items-center gap-2.5 transition-colors border border-transparent"
                >
                  <Avatar name={u.name} photo={u.photo_url} size={8} online={onlineUserIds.has(u.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate text-slate-700 dark:text-slate-300">{u.name}</div>
                    <div className="text-[10px] text-slate-600 truncate">{u.role_name}</div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </>
          )}

          {/* Groups */}
          {sidebarTab === 'groups' && (
            <>
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em]">Channels</p>
                <button
                  onClick={() => setShowNewGroup(true)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>
              {groupConvs.map(c => (
                <ConvItem
                  key={c.id} conv={c}
                  active={c.id === activeConversationId}
                  unread={Number(c.unread_count) || unreadCounts[c.id] || 0}
                  displayName={convDisplayName(c)}
                  onClick={() => accessToken && setActiveConversation(c.id, accessToken)}
                />
              ))}
              {!groupConvs.length && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Hash className="w-8 h-8 text-slate-700" />
                  <p className="text-xs text-slate-600">No channels yet</p>
                  <button onClick={() => setShowNewGroup(true)} className="text-xs text-indigo-400 hover:text-indigo-300">Create one →</button>
                </div>
              )}
            </>
          )}

          {/* Announcements */}
          {sidebarTab === 'announcements' && (
            <>
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em]">Announcements</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowBroadcast(true)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <Megaphone className="w-3 h-3" /> Broadcast
                  </button>
                )}
              </div>
              {!announcements.length && (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Bell className="w-8 h-8 text-slate-700" />
                  <p className="text-xs text-slate-600">No announcements yet</p>
                </div>
              )}
              <div className="space-y-2 px-0.5">
                {announcements.map(a => (
                  <div key={a.id} className="rounded-2xl overflow-hidden border border-amber-500/15 bg-gradient-to-br from-amber-500/8 to-transparent">
                    <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                      <Avatar name={a.sender_name} photo={a.sender_photo} size={7} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-amber-400 truncate">{a.sender_name}</p>
                        <p className="text-[9px] text-slate-600">{new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                      {a.target_label && (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full border border-white/5">{a.target_label}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed px-3 pb-3">{a.message}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User footer */}
        <div className="px-3 py-2.5 border-t border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-[#0f1117]/60 flex items-center gap-2.5">
          <Avatar name={user?.name} size={8} online />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]" />
              <span className="text-[10px] text-slate-600">Active now</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat Area ──────────────────────────────────────────────────────── */}
      {activeConversationId && activeConv ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#0f1117]">

          {/* Header */}
          <div className="h-14 border-b border-slate-200 dark:border-white/[0.05] flex items-center justify-between px-5 bg-white dark:bg-[#13151f]/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              {activeConv.type === 'direct' ? (
                <Avatar
                  name={activeConv.peer_name}
                  size={9}
                  online={activeConv.peer_id ? onlineUserIds.has(activeConv.peer_id) : undefined}
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{convDisplayName(activeConv)}</h3>
                {activeConv.type === 'direct' && (
                  <p className="text-[10px] text-slate-600">
                    {activeConv.peer_id && onlineUserIds.has(activeConv.peer_id) ? (
                      <span className="text-emerald-500">● Online</span>
                    ) : (
                      activeConv.peer_role
                    )}
                  </p>
                )}
                {activeConv.type !== 'direct' && (
                  <p className="text-[10px] text-slate-600">{activeConv.department_name || 'Group channel'}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[Users, Pin, Search].map((Icon, i) => (
                <button key={i} className="p-2 rounded-xl text-slate-600 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-white/5 transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 py-4">
            {!activeMessages.length && (
              <EmptyState
                title={`Start a conversation`}
                sub={`Say hello to ${convDisplayName(activeConv)} — messages are end-to-end delivered in real time.`}
              />
            )}
            {activeMessages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id;
              const prev = idx > 0 ? activeMessages[idx - 1] : null;
              const showHeader = !prev || prev.sender_id !== msg.sender_id ||
                (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) > 5 * 60_000;

              const dateLabel = getDateLabel(msg.created_at);
              const showDate = dateLabel !== lastDate;
              if (showDate) lastDate = dateLabel;

              return (
                <React.Fragment key={msg.id}>
                  {showDate && <DateDivider date={dateLabel} />}
                  {showHeader && idx > 0 && !showDate && <div className="h-2" />}
                  <MessageBubble
                    msg={msg} isMe={isMe} showHeader={showHeader}
                    onEdit={handleEdit} onDelete={deleteMessage}
                    onReact={sendReaction} onPin={handlePin}
                    currentUserId={user?.id || ''}
                  />
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing */}
          <TypingBar names={activeTyping.map(t => t.senderName)} />

          {/* Edit banner */}
          {editingMsg && (
            <div className="mx-4 mb-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-indigo-400">
                <Edit2 className="w-3 h-3" />
                Editing message
              </span>
              <button onClick={handleCancelEdit} className="text-slate-600 hover:text-slate-700 dark:text-slate-300 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-1 flex-shrink-0">
            <form onSubmit={handleSend}>
              <div className={`flex items-center gap-2 bg-white dark:bg-[#1a1d28] border rounded-2xl px-4 py-2.5 transition-all duration-200 ${
                editingMsg ? 'border-indigo-500/40' : 'border-slate-200 dark:border-white/[0.07] focus-within:border-indigo-500/30'
              }`}>
                <input
                  ref={inputRef}
                  value={inputMsg}
                  onChange={handleInputChange}
                  placeholder={editingMsg ? 'Edit your message…' : `Message ${convDisplayName(activeConv)}…`}
                  className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-700 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim()}
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    inputMsg.trim()
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 cursor-not-allowed'
                  }`}
                >
                  {editingMsg ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f1117]">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/20 flex items-center justify-center">
              <MessageSquare className="w-9 h-9 text-indigo-400 opacity-50" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#0f1117] shadow-lg shadow-emerald-400/40" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Welcome to HubNest Chat</h3>
          <p className="mt-2 text-sm text-slate-600 max-w-xs text-center">
            Select a conversation from the sidebar to start messaging your team.
          </p>
        </div>
      )}

      {/* ── Broadcast Modal ─────────────────────────────────────────────── */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-md shadow-2xl shadow-slate-200/50 dark:shadow-black/60">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Send Announcement</h3>
                <p className="text-xs text-slate-600">Broadcast to all organization members</p>
              </div>
              <button onClick={() => setShowBroadcast(false)} className="ml-auto text-slate-600 hover:text-slate-700 dark:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/15 rounded-2xl p-3.5 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80">This message will be delivered to all active members of the organization.</p>
            </div>
            <textarea
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              placeholder="Write your announcement…"
              rows={4}
              className="w-full bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-500/40 resize-none mb-4 transition-colors"
            />
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowBroadcast(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                disabled={!broadcastMsg.trim()}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 dark:text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Broadcast Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Group Modal ──────────────────────────────────────────────── */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-md shadow-2xl shadow-slate-200/50 dark:shadow-black/60 max-h-[80vh] flex flex-col">
            <div className="flex items-center gap-3 mb-5 flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                <Hash className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Create Channel</h3>
                <p className="text-xs text-slate-600">Add a group for your team</p>
              </div>
              <button onClick={() => setShowNewGroup(false)} className="ml-auto text-slate-600 hover:text-slate-700 dark:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="Channel name…"
              className="w-full flex-shrink-0 bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/40 mb-4 transition-colors"
            />
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 flex-shrink-0">Add Members</p>
            <div className="overflow-y-auto flex-1 space-y-0.5 pr-0.5 scrollbar-thin scrollbar-thumb-white/5">
              {users.filter(u => u.id !== user?.id).map(u => (
                <label
                  key={u.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                    selectedMembers.includes(u.id) ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-slate-100 dark:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(u.id)}
                    onChange={e => setSelectedMembers(p => e.target.checked ? [...p, u.id] : p.filter(id => id !== u.id))}
                    className="rounded accent-indigo-500 w-3.5 h-3.5"
                  />
                  <Avatar name={u.name} photo={u.photo_url} size={8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-600 truncate">{u.role_name}</p>
                  </div>
                  {selectedMembers.includes(u.id) && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                </label>
              ))}
            </div>
            <div className="flex gap-2.5 justify-between items-center mt-5 flex-shrink-0 pt-4 border-t border-slate-200 dark:border-white/[0.05]">
              <p className="text-xs text-slate-600">{selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected</p>
              <div className="flex gap-2">
                <button onClick={() => setShowNewGroup(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors">Cancel</button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-900 dark:text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create Channel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
