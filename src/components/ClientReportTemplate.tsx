import { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Project, Milestone, Task } from '../types';

interface ClientReportTemplateProps {
    project: Project;
    milestones: Milestone[];
    tasks: Task[];
}

export const ClientReportTemplate = forwardRef<HTMLDivElement, ClientReportTemplateProps>(
    ({ project, milestones, tasks }, ref) => {
        const sortedMilestones = [...milestones].sort((a, b) => {
            if (a.targetDate && b.targetDate) return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
            return (a.createdAt || '').localeCompare(b.createdAt || '');
        });

        const activeTasks = tasks.filter(t => t.status === 'in_progress');
        const doneTasks = tasks.filter(t => t.status === 'done');
        const recentDoneTasks = [...doneTasks].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5);

        const projectProgress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

        return (
            <div ref={ref} className="bg-white text-slate-900 w-[800px] font-sans p-12 box-border shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-orange-500 pb-8 mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-800 mb-1">PROJECT STATUS REPORT</h1>
                        <h2 className="text-xl font-bold text-orange-600 mb-2">{project.name}</h2>
                        <p className="text-slate-500 font-medium text-sm">Report Date: {format(new Date(), 'MMMM d, yyyy')}</p>
                        <p className="text-slate-500 font-medium text-sm">Project Phase: {project.phase || 'Planning'}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">DEC <span className="text-orange-600">ENGINEERING</span></h2>
                        <p className="text-slate-500 mt-1 text-sm">123 Corporate Ave, Suite 400</p>
                        <p className="text-slate-500 text-sm">Dubai, United Arab Emirates</p>
                    </div>
                </div>

                {/* Overall Status */}
                <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Progress</h3>
                        <p className="text-slate-600 text-sm max-w-sm">
                            The project is currently advancing through the {project.phase || 'Planning'} phase with {activeTasks.length} operations actively in progress.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-5xl font-black text-orange-600 mb-1">{projectProgress}%</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Rating</p>
                    </div>
                </div>

                {/* Milestones Summary */}
                <div className="mb-12">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Milestone Tracker</h3>
                    <div className="space-y-4">
                        {sortedMilestones.map((milestone) => {
                            const mTasks = tasks.filter(t => t.milestoneId === milestone.id);
                            const mDone = mTasks.filter(t => t.status === 'done').length;
                            const mProgress = mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0;

                            return (
                                <div key={milestone.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                                    <div className="w-1/2">
                                        <p className="font-bold text-slate-800">{milestone.name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                                            Target: {milestone.targetDate ? format(new Date(milestone.targetDate), 'MMM d, yyyy') : 'TBD'}
                                        </p>
                                    </div>
                                    <div className="w-1/3">
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${mProgress}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="w-1/6 text-right font-black text-slate-700">
                                        {mProgress}%
                                    </div>
                                </div>
                            );
                        })}
                        {sortedMilestones.length === 0 && (
                            <p className="text-slate-500 text-sm italic">No milestones defined yet.</p>
                        )}
                    </div>
                </div>

                {/* Grid for Tasks */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    {/* Recently Completed */}
                    <div>
                        <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2 mb-4">Recently Verified</h3>
                        <ul className="space-y-3">
                            {recentDoneTasks.map(task => (
                                <li key={task.id} className="flex items-start gap-2">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <p className="text-sm text-slate-600 font-medium">{task.title}</p>
                                </li>
                            ))}
                            {recentDoneTasks.length === 0 && (
                                <p className="text-slate-400 text-sm italic">Awaiting completed deliverables.</p>
                            )}
                        </ul>
                    </div>
                    {/* Active Operations */}
                    <div>
                        <h3 className="text-sm font-bold text-orange-600 uppercase tracking-widest border-b border-orange-100 pb-2 mb-4">Active Operations</h3>
                        <ul className="space-y-3">
                            {activeTasks.slice(0, 5).map(task => (
                                <li key={task.id} className="flex items-start gap-2">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                    <p className="text-sm text-slate-600 font-medium">{task.title}</p>
                                </li>
                            ))}
                            {activeTasks.length > 5 && (
                                <p className="text-slate-400 text-sm italic">...and {activeTasks.length - 5} more active tasks.</p>
                            )}
                            {activeTasks.length === 0 && (
                                <p className="text-slate-400 text-sm italic">All current operations are idle.</p>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-slate-400 text-xs mt-auto pt-8 border-t border-slate-100">
                    <p className="font-medium tracking-wide">CONFIDENTIAL & PROPRIETARY</p>
                    <p className="mt-1">Generated by DEC Project Management Intelligence</p>
                </div>
            </div>
        );
    }
);
