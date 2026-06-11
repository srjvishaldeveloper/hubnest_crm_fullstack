'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Info } from 'lucide-react';

const MOCK_TASKS = [
  { id: '1', title: 'Initial Call', scheduled_at: '2026-06-06T10:30:00Z', priority: 'High', status: 'Pending' },
  { id: '2', title: 'Product Demo', scheduled_at: '2026-06-06T11:45:00Z', priority: 'High', status: 'Pending' },
  { id: '3', title: 'Contract Signature', scheduled_at: '2026-06-12T14:30:00Z', priority: 'Medium', status: 'Pending' },
  { id: '4', title: 'Send Proposal', scheduled_at: '2026-06-18T09:00:00Z', priority: 'Low', status: 'Done' },
  { id: '5', title: 'Check Interest', scheduled_at: '2026-06-06T10:15:00Z', priority: 'High', status: 'Missed' }
];

export default function CalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [dayTasks, setDayTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/sales/tasks');
        setTasks(res.data.data.tasks);
      } catch {
        setTasks(MOCK_TASKS);
      }
    };
    fetchTasks();
  }, []);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Handle clicking a specific day
  const handleDayClick = (dayNum: number) => {
    const clickedDate = new Date(currentYear, currentMonth, dayNum);
    setSelectedDate(clickedDate);
    
    const matched = tasks.filter(t => {
      const tDate = new Date(t.scheduled_at);
      return tDate.getDate() === dayNum && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
    setDayTasks(matched);
  };

  // Populate tasks for a day in the calendar grid
  const getDayTasks = (dayNum: number) => {
    return tasks.filter(t => {
      const tDate = new Date(t.scheduled_at);
      return tDate.getDate() === dayNum && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/sales/tasks')} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Tasks Calendar</h2>
            <p className="text-xs text-slate-500 mt-0.5">Visualize your monthly workflow schedules.</p>
          </div>
        </div>
        <button onClick={() => router.push('/sales/tasks')} className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Month Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">{monthNames[currentMonth]} {currentYear}</h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1.5 border border-slate-200 hover:bg-slate-50 dark:bg-[#161616] rounded-lg transition text-slate-500">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextMonth} className="p-1.5 border border-slate-200 hover:bg-slate-50 dark:bg-[#161616] rounded-lg transition text-slate-500">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-[#1f1f1f] pb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 text-xs font-semibold">
            {/* Empty boxes for offset */}
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 border border-transparent" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayTasksList = getDayTasks(dayNum);
              const isToday = new Date().getDate() === dayNum && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
              
              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  className={`h-16 p-1.5 border border-slate-100 dark:border-[#1f1f1f] rounded-xl hover:border-blue-400 hover:bg-blue-50/10 cursor-pointer transition-all flex flex-col justify-between
                    ${isToday ? 'bg-blue-50/20 border-blue-300 ring-1 ring-blue-300' : 'bg-slate-50 dark:bg-[#161616]/30'}`}
                >
                  <span className={`text-[10px] font-extrabold ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{dayNum}</span>
                  <div className="flex gap-0.5 flex-wrap overflow-hidden">
                    {dayTasksList.slice(0, 3).map((t: any) => {
                      const color = t.status === 'Done' ? 'bg-green-500' : (t.status === 'Missed' ? 'bg-red-500' : 'bg-blue-500');
                      return (
                        <span key={t.id} className={`w-1.5 h-1.5 rounded-full ${color}`} title={t.title} />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 dark:border-[#1f1f1f]">
              Tasks for {selectedDate.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            {dayTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No tasks scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayTasks.map(task => {
                  const color = task.status === 'Done' ? 'bg-green-100 text-green-700' : (task.status === 'Missed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700');
                  return (
                    <div key={task.id} className="p-3 bg-slate-50 dark:bg-[#161616] rounded-xl border border-slate-200/40">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-bold text-slate-800 leading-tight">{task.title}</p>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${color}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Priority: {task.priority}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-6 p-3 bg-slate-50 dark:bg-[#161616] rounded-xl text-[10px] text-slate-500 leading-snug">
            Legend:<br />
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1 align-middle" /> Blue = Upcoming task<br />
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-1 align-middle" /> Green = Completed task<br />
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1 align-middle" /> Red = Missed task
          </div>
        </div>

      </div>

    </div>
  );
}
