
import { useData } from '../context/DataContext';
import { FolderKanban, Users, Clock, TrendingUp, Activity, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';


export const Dashboard = () => {
    const { projects, engineers, entries } = useData();
    const { role, engineerId } = useAuth();

    // Filter entries: Admins see all, Engineers see their own
    const filteredEntries = role === 'admin' ? entries : entries.filter(e => e.engineerId === engineerId);

    // Calculate Metrics
    const totalHours = filteredEntries.reduce((sum, e) => sum + e.timeSpent, 0);

    // Weekly hours
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const weeklyHours = filteredEntries
        .filter(e => new Date(e.date) >= startOfWeek)
        .reduce((sum, e) => sum + e.timeSpent, 0);

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
            <div className="text-center md:text-left mb-8">
                <h2 className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400 mb-2">
                    Dashboard Overview
                </h2>
                <p className="text-slate-400">Welcome back to DEC Tracker.</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800/40 p-6 rounded-2xl shadow-sm border border-slate-700/50 relative overflow-hidden group backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), transparent)' }} />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:bg-blue-500/20 transition-colors">
                            <FolderKanban className="w-6 h-6" />
                        </div>
                        <p className="text-slate-400 font-medium text-sm mb-1">Active Projects</p>
                        <p className="text-3xl font-bold text-slate-100">{activeProjectsCount} <span className="text-sm font-normal text-slate-500">/ {projects.length}</span></p>
                    </div>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl shadow-sm border border-slate-700/50 relative overflow-hidden group backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/30">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent)' }} />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:bg-indigo-500/20 transition-colors">
                            <Users className="w-6 h-6" />
                        </div>
                        <p className="text-slate-400 font-medium text-sm mb-1">Total Engineers</p>
                        <p className="text-3xl font-bold text-slate-100">{engineers.length}</p>
                    </div>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl shadow-sm border border-slate-700/50 relative overflow-hidden group backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)' }} />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:bg-emerald-500/20 transition-colors">
                            <Clock className="w-6 h-6" />
                        </div>
                        <p className="text-slate-400 font-medium text-sm mb-1">Hours This Week</p>
                        <p className="text-3xl font-bold text-slate-100">{weeklyHours.toFixed(1)}</p>
                    </div>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl shadow-sm border border-slate-700/50 relative overflow-hidden group backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), transparent)' }} />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(168,85,247,0.2)] group-hover:bg-purple-500/20 transition-colors">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <p className="text-slate-400 font-medium text-sm mb-1">Total Logged</p>
                        <p className="text-3xl font-bold text-slate-100">{totalHours.toFixed(0)} <span className="text-sm font-normal text-slate-500">hrs</span></p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-slate-800/40 rounded-2xl shadow-sm border border-slate-700/50 p-6 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(16, 185, 129, 0.03))' }} />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                Recent Activity
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {recentEntries.length === 0 ? (
                                <p className="text-slate-500 text-center py-8">No recent activity.</p>
                            ) : (
                                recentEntries.map(entry => {
                                    const project = projects.find(p => p.id === entry.projectId);
                                    const engineer = engineers.find(e => e.id === entry.engineerId);

                                    return (
                                        <div key={entry.id} className="flex gap-4 group/item hover:bg-slate-700/30 p-2 -m-2 rounded-xl transition-colors">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs ring-4 ring-slate-800 shadow-inner">
                                                {engineer?.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0 pb-6 border-b border-slate-700/50 group-last/item:border-0 group-last/item:pb-0">
                                                <p className="text-sm font-medium text-slate-200">
                                                    {engineer?.name} <span className="text-slate-500 font-normal">worked on</span> {project?.name}
                                                </p>
                                                <p className="text-sm text-slate-400 truncate mt-0.5">{entry.taskDescription}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                    <span>{format(new Date(entry.date), 'MMM d, h:mm a')}</span>
                                                    <span>•</span>
                                                    <span className="text-emerald-400/90 font-medium">{entry.timeSpent} hrs</span>
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
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 text-white shadow-xl shadow-black/20 relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), transparent)' }} />
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2 text-slate-200">Weekly Goal</h3>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-4xl font-bold text-white">{weeklyHours.toFixed(0)}</span>
                                <span className="text-slate-400 mb-1.5">/ 100 hrs</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4 overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-1000 relative"
                                    style={{ width: `${Math.min(100, (weeklyHours / 100) * 100)}% ` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400">
                                {role === 'admin'
                                    ? `Team is at ${Math.round((weeklyHours / 100) * 100)}% of weekly capacity target.`
                                    : `You are at ${Math.round((weeklyHours / 40) * 100)}% of your weekly capacity target.`}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800/40 rounded-2xl shadow-sm border border-slate-700/50 p-6 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)' }} />
                        <div className="relative z-10">
                            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-blue-400" />
                                Project Status
                            </h3>
                            <div className="space-y-3">
                                {projects.slice(0, 4).map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer group/status">
                                        <span className="text-sm font-medium text-slate-300 group-hover/status:text-slate-100 transition-colors">{p.name}</span>
                                        <span className="text-xs text-blue-400/80 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">Active</span>
                                    </div>
                                ))}
                                {projects.length === 0 && <p className="text-sm text-slate-500">No projects yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
