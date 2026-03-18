import { motion } from 'framer-motion';
import { BookOpen, FolderKanban, Users, Clock, Target, Activity, Zap, HardHat, FileLineChart, MonitorPlay, CalendarDays, Brain, Building2, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HelpGuide = () => {
    const { role } = useAuth();
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 pb-12"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                    <BookOpen className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-2">
                        System <span className="text-orange-400">Help Guide</span>
                    </h2>
                    <p className="text-slate-500 font-medium tracking-wide">
                        Comprehensive documentation on platform features, workflows, and best practices.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Core Navigation */}
                <div className="bg-[#1a1a1a] rounded-[32px] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        Platform Navigation
                    </h3>
                    <div className="space-y-6 text-sm text-slate-400 font-medium">
                        <div>
                            <strong className="text-emerald-400 flex items-center gap-2 mb-1"><Target className="w-4 h-4" /> Dashboard</strong>
                            Your central command center. Provides a real-time overview of active projects, system health, predictive risk algorithms, and daily productivity trends.
                        </div>
                        {role !== 'client' && (
                            <div>
                                <strong className="text-emerald-400 flex items-center gap-2 mb-1"><FolderKanban className="w-4 h-4" /> Ventures (Projects)</strong>
                                Navigate here to manage projects, set up AI estimates, and organize milestone phases. Inside each venture, you can distribute tasks using the Smart Assign AI.
                            </div>
                        )}
                        <div>
                            <strong className="text-emerald-400 flex items-center gap-2 mb-1"><Users className="w-4 h-4" /> Operatives (Engineers)</strong>
                            Provides visibility into the workforce, their performance metrics, assigned evaluations, and AI-predicted capacity.
                        </div>
                    </div>
                </div>

                {/* Section 2: Command & Control */}
                <div className="bg-[#1a1a1a] rounded-[32px] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-cyan-500/10 transition-colors"></div>
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                        <MonitorPlay className="w-5 h-5 text-cyan-400" />
                        Command & Control Center
                    </h3>
                    <div className="space-y-6 text-sm text-slate-400 font-medium">
                        {role !== 'client' && (
                            <div>
                                <strong className="text-cyan-400 flex items-center gap-2 mb-1"><Activity className="w-4 h-4" /> Live Operations Monitor</strong>
                                A real-time tracking dashboard showing exactly what software your specialists are using right now, their active CAD drawings, and idle time. Crucial for live resource management.
                            </div>
                        )}
                        <div>
                            <strong className="text-cyan-400 flex items-center gap-2 mb-1"><CalendarDays className="w-4 h-4" /> Capacity Heatmap</strong>
                            Visualizes operative workloads across the next 4 weeks. Use this 4-week forecast matrix to instantly spot overloaded engineers (marked in Red) or under-utilized staff (marked in Emerald).
                        </div>
                        {role === 'admin' || role === 'project_manager' ? (
                            <div>
                                <strong className="text-cyan-400 flex items-center gap-2 mb-1"><BarChart3 className="w-4 h-4" /> Advanced Intelligence Reports</strong>
                                Access high-fidelity analytics across dimensions: Projects (Fiscal Value & Cumulative Hours), Engineers (Activity & Overtime), Productivity (Deep Work Focus Scores), and the System Audit Trail.
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Section 3: AI & Automation */}
                <div className="bg-[#1a1a1a] rounded-[32px] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                        <Brain className="w-5 h-5 text-purple-400" />
                        AI & Automation Engine
                    </h3>
                    <div className="space-y-6 text-sm text-slate-400 font-medium">
                        <div>
                            <strong className="text-purple-400 flex items-center gap-2 mb-1"><Target className="w-4 h-4" /> Smart Task Allocation</strong>
                            Instead of manually assigning tasks, use the <strong className="text-orange-400">AI Smart Assign</strong> button. It scans current backlogs and instantly routes the task to the operative with the lowest workload, ensuring perfectly balanced delivery.
                        </div>
                        <div>
                            <strong className="text-purple-400 flex items-center gap-2 mb-1"><HardHat className="w-4 h-4" /> Predictive Risk Analytics</strong>
                            The system continuously monitors burn rates, delayed milestones, and outstanding issues. If a project is trending towards a failure, the AI flags it as <strong className="text-red-400">Critical</strong> before deadlines are actually missed.
                        </div>
                        <div>
                            <strong className="text-purple-400 flex items-center gap-2 mb-1"><Zap className="w-4 h-4" /> AI Project Estimates</strong>
                            When onboarding a new project, the system uses machine learning against historical timeline data to predict accurate completion times, estimated engineering costs, and required personnel count.
                        </div>
                    </div>
                </div>

                {/* Section 4: Key Workflows & Partner Portal */}
                <div className="bg-[#1a1a1a] rounded-[32px] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/10 transition-colors"></div>
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-orange-400" />
                        Key Workflows & Partner Portal
                    </h3>
                    <div className="space-y-6 text-sm text-slate-400 font-medium">
                        <div>
                            <strong className="text-orange-400 flex items-center gap-2 mb-1"><Clock className="w-4 h-4" /> Logging Orbital Data (Time Tracking)</strong>
                            Use the <strong>Entries</strong> tab to log daily progress. Ensure your work exports match the task descriptions for our Smart Verification engine to auto-close your tasks.
                        </div>
                        <div>
                            <strong className="text-orange-400 flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4" /> Partner Portal (Client Access)</strong>
                            Clients have a dedicated dashboard visualizing live project timelines, cumulative milestones, active blockers, and an integrated 3D/BIM Model spatial engine for reviewing digital twins.
                        </div>
                        {role === 'admin' && (
                            <div>
                                <strong className="text-orange-400 flex items-center gap-2 mb-1"><FileLineChart className="w-4 h-4" /> Actionable Audit Logs</strong>
                                The system records every interaction. Admins can view exact timestamps, record IDs, and data mutations to maintain complete compliance and security over project data.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a1a] to-slate-900/50 rounded-[32px] border border-white/5 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                <h3 className="text-xl font-black text-white mb-4">Frequently Asked Questions</h3>
                <div className="space-y-4 text-sm text-slate-400 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl h-full">
                        <p className="font-bold text-white mb-2 text-[13px] uppercase tracking-widest text-orange-400">Q: How do I assign tasks optimally?</p>
                        <p>A: Within the Venture Details page, add a new task under a milestone and click the <strong className="text-white">AI Smart Assign</strong> button to instantly locate the operative with the lowest workload.</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl h-full">
                        <p className="font-bold text-white mb-2 text-[13px] uppercase tracking-widest text-orange-400">Q: How does the system automatically verify tasks?</p>
                        <p>A: When an operative exports a file (like a PDF or DWG) that matches a task's parameters, the smart engine cross-references the application usage logs and automatically transitions the task to "Completed".</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl h-full">
                        <p className="font-bold text-white mb-2 text-[13px] uppercase tracking-widest text-orange-400">Q: Can I see Total Hours instead of Weekly Activity for an Engineer?</p>
                        <p>A: Yes. In the <strong className="text-white">Reports</strong> section, switch to the Engineers view and use the Date filters at the top to filter total cumulative hours over any specific period.</p>
                    </div>
                    {role === 'client' && (
                        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl h-full">
                            <p className="font-bold text-white mb-2 text-[13px] uppercase tracking-widest text-orange-400">Q: How do I review the 3D BIM Models?</p>
                            <p>A: Navigate to your Partner Portal dashboard. The centralized 3D viewer will load available federated models for your associated projects, allowing you to visually orbit and inspect the design.</p>
                        </div>
                    )}
                </div>
            </div>

        </motion.div>
    );
};
