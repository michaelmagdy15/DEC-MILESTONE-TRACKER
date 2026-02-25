import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Check, AlertCircle, FolderKanban, Clock, CheckCircle2, MoreHorizontal, Settings2, File, Upload, Trash2, Download, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Task } from '../types';
import { supabase } from '../lib/supabase';

export const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { projects, milestones, tasks, engineers, entries, addMilestone, addTask, updateTask, addNotification, projectFiles, addProjectFile, deleteProjectFile, isLoading } = useData();
    const { role, engineerId: currentEngineerId, user } = useAuth();

    const project = projects.find(p => p.id === id);
    const projectMilestones = milestones.filter(m => m.projectId === id).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    const projectTasks = tasks.filter(t => t.projectId === id).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    const pFiles = projectFiles.filter(f => f.projectId === id).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const projectEntries = entries.filter(e => e.projectId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const [activeTab, setActiveTab] = useState<'milestones' | 'files' | 'entries'>('milestones');
    const [isUploading, setIsUploading] = useState(false);

    // UI state
    const [isAddingMilestone, setIsAddingMilestone] = useState(false);
    const [milestoneName, setMilestoneName] = useState('');
    const [milestoneTargetDate, setMilestoneTargetDate] = useState('');

    const [isAddingTask, setIsAddingTask] = useState<string | null>(null); // milestone ID
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskEngineer, setTaskEngineer] = useState('');

    if (!project) {
        if (isLoading) {
            return (
                <div className="min-h-[50vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Loading Project Data</p>
                    </div>
                </div>
            );
        }
        return <div className="p-8 text-center text-slate-500">Project not found</div>;
    }

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !project) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
            const fileName = `${project.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('project-files')
                .getPublicUrl(fileName);

            await addProjectFile({
                id: crypto.randomUUID(),
                projectId: project.id,
                name: file.name,
                fileFormat: fileExt as 'pdf' | 'dwf',
                fileUrl: publicUrlData.publicUrl,
                uploadedBy: currentEngineerId || 'system'
            });

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file.');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = ''; // clear input
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
                    <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">
                            {project.name} <span className="text-orange-400">Venture</span>
                        </h2>
                        <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold tracking-widest uppercase">
                            {project.phase || 'Planning'}
                        </div>
                    </div>
                    <div className="h-1 w-20 bg-orange-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Strategic Milestone & Task Command Center</p>
                </div>
                <div className="flex gap-4">
                    {activeTab === 'milestones' && role === 'admin' && (
                        <button
                            onClick={() => setIsAddingMilestone(true)}
                            className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-1 disabled:opacity-50 font-bold uppercase tracking-widest text-[11px]"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Establish Milestone</span>
                        </button>
                    )}
                    {activeTab === 'files' && (
                        <div>
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleFileUpload}
                                accept=".pdf,.dwf"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className={`flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-1 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} font-bold uppercase tracking-widest text-[11px]`}
                            >
                                <Upload className="w-4 h-4" />
                                <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex space-x-4 border-b border-white/10 mb-8">
                <button
                    onClick={() => setActiveTab('milestones')}
                    className={`px-6 py-4 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 ${activeTab === 'milestones' ? 'text-orange-400 border-orange-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                >
                    Milestones & Tasks
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`px-6 py-4 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 ${activeTab === 'files' ? 'text-orange-400 border-orange-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                >
                    Project Files
                </button>
                <button
                    onClick={() => setActiveTab('entries')}
                    className={`px-6 py-4 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 ${activeTab === 'entries' ? 'text-orange-400 border-orange-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                >
                    Activity Log ({projectEntries.length})
                </button>
            </div>

            {isAddingMilestone && activeTab === 'milestones' && (
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

            {activeTab === 'files' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {pFiles.length === 0 ? (
                        <div className="col-span-full text-center py-32 bg-[#1a1a1a]/20 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <File className="w-10 h-10 text-slate-700" />
                            </div>
                            <p className="text-slate-400 font-black text-xl tracking-tight mb-2">No files uploaded yet</p>
                            <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">Share PDFs or DWF files for this project</p>
                        </div>
                    ) : (
                        pFiles.map(f => {
                            const uploader = engineers.find(e => e.id === f.uploadedBy);
                            return (
                                <div key={f.id} className="group bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 hover:border-orange-500/30 backdrop-blur-3xl shadow-2xl transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all duration-500"></div>
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="w-14 h-14 bg-white/5 text-white rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-500 shadow-lg">
                                            <File className="w-6 h-6" />
                                        </div>
                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                            <a
                                                href={f.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 text-slate-500 hover:text-orange-400 hover:bg-orange-400/10 rounded-xl transition-all"
                                                title="Open / Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            {(role === 'admin' || f.uploadedBy === user?.id) && (
                                                <button
                                                    onClick={() => deleteProjectFile(f.id)}
                                                    className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all flex items-center"
                                                    title="Delete File"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="font-black text-lg text-white tracking-tight group-hover:text-orange-400 transition-colors break-words mb-2">{f.name}</h3>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                <span className="bg-white/10 px-2 py-0.5 rounded text-white mr-2">{f.fileFormat.toUpperCase()}</span>
                                                {new Date(f.createdAt || '').toLocaleDateString()}
                                            </div>
                                            {uploader && (
                                                <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Uploaded by: <span className="text-slate-400">{uploader.name}</span></p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </motion.div>
            )}
            {activeTab === 'entries' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                >
                    {projectEntries.length === 0 ? (
                        <div className="text-center py-32 bg-[#1a1a1a]/40 rounded-[40px] border border-dashed border-white/5 backdrop-blur-3xl">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                                <ClipboardList className="w-10 h-10 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tight">No entries logged</h3>
                            <p className="text-slate-500 font-medium mt-2">Engineers haven't logged any work for this project yet.</p>
                        </div>
                    ) : (
                        <div className="bg-[#1a1a1a]/40 rounded-[32px] border border-white/5 overflow-hidden backdrop-blur-3xl">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Engineer</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Date</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Task</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Software</th>
                                            <th className="text-right px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectEntries.map(entry => {
                                            const engineer = engineers.find(e => e.id === entry.engineerId);
                                            return (
                                                <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400 font-black text-xs border border-orange-500/20">
                                                                {engineer?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <span className="text-white font-bold text-sm">{engineer?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 text-sm font-medium">
                                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-white text-sm font-medium max-w-xs">
                                                        <p className="truncate">{entry.taskDescription}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {entry.softwareUsed?.map((sw, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-slate-400 border border-white/5">{sw}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-white font-black text-lg">{entry.timeSpent}</span>
                                                        <span className="text-slate-600 text-xs ml-1">hrs</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-white/10">
                                            <td colSpan={4} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-orange-400 font-black text-lg">{projectEntries.reduce((sum, e) => sum + e.timeSpent, 0).toFixed(1)}</span>
                                                <span className="text-slate-600 text-xs ml-1">hrs</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
};
