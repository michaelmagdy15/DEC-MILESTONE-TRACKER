import { useData } from '../context/DataContext';
import { FolderKanban, Activity, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export const ClientDashboard = () => {
    const { projects, entries } = useData();

    // Active Projects (projects with entries in last 30 days)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const activeProjectIds = new Set(
        entries
            .filter(e => new Date(e.date) >= thirtyDaysAgo)
            .map(e => e.projectId)
    );
    const activeProjectsCount = activeProjectIds.size;

    // Recent Activity (Anonymized/High-level for clients)
    const recentEntries = [...entries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Client Portal</h2>
                <p className="text-slate-500">Welcome to your project tracking dashboard.</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <Activity className="w-5 h-5" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm mb-1">Recent Updates</p>
                        <p className="text-3xl font-bold text-slate-900">{recentEntries.length}</p>
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
                            Project Activity Feed
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {recentEntries.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No recent activity.</p>
                        ) : (
                            recentEntries.map(entry => {
                                const project = projects.find(p => p.id === entry.projectId);

                                return (
                                    <div key={entry.id} className="flex gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs ring-4 ring-white">
                                            {project?.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                            <p className="text-sm font-medium text-slate-900">
                                                Update on {project?.name}
                                            </p>
                                            <p className="text-sm text-slate-500 truncate">{entry.taskDescription}</p>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                                                <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                                                {entry.milestone && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-indigo-600 font-medium">Milestone: {entry.milestone}</span>
                                                    </>
                                                )}
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
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            Your Projects
                        </h3>
                        <div className="space-y-3">
                            {projects.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
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
