
import React, { useState } from 'react';
import { Trash2, FileText, X, Check, Wrench, Clock, Calendar, Plus } from 'lucide-react';
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
        const finalEngineerId = role === 'admin' ? engineerId : currentEngineerId;
        if (!projectId || !finalEngineerId || !taskDescription || !timeSpent) return;

        const entry: LogEntry = {
            id: crypto.randomUUID(),
            projectId,
            engineerId: finalEngineerId,
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
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this entry?')) {
            deleteEntry(id);
        }
    };

    const sortedEntries = [...entries]
        .filter(e => role === 'admin' || e.engineerId === currentEngineerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
                        Activity <span className="text-orange-400">Ledger</span>
                    </h2>
                    <div className="h-1 w-20 bg-orange-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Historical log of all engineering operations and time allocation.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl transition-all duration-300 border border-white/5 font-bold uppercase tracking-widest text-[11px]"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        disabled={isAdding}
                        className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-1 disabled:opacity-50 font-bold uppercase tracking-widest text-[11px]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Log Operation</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-[#1a1a1a]/60 p-10 rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500"></div>
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                    <FileText className="w-6 h-6 text-orange-400" />
                                </div>
                                Record Operation
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-14">Time Tracking & Resource Allocation</p>
                        </div>
                        <button onClick={() => setIsAdding(false)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    required
                                />
                            </div>
                            {role === 'admin' && (
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Engineer</label>
                                    <select
                                        value={engineerId}
                                        onChange={(e) => setEngineerId(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium appearance-none"
                                        required
                                    >
                                        <option value="" className="bg-[#1a1a1a]">Select Engineer...</option>
                                        {engineers.map(e => <option key={e.id} value={e.id} className="bg-[#1a1a1a]">{e.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Venture Selection</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium appearance-none"
                                    required
                                >
                                    <option value="" className="bg-[#1a1a1a]">Select Venture...</option>
                                    {projects.map(p => <option key={p.id} value={p.id} className="bg-[#1a1a1a]">{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Duration (Hours)</label>
                                <div className="relative">
                                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={timeSpent}
                                        onChange={(e) => setTimeSpent(e.target.value)}
                                        className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                        placeholder="0.0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Software Arsenal</label>
                            <div className="flex flex-wrap gap-3">
                                {COMMON_SOFTWARE.map(sw => (
                                    <button
                                        key={sw}
                                        type="button"
                                        onClick={() => toggleSoftware(sw)}
                                        className={clsx(
                                            "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                            softwareUsed.includes(sw)
                                                ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                                                : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-white"
                                        )}
                                    >
                                        {sw}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Operational Description</label>
                            <textarea
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium min-h-[120px]"
                                placeholder="Detail the engineering operations performed..."
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Status / Phase</label>
                                <input
                                    type="text"
                                    value={milestone}
                                    onChange={(e) => setMilestone(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="e.g. 50% Schematic Design"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Tags (Enter to Add)</label>
                                <div className="flex flex-wrap gap-2 p-2 bg-white/5 border border-white/5 rounded-2xl min-h-[58px]">
                                    {tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-2 bg-orange-500/10 text-orange-400 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-orange-500/20">
                                            #{tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagInput}
                                        className="flex-1 min-w-[120px] bg-transparent outline-none px-3 text-white placeholder-slate-700 text-sm font-medium"
                                        placeholder="e.g. urgent, rfi..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-6 pt-8 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-8 py-4 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[11px] transition-all"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                className="px-12 py-4 bg-white text-black hover:bg-orange-500 hover:text-white rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-xl font-black uppercase tracking-widest text-[11px]"
                            >
                                <Check className="w-4 h-4" />
                                <span>Commit Entry</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/0">
                    <h3 className="text-xl font-black text-white tracking-tight uppercase">Operational Logs</h3>
                    <div className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5">
                        {sortedEntries.length} Records Found
                    </div>
                </div>
                <div className="divide-y divide-white/5">
                    {sortedEntries.map((entry, idx) => {
                        const project = projects.find(p => p.id === entry.projectId);
                        const engineer = engineers.find(e => e.id === entry.engineerId);
                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-8 hover:bg-white/[0.02] transition-colors group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                                    <div className="flex items-start gap-6 flex-1 min-w-0">
                                        <div className="w-16 h-16 bg-white/5 rounded-[20px] flex items-center justify-center border border-white/5 group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-all duration-500 flex-shrink-0">
                                            <Calendar className="w-7 h-7 text-slate-500 group-hover:text-orange-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h4 className="font-black text-white text-xl tracking-tight group-hover:text-orange-400 transition-colors">
                                                    {project?.name || 'Unidentified Venture'}
                                                </h4>
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-500 border border-white/5 group-hover:border-orange-500/20 group-hover:text-orange-400">
                                                    {format(new Date(entry.date), 'MMMM d, yyyy')}
                                                </span>
                                                {entry.milestone && (
                                                    <span className="px-3 py-1 bg-amber-500/10 rounded-full text-[10px] font-black text-amber-500 border border-amber-500/20">
                                                        {entry.milestone}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-400 font-medium leading-relaxed max-w-3xl mb-4">{entry.taskDescription}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <div className="flex items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mr-4">
                                                    <Wrench className="w-3.5 h-3.5 mr-2 opacity-40" />
                                                    {engineer?.name || 'Unknown'}
                                                </div>
                                                {entry.softwareUsed.map(sw => (
                                                    <span key={sw} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-slate-500 border border-white/5">
                                                        {sw}
                                                    </span>
                                                ))}
                                                {(entry.tags || []).map(tag => (
                                                    <span key={tag} className="px-3 py-1 bg-orange-500/5 rounded-lg text-[10px] font-bold text-orange-400/60 border border-orange-500/10">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 justify-between lg:justify-end">
                                        <div className="text-right">
                                            <div className="text-4xl font-black text-white group-hover:text-orange-400 transition-colors">{entry.timeSpent}h</div>
                                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Efficiency Logged</div>
                                        </div>
                                        {role === 'admin' && (
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="p-4 bg-white/5 text-slate-600 hover:bg-red-500/10 hover:text-red-500 rounded-2xl border border-white/5 hover:border-red-500/20 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {sortedEntries.length === 0 && (
                        <div className="py-32 text-center">
                            <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-white/5">
                                <FileText className="w-12 h-12 text-slate-700" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">No operations on record</h3>
                            <p className="text-slate-500 mt-2 font-medium">Initialize your first engineering log to see activity here.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
