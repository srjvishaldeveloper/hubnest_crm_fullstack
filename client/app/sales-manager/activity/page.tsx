'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  Video, 
  Activity as ActivityIcon,
  TrendingUp,
  Filter,
  Search,
  Sparkles,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock
} from 'lucide-react';

type ActivityType = 'Call' | 'Email' | 'Meeting';
type ActivityOutcome = 'Connected' | 'No Answer' | 'Sent' | 'Opened' | 'Clicked' | 'Completed' | 'Rescheduled';

interface Activity {
  id: string;
  type: ActivityType;
  leadName: string;
  company: string;
  dateTime: string;
  outcome: ActivityOutcome;
  duration?: string;
  notes: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', type: 'Call', leadName: 'Amit Sharma', company: 'Sharma Enterprises', dateTime: 'Today, 05:30 PM', outcome: 'Connected', duration: '04:32', notes: 'Discussed about pricing and product features. He showed interest.' },
  { id: '2', type: 'Email', leadName: 'Neha Verma', company: 'Verma Solutions', dateTime: 'Today, 04:15 PM', outcome: 'Opened', notes: 'Sent proposal email with custom pricing tier.' },
  { id: '3', type: 'Meeting', leadName: 'Rajeev Kumar', company: 'Kumar Traders', dateTime: 'Today, 02:20 PM', outcome: 'Completed', duration: '45:00', notes: 'Product demo conducted. Customer asked for technical docs.' },
  { id: '4', type: 'Call', leadName: 'Pooja Aggarwal', company: 'Aggarwal Industries', dateTime: 'Today, 01:10 PM', outcome: 'No Answer', duration: '00:45', notes: 'Left a voicemail to call back.' },
  { id: '5', type: 'Email', leadName: 'Vikram Singh', company: 'Singh & Sons', dateTime: 'Yesterday, 11:30 AM', outcome: 'Sent', notes: 'Follow-up on the previous meeting.' },
];

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ActivityType | 'All'>('All');

  const filteredActivities = activities.filter(a => {
    const matchSearch = a.leadName.toLowerCase().includes(search.toLowerCase()) || a.company.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || a.type === filterType;
    return matchSearch && matchType;
  });

  const callsCount = activities.filter(a => a.type === 'Call').length;
  const emailsCount = activities.filter(a => a.type === 'Email').length;
  const meetingsCount = activities.filter(a => a.type === 'Meeting').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Track all your sales activities in one place</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200">
          <ActivityIcon size={18} />
          Log New Activity
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Calls Made" value={callsCount} icon={<Phone size={20} className="text-blue-600" />} bg="bg-blue-50" trend="+12% vs yesterday" />
          <KPICard title="Emails Sent" value={emailsCount} icon={<Mail size={20} className="text-orange-600" />} bg="bg-orange-50" trend="+8% vs yesterday" />
          <KPICard title="Meetings Done" value={meetingsCount} icon={<Video size={20} className="text-purple-600" />} bg="bg-purple-50" trend="+25% vs yesterday" />
          <KPICard title="Total Activities" value={activities.length} icon={<ActivityIcon size={20} className="text-emerald-600" />} bg="bg-emerald-50" trend="+10% vs yesterday" />
        </div>

        {/* AI Insight */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className="bg-white p-2 rounded-full shadow-sm text-emerald-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-emerald-900">Activity Performance Score: 82%</h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Excellent</span>
            </div>
            <p className="text-emerald-700 text-sm mt-1">Great job! You're performing better than 78% of users. Try to increase follow-up calls to reach 90%.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search activities..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Types</option>
                <option value="Call">Calls</option>
                <option value="Email">Emails</option>
                <option value="Meeting">Meetings</option>
              </select>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 relative">
            <div className="absolute top-0 bottom-0 left-[39px] w-[2px] bg-slate-100 z-0" />
            <div className="space-y-8 relative z-10">
              {filteredActivities.length > 0 ? filteredActivities.map((activity, idx) => (
                <div key={activity.id} className="flex gap-6 items-start group">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm shrink-0 ${
                    activity.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'Meeting' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {activity.type === 'Call' && <Phone size={16} />}
                    {activity.type === 'Meeting' && <Video size={16} />}
                    {activity.type === 'Email' && <Mail size={16} />}
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white border border-slate-100 hover:border-slate-300 rounded-xl p-4 shadow-sm transition-all group-hover:shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                          {activity.type} with {activity.leadName}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            activity.outcome === 'Connected' || activity.outcome === 'Completed' || activity.outcome === 'Opened' ? 'bg-emerald-100 text-emerald-700' :
                            activity.outcome === 'Sent' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {activity.outcome}
                          </span>
                        </h4>
                        <p className="text-sm text-slate-500 font-medium">{activity.company}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-md">
                        <Clock size={12} /> {activity.dateTime}
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {activity.notes}
                    </p>

                    <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      {activity.type === 'Call' && (
                        <button className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-800">
                          <Phone size={14} /> Call Again
                        </button>
                      )}
                      <button className="text-xs font-semibold text-slate-600 flex items-center gap-1 hover:text-slate-800">
                        <Sparkles size={14} className="text-indigo-500" /> AI Suggestions
                      </button>
                      <button className="text-xs font-semibold text-slate-600 flex items-center gap-1 hover:text-slate-800 ml-auto">
                        View Details <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center text-slate-500 py-10">No activities found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, bg, trend }: { title: string, value: number | string, icon: React.ReactNode, bg: string, trend: string }) {
  return (
    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{trend}</span>
      </div>
      <div>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
        <p className="text-sm font-medium text-slate-500">{title}</p>
      </div>
    </div>
  );
}
