import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Check, AlertCircle, FolderKanban, Clock, CheckCircle2, MoreHorizontal, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Task } from '../types';

export const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { projects, milestones, tasks, engineers, addMilestone, addTask, updateTask, addNotification } = useData();
    const { role, engineerId: currentEngineerId } = useAuth();

    const project = projects.find(p => p.id === id);
    const projectMilestones = milestones.filter(m => m.projectId === id).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    const projectTasks = tasks.filter(t => t.projectId === id).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

    // UI state
    const [isAddingMilestone, setIsAddingMilestone] = useState(false);
    const [milestoneName, setMilestoneName] = useState('');
    const [milestoneTargetDate, setMilestoneTargetDate] = useState('');

    const [isAddingTask, setIsAddingTask] = useState<string | null>(null); // milestone ID
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskEngineer, setTaskEngineer] = useState('');

    if (!project) return <div className="p-8 text-center text-slate-500">Project not found</div>;

    const handleAddMilestone = (e: React.FormEvent) => {
        e.preventDefault();
        if (!milestoneName.trim()) return;
        addMilestone({
            id: crypto.randomUUID(),
            projectId: project.id,
            name: milestoneName,
            targetDate: milestoneTargetDate || undefined,
            completedPercentage: 0
        });
        setMilestoneName('');
        setMilestoneTargetDate('');
        setIsAddingMilestone(false);
    };

    const handleAddTask = (milestoneId: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!taskTitle.trim()) return;
        addTask({
            id: crypto.randomUUID(),
            projectId: project.id,
            milestoneId,
            engineerId: taskEngineer || undefined,
            title: taskTitle,
            description: taskDesc,
            status: 'todo'
        });

        if (taskEngineer && taskEngineer !== currentEngineerId) {
            addNotification({
                id: crypto.randomUUID(),
                engineerId: taskEngineer,
                message: `You've been assigned a new task: "${taskTitle}" in ${project.name}`,
                isRead: false
            });
        }

        setTaskTitle('');
        setTaskDesc('');
        setTaskEngineer('');
        setIsAddingTask(null);
    };

    const handleStatusMove = (task: Task, newStatus: 'todo' | 'in_progress' | 'done') => {
        updateTask({ ...task, status: newStatus });

        if (task.engineerId && task.engineerId !== currentEngineerId) {
            const statusLabel = newStatus.replace('_', ' ');
            addNotification({
                id: crypto.randomUUID(),
                engineerId: task.engineerId,
                message: `Status of your task "${task.title}" was changed to ${statusLabel}.`,
                isRead: false
            });
        }
    };

    // New function to handle task status update
    const updateTaskStatus = (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (taskToUpdate) {
            handleStatusMove(taskToUpdate, newStatus);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <button
                onClick={() => navigate('/projects')}
                className="flex items-center text-slate-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px] group"
            >
                <div className="p-2 bg-white/5 rounded-lg mr-3 group-hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Return to Library
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
                        {project.name} <span className="text-orange-400">Venture</span>
                    </h2>
                    <div className="h-1 w-20 bg-orange-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Strategic Milestone & Task Command Center</p>
                </div>
                {role === 'admin' && (
                    <button
                        onClick={() => setIsAddingMilestone(true)}
                        className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-1 disabled:opacity-50 font-bold uppercase tracking-widest text-[11px]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Establish Milestone</span>
                    </button>
                )}
            </div>

            {isAddingMilestone && (
                <div className="bg-[#1a1a1a]/60 p-10 rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500"></div>
                    <form onSubmit={handleAddMilestone} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Milestone Designation</label>
                                <input
                                    type="text"
                                    value={milestoneName}
                                    onChange={e => setMilestoneName(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="e.g. Concept Submission"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Target Completion</label>
                                <input
                                    type="date"
                                    value={milestoneTargetDate}
                                    onChange={e => setMilestoneTargetDate(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsAddingMilestone(false)}
                                className="px-8 py-4 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[11px] transition-all"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-4 bg-white text-black hover:bg-orange-500 hover:text-white rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-xl font-bold uppercase tracking-widest text-[11px]"
                            >
                                <Check className="w-4 h-4" />
                                <span>Save Milestone</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-8">
                {projectMilestones.length === 0 && !isAddingMilestone && (
                    <div className="text-center py-20 bg-[#1a1a1a]/40 rounded-[40px] border border-dashed border-white/5 backdrop-blur-3xl">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <FolderKanban className="w-10 h-10 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight">No milestones established</h3>
                        <p className="text-slate-500 font-medium mt-2">Initialize your project architecture by adding a milestone.</p>
                    </div>
                )}

                {projectMilestones.map(milestone => {
                    const mTasks = projectTasks.filter(t => t.milestoneId === milestone.id);
                    const todoTasks = mTasks.filter(t => t.status === 'todo');
                    const inProgressTasks = mTasks.filter(t => t.status === 'in_progress');
                    const doneTasks = mTasks.filter(t => t.status === 'done');

                    const progressVal = mTasks.length > 0 ? Math.round((doneTasks.length / mTasks.length) * 100) : 0;

                    return (
                        <div key={milestone.id} className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl relative group">
                            <div className="p-8 border-b border-white/5 bg-white/0 flex justify-between items-center relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight mb-2 group-hover:text-orange-400 transition-colors">{milestone.name}</h3>
                                    {milestone.targetDate && (
                                        <div className="flex items-center gap-3">
                                            <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center">
                                                    <AlertCircle className="w-3 h-3 mr-1.5" />
                                                    Deadline: {new Date(milestone.targetDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-white mb-1">{progressVal}%</div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Efficiency Rating</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/5 relative z-10">
                                {/* TODO COLUMN */}
                                <div className="p-8">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-[0_0_10px_rgba(148,163,184,0.5)]"></div>
                                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Pending Operations</h4>
                                        </div>
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-500 border border-white/5">{todoTasks.length}</span>
                                    </div>
                                    <div className="space-y-4">
                                        {isAddingTask === milestone.id && (
                                            <div className="bg-[#1a1a1a]/60 p-6 rounded-[28px] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500/50 to-purple-500/50"></div>
                                                <form onSubmit={(e) => handleAddTask(milestone.id, e)} className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Task Objective</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Describe the operation..."
                                                            value={taskTitle}
                                                            onChange={e => setTaskTitle(e.target.value)}
                                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all text-sm font-medium"
                                                            autoFocus
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assignee</label>
                                                        <select
                                                            value={taskEngineer}
                                                            onChange={e => setTaskEngineer(e.target.value)}
                                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all text-xs font-medium appearance-none"
                                                        >
                                                            <option value="" className="bg-[#1a1a1a]">Assign Operative...</option>
                                                            {engineers.map(e => (
                                                                <option key={e.id} value={e.id} className="bg-[#1a1a1a]">{e.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex justify-end gap-3 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAddingTask(null)}
                                                            className="px-4 py-2 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[9px] transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all duration-300 shadow-lg shadow-orange-600/20 font-bold uppercase tracking-widest text-[9px]"
                                                        >
                                                            Launch Task
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                        {todoTasks.map(task => (
                                            <div key={task.id} className="group/task bg-white/5 p-6 rounded-[24px] border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:bg-white/[0.08]">
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="text-white font-bold leading-relaxed">{task.title}</p>
                                                    <button className="text-slate-600 hover:text-white transition-colors">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                    <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                        <Clock className="w-3 h-3 mr-1.5" />
                                                        Queued
                                                    </div>
                                                    <button
                                                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                                        className="p-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {todoTasks.length === 0 && (
                                            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                                                <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">No Pending Tasks</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* IN PROGRESS COLUMN */}
                                <div className="p-8 bg-orange-500/[0.02]">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Active Operations</h4>
                                        </div>
                                        <span className="px-3 py-1 bg-orange-500/10 rounded-full text-[10px] font-black text-orange-400 border border-orange-500/20">{inProgressTasks.length}</span>
                                    </div>
                                    <div className="space-y-4">
                                        {inProgressTasks.map(task => (
                                            <div key={task.id} className="group/task bg-[#1a1a1a]/40 p-6 rounded-[24px] border border-white/5 hover:border-orange-500/30 transition-all duration-300 shadow-xl">
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="text-white font-bold leading-relaxed">{task.title}</p>
                                                    <button className="text-slate-600 hover:text-white transition-colors">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                    <div className="flex items-center text-orange-400 text-[10px] font-bold uppercase tracking-widest">
                                                        <Settings2 className="w-3 h-3 mr-1.5 animate-spin-slow" />
                                                        Executing
                                                    </div>
                                                    <button
                                                        onClick={() => updateTaskStatus(task.id, 'done')}
                                                        className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {inProgressTasks.length === 0 && (
                                            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                                                <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">All Clear</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* DONE COLUMN */}
                                <div className="p-8">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Completed Missions</h4>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-500 border border-emerald-500/20">{doneTasks.length}</span>
                                    </div>
                                    <div className="space-y-4">
                                        {doneTasks.map(task => (
                                            <div key={task.id} className="group/task bg-white/5 opacity-60 p-6 rounded-[24px] border border-white/5">
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="text-slate-400 font-bold line-through leading-relaxed">{task.title}</p>
                                                    <button className="text-slate-600 hover:text-white transition-colors">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center text-emerald-500/50 text-[10px] font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                                                    <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                                    Verified
                                                </div>
                                            </div>
                                        ))}
                                        {doneTasks.length === 0 && (
                                            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                                                <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">Awaiting Results</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </motion.div>
    );
};
