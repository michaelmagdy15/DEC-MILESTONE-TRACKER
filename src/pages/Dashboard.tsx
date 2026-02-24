
import { useData } from '../context/DataContext';
import { FolderKanban, Users, Clock, TrendingUp, Activity, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';


export const Dashboard = () => {
    const { projects, engineers, entries, timeEntries } = useData();
    const { role } = useAuth();

    // Filter entries: Everyone sees all for stats and overview
    const filteredEntries = entries;

    const getTimeclockMs = (filterFn?: (te: any) => boolean) => {
        let workMs = 0;
        let breakMs = 0;
        const filtered = filterFn ? timeEntries.filter(filterFn) : timeEntries;
        filtered.forEach(te => {
            const start = new Date(te.startTime).getTime();
            const end = te.endTime ? new Date(te.endTime).getTime() : new Date().getTime();
            if (te.entryType === 'work') workMs += (end - start);
            else if (te.entryType === 'break') breakMs += (end - start);
        });
        return Math.max(0, workMs - breakMs);
    };

    const totalTimeclockHours = getTimeclockMs() / 3600000;

    // Weekly hours
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const weeklyTimeclockHours = getTimeclockMs(te => new Date(te.startTime) >= startOfWeek) / 3600000;

    // Calculate Metrics
    const totalHours = filteredEntries.reduce((sum, e) => sum + e.timeSpent, 0) + totalTimeclockHours;

    const weeklyHours = filteredEntries
        .filter(e => new Date(e.date) >= startOfWeek)
        .reduce((sum, e) => sum + e.timeSpent, 0) + weeklyTimeclockHours;

    // Active Projects (projects with entries in last 30 days)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const activeProjectIds = new Set(
        filteredEntries
            .filter(e => new Date(e.date) >= thirtyDaysAgo)
            .map(e => e.projectId)
    );
    const activeProjectsCount = activeProjectIds.size;

    // Recent Activity
    const recentEntries = [...filteredEntries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="text-center md:text-left mb-8 relative">
                <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
                    Insight <span className="text-orange-400">Dashboard</span>
                </h2>
                <div className="h-1 w-20 bg-orange-500 rounded-full mb-4 md:mx-0 mx-auto"></div>
                <p className="text-slate-500 font-medium tracking-wide prose max-w-none">DEC Engineering Consultant Milestone Tracker</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#1a1a1a]/40 p-8 rounded-[32px] border border-white/5 relative overflow-hidden group backdrop-blur-3xl transition-all duration-500 hover:border-orange-500/30 hover:-translate-y-1">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), transparent)' }} />
                    <div className="relative z-10 text-center md:text-left">
                        <div className="w-14 h-14 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(79,70,229,0.1)] group-hover:bg-orange-500/20 transition-all duration-500">
                            <FolderKanban className="w-7 h-7" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">Active Projects</p>
                        <p className="text-4xl font-black text-white">{activeProjectsCount} <span className="text-sm font-bold text-slate-600">/ {projects.length}</span></p>
                    </div>
                </div>

                <div className="bg-[#1a1a1a]/40 p-8 rounded-[32px] border border-white/5 relative overflow-hidden group backdrop-blur-3xl transition-all duration-500 hover:border-orange-500/30 hover:-translate-y-1">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent)' }} />
                    <div className="relative z-10 text-center md:text-left">
                        <div className="w-14 h-14 bg-orange-400/10 text-orange-300 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(99,102,241,0.1)] group-hover:bg-orange-400/20 transition-all duration-500">
                            <Users className="w-7 h-7" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">Total Engineers</p>
                        <p className="text-4xl font-black text-white">{engineers.length}</p>
                    </div>
                </div>

                <div className="bg-[#1a1a1a]/40 p-8 rounded-[32px] border border-white/5 relative overflow-hidden group backdrop-blur-3xl transition-all duration-500 hover:border-emerald-500/30 hover:-translate-y-1">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)' }} />
                    <div className="relative z-10 text-center md:text-left">
                        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] group-hover:bg-emerald-500/20 transition-all duration-500">
                            <Clock className="w-7 h-7" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">Hours This Week</p>
                        <p className="text-4xl font-black text-white">{weeklyHours.toFixed(1)}</p>
                    </div>
                </div>

                <div className="bg-[#1a1a1a]/40 p-8 rounded-[32px] border border-white/5 relative overflow-hidden group backdrop-blur-3xl transition-all duration-500 hover:border-purple-500/30 hover:-translate-y-1">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), transparent)' }} />
                    <div className="relative z-10 text-center md:text-left">
                        <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(168, 85, 247, 0.1)] group-hover:bg-purple-500/20 transition-all duration-500">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">Total Logged</p>
                        <p className="text-4xl font-black text-white">{totalHours.toFixed(0)} <span className="text-sm font-bold text-slate-600 tracking-normal capitalize">hrs</span></p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-[#1a1a1a]/40 rounded-[32px] border border-white/5 p-8 backdrop-blur-3xl relative overflow-hidden group min-h-[500px]">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.02), rgba(16, 185, 129, 0.02))' }} />
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                <Activity className="w-6 h-6 text-emerald-400" />
                                Recent Updates
                            </h3>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">Real-time Stream</span>
                        </div>

                        <div className="space-y-4 flex-1">
                            {recentEntries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                                    <Activity className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm font-medium">No activity recorded yet</p>
                                </div>
                            ) : (
                                recentEntries.map(entry => {
                                    const project = projects.find(p => p.id === entry.projectId);
                                    const engineer = engineers.find(e => e.id === entry.engineerId);

                                    return (
                                        <div key={entry.id} className="flex gap-4 group/item hover:bg-white/5 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/5">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#2a2a2a] flex items-center justify-center text-white font-black text-sm border border-white/10 shadow-2xl relative">
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#1a1a1a]"></div>
                                                {engineer?.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-black text-white truncate pr-2">
                                                        {engineer?.name} <span className="text-slate-500 font-bold mx-1">•</span> <span className="text-orange-400">{project?.name}</span>
                                                    </p>
                                                    <span className="text-xs font-bold text-emerald-400/90 whitespace-nowrap bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">+{entry.timeSpent}h</span>
                                                </div>
                                                <p className="text-sm text-slate-400 line-clamp-1 font-medium italic">"{entry.taskDescription}"</p>
                                                <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{format(new Date(entry.date), 'MMM d, HH:mm')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Side Panel */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a]/40 border border-white/5 rounded-[32px] p-8 text-white shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), transparent)' }} />
                        <div className="relative z-10">
                            <h3 className="font-black text-lg mb-6 text-white tracking-tight">Capacity Goal</h3>
                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-5xl font-black text-white">{weeklyHours.toFixed(0)}</span>
                                <span className="text-slate-600 font-bold mb-2 uppercase tracking-widest text-xs">/ 100 hrs</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-3 mb-6 overflow-hidden border border-white/5 p-0.5">
                                <div
                                    className="bg-gradient-to-r from-orange-500 to-orange-400 h-full rounded-full transition-all duration-1000 relative"
                                    style={{ width: `${Math.min(100, (weeklyHours / 100) * 100)}% ` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                {role === 'admin'
                                    ? `Team is at ${Math.round((weeklyHours / 100) * 100)}% of objective.`
                                    : `You've achieved ${Math.round((weeklyHours / 40) * 100)}% of your target.`}
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a]/40 rounded-[32px] border border-white/5 p-8 backdrop-blur-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), transparent)' }} />
                        <div className="relative z-10">
                            <h3 className="font-black text-white text-lg mb-6 flex items-center gap-3">
                                <Briefcase className="w-5 h-5 text-orange-400" />
                                Active Focus
                            </h3>
                            <div className="space-y-4">
                                {projects.slice(0, 4).map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-2xl transition-all duration-300 cursor-pointer group/status">
                                        <span className="text-sm font-bold text-slate-400 group-hover/status:text-white transition-colors">{p.name}</span>
                                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">Active</span>
                                    </div>
                                ))}
                                {projects.length === 0 && <p className="text-sm font-bold text-slate-600 italic">No projects tracked.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
