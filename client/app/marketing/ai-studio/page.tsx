'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Megaphone, Mail, MessageSquare, PhoneCall, Workflow, Users,
  FileText, Layout, Send, Sparkles, Bot, Loader2, Clock, Trash2,
} from 'lucide-react';
import api from '../../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  serviceName: string;
  endpoint: string;
  promptTemplate: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RecentGeneration {
  id: string;
  tool: string;
  prompt: string;
  timestamp: string;
  preview: string;
}

// ─── Tool Definitions ────────────────────────────────────────────────────────

const AI_TOOLS: AITool[] = [
  {
    id: 'campaign',
    title: 'Campaign Generator',
    description: 'Generate complete multi-channel campaign briefs',
    icon: Megaphone,
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    serviceName: 'campaign',
    endpoint: 'generate-campaign',
    promptTemplate: 'Generate a complete multi-channel marketing campaign brief for: ',
  },
  {
    id: 'email',
    title: 'Email Generator',
    description: 'Write compelling email copy with subject lines',
    icon: Mail,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    serviceName: 'content',
    endpoint: 'generate-content',
    promptTemplate: 'Write a compelling email with subject line and body for: ',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Generator',
    description: 'Craft WhatsApp messages and sequences',
    icon: MessageSquare,
    iconColor: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    serviceName: 'content',
    endpoint: 'generate-content',
    promptTemplate: 'Create a WhatsApp message sequence for: ',
  },
  {
    id: 'sms',
    title: 'SMS Generator',
    description: 'Generate high-conversion SMS messages',
    icon: PhoneCall,
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    serviceName: 'content',
    endpoint: 'generate-content',
    promptTemplate: 'Generate a high-conversion SMS marketing message for: ',
  },
  {
    id: 'workflow',
    title: 'Workflow Generator',
    description: 'Describe a workflow in plain English, AI builds it',
    icon: Workflow,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    serviceName: 'workflow',
    endpoint: 'generate-workflow',
    promptTemplate: 'Build an automation workflow for: ',
  },
  {
    id: 'audience',
    title: 'Audience Builder',
    description: 'Describe your ideal audience, AI creates the segment',
    icon: Users,
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    serviceName: 'segmentation',
    endpoint: 'create-segment',
    promptTemplate: 'Create an audience segment definition for: ',
  },
  {
    id: 'form',
    title: 'Form Generator',
    description: 'Describe a form, AI creates fields and validation',
    icon: FileText,
    iconColor: 'text-pink-600 dark:text-pink-400',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    serviceName: 'form',
    endpoint: 'generate-form',
    promptTemplate: 'Generate a form with fields and validation for: ',
  },
  {
    id: 'landing',
    title: 'Landing Page Generator',
    description: 'Generate landing page copy and structure',
    icon: Layout,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    serviceName: 'content',
    endpoint: 'generate-content',
    promptTemplate: 'Generate complete landing page copy and structure for: ',
  },
];

