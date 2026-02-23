
import React, { useState } from 'react';
import { Trash2, FileText, X, Check, Wrench, Folder, Clock, Calendar, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { LogEntry } from '../types';
import { format } from 'date-fns';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const COMMON_SOFTWARE = ['AutoCAD', 'Revit', 'Excel', 'Word', 'Civil 3D', 'SAP2000', 'ETABS', 'SAFE', 'Primavera'];

export const Entries: React.FC = () => {
    const { projects, engineers, entries, addEntry, deleteEntry } = useData();
    const { role, engineerId: currentEngineerId } = useAuth();
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [projectId, setProjectId] = useState('');
    const [engineerId, setEngineerId] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [softwareUsed, setSoftwareUsed] = useState<string[]>([]);
    const [timeSpent, setTimeSpent] = useState('');
    const [milestone, setMilestone] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const toggleSoftware = (sw: string) => {
        setSoftwareUsed(prev =>
            prev.includes(sw) ? prev.filter(s => s !== sw) : [...prev, sw]
        );
    };

    const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !engineerId || !taskDescription || !timeSpent) return;

        const entry: LogEntry = {
            id: crypto.randomUUID(),
            projectId,
            engineerId,
            date,
            taskDescription,
            softwareUsed,
            timeSpent: parseFloat(timeSpent),
            milestone,
            tags
        };

        addEntry(entry);
        resetForm();
    };

    const resetForm = () => {
        setIsAdding(false);
        setTaskDescription('');
        setSoftwareUsed([]);
        setTimeSpent('');
        setMilestone('');
        setTags([]);
        setTagInput('');
        // Keep date, project, engineer as they might be entering multiple for same day/person
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this entry?')) {
            deleteEntry(id);
        }
    };

    // Group entries by date (descending) & filter by role
    const sortedEntries = [...entries]
        .filter(e => role === 'admin' || e.engineerId === currentEngineerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Daily Entries</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Export Report</span>
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        disabled={isAdding}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Entry</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 ring-1 ring-blue-500/10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            New Time Entry
                        </h3>
                        <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date & Engineer */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Engineer</label>
                                <select
                                    value={engineerId}
                                    onChange={(e) => setEngineerId(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                >
                                    <option value="">Select Engineer...</option>
                                    {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>

                            {/* Project & Time */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                >
                                    <option value="">Select Project...</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Time Spent (Hours)</label>
                                <input
                                    type="number"
                                    value={timeSpent}
                                    onChange={(e) => setTimeSpent(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="e.g. 4.5"
                                    step="0.25"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        {/* Task Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Task Description</label>
                            <textarea
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[100px]"
                                placeholder="What did you work on?"
                                required
                            />
                        </div>

                        {/* Software */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Software Used</label>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_SOFTWARE.map(sw => (
                                    <button
                                        key={sw}
                                        type="button"
                                        onClick={() => toggleSoftware(sw)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                                            softwareUsed.includes(sw)
                                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                        )}
                                    >
                                        {sw}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Milestone/Status & Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Milestone / Status (Optional)</label>
                                <input
                                    type="text"
                                    value={milestone}
                                    onChange={(e) => setMilestone(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="e.g. 50% Draft, Submission, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (Press Enter to add)</label>
                                <div className="w-full p-2 rounded-lg border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all flex flex-wrap gap-2 items-center min-h-[42px]">
                                    {tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-medium">
                                            #{tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-amber-600"><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagInput}
                                        className="flex-1 min-w-[120px] outline-none bg-transparent py-0.5 text-sm"
                                        placeholder="e.g. bugfix, urgent..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-sm font-medium"
                            >
                                <Check className="w-4 h-4" />
                                <span>Save Entry</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {sortedEntries.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No entries yet</p>
                        <p className="text-slate-400 text-sm">Start logging your work above</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {sortedEntries.map(entry => {
                            const project = projects.find(p => p.id === entry.projectId);
                            const engineer = engineers.find(e => e.id === entry.engineerId);

                            return (
                                <div key={entry.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                                        {/* Time & User */}
                                        <div className="md:w-48 flex-shrink-0">
                                            <div className="flex items-center text-slate-500 text-sm mb-1">
                                                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                {format(new Date(entry.date), 'MMM d, yyyy')}
                                            </div>
                                            <div className="font-medium text-slate-900 mb-0.5">
                                                {engineer?.name || 'Unknown Engineer'}
                                            </div>
                                            <div className="flex items-center text-blue-600 text-sm font-medium">
                                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                {entry.timeSpent} hrs
                                            </div>
                                        </div>

                                        {/* Task Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                    <Folder className="w-3 h-3 mr-1" />
                                                    {project?.name || 'Unknown Project'}
                                                </span>
                                                {entry.milestone && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                                                        {entry.milestone}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-600 text-sm mb-2">{entry.taskDescription}</p>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {entry.tags?.map(tag => (
                                                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        #{tag}
                                                    </span>
                                                ))}
                                                {entry.softwareUsed.map(sw => (
                                                    <span key={sw} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                        <Wrench className="w-3 h-3 mr-1 opacity-50" />
                                                        {sw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50 self-start"
                                            title="Delete Entry"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
