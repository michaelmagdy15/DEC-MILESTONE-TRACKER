
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Users, X, Check, ShieldCheck, Mail, DollarSign, Target } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Engineer } from '../types';
import { motion } from 'framer-motion';

export const Engineers = () => {
    const { engineers, addEngineer, updateEngineer, deleteEngineer } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [role, setRole] = useState('Engineer');
    const [hourlyRate, setHourlyRate] = useState<number>(0);
    const [weeklyGoalHours, setWeeklyGoalHours] = useState<number>(40);
    const { role: currentUserRole } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const engineerData: Engineer = {
            id: editingId || crypto.randomUUID(),
            name,
            role,
            hourlyRate,
            weeklyGoalHours
        };

        if (editingId) {
            updateEngineer(engineerData);
        } else {
            addEngineer(engineerData);
        }

        resetForm();
    };

    const startEdit = (engineer: Engineer) => {
        setEditingId(engineer.id);
        setName(engineer.name);
        setRole(engineer.role || 'Engineer');
        setHourlyRate(engineer.hourlyRate || 0);
        setWeeklyGoalHours(engineer.weeklyGoalHours || 40);
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setName('');
        setRole('Engineer');
        setHourlyRate(0);
        setWeeklyGoalHours(40);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this operative?')) {
            deleteEngineer(id);
        }
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
                        Engineering <span className="text-orange-400">Roster</span>
                    </h2>
                    <div className="h-1 w-20 bg-orange-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Command and control for your specialist project teams.</p>
                </div>
                {currentUserRole === 'admin' && (
                    <button
                        onClick={() => setIsAdding(true)}
                        disabled={isAdding}
                        className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-1 disabled:opacity-50 font-bold uppercase tracking-widest text-[11px]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Recruit Specialist</span>
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-[#1a1a1a]/60 p-10 rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500"></div>
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                    <Users className="w-6 h-6 text-orange-400" />
                                </div>
                                {editingId ? 'Modify Credentials' : 'New Operative'}
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-14">Specialist Onboarding & Assignment</p>
                        </div>
                        <button onClick={resetForm} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Operative Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="e.g. John Doe"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Tactical Designation</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium appearance-none"
                                >
                                    <option value="Engineer" className="bg-[#1a1a1a]">Engineer</option>
                                    <option value="Senior Engineer" className="bg-[#1a1a1a]">Senior Engineer</option>
                                    <option value="Architect" className="bg-[#1a1a1a]">Architect</option>
                                    <option value="Project Manager" className="bg-[#1a1a1a]">Project Manager</option>
                                    <option value="Draftsman" className="bg-[#1a1a1a]">Draftsman</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Hourly Compensation (AED)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="number"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                                        className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Weekly Capability Goal (Hrs)</label>
                                <div className="relative">
                                    <Target className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="number"
                                        value={weeklyGoalHours}
                                        onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                                        className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                        min="0"
                                        step="1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-6 pt-8 border-t border-white/5">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-4 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[11px] transition-all"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                className="px-12 py-4 bg-white text-black hover:bg-orange-500 hover:text-white rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-xl font-black uppercase tracking-widest text-[11px]"
                            >
                                <Check className="w-4 h-4" />
                                <span>Save Credentials</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {engineers.map((engineer, idx) => (
                    <motion.div
                        key={engineer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-[#1a1a1a]/40 p-8 rounded-[32px] border border-white/5 hover:border-orange-500/30 transition-all duration-500 backdrop-blur-3xl shadow-xl hover:shadow-orange-500/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
                        <div className="flex flex-col h-full relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-orange-500/20 group-hover:bg-orange-500/10 transition-all duration-500">
                                    <Users className="w-8 h-8 text-slate-500 group-hover:text-orange-400" />
                                </div>
                                {currentUserRole === 'admin' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(engineer)}
                                            className="p-2.5 bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(engineer.id)}
                                            className="p-2.5 bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-white/5 hover:border-red-500/20 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-orange-400 transition-colors">{engineer.name}</h3>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-500 border border-white/5 uppercase tracking-widest group-hover:border-orange-500/20 group-hover:text-orange-400">
                                        {engineer.role || 'Specialist'}
                                    </span>
                                    <span className="px-3 py-1 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">
                                        Active
                                    </span>
                                </div>

                                {currentUserRole === 'admin' && (
                                    <div className="grid grid-cols-2 gap-4 py-6 border-t border-white/5">
                                        <div>
                                            <div className="text-2xl font-black text-white">{engineer.hourlyRate}<span className="text-[10px] ml-1 text-slate-600">AED/H</span></div>
                                            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Rate</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-white">{engineer.weeklyGoalHours}<span className="text-[10px] ml-1 text-slate-600">H</span></div>
                                            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Goal</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    <ShieldCheck className="w-3.5 h-3.5 mr-2 text-orange-500" />
                                    Verified Personnel
                                </div>
                                <button className="p-2 text-slate-500 hover:text-orange-400 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {engineers.length === 0 && !isAdding && (
                    <div className="col-span-full py-32 text-center bg-[#1a1a1a]/40 rounded-[40px] border border-dashed border-white/5 backdrop-blur-3xl">
                        <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-white/5">
                            <Users className="w-12 h-12 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight">No specialists assigned</h3>
                        <p className="text-slate-500 mt-2 font-medium">Recruit your first engineer to start tracking operations.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