const STORAGE_KEY = 'ai_studio_recent';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadRecent(): RecentGeneration[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecent(items: RecentGeneration[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 5)));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIStudioPage() {
  const [activeTool, setActiveTool] = useState<AITool | null>(null);
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [recent, setRecent] = useState<RecentGeneration[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [conversation]);

  function handleLaunchTool(tool: AITool) {
    setActiveTool(tool);
    setPrompt(tool.promptTemplate);
    textareaRef.current?.focus();
  }

  async function handleSend() {
    if (!prompt.trim() || generating) return;

    const userMsg: ConversationMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, userMsg]);
    const currentPrompt = prompt;
    setPrompt('');
    setGenerating(true);

    try {
      const tool = activeTool ?? AI_TOOLS[0];
      const res = await api.post(
        `/marketing/ai/${tool.serviceName}/${tool.endpoint}`,
        { prompt: currentPrompt, topic: currentPrompt, channel: tool.id }
      );

      const raw = res.data?.data || res.data;
      let responseText = '';

      if (typeof raw === 'string') {
        responseText = raw;
      } else if (raw?.content_body) {
        responseText = [
          raw.subject_line ? `Subject: ${raw.subject_line}` : '',
          raw.content_body,
          raw.cta_label ? `CTA: ${raw.cta_label}` : '',
        ].filter(Boolean).join('\n\n');
      } else if (raw?.nodes) {
        responseText = `Workflow generated with ${raw.nodes.length} node(s):\n\n` +
          raw.nodes.map((n: any, i: number) => `${i + 1}. [${n.type?.toUpperCase()}] ${n.data?.label || n.label || n.id}`).join('\n');
      } else {
        responseText = JSON.stringify(raw, null, 2);
      }

      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, assistantMsg]);

      // Save to recent
      const newEntry: RecentGeneration = {
        id: Date.now().toString(),
        tool: tool.title,
        prompt: currentPrompt.slice(0, 60),
        timestamp: new Date().toISOString(),
        preview: responseText.slice(0, 80),
      };
      const updated = [newEntry, ...recent].slice(0, 5);
      setRecent(updated);
      saveRecent(updated);
    } catch (err: any) {
      const errorMsg: ConversationMessage = {
        role: 'assistant',
        content: `AI service is currently unavailable. Please check your connection and try again.\n\nError: ${err?.message ?? 'Unknown error'}`,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, errorMsg]);
    } finally {
      setGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearConversation() {
    setConversation([]);
    setActiveTool(null);
    setPrompt('');
  }

  return (
    <div className="pb-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#ededed] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            AI Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
            AI-powered tools for every marketing task
          </p>
        </div>
        {activeTool && (
          <span className="px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-semibold">
            {activeTool.title} active
          </span>
        )}
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Left: Tool Cards ── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">
            Select a Tool
          </p>
          <div className="grid grid-cols-2 gap-3">
            {AI_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool?.id === tool.id;
              return (
                <div
                  key={tool.id}
                  className={`bg-white dark:bg-[#161616] rounded-2xl border shadow-sm p-4 flex flex-col gap-3 transition-all cursor-pointer
                    ${isActive
                      ? 'border-violet-400 dark:border-violet-600 ring-1 ring-violet-300 dark:ring-violet-700'
                      : 'border-slate-200/60 dark:border-[#1f1f1f] hover:border-violet-200 dark:hover:border-violet-800'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tool.iconBg}`}>
                    <Icon className={`w-4.5 h-4.5 ${tool.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-[#ededed] leading-snug">{tool.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] mt-0.5 leading-snug line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLaunchTool(tool)}
                    className="w-full py-1.5 rounded-xl text-[10px] font-bold transition bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Launch
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: AI Workspace ── */}
        <div className="flex flex-col gap-4">

          {/* Output area */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm flex flex-col overflow-hidden"
            style={{ minHeight: 380 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#1f1f1f] bg-slate-50/50 dark:bg-[#111]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-[#ededed]">
                  {activeTool ? activeTool.title : 'AI Workspace'}
                </span>
              </div>
              {conversation.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition"
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>

            {/* Messages */}
            <div
              ref={outputRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ maxHeight: 320 }}
            >
              {conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Sparkles className="w-8 h-8 text-violet-300 dark:text-violet-700 mb-2 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-400 dark:text-[#a3a3a3]">
                    Select a tool and write your prompt
                  </p>
                  <p className="text-[10px] text-slate-300 dark:text-[#555] mt-1">
                    Press Ctrl+Enter or click Send
                  </p>
                </div>
              ) : (
                conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap
                        ${msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : 'bg-slate-100 dark:bg-[#1a1a1a] text-slate-800 dark:text-[#ededed] rounded-tl-sm'
                        }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {/* Generating indicator */}
              {generating && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="bg-slate-100 dark:bg-[#1a1a1a] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[10px] text-slate-400 ml-1">Generating...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prompt input */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-3 flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to generate... (Ctrl+Enter to send)"
              rows={3}
              className="w-full bg-transparent text-xs text-slate-800 dark:text-[#ededed] placeholder:text-slate-400 dark:placeholder:text-[#555] outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 dark:text-[#555]">
                {activeTool ? `Tool: ${activeTool.title}` : 'No tool selected — general AI'}
              </span>
              <button
                onClick={handleSend}
                disabled={!prompt.trim() || generating}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send
              </button>
            </div>
          </div>

          {/* Recent Generations */}
          {recent.length > 0 && (
            <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-[#a3a3a3]" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">
                  Recent Generations
                </span>
              </div>
              <div className="space-y-2">
                {recent.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1a1a] cursor-pointer transition group"
                    onClick={() => setPrompt(item.prompt)}
                  >
                    <div className="w-5 h-5 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-600 dark:text-[#ededed] truncate">{item.tool}</p>
                      <p className="text-[10px] text-slate-400 dark:text-[#a3a3a3] truncate">{item.prompt}</p>
                    </div>
                    <span className="text-[9px] text-slate-300 dark:text-[#555] shrink-0 mt-0.5 ml-auto">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
