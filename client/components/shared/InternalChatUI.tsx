"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useOrgChatStore, OrgMessage, OrgConversation } from '../../store/useOrgChatStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Search, Send, Hash, MessageSquare, Users, Bell, Plus, Smile,
  Edit2, Trash2, Pin, X, Megaphone, MoreHorizontal,
  Check, AlertCircle, AtSign, Zap, ChevronRight,
  Paperclip, Image as ImageIcon, FileText, Download, Calendar,
  ChevronLeft, Clock, File, Mic, Square,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const EMOJI_LIST = ['👍','❤️','😂','😮','😢','🔥','🎉','👏','✅','🙏'];
const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-500','from-sky-500 to-cyan-400',
  'from-rose-500 to-pink-500','from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400','from-fuchsia-500 to-purple-500',
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ onSelect, onClose }: { onSelect: (date: Date, time: string) => void; onClose: () => void }) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<Date | null>(null);
  const [time, setTime] = useState('09:00');

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  return (
    <div className="absolute bottom-14 left-0 z-50 bg-white dark:bg-[#1a1d28] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
        <span className="text-sm font-bold text-slate-800 dark:text-white">{MONTHS[view.month]} {view.year}</span>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-0.5">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const date = new Date(view.year, view.month, day);
          const isToday = date.toDateString() === today.toDateString();
          const isSel = selected && date.toDateString() === selected.toDateString();
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <button key={day} disabled={isPast} onClick={() => setSelected(date)}
              className={`h-7 w-full rounded-lg text-xs font-medium transition-all ${isSel ? 'bg-indigo-500 text-white' : isToday ? 'border border-indigo-400 text-indigo-500' : isPast ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
              {day}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="flex-1 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
        <button disabled={!selected} onClick={() => selected && onSelect(selected, time)}
          className="flex-1 py-1.5 bg-indigo-500 text-white rounded-xl text-xs font-semibold hover:bg-indigo-600 disabled:opacity-40">
          Send Event
        </button>
      </div>
    </div>
  );
}

// ─── Emoji Picker ──────────────────────────────────────────────────────────────
function EmojiPicker({ onPick, above }: { onPick: (e: string) => void; above?: boolean }) {
  return (
    <div className={`absolute ${above ? 'bottom-9' : 'top-9'} left-0 z-50 flex gap-0.5 bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-white/10 rounded-2xl px-2.5 py-2 shadow-2xl backdrop-blur-xl`}>
      {EMOJI_LIST.map((e) => (
        <button key={e} onClick={() => onPick(e)} className="text-base w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 hover:scale-110 transition-all duration-150">{e}</button>
      ))}
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, photo, size = 9, online }: { name?: string; photo?: string; size?: number; online?: boolean }) {
  const gradIdx = (name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  const sizeMap: Record<number, string> = { 6: 'w-6 h-6 text-[9px]', 7: 'w-7 h-7 text-[10px]', 8: 'w-8 h-8 text-xs', 9: 'w-9 h-9 text-sm', 10: 'w-10 h-10 text-sm' };
  const cls = sizeMap[size] || sizeMap[9];
  const dotSize = size <= 7 ? 'w-2 h-2 border' : 'w-2.5 h-2.5 border-2';
  return (
    <div className="relative flex-shrink-0">
      {photo ? <img src={photo} alt={name} className={`${cls} rounded-full object-cover ring-2 ring-white/10`} />
        : <div className={`${cls} rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} flex items-center justify-center text-slate-900 dark:text-white font-bold ring-2 ring-white/10 shadow-lg`}>{name?.charAt(0)?.toUpperCase() || '?'}</div>}
      {online !== undefined && <span className={`absolute bottom-0 right-0 ${dotSize} rounded-full border-[#0f1117] ${online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`} />}
    </div>
  );
}

// ─── Date Divider ──────────────────────────────────────────────────────────────
function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3">
      <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2">{date}</span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
    </div>
  );
}

