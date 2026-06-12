'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, X, Eye, Monitor, Smartphone, Check, Plus,
  Loader2, LayoutTemplate, ChevronRight,
} from 'lucide-react';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CampaignTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  description?: string;
  thumbnail_url?: string;
  html_content?: string;
  tags?: string[];
}

interface Props {
  campaignType: 'email' | 'sms';
  onSelectTemplate: (tpl: CampaignTemplate) => void;
  onStartBlank: () => void;
}

// ─── Category config ──────────────────────────────────────────────────────────

const EMAIL_CATEGORIES = [
  { key: 'all',          label: 'All Templates' },
  { key: 'welcome',      label: 'Welcome' },
  { key: 'promotional',  label: 'Promotional' },
  { key: 'newsletter',   label: 'Newsletter' },
  { key: 'event',        label: 'Event Invite' },
  { key: 'followup',     label: 'Follow Up' },
  { key: 'reengagement', label: 'Re-engagement' },
  { key: 'announcement', label: 'Announcement' },
];

const SMS_CATEGORIES = [
  { key: 'all',        label: 'All Templates' },
  { key: 'sms',        label: 'SMS General' },
];

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  tpl,
  onClose,
  onUse,
}: {
  tpl: CampaignTemplate;
  onClose: () => void;
  onUse: () => void;
}) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [content, setContent] = useState(tpl.html_content);
  const [loading, setLoading] = useState(!tpl.html_content);

  useEffect(() => {
    if (!tpl.html_content) {
      setLoading(true);
      api.get(`/marketing/campaign-templates/${tpl.id}`)
        .then(r => setContent(r.data?.data?.template?.html_content || r.data?.template?.html_content || ''))
        .catch(() => setContent(''))
        .finally(() => setLoading(false));
    }
  }, [tpl]);

  const isHtml = content?.trimStart().startsWith('<');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '100%', maxWidth: 900, maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">{tpl.name}</h3>
            {tpl.description && <p className="text-xs text-gray-400 mt-0.5">{tpl.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop / Mobile toggle */}
            {isHtml && (
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setView('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  onClick={() => setView('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            )}
            <button
              onClick={onUse}
              className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              <Check className="w-4 h-4" /> Use This Template
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center p-6">
          {loading ? (
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          ) : !content ? (
            <div className="text-center text-gray-400">
              <LayoutTemplate className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No preview available</p>
            </div>
          ) : isHtml ? (
            <div
              className="bg-white shadow-xl rounded-2xl overflow-hidden transition-all duration-300"
              style={{ width: view === 'mobile' ? 375 : '100%', maxWidth: view === 'mobile' ? 375 : 760, height: '100%' }}
            >
              <iframe
                srcDoc={content}
                className="w-full h-full"
                title={tpl.name}
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8 max-w-lg w-full">
              <div className="bg-gray-50 rounded-xl p-5 font-mono text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  tpl,
  selected,
  onSelect,
  onPreview,
}: {
  tpl: CampaignTemplate;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 ${
        selected
          ? 'border-orange-500 shadow-lg shadow-orange-100/60'
          : 'border-gray-100 hover:border-orange-200 hover:shadow-md'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-[120px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {tpl.thumbnail_url ? (
          <img
            src={tpl.thumbnail_url}
            alt={tpl.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
            <LayoutTemplate className="w-8 h-8" />
          </div>
        )}

        {/* Hover overlay */}
        {hovered && (
          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); onSelect(); }}
              className="px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Use Template
            </button>
            <button
              onClick={e => { e.stopPropagation(); onPreview(); }}
              className="text-white/80 text-xs hover:text-white transition-colors underline underline-offset-2"
            >
              Preview
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-white">
        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{tpl.name}</p>
        {tpl.description && (
          <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{tpl.description}</p>
        )}
      </div>

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}

// ─── TemplateGallery ──────────────────────────────────────────────────────────

export default function TemplateGallery({ campaignType, onSelectTemplate, onStartBlank }: Props) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [previewTpl, setPreviewTpl] = useState<CampaignTemplate | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = campaignType === 'sms' ? SMS_CATEGORIES : EMAIL_CATEGORIES;

  const fetchTemplates = useCallback((cat: string, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ type: campaignType });
    if (cat && cat !== 'all') params.set('category', cat);
    if (q) params.set('search', q);
    api.get(`/marketing/campaign-templates?${params}`)
      .then(r => setTemplates(r.data?.data?.templates || r.data?.templates || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [campaignType]);

  // Initial load
  useEffect(() => {
    fetchTemplates('all', '');
  }, [fetchTemplates]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    fetchTemplates(cat, search);
  };

  const handleSearchChange = (q: string) => {
    setSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTemplates(activeCategory, q), 300);
  };

  const handleSelect = (tpl: CampaignTemplate) => {
    setSelected(tpl.id);
    onSelectTemplate(tpl);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search templates…"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── Sidebar ── */}
        <div className="w-48 flex-shrink-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Categories</p>
          <nav className="space-y-0.5">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                  activeCategory === cat.key
                    ? 'bg-orange-50 text-orange-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {cat.label}
                {activeCategory === cat.key && (
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Grid ── */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Start from Scratch card */}
              <button
                onClick={onStartBlank}
                className="relative h-full flex flex-col rounded-2xl border-2 border-dashed border-gray-200 hover:border-orange-400 hover:bg-orange-50/30 transition-all group overflow-hidden min-h-[180px]"
              >
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-orange-100 transition-colors flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 group-hover:text-orange-600 transition-colors">Start from Scratch</p>
                  <p className="text-[11px] text-gray-400 text-center">Blank template</p>
                </div>
              </button>

              {/* Template cards */}
              {templates.map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  selected={selected === tpl.id}
                  onSelect={() => handleSelect(tpl)}
                  onPreview={() => setPreviewTpl(tpl)}
                />
              ))}

              {templates.length === 0 && !loading && (
                <div className="col-span-2 lg:col-span-2 flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
                  <LayoutTemplate className="w-8 h-8 opacity-40" />
                  <p className="text-sm">No templates found for this category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTpl && (
        <PreviewModal
          tpl={previewTpl}
          onClose={() => setPreviewTpl(null)}
          onUse={() => {
            handleSelect(previewTpl);
            setPreviewTpl(null);
          }}
        />
      )}
    </div>
  );
}
