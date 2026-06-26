'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Calendar as CalendarIcon,
  Phone,
  Video,
  MessageSquare,
  Plus,
  Filter,
  Search,
  MoreVertical,
  Check,
  ChevronRight,
  Sparkles,
  RefreshCw,
  CalendarDays
} from 'lucide-react';

// --- Types ---
type TaskPriority = 'High' | 'Medium' | 'Low';
type TaskStatus = 'Pending' | 'Completed' | 'Missed';
type TaskType = 'Call' | 'Meeting' | 'Follow-up';

interface Task {
  id: string;
  title: string;
  type: TaskType;
  leadName: string;
  company: string;
  date: string;
  time: string;
  priority: TaskPriority;
  status: TaskStatus;
}

// --- Mock Data ---
const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Follow-up Call', type: 'Call', leadName: 'Amit Sharma', company: 'Sharma Enterprises', date: 'Today', time: '10:00 AM', priority: 'High', status: 'Pending' },
  { id: '2', title: 'Product Demo', type: 'Meeting', leadName: 'Neha Verma', company: 'Verma Solutions', date: 'Today', time: '12:00 PM', priority: 'Medium', status: 'Pending' },
  { id: '3', title: 'Pricing Discussion', type: 'Call', leadName: 'Rajeev Kumar', company: 'Kumar Traders', date: 'Today', time: '02:30 PM', priority: 'High', status: 'Pending' },
  { id: '4', title: 'Check budget approval', type: 'Follow-up', leadName: 'Pooja Aggarwal', company: 'Aggarwal Industries', date: 'Today', time: '04:00 PM', priority: 'Low', status: 'Completed' },
  { id: '5', title: 'Send proposal', type: 'Follow-up', leadName: 'Vikram Singh', company: 'Singh & Sons', date: 'Yesterday', time: '11:00 AM', priority: 'High', status: 'Missed' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TaskType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');

  // Computed
  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.leadName.toLowerCase().includes(search.toLowerCase()) || t.company.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || t.type === filterType;
    const matchStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const todayTasks = tasks.filter(t => t.date === 'Today');
  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const missedTasks = tasks.filter(t => t.status === 'Missed');

  const handleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tasks / Follow-ups</h1>
          <p className="text-sm text-slate-500 mt-1">Stay on track. Follow up. Close more deals.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200">
          <Plus size={18} />
          Add New Task
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Today's Tasks" value={todayTasks.length} icon={<CalendarDays size={20} className="text-blue-600" />} bg="bg-blue-50" />
          <KPICard title="Pending Tasks" value={pendingTasks.length} icon={<Clock size={20} className="text-orange-600" />} bg="bg-orange-50" />
          <KPICard title="Completed" value={completedTasks.length} icon={<CheckCircle2 size={20} className="text-emerald-600" />} bg="bg-emerald-50" />
          <KPICard title="Missed Tasks" value={missedTasks.length} icon={<XCircle size={20} className="text-red-600" />} bg="bg-red-50" />
        </div>

        {/* AI Insight */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-indigo-900">AI Recommendations</h4>
            <p className="text-indigo-700 text-sm mt-1">You have 1 high priority task due in next 30 mins: Call Amit Sharma. Completing this has a 90% chance of advancing the deal.</p>
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
                placeholder="Search leads or company..." 
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
                <option value="Meeting">Meetings</option>
                <option value="Follow-up">Follow-ups</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Missed">Missed</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 flex-1 overflow-auto">
            <AnimatePresence>
              {filteredTasks.length > 0 ? filteredTasks.map(task => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 hover:bg-slate-50 transition-colors group flex items-start gap-4 ${task.status === 'Completed' ? 'opacity-60' : ''}`}
                >
                  {/* Icon */}
                  <div className={`p-3 rounded-full ${
                    task.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                    task.type === 'Meeting' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {task.type === 'Call' && <Phone size={18} />}
                    {task.type === 'Meeting' && <Video size={18} />}
                    {task.type === 'Follow-up' && <MessageSquare size={18} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{task.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        task.priority === 'High' ? 'bg-red-100 text-red-700' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                      {task.status === 'Missed' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertCircle size={10} /> Missed
                        </span>
                      )}
                      {task.status === 'Completed' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Completed
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      <span className="font-medium text-slate-700">{task.leadName}</span> • {task.company}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                        <CalendarIcon size={14} /> {task.date}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                        <Clock size={14} /> {task.time}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status === 'Pending' && (
                      <>
                        <button 
                          onClick={() => handleComplete(task.id)}
                          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Check size={16} /> Mark Done
                        </button>
                        <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                          <RefreshCw size={14} /> Reschedule
                        </button>
                      </>
                    )}
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">No tasks found</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-sm">
                    You're all caught up! Or try adjusting your filters to find what you're looking for.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, bg }: { title: string, value: number | string, icon: React.ReactNode, bg: string }) {
  return (
    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
      </div>
    </div>
  );
}
