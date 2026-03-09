import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Folder, X, Check, Users, Calendar, Target, RefreshCw, Settings, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types';
import { motion } from 'framer-motion';
import { RiskIndicator } from '../components/RiskIndicator';

export const Projects: React.FC = () => {
    const { role, engineerId } = useAuth();
    const { projects, projectPhases, engineers, milestones, entries, addProject, updateProject, deleteProject, addMilestone, updateProjectOrder, addProjectPhase, updateProjectPhase, deleteProjectPhase } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isManagingPhases, setIsManagingPhases] = useState(false);

    // Filter projects based on visibility
    const [orderedProjects, setOrderedProjects] = useState<Project[]>([]);
    const isDraggingRef = useRef(false);
    const [draggedProjectIndex, setDraggedProjectIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!isDraggingRef.current) {
            const filtered = projects.filter(p => {
                if (role === 'admin') return true;
                if (p.leadDesignerId === engineerId) return true;
                if (p.teamMembers?.includes(engineerId || '')) return true;
                return false;
            });
            setOrderedProjects(filtered);
        }
    }, [projects, role, engineerId]);

    // Form State
    const [name, setName] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [budget, setBudget] = useState('');
    const [phase, setPhase] = useState('');
    const [leadDesignerId, setLeadDesignerId] = useState('');
    const [teamMembers, setTeamMembers] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [googleDriveLink, setGoogleDriveLink] = useState('');

    // Phase milestones (inline creation)
    const [phaseMilestones, setPhaseMilestones] = useState<Record<string, string>>({});

    // Manage Phases State
    const [newPhaseName, setNewPhaseName] = useState('');

    useEffect(() => {
        if (projectPhases.length > 0 && !phase && !editingId) {
            setPhase(projectPhases[0].name);
        }
    }, [projectPhases, phase, editingId]);

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
            phase: phase || projectPhases[0]?.name || 'Planning',
            leadDesignerId: leadDesignerId || undefined,
            teamMembers,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            googleDriveLink: googleDriveLink || undefined,
            orderIndex: projects.length, // Set order to bottom by default
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
        setPhase(project.phase || projectPhases[0]?.name || 'Planning');
        setLeadDesignerId(project.leadDesignerId || '');
        setTeamMembers(project.teamMembers || []);
        setStartDate(project.startDate || '');
        setEndDate(project.endDate || '');
        setGoogleDriveLink(project.googleDriveLink || '');
        setPhaseMilestones({});
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setName('');
        setHourlyRate('');
        setBudget('');
        setPhase(projectPhases[0]?.name || 'Planning');
        setLeadDesignerId('');
        setTeamMembers([]);
        setStartDate('');
        setEndDate('');
        setGoogleDriveLink('');
        setPhaseMilestones({});
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            deleteProject(id);
        }
    };

    // --- Drag and Drop Logic ---
    const handleDragStart = (index: number) => {
        if (role !== 'admin') return;
        isDraggingRef.current = true;
        setDraggedProjectIndex(index);
    };

    const handleDragEnter = (index: number) => {
        if (role !== 'admin' || draggedProjectIndex === null || draggedProjectIndex === index) return;

        // Ensure index is within the orderedProjects valid bounds
        if (index < 0 || index >= orderedProjects.length) return;

        setOrderedProjects(prev => {
            const newProjects = [...prev];
            const draggedItem = newProjects[draggedProjectIndex];
            newProjects.splice(draggedProjectIndex, 1);
            newProjects.splice(index, 0, draggedItem);
            setDraggedProjectIndex(index);
            return newProjects;
        });
    };

    const handleDragEnd = async () => {
        if (role !== 'admin') return;
        isDraggingRef.current = false;
        setDraggedProjectIndex(null);
        await updateProjectOrder(orderedProjects);
    };

    // --- Phase Management Logic ---
    const handleAddPhase = async () => {
        if (!newPhaseName.trim()) return;
        await addProjectPhase({ name: newPhaseName, orderIndex: projectPhases.length });
        setNewPhaseName('');
    };

    const handlePhaseReorder = async (index: number, direction: 'up' | 'down') => {
        const newPhases = [...projectPhases];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= newPhases.length) return;

        const temp = newPhases[index];
        newPhases[index] = newPhases[swapIndex];
        newPhases[swapIndex] = temp;

        // Execute updates
        for (let i = 0; i < newPhases.length; i++) {
            await updateProjectPhase({ ...newPhases[i], orderIndex: i });
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
                    <p className="text-slate-500 font-medium tracking-wide">Manage and monitor active DEC engineering ventures.</p>
                </div>
                {role === 'admin' && (
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsManagingPhases(true)}
                            className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl border border-white/5 transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Manage Phases</span>
                        </button>
                        <button
                            onClick={() => setIsAdding(true)}
                            disabled={isAdding}
                            className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-1 disabled:opacity-50 font-bold uppercase tracking-widest text-[11px]"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Initiate Project</span>
                        </button>
                    </div>
                )}
            </div>

            {/* PHASE MANAGEMENT MODAL */}
            {isManagingPhases && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#1a1a1a] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl p-8 relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-white tracking-tight">Project Phases Config</h3>
                            <button onClick={() => setIsManagingPhases(false)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {projectPhases.map((phase, index) => (
                                <div key={phase.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 group">
                                    <div className="flex flex-col">
                                        <button onClick={() => handlePhaseReorder(index, 'up')} disabled={index === 0} className="text-slate-600 hover:text-white disabled:opacity-30">
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handlePhaseReorder(index, 'down')} disabled={index === projectPhases.length - 1} className="text-slate-600 hover:text-white disabled:opacity-30">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={phase.name}
                                            onChange={(e) => updateProjectPhase({ ...phase, name: e.target.value })}
                                            className="w-full bg-transparent border-none text-sm text-white focus:ring-1 focus:ring-orange-500/50 rounded-lg px-2 py-1"
                                        />
                                    </div>
                                    <button onClick={() => deleteProjectPhase(phase.id)} className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {projectPhases.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">No phases defined. Please add some.</p>}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <input
                                type="text"
                                placeholder="New phase name..."
                                value={newPhaseName}
                                onChange={(e) => setNewPhaseName(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPhase()}
                            />
                            <button onClick={handleAddPhase} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all">
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    {projectPhases.map(p => (
                                        <option key={p.id} value={p.name} className="bg-[#1a1a1a]">{p.name}</option>
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

                        {/* Row 3: Google Drive + Start Date + End Date */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Google Drive Folder URL</label>
                                <input
                                    type="url"
                                    value={googleDriveLink}
                                    onChange={(e) => setGoogleDriveLink(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="https://drive.google.com/..."
                                />
                            </div>
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
                        {!editingId && projectPhases.length > 0 && (
                            <div className="space-y-3 border-t border-white/5 pt-6">
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    <Target className="w-3.5 h-3.5 text-orange-400" />
                                    Phase Milestones — Set Deadlines
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {projectPhases.map(p => (
                                        <div key={p.id} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-white tracking-tight mb-2 truncate" title={p.name}>{p.name}</div>
                                                <input
                                                    type="date"
                                                    value={phaseMilestones[p.name] || ''}
                                                    onChange={(e) => setPhaseMilestones(prev => ({ ...prev, [p.name]: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
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
                {orderedProjects.length === 0 && !isAdding && (
                    <div className="col-span-full text-center py-32 bg-[#1a1a1a]/20 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Folder className="w-10 h-10 text-slate-700" />
                        </div>
                        <p className="text-slate-400 font-black text-xl tracking-tight mb-2">The library is empty</p>
                        <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">Awaiting first venture initiation</p>
                    </div>
                )}

                {orderedProjects.map((project, index) => {
                    const projectMilestones = milestones.filter(m => m.projectId === project.id);
                    const teamCount = project.teamMembers?.length || 0;
                    const duration = getDuration(project.startDate, project.endDate);

                    return (
                        <div
                            key={project.id}
                            draggable={role === 'admin'}
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`group bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 hover:border-orange-500/30 backdrop-blur-3xl shadow-2xl transition-all duration-300 ${draggedProjectIndex === index ? 'opacity-40 scale-95' : 'opacity-100'} hover:-translate-y-2 relative overflow-hidden ${role === 'admin' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all duration-500"></div>
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="w-14 h-14 bg-white/5 text-white rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-500 shadow-lg">
                                    <Folder className="w-6 h-6" />
                                </div>
                                {role === 'admin' && (
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                        <div className="p-2.5 text-slate-700 cursor-grab" title="Drag to reorder">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
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
                            <div className="relative z-10 pointer-events-none">
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
                                            <div key={m.id} className="space-y-2">
                                                <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                                                    <span className="text-xs font-bold text-white truncate" title={m.name}>{m.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono shrink-0">{m.targetDate || '-'}</span>
                                                </div>
                                                <RiskIndicator milestone={m} entries={entries} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mb-4">
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Lead Designer</p>
                                    <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold tracking-widest uppercase">
                                        {engineers.find(e => e.id === project.leadDesignerId)?.name || 'Unassigned'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 relative z-20 pointer-events-auto mt-4">
                                <button
                                    onClick={() => window.location.href = `/projects/${project.id}`}
                                    className="flex-[2] py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white bg-white/5 hover:bg-orange-600 rounded-2xl transition-all duration-500 border border-white/5 hover:border-orange-500 shadow-xl"
                                >
                                    Inspect Venture
                                </button>
                                {role === 'admin' && (
                                    <button
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.classList.add('animate-spin-slow');
                                            await new Promise(r => setTimeout(r, 1000));
                                            btn.classList.remove('animate-spin-slow');
                                        }}
                                        title="Sync with Zoho CRM"
                                        className="w-12 h-12 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl border border-white/5 transition-all flex items-center justify-center shrink-0"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};