// ─── Attachment Bubble ─────────────────────────────────────────────────────────
function AttachmentBubble({ url, type }: { url: string; type: string }) {
  if (type === 'voice') return (
    <div className="mt-1.5">
      <audio src={url} controls className="h-8 max-w-[220px] outline-none rounded-lg bg-white/5" />
    </div>
  );

  const isImage = type === 'image' || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url) || url.startsWith('data:image/');
  const isVideo = /\.(mp4|webm|ogg)$/i.test(url) || url.startsWith('data:video/');
  const isDoc = !isImage && !isVideo;
  // For data URLs, use the type hint; for regular URLs, extract filename
  const fileName = url.startsWith('data:') ? (type || 'file') : (url.split('/').pop() || 'file');

  if (isImage) return (
    <a href={url} target="_blank" rel="noreferrer" className="block mt-1">
      <img src={url} alt="attachment" className="max-w-[220px] max-h-[160px] rounded-xl object-cover border border-white/10 hover:opacity-90 transition" />
    </a>
  );

  if (isDoc) return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2.5 mt-1.5 px-3 py-2 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition max-w-[220px]">
      <FileText className="w-5 h-5 text-indigo-300 flex-shrink-0" />
      <div className="min-w-0"><p className="text-xs font-semibold truncate">{fileName}</p><p className="text-[10px] opacity-60">Click to download</p></div>
      <Download className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
    </a>
  );

  return <a href={url} target="_blank" rel="noreferrer" className="text-xs text-indigo-300 underline mt-1 block">{fileName}</a>;
}

