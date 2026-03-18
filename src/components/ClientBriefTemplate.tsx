import { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Project, Milestone, Task, LogEntry } from '../types';
import logo from '../assets/logo.png';

interface ClientBriefTemplateProps {
    project: Project;
    milestones: Milestone[];
    tasks: Task[];
    entries: LogEntry[];
    totalCost: number;
}

export const ClientBriefTemplate = forwardRef<HTMLDivElement, ClientBriefTemplateProps>(
    ({ project, milestones, tasks, entries, totalCost }, ref) => {
        const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
        
        // Calculate Budget Health
        const budget = project.budget || 0;
        const budgetUsedPercent = budget > 0 ? (totalCost / budget) * 100 : 0;

        // Calculate Milestones Progress
        const milestonesWithProgress = milestones.map(m => {
            const milestoneTasks = tasks.filter(t => t.milestoneId === m.id);
            const completedTasks = milestoneTasks.filter(t => t.status === 'completed').length;
            const totalTasks = milestoneTasks.length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            return { ...m, progress, completedTasks, totalTasks };
        });

        // Overall Project Progress (average of milestone progress)
        const totalProgress = milestonesWithProgress.length > 0 
            ? milestonesWithProgress.reduce((sum, m) => sum + m.progress, 0) / milestonesWithProgress.length 
            : 0;

        return (
            <div ref={ref} className="bg-white text-slate-900 w-[800px] font-sans p-12 box-border">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-emerald-600 mb-2">PROGRESS BRIEF</h1>
                        <p className="text-slate-500 font-medium tracking-wide">CONFIDENTIAL CLIENT REPORT</p>
                        <p className="text-slate-500 font-medium">Date: {format(new Date(), 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <img src={logo} alt="DEC Logo" className="h-12 w-auto object-contain mb-2" />
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">DEC Engineering</h2>
                        <p className="text-slate-500 mt-1 text-sm">Design & Engineering Consultants</p>
                        <p className="text-slate-500 text-sm">Abu Dhabi / Cairo</p>
                    </div>
                </div>

                {/* Project Overview */}
                <div className="mb-10 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">{project.name}</h2>
                    
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Completion</h3>
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-black text-emerald-600">{Math.round(totalProgress)}%</div>
                                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalProgress}%` }}></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Budget Health</h3>
                            <div className="flex items-center gap-4">
                                <div className="text-xl font-bold text-slate-700">AED {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} Used</div>
                                <div className="text-sm font-medium text-slate-500">of AED {budget.toLocaleString()}</div>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-2">
                                <div className={`h-full ${budgetUsedPercent > 90 ? 'bg-red-500' : 'bg-orange-500'} rounded-full`} style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Milestones Status */}
                <div className="mb-10">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Milestone Status</h3>
                    <div className="space-y-4">
                        {milestonesWithProgress.map(m => (
                            <div key={m.id} className="flex items-center justify-between">
                                <div className="w-1/2">
                                    <p className="font-bold text-slate-800">{m.name}</p>
                                    <p className="text-xs text-slate-500">{m.completedTasks} / {m.totalTasks} Tasks Completed</p>
                                </div>
                                <div className="w-1/3 flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.progress}%` }}></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 w-12 text-right">{Math.round(m.progress)}%</span>
                                </div>
                            </div>
                        ))}
                        {milestonesWithProgress.length === 0 && (
                            <p className="text-slate-500 italic text-sm">No milestones established for this project.</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mb-12">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Recent Engineering Activity</h3>
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="text-slate-500 border-b border-slate-100">
                                <th className="py-2 font-medium w-1/4">Date</th>
                                <th className="py-2 font-medium w-3/4">Task Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sortedEntries.map((entry, idx) => (
                                <tr key={idx} className="text-slate-700">
                                    <td className="py-3 whitespace-nowrap">{format(new Date(entry.date), 'MMM d, yyyy')}</td>
                                    <td className="py-3 pr-4">{entry.taskDescription}</td>
                                </tr>
                            ))}
                            {sortedEntries.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="py-4 text-slate-500 italic text-center">No recent activity logged.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="text-center text-slate-400 text-xs mt-auto pt-8 border-t border-slate-100">
                    <p className="font-bold mb-1 uppercase tracking-widest text-slate-300">Generated Automatically by DEC Milestone Tracker</p>
                    <p>This document is confidential and intended solely for the use of the individual or entity to whom it is addressed.</p>
                </div>
            </div>
        );
    }
);
