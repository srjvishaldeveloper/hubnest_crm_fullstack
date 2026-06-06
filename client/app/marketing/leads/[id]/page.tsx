'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { User, ShieldAlert, Sparkles, Plus, Clock, Award, Phone, Mail, MapPin } from 'lucide-react';

export default function MarketingLeadDetailPage() {
  const { id } = useParams();
  const [notes, setNotes] = useState([
    { id: 1, text: 'Lead expressed high interest in CRM integrations with Slack.', date: 'Today, 10:45 AM', author: 'Priya Sharma' },
    { id: 2, text: 'Called but line was busy. Scheduled follow-up email.', date: 'Yesterday, 02:15 PM', author: 'Priya Sharma' },
  ]);
  const [newNote, setNewNote] = useState('');

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote) return;
    setNotes(prev => [
      { id: Date.now(), text: newNote, date: 'Just now', author: 'Marketing Executive' },
      ...prev
    ]);
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-lg">
            SY
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Shivam Yadav</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-600">
                High Quality
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Lead ID: {id} • Created on 06 Jun 2026</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
          Assign to Sales
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Details Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <Mail className="w-4 h-4 text-slate-400" /> sy5952832@gmail.com
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <Phone className="w-4 h-4 text-slate-400" /> +91 99999 88888
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <MapPin className="w-4 h-4 text-slate-400" /> Noida, India
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <User className="w-4 h-4 text-slate-400" /> Device: Mobile (Chrome)
              </div>
            </div>
          </div>

          {/* Source/Campaign details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Marketing attribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Campaign</span>
                <span className="text-xs font-bold text-slate-700">Summer Sale 2026</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Source / Platform</span>
                <span className="text-xs font-bold text-slate-700">Facebook Ads</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ad Group</span>
                <span className="text-xs font-bold text-slate-700">Automation Interest Group</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attributed Creative</span>
                <span className="text-xs font-bold text-slate-700">Creative Variant A (Benefits)</span>
              </div>
            </div>
          </div>

          {/* Behavior and notes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Notes & Comments</h3>
            <form onSubmit={addNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
              />
              <button type="submit" className="flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shrink-0">
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
            <div className="space-y-3 pt-2">
              {notes.map(n => (
                <div key={n.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">{n.text}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>By {n.author}</span>
                    <span>{n.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Activity and lifecycle timeline */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Lead Lifecycle</h3>
            <div className="space-y-4 pt-2">
              {[
                { step: 'New', desc: 'Lead captured from Facebook Ads form.', active: true },
                { step: 'Assigned', desc: 'Auto assigned to Marketing queue.', active: true },
                { step: 'Contacted', desc: 'Awaiting first call dispatch.', active: false },
                { step: 'Converted', desc: 'Pending deal closure.', active: false },
              ].map((s, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${
                      s.active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    {idx < 3 && <div className={`w-0.5 h-10 ${s.active ? 'bg-blue-600' : 'bg-slate-100'}`} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{s.step}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
