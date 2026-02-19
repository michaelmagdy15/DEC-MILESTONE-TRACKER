
import { useData } from '../context/DataContext';
import { FolderKanban, Users, Clock, TrendingUp, Activity, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';


export const Dashboard = () => {
    const { projects, engineers, entries } = useData();

    // Calculate Metrics
    const totalHours = entries.reduce((sum, e) => sum + e.timeSpent, 0);

    // Weekly hours
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const weeklyHours = entries
        .filter(e => new Date(e.date) >= startOfWeek)
        .reduce((sum, e) => sum + e.timeSpent, 0);

    // Active Projects (projects with entries in last 30 days)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const activeProjectIds = new Set(
        entries
            .filter(e => new Date(e.date) >= thirtyDaysAgo)
            .map(e => e.projectId)
    );
    const activeProjectsCount = activeProjectIds.size;

    // Recent Activity
    const recentEntries = [...entries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
                <p className="text-slate-500">Welcome back to DEC Tracker.</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                            <FolderKanban className="w-5 h-5" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm mb-1">Active Projects</p>
                        <p className="text-3xl font-bold text-slate-900">{activeProjectsCount} <span className="text-sm font-normal text-slate-400">/ {projects.length}</span></p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                            <Users className="w-5 h-5" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm mb-1">Total Engineers</p>
                        <p className="text-3xl font-bold text-slate-900">{engineers.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                            <Clock className="w-5 h-5" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm mb-1">Hours This Week</p>
                        <p className="text-3xl font-bold text-slate-900">{weeklyHours.toFixed(1)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm mb-1">Total Logged</p>
                        <p className="text-3xl font-bold text-slate-900">{totalHours.toFixed(0)} <span className="text-sm font-normal text-slate-400">hrs</span></p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
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
                                    <div key={entry.id} className="flex gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs ring-4 ring-white">
                                            {engineer?.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                            <p className="text-sm font-medium text-slate-900">
                                                {engineer?.name} <span className="text-slate-500 font-normal">worked on</span> {project?.name}
                                            </p>
                                            <p className="text-sm text-slate-500 truncate">{entry.taskDescription}</p>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                                                <span>{format(new Date(entry.date), 'MMM d, h:mm a')}</span>
                                                <span>•</span>
                                                <span className="text-blue-600 font-medium">{entry.timeSpent} hrs</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Quick Actions / Side Panel */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10">
                        <h3 className="font-bold text-lg mb-2">Weekly Goal</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold">{weeklyHours.toFixed(0)}</span>
                            <span className="text-slate-400 mb-1.5">/ 100 hrs</span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (weeklyHours / 100) * 100)}% ` }}
                            />
                        </div>
                        <p className="text-sm text-slate-400">Team is at {Math.round((weeklyHours / 100) * 100)}% of weekly capacity target.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            Project Status
                        </h3>
                        <div className="space-y-3">
                            {projects.slice(0, 4).map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                                    <span className="text-xs text-slate-400">Active</span>
                                </div>
                            ))}
                            {projects.length === 0 && <p className="text-sm text-slate-500">No projects yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
