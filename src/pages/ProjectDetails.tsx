import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Task } from '../types';

export const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { projects, milestones, tasks, engineers, addMilestone, addTask, updateTask, deleteTask, addNotification } = useData();
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

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <button onClick={() => navigate('/projects')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
            </button>

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">{project.name}</h2>
                    <p className="text-slate-500">Milestone & Task Tracking</p>
                </div>
                {role === 'admin' && (
                    <button
                        onClick={() => setIsAddingMilestone(true)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Milestone</span>
                    </button>
                )}
            </div>

            {isAddingMilestone && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 ring-1 ring-blue-500/10">
                    <form onSubmit={handleAddMilestone} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Milestone Name</label>
                                <input type="text" value={milestoneName} onChange={e => setMilestoneName(e.target.value)} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-blue-500" autoFocus required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Target Date</label>
                                <input type="date" value={milestoneTargetDate} onChange={e => setMilestoneTargetDate(e.target.value)} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsAddingMilestone(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save Milestone</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-8">
                {projectMilestones.length === 0 && !isAddingMilestone && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed text-slate-500">
                        No milestones added yet.
                    </div>
                )}

                {projectMilestones.map(milestone => {
                    const mTasks = projectTasks.filter(t => t.milestoneId === milestone.id);
                    const todoTasks = mTasks.filter(t => t.status === 'todo');
                    const inProgressTasks = mTasks.filter(t => t.status === 'in_progress');
                    const doneTasks = mTasks.filter(t => t.status === 'done');

                    const progressVal = mTasks.length > 0 ? Math.round((doneTasks.length / mTasks.length) * 100) : 0;

                    return (
                        <div key={milestone.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{milestone.name}</h3>
                                    {milestone.targetDate && (
                                        <p className="text-sm text-slate-500 flex items-center mt-1">
                                            <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
                                            Due {new Date(milestone.targetDate).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">{progressVal}%</div>
                                    <div className="text-sm text-slate-400">Completed</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                                {/* TODO COLUMN */}
                                <div className="p-4 bg-slate-50/30">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold text-slate-700 flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-slate-400 mr-2" />
                                            To Do ({todoTasks.length})
                                        </h4>
                                        {role !== 'client' && (
                                            <button onClick={() => setIsAddingTask(milestone.id)} className="p-1 text-slate-400 hover:bg-slate-200 rounded">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {isAddingTask === milestone.id && (
                                            <form onSubmit={(e) => handleAddTask(milestone.id, e)} className="bg-white p-3 rounded-lg shadow-sm border border-blue-200">
                                                <input type="text" placeholder="Task Title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="w-full text-sm outline-none font-medium mb-2 border-b pb-1" autoFocus required />
                                                <select value={taskEngineer} onChange={e => setTaskEngineer(e.target.value)} className="w-full text-xs outline-none bg-slate-50 mb-2 p-1 rounded">
                                                    <option value="">Assign Engineer...</option>
                                                    {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                                </select>
                                                <div className="flex justify-end gap-2 text-xs">
                                                    <button type="button" onClick={() => setIsAddingTask(null)}>Cancel</button>
                                                    <button type="submit" className="text-blue-600 font-medium">Add</button>
                                                </div>
                                            </form>
                                        )}
                                        {todoTasks.map(task => (
                                            <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors group">
                                                <div className="font-medium text-slate-800 text-sm mb-2">{task.title}</div>
                                                {task.engineerId && (
                                                    <div className="text-xs text-slate-500 flex items-center">
                                                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 font-bold">{engineers.find(e => e.id === task.engineerId)?.name.charAt(0)}</div>
                                                        {engineers.find(e => e.id === task.engineerId)?.name}
                                                    </div>
                                                )}
                                                {role !== 'client' && (
                                                    <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleStatusMove(task, 'in_progress')} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Start</button>
                                                        {role === 'admin' && <button onClick={() => deleteTask(task.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded ml-auto">Delete</button>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* IN PROGRESS COLUMN */}
                                <div className="p-4 bg-blue-50/10">
                                    <h4 className="font-semibold text-slate-700 flex items-center mb-4">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                        In Progress ({inProgressTasks.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {inProgressTasks.map(task => (
                                            <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 group">
                                                <div className="font-medium text-slate-800 text-sm mb-2">{task.title}</div>
                                                {task.engineerId && (
                                                    <div className="text-xs text-slate-500 flex items-center">
                                                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 font-bold">{engineers.find(e => e.id === task.engineerId)?.name.charAt(0)}</div>
                                                        {engineers.find(e => e.id === task.engineerId)?.name}
                                                    </div>
                                                )}
                                                {role !== 'client' && (
                                                    <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleStatusMove(task, 'done')} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">Complete</button>
                                                        <button onClick={() => handleStatusMove(task, 'todo')} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Back</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* DONE COLUMN */}
                                <div className="p-4 bg-emerald-50/20">
                                    <h4 className="font-semibold text-slate-700 flex items-center mb-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                                        Completed ({doneTasks.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {doneTasks.map(task => (
                                            <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 opacity-75 group text-sm">
                                                <div className="line-through text-slate-500 mb-2">{task.title}</div>
                                                {role !== 'client' && (
                                                    <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleStatusMove(task, 'in_progress')} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Reopen</button>
                                                        {role === 'admin' && <button onClick={() => deleteTask(task.id)} className="text-xs text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
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
