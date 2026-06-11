'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Trash2, Bot, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { aiService, ChatMessage } from '../services/aiService';

export default function AIChatbot() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message tailored to user role
  useEffect(() => {
    if (user && messages.length === 0) {
      let welcomeText = `Hello! I'm your Job Nest AI assistant. How can I help you manage the CRM today?`;
      const role = user.role;
      if (role === 'Super Admin' || role === 'Admin') {
        welcomeText = `Welcome, Admin. I can assist you with system monitoring, user management, and tenant metrics. What details would you like to review?`;
      } else if (role === 'Sales Manager') {
        welcomeText = `Welcome, Sales Manager. Ready to analyze pipelines, check sales targets, or review lead allocations? Let me know what you need.`;
      } else if (role === 'Sales Executive') {
        welcomeText = `Hi there! I can help you with lead follow-ups, daily call logs, and customer conversion tips. What lead are we working on today?`;
      } else if (role === 'Marketing') {
        welcomeText = `Hello! Ready to check marketing campaigns, CPL metrics, or ad budget optimization? Ask me anything about campaign performance.`;
      } else if (role === 'Finance') {
        welcomeText = `Hello! I can assist with invoices, payment tracking, Q2 budget performance, and revenue reports. How can I help you today?`;
      } else if (role === 'Support') {
        welcomeText = `Hi! I'm ready to help you analyze support tickets, SLA deadlines, or resolution workflows. What ticket category should we inspect?`;
      }
      setMessages([{ role: 'assistant', content: welcomeText }]);
    }
  }, [user, messages.length]);

  // Check health periodically when open
  useEffect(() => {
    if (!isOpen) return;
    const checkHealth = async () => {
      const online = await aiService.health();
      setIsOnline(online);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Pre-flight health check
    const online = await aiService.health();
    setIsOnline(online);
    if (!online) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'AI service is offline. Please make sure the AI chatbot microservice is running.',
        },
      ]);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage } as ChatMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Pass the complete message history
      const response = await aiService.chat(newMessages, user.role);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err: any) {
      console.error(err);
      const status = err.response?.status;
      let errorMsg = 'Something went wrong. Please try again.';
      
      if (status === 502) {
        errorMsg = 'AI service is starting up. Try again in a moment.';
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMsg,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      try {
        await aiService.resetChat();
      } catch (err) {
        console.error('Failed to reset chat on backend:', err);
      }
      // Re-initialize message list
      setMessages([]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-full px-4 py-3 shadow-lg flex items-center gap-2 text-white font-medium hover:scale-105 transition-all duration-300 group cursor-pointer active:scale-95"
      >
        <Sparkles size={18} className="animate-pulse group-hover:rotate-12 transition-transform duration-300" />
        <span className="font-semibold text-sm tracking-wide">Ask AI</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[400px] h-[550px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-t-xl p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <Bot size={20} className="text-white" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold leading-none">Job Nest AI</p>
                  {isOnline ? (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Online" />
                  ) : (
                    <div className="w-2 h-2 bg-red-400 rounded-full" title="Offline" />
                  )}
                </div>
                <p className="text-orange-100 text-xs mt-1">
                  {user.role}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <button
                onClick={handleClear}
                title="Clear conversation"
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 rounded-full p-1 transition-colors cursor-pointer text-white/80 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-[#161616] space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {/* Bot Avatar */}
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Sparkles size={14} className="text-orange-500" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-tr-none'
                        : 'bg-orange-50 border border-orange-100 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <User size={14} className="text-orange-500" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles size={14} className="text-orange-500 animate-spin" />
                </div>
                <div className="bg-orange-50 border border-orange-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-orange-100 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about sales tips, campaigns..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#161616] border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all placeholder-slate-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all shadow-md hover:shadow-orange-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
