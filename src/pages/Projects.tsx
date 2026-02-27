import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Folder, X, Check, Users, Calendar, Target } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types';
import { motion } from 'framer-motion';

const PROJECT_PHASES = ['Planning', 'Design', 'Construction', 'Post-Construction', 'Completed'];

export const Projects: React.FC = () => {
    const { role } = useAuth();
    const { projects, engineers, milestones, addProject, updateProject, deleteProject, addMilestone } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [budget, setBudget] = useState('');
    const [phase, setPhase] = useState('Planning');
    const [leadDesignerId, setLeadDesignerId] = useState('');
    const [teamMembers, setTeamMembers] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Phase milestones (inline creation)
    const [phaseMilestones, setPhaseMilestones] = useState<Record<string, string>>({});

    const toggleTeamMember = (id: string) => {
        setTeamMembers(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const projectId = editingId || crypto.randomUUID();

        const projectData: Project = {
            id: projectId,
            name,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
            budget: budget ? parseFloat(budget) : 0,
            phase: phase || 'Planning',
            leadDesignerId: leadDesignerId || undefined,
            teamMembers,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        };

        if (editingId) {
            await updateProject(projectData);
        } else {
            await addProject(projectData);

            // Create milestones for each phase that has a deadline
            for (const [phaseName, deadline] of Object.entries(phaseMilestones)) {
                if (deadline) {
                    await addMilestone({
                        id: crypto.randomUUID(),
                        projectId,
                        name: `${phaseName} Phase`,
                        targetDate: deadline,
                        completedPercentage: 0,
                    });
                }
            }
        }

        resetForm();
    };

    const startEdit = (project: Project) => {
        setEditingId(project.id);
        setName(project.name);
        setHourlyRate(project.hourlyRate?.toString() || '');
        setBudget(project.budget?.toString() || '');
        setPhase(project.phase || 'Planning');
        setLeadDesignerId(project.leadDesignerId || '');
        setTeamMembers(project.teamMembers || []);
        setStartDate(project.startDate || '');
        setEndDate(project.endDate || '');
        setPhaseMilestones({});
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setName('');
        setHourlyRate('');
        setBudget('');
        setPhase('Planning');
        setLeadDesignerId('');
        setTeamMembers([]);
        setStartDate('');
        setEndDate('');
        setPhaseMilestones({});
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            deleteProject(id);
        }
    };

    // Compute duration string
    const getDuration = (start?: string, end?: string) => {
        if (!start || !end) return null;
        const ms = new Date(end).getTime() - new Date(start).getTime();
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        if (days < 30) return `${days} days`;
        const months = Math.round(days / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
    };

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
                        Project <span className="text-orange-400">Library</span>
                    </h2>
                    <div className="h-1 w-20 bg-orange-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Manage and monitor all active DEC engineering ventures.</p>
                </div>
                {role === 'admin' && (
                    <button
                        onClick={() => setIsAdding(true)}
                        disabled={isAdding}
                        className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-1 disabled:opacity-50 font-bold uppercase tracking-widest text-[11px]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Initiate Project</span>
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-[#1a1a1a]/60 p-10 rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500"></div>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">
                                {editingId ? 'Refine Project Details' : 'Configure New Venture'}
                            </h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Strategic Planning</p>
                        </div>
                        <button onClick={resetForm} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Row 1: Name + Budget */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Project Identity</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="e.g. Al Reem Tower Redesign"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Total Budget (AED)</label>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="50000.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* Row 2: Hourly Rate + Phase + Lead Designer */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Hourly Rate (USD)</label>
                                <input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="85.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Current Phase</label>
                                <select
                                    value={phase}
                                    onChange={(e) => setPhase(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium appearance-none"
                                >
                                    {PROJECT_PHASES.map(p => (
                                        <option key={p} value={p} className="bg-[#1a1a1a]">{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Lead Designer</label>
                                <select
                                    value={leadDesignerId}
                                    onChange={(e) => setLeadDesignerId(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium appearance-none"
                                >
                                    <option value="" className="bg-[#1a1a1a]">None</option>
                                    {engineers.map(e => (
                                        <option key={e.id} value={e.id} className="bg-[#1a1a1a]">{e.name} ({e.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 3: Start Date + End Date (Duration) */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                                Project Duration
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Start Date</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">End Date</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    {startDate && endDate && (
                                        <div className="px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration</div>
                                            <div className="text-lg font-black text-orange-400">{getDuration(startDate, endDate)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Row 4: Team Members */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                                <Users className="w-3.5 h-3.5 text-orange-400" />
                                Delegate Team Members
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {engineers.map(eng => {
                                    const isSelected = teamMembers.includes(eng.id);
                                    return (
                                        <button
                                            key={eng.id}
                                            type="button"
                                            onClick={() => toggleTeamMember(eng.id)}
                                            className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 border ${isSelected
                                                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-lg shadow-orange-500/10'
                                                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/20'
                                                }`}
                                        >
                                            {eng.name}
                                            <span className="ml-2 text-[9px] text-slate-600">({eng.location || 'HQ'})</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {teamMembers.length > 0 && (
                                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">
                                    {teamMembers.length} member{teamMembers.length > 1 ? 's' : ''} assigned
                                </div>
                            )}
                        </div>

                        {/* Row 5: Phase Milestones (only for new projects) */}
                        {!editingId && (
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    <Target className="w-3.5 h-3.5 text-orange-400" />
                                    Phase Milestones — Set Deadlines
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {PROJECT_PHASES.filter(p => p !== 'Completed').map(p => (
                                        <div key={p} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-white tracking-tight mb-2">{p}</div>
                                                <input
                                                    type="date"
                                                    value={phaseMilestones[p] || ''}
                                                    onChange={(e) => setPhaseMilestones(prev => ({ ...prev, [p]: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-4 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[11px] transition-all"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-4 bg-white text-black hover:bg-orange-500 hover:text-white rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-xl font-bold uppercase tracking-widest text-[11px]"
                            >
                                <Check className="w-4 h-4" />
                                <span>{editingId ? 'Update Identity' : 'Establish Project'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.length === 0 && !isAdding && (
                    <div className="col-span-full text-center py-32 bg-[#1a1a1a]/20 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Folder className="w-10 h-10 text-slate-700" />
                        </div>
                        <p className="text-slate-400 font-black text-xl tracking-tight mb-2">The library is empty</p>
                        <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">Awaiting first venture initiation</p>
                    </div>
                )}

                {projects.map((project) => {
                    const projectMilestones = milestones.filter(m => m.projectId === project.id);
                    const teamCount = project.teamMembers?.length || 0;
                    const duration = getDuration(project.startDate, project.endDate);

                    return (
                        <div key={project.id} className="group bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 hover:border-orange-500/30 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all duration-500"></div>
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="w-14 h-14 bg-white/5 text-white rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-500 shadow-lg">
                                    <Folder className="w-6 h-6" />
                                </div>
                                {role === 'admin' && (
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                        <button
                                            onClick={() => startEdit(project)}
                                            className="p-2.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(project.id)}
                                            className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-black text-xl text-white mb-2 tracking-tight group-hover:text-orange-400 transition-colors">{project.name}</h3>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-0.5 w-8 bg-orange-500/30 group-hover:w-12 transition-all duration-500"></div>
                                    {project.hourlyRate ? (
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                                            <span className="text-white">${project.hourlyRate.toFixed(0)}</span> / Hour
                                        </p>
                                    ) : (
                                        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Rate not set</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {project.budget !== undefined && project.budget > 0 && (
                                        <div>
                                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Budget</p>
                                            <p className="text-lg font-black text-emerald-400">AED {project.budget.toLocaleString()}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Phase</p>
                                        <div className="inline-block px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-widest uppercase">
                                            {project.phase || 'Planning'}
                                        </div>
                                    </div>
                                </div>

                                {/* Team + Duration row */}
                                <div className="flex items-center gap-4 mb-4 flex-wrap">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                        <Users className="w-3 h-3 text-orange-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {teamCount > 0 ? `${teamCount} Member${teamCount > 1 ? 's' : ''}` : 'No Team'}
                                        </span>
                                    </div>
                                    {duration && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                            <Calendar className="w-3 h-3 text-orange-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{duration}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Milestones preview */}
                                {projectMilestones.length > 0 && (
                                    <div className="mb-6 space-y-2">
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Milestones</p>
                                        {projectMilestones.slice(0, 3).map(m => (
                                            <div key={m.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                                                <span className="text-xs font-bold text-white">{m.name}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">{m.targetDate || '-'}</span>
                                            </div>
                                        ))}
                                        {projectMilestones.length > 3 && (
                                            <p className="text-[10px] text-slate-600 font-bold">+{projectMilestones.length - 3} more</p>
                                        )}
                                    </div>
                                )}

                                <div className="mb-4">
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Lead Designer</p>
                                    <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold tracking-widest uppercase">
                                        {engineers.find(e => e.id === project.leadDesignerId)?.name || 'Unassigned'}
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.location.href = `/projects/${project.id}`}
                                    className="w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white bg-white/5 hover:bg-orange-600 rounded-2xl transition-all duration-500 border border-white/5 hover:border-orange-500 shadow-xl"
                                >
                                    Inspect Venture
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};