// ─── Calendar Event Bubble ──────────────────────────────────────────────────────
function CalendarEventBubble({ message }: { message: string }) {
  const match = message.match(/📅 Event: (.+?) at (.+?) on (.+)/);
  if (!match) return <span>{message}</span>;
  return (
    <div className="flex items-start gap-2.5 mt-0.5 bg-white/10 rounded-xl px-3 py-2.5 border border-white/15 max-w-[230px]">
      <div className="w-8 h-8 bg-indigo-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
        <Calendar className="w-4 h-4 text-indigo-300" />
      </div>
      <div>
        <p className="text-xs font-bold text-white">{match[1]}</p>
        <p className="text-[10px] opacity-70 mt-0.5">{match[3]} · {match[2]}</p>
      </div>
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
interface MsgBubbleProps {
  msg: OrgMessage; isMe: boolean; showHeader: boolean;
  onEdit: (msg: OrgMessage) => void; onDelete: (id: string) => void;
  onReact: (msgId: string, emoji: string) => void; onPin: (msgId: string) => void;
  currentUserId: string;
}

function MessageBubble({ msg, isMe, showHeader, onEdit, onDelete, onReact, onPin, currentUserId }: MsgBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setShowMenu(false); setShowEmoji(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const grouped = (msg.reactions || []).reduce<Record<string, string[]>>((acc, r) => {
    (acc[r.reaction] = acc[r.reaction] || []).push(r.user_id); return acc;
  }, {});

  if (msg.is_deleted) return (
    <div className="px-6 py-0.5 flex gap-3 items-center">
      <div className="w-9 flex-shrink-0" />
      <span className="text-xs italic text-slate-500 select-none">Message deleted</span>
    </div>
  );

  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isCalEvent = msg.message?.startsWith('📅 Event:');

  return (
    <div className={`group relative flex gap-3 px-4 py-0.5 hover:bg-slate-100/50 dark:hover:bg-white/[0.02] rounded-lg mx-2 transition-colors ${isMe ? 'flex-row-reverse' : ''}`}>
      <div className="flex-shrink-0 w-9">{showHeader ? <Avatar name={msg.sender_name} photo={msg.sender_photo} size={9} /> : null}</div>
      <div className={`flex flex-col min-w-0 flex-1 ${isMe ? 'items-end' : 'items-start'}`}>
        {showHeader && (
          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
            <span className={`text-sm font-semibold ${isMe ? 'text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>{isMe ? 'You' : msg.sender_name}</span>
            <span className="text-[10px] text-slate-500">{time}</span>
          </div>
        )}
        <div className="relative max-w-[min(520px,72%)]">
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-indigo-900/40' : 'bg-white dark:bg-[#1e2130] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-white/[0.06] rounded-tl-sm'}`}>
            {isCalEvent ? <CalendarEventBubble message={msg.message} /> : <span>{msg.message}</span>}
            {msg.attachment_url && <AttachmentBubble url={msg.attachment_url} type={msg.type} />}
            {msg.is_edited && <span className="ml-1.5 text-[10px] opacity-50">(edited)</span>}
            {!showHeader && <span className="ml-2 text-[10px] opacity-0 group-hover:opacity-40 transition-opacity">{time}</span>}
          </div>
          {Object.keys(grouped).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(grouped).map(([emoji, uids]) => (
                <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all ${uids.includes(currentUserId) ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300' : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-400 hover:border-white/20 hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                  <span className="text-sm leading-none">{emoji}</span>
                  <span className="font-medium leading-none">{uids.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Toolbar */}
      <div ref={ref} className={`absolute top-0 ${isMe ? 'left-12' : 'right-4'} z-20 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150`}>
        <div className="flex items-center gap-0.5 bg-white dark:bg-[#1a1d28] border border-slate-200 dark:border-white/10 rounded-xl px-1 py-0.5 shadow-xl">
          <div className="relative">
            <button onClick={() => { setShowEmoji(!showEmoji); setShowMenu(false); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"><Smile className="w-3.5 h-3.5" /></button>
            {showEmoji && <EmojiPicker above onPick={(e) => { onReact(msg.id, e); setShowEmoji(false); }} />}
          </div>
          <button onClick={() => onPin(msg.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"><Pin className="w-3.5 h-3.5" /></button>
          {isMe && <button onClick={() => onEdit(msg)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>}
          <div className="relative">
            <button onClick={() => { setShowMenu(!showMenu); setShowEmoji(false); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"><MoreHorizontal className="w-3.5 h-3.5" /></button>
            {showMenu && (
              <div className={`absolute top-8 ${isMe ? 'left-0' : 'right-0'} z-50 bg-white dark:bg-[#1a1d28] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl py-1.5 w-44 overflow-hidden`}>
                <button onClick={() => { onPin(msg.id); setShowMenu(false); }} className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors"><Pin className="w-4 h-4 text-amber-400" /> Pin message</button>
                {isMe && (
                  <>
                    <button onClick={() => { onEdit(msg); setShowMenu(false); }} className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors"><Edit2 className="w-4 h-4 text-sky-400" /> Edit</button>
                    <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-white/5" />
                    <button onClick={() => { onDelete(msg.id); setShowMenu(false); }} className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:bg-rose-500/10 text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
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
        {[0, 1, 2].map(i => <span key={i} className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }} />)}
      </div>
      <span className="italic">{label}…</span>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-1"><MessageSquare className="w-7 h-7 text-indigo-400 opacity-60" /></div>
      <p className="text-base font-semibold text-slate-400">{title}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{sub}</p>
    </div>
  );
}

// ─── Conv Item ─────────────────────────────────────────────────────────────────
function ConvItem({ conv, active, unread, online, displayName, onClick }: { conv: OrgConversation; active: boolean; unread: number; online?: boolean; displayName: string; onClick: () => void }) {
  const isGroup = conv.type !== 'direct';
  return (
    <button onClick={onClick} className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-3 transition-all duration-150 group/item ${active ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 border border-indigo-500/30 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent'}`}>
      {isGroup ? (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-indigo-500/30' : 'bg-slate-100 dark:bg-white/5 group-hover/item:bg-slate-200 dark:group-hover/item:bg-white/10'}`}>
          <Hash className={`w-4 h-4 ${active ? 'text-indigo-300' : 'text-slate-500'}`} />
        </div>
      ) : <Avatar name={displayName} size={9} online={online} />}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{displayName}</div>
        {conv.last_message && <div className={`text-[11px] truncate mt-0.5 ${active ? 'text-indigo-300/70' : 'text-slate-500'}`}>{conv.last_message}</div>}
      </div>
      {unread > 0 && <span className="flex-shrink-0 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-indigo-500/30">{unread > 99 ? '99+' : unread}</span>}
    </button>
  );
}

// ─── File Upload Preview ───────────────────────────────────────────────────────
interface UploadPreview { file: File; preview?: string; uploading: boolean; url?: string; error?: string; name?: string; }

// ─── Main Component ────────────────────────────────────────────────────────────
type SidebarTab = 'dms' | 'groups' | 'announcements';

export default function InternalChatUI() {
  const { accessToken, user } = useAuthStore();
  const {
    connect, disconnect, fetchUsers, fetchConversations, fetchDepartments, fetchAnnouncements,
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploads, setUploads] = useState<UploadPreview[]>([]);
  const [eventTitle, setEventTitle] = useState('');

  // Add Members modal state
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberIds, setAddMemberIds] = useState<string[]>([]);
  const [convMembers, setConvMembers] = useState<any[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  
  // Voice recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAdmin = user?.role === 'Tenant Admin' || user?.role === 'Admin';

  useEffect(() => {
    if (!accessToken) return;
    connect(accessToken);
    fetchUsers(accessToken);
    fetchConversations(accessToken);
    fetchDepartments(accessToken);
    fetchAnnouncements(accessToken);
    return () => disconnect();
  }, [accessToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) setShowAttachMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const activeMessages: OrgMessage[] = activeConversationId ? messages[activeConversationId] || [] : [];
  const activeTyping = typingUsers.filter(t => t.conversationId === activeConversationId && t.senderId !== user?.id);
  const dmConvs = conversations.filter(c => c.type === 'direct');
  const groupConvs = conversations.filter(c => c.type === 'group' || c.type === 'department');
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // ── Voice Recording Logic ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordingTime(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  function convDisplayName(c: OrgConversation) {
    if (c.type === 'direct') return c.peer_name || 'Direct Message';
    return c.group_name || c.name || 'Group';
  }

  // ── File Upload — converts to base64 then sends to /org-chat/upload ──
  async function uploadFile(file: File, idx: number) {
    if (file.size > 15 * 1024 * 1024) {
      setUploads(prev => prev.map((u, i) => i === idx ? { ...u, uploading: false, error: 'File too large (max 15 MB)' } : u));
      return;
    }
    setUploads(prev => prev.map((u, i) => i === idx ? { ...u, uploading: true } : u));
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        const res = await api.post('/org-chat/upload', { file_data: dataUrl, file_name: file.name, mime_type: file.type });
        const url = res.data?.url || dataUrl;
        setUploads(prev => prev.map((u, i) => i === idx ? { ...u, uploading: false, url } : u));
      } catch {
        // Use data URL directly as fallback — still works cross-session since stored in DB
        setUploads(prev => prev.map((u, i) => i === idx ? { ...u, uploading: false, url: dataUrl } : u));
      }
    };
    reader.onerror = () => setUploads(prev => prev.map((u, i) => i === idx ? { ...u, uploading: false, error: 'Read failed' } : u));
    reader.readAsDataURL(file);
  }

  function addFiles(files: FileList | null, type: 'file' | 'image') {
    if (!files) return;
    const newUploads: UploadPreview[] = Array.from(files).map(file => ({
      file, uploading: false,
      preview: type === 'image' ? URL.createObjectURL(file) : undefined,
    }));
    setUploads(prev => {
      const updated = [...prev, ...newUploads];
      newUploads.forEach((_, i) => uploadFile(updated[prev.length + i].file, prev.length + i));
      return updated;
    });
    setShowAttachMenu(false);
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMsg.trim();
    const pendingUploads = uploads.filter(u => u.url);

    if (editingMsg) {
      if (text) editMessage(editingMsg.id, text);
      setEditingMsg(null);
      setInputMsg('');
      return;
    }

    if (audioBlob) {
      const blob = audioBlob;
      cancelRecording(); // clear UI state immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) sendMessage('🎤 Voice message', 'voice', reader.result as string);
      };
      reader.readAsDataURL(blob);
      return;
    }

    // Send each uploaded file as a message
    pendingUploads.forEach(u => {
      const isImage = u.file.type.startsWith('image/');
      sendMessage(text || u.file.name, isImage ? 'image' : 'file', u.url);
    });

    // If text-only (no uploads, or text alongside uploads)
    if (text && !pendingUploads.length) sendMessage(text);
    else if (text && pendingUploads.length) {/* already sent with file */}

    setInputMsg('');
    setUploads([]);
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
    setNewGroupName(''); setSelectedMembers([]); setShowNewGroup(false);
    // Refresh conversations to show new group immediately
    fetchConversations(accessToken);
  };

  const openAddMembers = useCallback(async (convId: string) => {
    setShowAddMembers(true);
    setAddMemberIds([]);
    setAddMemberSearch('');
    try {
      const res = await api.get(`/org-chat/conversations/${convId}/members`);
      setConvMembers(res.data || []);
    } catch { setConvMembers([]); }
  }, []);

  const handleAddMembers = async () => {
    if (!activeConversationId || addMemberIds.length === 0) return;
    setAddingMembers(true);
    try {
      await api.post(`/org-chat/conversations/${activeConversationId}/members`, { userIds: addMemberIds });
      setShowAddMembers(false);
      setAddMemberIds([]);
      // Refresh member list
      const res = await api.get(`/org-chat/conversations/${activeConversationId}/members`);
      setConvMembers(res.data || []);
    } catch { /* ignore */ } finally { setAddingMembers(false); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeConversationId) return;
    try {
      await api.delete(`/org-chat/conversations/${activeConversationId}/members/${userId}`);
      setConvMembers(prev => prev.filter(m => m.id !== userId));
    } catch { /* ignore */ }
  };

  const handleSearch = useCallback((q: string) => {
    setSearchQ(q);
    if (!accessToken) return;
    if (!q.trim()) { clearSearch(); return; }
    const t = setTimeout(() => searchMessages(q, accessToken), 400);
    return () => clearTimeout(t);
  }, [accessToken, clearSearch, searchMessages]);

  const handleCalendarSelect = (date: Date, time: string) => {
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const title = eventTitle.trim() || 'Meeting';
    sendMessage(`📅 Event: ${title} at ${time} on ${dateStr}`, 'calendar');
    setShowCalendar(false);
    setEventTitle('');
  };

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
        <div className="px-4 pt-4 pb-3 border-b border-slate-200 dark:border-white/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"><Zap className="w-4 h-4 text-white" /></div>
              <div><h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">HubNest Chat</h2><p className="text-[10px] text-slate-500 leading-none">Internal workspace</p></div>
            </div>
            {totalUnread > 0 && <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-indigo-500/30">{totalUnread}</span>}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchQ} onChange={e => handleSearch(e.target.value)} placeholder="Search messages…"
              className="w-full bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-white/[0.07] rounded-xl py-2 pl-9 pr-8 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" />
            {searchQ && <button onClick={() => { setSearchQ(''); clearSearch(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-3 h-3" /></button>}
          </div>
        </div>

        {searchQ && (
          <div className="border-b border-slate-200 dark:border-white/[0.05] max-h-44 overflow-y-auto p-2 space-y-0.5 bg-slate-50 dark:bg-[#0f1117]/60">
            {isSearching && <p className="text-[11px] text-slate-500 text-center py-3">Searching…</p>}
            {!isSearching && !searchResults.length && <p className="text-[11px] text-slate-500 text-center py-3">No results found</p>}
            {searchResults.map(r => (
              <button key={r.id} onClick={() => accessToken && setActiveConversation(r.conversation_id, accessToken)} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <p className="text-[10px] text-slate-500 mb-0.5">{r.sender_name} · {r.conversation_name}</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{r.message}</p>
              </button>
            ))}
          </div>
        )}

        <div className="flex px-2 pt-2 gap-0.5">
          {(['dms', 'groups', 'announcements'] as const).map((tab, i) => {
            const labels = ['Messages', 'Groups', 'Alerts'];
            const Icons = [AtSign, Hash, Bell];
            const Icon = Icons[i];
            return (
              <button key={tab} onClick={() => setSidebarTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${sidebarTab === tab ? 'bg-slate-200 dark:bg-white/8 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/[0.03]'}`}>
                <Icon className="w-3 h-3" />{labels[i]}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/5">
          {sidebarTab === 'dms' && (
            <>
              {dmConvs.length > 0 && (
                <>
                  <p className="px-2 pt-1 pb-1 text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Recent</p>
                  {dmConvs.map(c => <ConvItem key={c.id} conv={c} active={c.id === activeConversationId} unread={Number(c.unread_count) || unreadCounts[c.id] || 0} online={c.peer_id ? onlineUserIds.has(c.peer_id) : undefined} displayName={convDisplayName(c)} onClick={() => accessToken && setActiveConversation(c.id, accessToken)} />)}
                </>
              )}
              <p className="px-2 pt-2 pb-1 text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                {user?.role === 'Super Admin' ? 'Admins' : 'All Members'}
              </p>
              {users.filter(u => u.id !== user?.id).length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Users className="w-8 h-8 text-slate-600" />
                  <p className="text-xs text-slate-500">No members available to chat</p>
                </div>
              )}
              {users.filter(u => u.id !== user?.id).map(u => (
                <button key={u.id} onClick={() => handleDMClick(u.id)} className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] flex items-center gap-2.5 transition-colors border border-transparent">
                  <Avatar name={u.name} photo={u.photo_url} size={8} online={onlineUserIds.has(u.id)} />
                  <div className="flex-1 min-w-0"><div className="text-xs font-medium truncate text-slate-700 dark:text-slate-300">{u.name}</div><div className="text-[10px] text-slate-500 truncate">{u.role_name}</div></div>
                  <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </>
          )}

          {sidebarTab === 'groups' && (
            <>
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Channels</p>
                <button onClick={() => setShowNewGroup(true)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-400 transition-colors"><Plus className="w-3 h-3" /> New</button>
              </div>
              {groupConvs.map(c => <ConvItem key={c.id} conv={c} active={c.id === activeConversationId} unread={Number(c.unread_count) || unreadCounts[c.id] || 0} displayName={convDisplayName(c)} onClick={() => accessToken && setActiveConversation(c.id, accessToken)} />)}
              {!groupConvs.length && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Hash className="w-8 h-8 text-slate-600" />
                  <p className="text-xs text-slate-500">No channels yet</p>
                  <button onClick={() => setShowNewGroup(true)} className="text-xs text-indigo-400 hover:text-indigo-300">Create one →</button>
                </div>
              )}
            </>
          )}

          {sidebarTab === 'announcements' && (
            <>
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Announcements</p>
                {isAdmin && <button onClick={() => setShowBroadcast(true)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-400 transition-colors"><Megaphone className="w-3 h-3" /> Broadcast</button>}
              </div>
              {!announcements.length && <div className="flex flex-col items-center gap-2 py-8"><Bell className="w-8 h-8 text-slate-600" /><p className="text-xs text-slate-500">No announcements yet</p></div>}
              <div className="space-y-2 px-0.5">
                {announcements.map(a => (
                  <div key={a.id} className="rounded-2xl overflow-hidden border border-amber-500/15 bg-gradient-to-br from-amber-500/8 to-transparent">
                    <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                      <Avatar name={a.sender_name} photo={a.sender_photo} size={7} />
                      <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-amber-400 truncate">{a.sender_name}</p><p className="text-[9px] text-slate-500">{new Date(a.created_at).toLocaleDateString()}</p></div>
                      {a.target_label && <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full border border-white/5">{a.target_label}</span>}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed px-3 pb-3">{a.message}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-3 py-2.5 border-t border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-[#0f1117]/60 flex items-center gap-2.5">
          <Avatar name={user?.name} size={8} online />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</div>
            <div className="flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]" /><span className="text-[10px] text-slate-500">Active now</span></div>
          </div>
        </div>
      </div>

      {/* ── Chat Area ──────────────────────────────────────────────────────── */}
      {activeConversationId && activeConv ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#0f1117]">
          {/* Header */}
          <div className="h-14 border-b border-slate-200 dark:border-white/[0.05] flex items-center justify-between px-5 bg-white dark:bg-[#13151f]/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              {activeConv.type === 'direct' ? <Avatar name={activeConv.peer_name} size={9} online={activeConv.peer_id ? onlineUserIds.has(activeConv.peer_id) : undefined} />
                : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center"><Hash className="w-4 h-4 text-indigo-400" /></div>}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{convDisplayName(activeConv)}</h3>
                {activeConv.type === 'direct' ? (
                  <p className="text-[10px] text-slate-500">{activeConv.peer_id && onlineUserIds.has(activeConv.peer_id) ? <span className="text-emerald-500">● Online</span> : activeConv.peer_role}</p>
                ) : <p className="text-[10px] text-slate-500">{activeConv.department_name || 'Group channel'}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {activeConv.type !== 'direct' && (
                <button onClick={() => openAddMembers(activeConversationId!)}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Manage members">
                  <Users className="w-4 h-4" />
                </button>
              )}
              <button className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Pinned messages">
                <Pin className="w-4 h-4" />
              </button>
              <button onClick={() => { setSearchQ(''); }} className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Search">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 py-4">
            {!activeMessages.length && <EmptyState title="Start a conversation" sub={`Say hello to ${convDisplayName(activeConv)} — messages are delivered in real time.`} />}
            {activeMessages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id;
              const prev = idx > 0 ? activeMessages[idx - 1] : null;
              const showHeader = !prev || prev.sender_id !== msg.sender_id || (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) > 5 * 60_000;
              const dateLabel = getDateLabel(msg.created_at);
              const showDate = dateLabel !== lastDate;
              if (showDate) lastDate = dateLabel;
              return (
                <React.Fragment key={msg.id}>
                  {showDate && <DateDivider date={dateLabel} />}
                  {showHeader && idx > 0 && !showDate && <div className="h-2" />}
                  <MessageBubble msg={msg} isMe={isMe} showHeader={showHeader} onEdit={handleEdit} onDelete={deleteMessage} onReact={sendReaction} onPin={handlePin} currentUserId={user?.id || ''} />
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <TypingBar names={activeTyping.map(t => t.senderName)} />

          {/* Upload Previews */}
          {uploads.length > 0 && (
            <div className="mx-4 mb-2 flex flex-wrap gap-2 p-3 bg-white dark:bg-[#1a1d28] border border-slate-200 dark:border-white/10 rounded-2xl">
              {uploads.map((u, i) => (
                <div key={i} className="relative group/up">
                  {u.preview ? (
                    <img src={u.preview} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-white/10 flex flex-col items-center justify-center gap-0.5">
                      <File className="w-5 h-5 text-slate-400" />
                      <span className="text-[9px] text-slate-400 truncate w-12 text-center">{u.file.name.slice(0, 8)}</span>
                    </div>
                  )}
                  {u.uploading && <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
                  {u.error && <div className="absolute inset-0 bg-red-900/70 rounded-xl flex items-center justify-center"><span className="text-[8px] text-red-200 text-center px-1">{u.error}</span></div>}
                  <button onClick={() => setUploads(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/up:opacity-100 transition"><X className="w-2.5 h-2.5 text-white" /></button>
                </div>
              ))}
            </div>
          )}

          {/* Edit banner */}
          {editingMsg && (
            <div className="mx-4 mb-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-indigo-400"><Edit2 className="w-3 h-3" />Editing message</span>
              <button onClick={handleCancelEdit} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-1 flex-shrink-0">
            {/* Calendar event title (shown when calendar is open) */}
            {showCalendar && (
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Event title (e.g. Team Standup)…"
                  className="flex-1 text-xs border border-indigo-300 dark:border-indigo-700 rounded-xl px-3 py-1.5 dark:bg-[#111] dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none" />
              </div>
            )}
            <form onSubmit={handleSend}>
              <div className={`flex items-center gap-2 bg-white dark:bg-[#1a1d28] border rounded-2xl px-3 py-2.5 transition-all duration-200 relative ${editingMsg ? 'border-indigo-500/40' : 'border-slate-200 dark:border-white/[0.07] focus-within:border-indigo-500/30'}`}>
                
                {isRecording ? (
                  <div className="flex-1 flex items-center justify-between pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-semibold text-red-500">Recording... {formatTime(recordingTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={cancelRecording} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={stopRecording} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ) : audioPreviewUrl ? (
                  <div className="flex-1 flex items-center justify-between pl-2">
                    <audio src={audioPreviewUrl} controls className="h-8 max-w-[250px] outline-none rounded-lg bg-slate-50 dark:bg-white/5" />
                    <button type="button" onClick={cancelRecording} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Attach button */}
                    <div className="relative flex-shrink-0" ref={attachMenuRef}>
                      <button type="button" onClick={() => { setShowAttachMenu(p => !p); setShowCalendar(false); }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      {showAttachMenu && (
                        <div className="absolute bottom-10 left-0 z-50 bg-white dark:bg-[#1a1d28] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 w-44 overflow-hidden">
                          <button type="button" onClick={() => imageRef.current?.click()} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                            <ImageIcon className="w-4 h-4 text-sky-400" />Photos & Videos
                          </button>
                          <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                            <FileText className="w-4 h-4 text-amber-400" />Documents
                          </button>
                        </div>
                      )}
                      <input ref={imageRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => addFiles(e.target.files, 'image')} />
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" multiple className="hidden" onChange={e => addFiles(e.target.files, 'file')} />
                    </div>

                    {/* Calendar button */}
                    <button type="button" onClick={() => { setShowCalendar(p => !p); setShowAttachMenu(false); }}
                      className={`flex-shrink-0 p-1.5 rounded-xl transition-colors ${showCalendar ? 'text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                      <Calendar className="w-4 h-4" />
                    </button>

                    {/* Mic button */}
                    <button type="button" onClick={startRecording}
                      className="flex-shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                      <Mic className="w-4 h-4" />
                    </button>

                    <input ref={inputRef} value={inputMsg} onChange={handleInputChange}
                      placeholder={editingMsg ? 'Edit your message…' : `Message ${convDisplayName(activeConv)}…`}
                      className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none min-w-0" />
                  </>
                )}

                <button type="submit" disabled={(!inputMsg.trim() && !uploads.some(u => u.url) && !audioPreviewUrl) || isRecording}
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${(inputMsg.trim() || uploads.some(u => u.url) || audioPreviewUrl) && !isRecording ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105' : 'bg-slate-100 dark:bg-white/5 text-slate-500 cursor-not-allowed'}`}>
                  {editingMsg ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>

            {/* Calendar picker */}
            {showCalendar && (
              <div className="relative">
                <MiniCalendar onSelect={handleCalendarSelect} onClose={() => setShowCalendar(false)} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f1117]">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/20 flex items-center justify-center"><MessageSquare className="w-9 h-9 text-indigo-400 opacity-50" /></div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#0f1117] shadow-lg shadow-emerald-400/40" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Welcome to HubNest Chat</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-xs text-center">Select a conversation from the sidebar to start messaging your team.</p>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />File sharing</span>
            <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" />Images</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Calendar events</span>
          </div>
        </div>
      )}

      {/* ── Broadcast Modal ─────────────────────────────────────────────── */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center"><Megaphone className="w-5 h-5 text-amber-400" /></div>
              <div><h3 className="font-bold text-slate-900 dark:text-white">Send Announcement</h3><p className="text-xs text-slate-500">Broadcast to all organization members</p></div>
              <button onClick={() => setShowBroadcast(false)} className="ml-auto text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/15 rounded-2xl p-3.5 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80">This message will be delivered to all active members of the organization.</p>
            </div>
            <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Write your announcement…" rows={4}
              className="w-full bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 resize-none mb-4 transition-colors" />
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setShowBroadcast(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cancel</button>
              <button onClick={handleBroadcast} disabled={!broadcastMsg.trim()} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed">Broadcast Now</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Members Modal ────────────────────────────────────────────── */}
      {showAddMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center"><Users className="w-5 h-5 text-indigo-400" /></div>
              <div><h3 className="font-bold text-slate-900 dark:text-white">Manage Members</h3><p className="text-xs text-slate-500">{activeConv ? convDisplayName(activeConv) : 'Group'}</p></div>
              <button onClick={() => setShowAddMembers(false)} className="ml-auto text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>

            {/* Current members */}
            {convMembers.length > 0 && (
              <div className="mb-4 flex-shrink-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Current Members ({convMembers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {convMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 rounded-xl px-2.5 py-1">
                      <Avatar name={m.name} photo={m.photo_url} size={6} />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{m.name}</span>
                      {m.id !== user?.id && (
                        <button onClick={() => handleRemoveMember(m.id)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex-shrink-0">Add Members</p>
            <input value={addMemberSearch} onChange={e => setAddMemberSearch(e.target.value)} placeholder="Search by name…"
              className="w-full flex-shrink-0 mb-2 bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-white/[0.07] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40" />
            <div className="overflow-y-auto flex-1 space-y-0.5 pr-0.5 scrollbar-thin scrollbar-thumb-white/5">
              {users
                .filter(u => u.id !== user?.id && !convMembers.some(m => m.id === u.id))
                .filter(u => !addMemberSearch || u.name.toLowerCase().includes(addMemberSearch.toLowerCase()))
                .map(u => (
                  <label key={u.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${addMemberIds.includes(u.id) ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent'}`}>
                    <input type="checkbox" checked={addMemberIds.includes(u.id)} onChange={e => setAddMemberIds(p => e.target.checked ? [...p, u.id] : p.filter(id => id !== u.id))} className="rounded accent-indigo-500 w-3.5 h-3.5" />
                    <Avatar name={u.name} photo={u.photo_url} size={8} />
                    <div className="flex-1 min-w-0"><p className="text-sm text-slate-700 dark:text-slate-300 truncate">{u.name}</p><p className="text-[10px] text-slate-500 truncate">{u.role_name}</p></div>
                    {addMemberIds.includes(u.id) && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                  </label>
                ))}
            </div>
            <div className="flex gap-2.5 justify-between items-center mt-4 flex-shrink-0 pt-4 border-t border-slate-200 dark:border-white/[0.05]">
              <p className="text-xs text-slate-500">{addMemberIds.length} selected to add</p>
              <div className="flex gap-2">
                <button onClick={() => setShowAddMembers(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
                <button onClick={handleAddMembers} disabled={addMemberIds.length === 0 || addingMembers}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed">
                  {addingMembers ? 'Adding…' : `Add ${addMemberIds.length > 0 ? addMemberIds.length : ''} Member${addMemberIds.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── New Group Modal ──────────────────────────────────────────────── */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center gap-3 mb-5 flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center"><Hash className="w-5 h-5 text-indigo-400" /></div>
              <div><h3 className="font-bold text-slate-900 dark:text-white">Create Channel</h3><p className="text-xs text-slate-500">Add a group for your team</p></div>
              <button onClick={() => setShowNewGroup(false)} className="ml-auto text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Channel name…"
              className="w-full flex-shrink-0 bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40 mb-4 transition-colors" />
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 flex-shrink-0">Add Members</p>
            <div className="overflow-y-auto flex-1 space-y-0.5 pr-0.5 scrollbar-thin scrollbar-thumb-white/5">
              {users.filter(u => u.id !== user?.id).map(u => (
                <label key={u.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${selectedMembers.includes(u.id) ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent'}`}>
                  <input type="checkbox" checked={selectedMembers.includes(u.id)} onChange={e => setSelectedMembers(p => e.target.checked ? [...p, u.id] : p.filter(id => id !== u.id))} className="rounded accent-indigo-500 w-3.5 h-3.5" />
                  <Avatar name={u.name} photo={u.photo_url} size={8} />
                  <div className="flex-1 min-w-0"><p className="text-sm text-slate-700 dark:text-slate-300 truncate">{u.name}</p><p className="text-[10px] text-slate-500 truncate">{u.role_name}</p></div>
                  {selectedMembers.includes(u.id) && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                </label>
              ))}
            </div>
            <div className="flex gap-2.5 justify-between items-center mt-5 flex-shrink-0 pt-4 border-t border-slate-200 dark:border-white/[0.05]">
              <p className="text-xs text-slate-500">{selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected</p>
              <div className="flex gap-2">
                <button onClick={() => setShowNewGroup(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cancel</button>
                <button onClick={handleCreateGroup} disabled={!newGroupName.trim()} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed">Create Channel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
