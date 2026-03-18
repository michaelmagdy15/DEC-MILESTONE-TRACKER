import React from 'react';
import type { Engineer, Task } from '../types';
import { addDays, eachDayOfInterval, format, startOfDay } from 'date-fns';
import { Activity } from 'lucide-react';

interface ResourceHeatmapProps {
    engineers: Engineer[];
    tasks: Task[];
}

export const ResourceHeatmap: React.FC<ResourceHeatmapProps> = ({ engineers, tasks }) => {
    // Generate an array of 14 days starting from today
    const today = startOfDay(new Date());
    const days = eachDayOfInterval({
        start: today,
        end: addDays(today, 13)
    });

    return (
        <div className="bg-[#1a1a1a]/40 rounded-[32px] p-6 md:p-8 border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden mb-8">
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(243, 130, 45, 0.05), transparent)' }} />
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-lg tracking-tight">Resource Allocation Heatmap</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">14-Day Capacity Forecast</p>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar pb-4">
                    <div className="min-w-max">
                        <div className="flex items-end mb-2">
                            <div className="w-48 shrink-0 pr-4">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Engineer</span>
                            </div>
                            <div className="flex gap-1 flex-1">
                                {days.map((day, i) => (
                                    <div key={i} className="w-10 flex flex-col items-center">
                                        <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-500">{format(day, 'EEE')}</span>
                                        <span className={`text-[10px] font-black ${day.getDay() === 0 || day.getDay() === 6 ? 'text-slate-600' : 'text-slate-400'}`}>{format(day, 'dd')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            {engineers.map(engineer => {
                                // Find all active tasks for this engineer
                                const activeTasks = tasks.filter(t => 
                                    t.engineerId === engineer.id && 
                                    t.status !== 'completed' && 
                                    t.startDate && 
                                    t.dueDate
                                );

                                return (
                                    <div key={engineer.id} className="flex items-center group/row hover:bg-white/5 p-1 rounded-xl transition-colors">
                                        <div className="w-48 shrink-0 pr-4 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-300 truncate w-32" title={engineer.name}>{engineer.name}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">{engineer.role.substring(0, 3)}</span>
                                        </div>
                                        <div className="flex gap-1 flex-1">
                                            {days.map((day, i) => {
                                                const currentDay = startOfDay(day);
                                                
                                                // Calculate load (number of overlapping tasks on this day)
                                                let load = 0;
                                                activeTasks.forEach(task => {
                                                    const start = startOfDay(new Date(task.startDate!));
                                                    // Add 1 day to due date to make it inclusive if it ends at 00:00
                                                    const due = startOfDay(addDays(new Date(task.dueDate!), 1)); 
                                                    
                                                    if (currentDay >= start && currentDay <= due) {
                                                        load++;
                                                    }
                                                });

                                                let bgColor = 'bg-white/5 border-white/5';
                                                let textColor = 'text-transparent';
                                                
                                                if (load > 0) {
                                                    if (load < 3) {
                                                        bgColor = 'bg-emerald-500/20 border-emerald-500/30';
                                                        textColor = 'text-emerald-400';
                                                    } else if (load < 5) {
                                                        bgColor = 'bg-orange-500/30 border-orange-500/40';
                                                        textColor = 'text-orange-400';
                                                    } else {
                                                        bgColor = 'bg-rose-500/40 border-rose-500/50';
                                                        textColor = 'text-rose-400';
                                                    }
                                                }

                                                return (
                                                    <div 
                                                        key={i} 
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${bgColor} ${day.getDay() === 0 || day.getDay() === 6 ? 'opacity-50' : ''}`}
                                                        title={load > 0 ? `${load} tasks assigned` : 'Available'}
                                                    >
                                                        <span className={`text-[10px] font-black ${textColor}`}>{load > 0 ? load : ''}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {engineers.length === 0 && (
                                <p className="text-xs text-slate-500 italic py-4">No engineers available to generate heatmap.</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 flex items-center gap-6 justify-end border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-white/5 border border-white/10"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Optimal (1-2)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-orange-500/30 border border-orange-500/40"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Heavy (3-4)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500/50"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Overloaded (5+)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
