import React, { useState, useRef, useEffect } from 'react';


import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Check, AlertCircle, FolderKanban, Clock, CheckCircle2, MoreHorizontal, Settings2, Folder, Info, ClipboardList, DollarSign, TrendingUp, AlertTriangle, FileText, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Task } from '../types';


import { differenceInDays, format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfDay } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ClientReportTemplate } from '../components/ClientReportTemplate';

export const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { projects, milestones, tasks, engineers, entries, appUsageLogs, addMilestone, addTask, updateTask, addNotification, isLoading } = useData();
    const { role, engineerId: currentEngineerId } = useAuth();

    const project = projects.find(p => p.id === id);
    const projectMilestones = milestones.filter(m => m.projectId === id).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    const projectTasks = tasks.filter(t => t.projectId === id).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    const projectEntries = entries.filter(e => e.projectId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // --- Smart Document Deliverable Verification ---
    useEffect(() => {
        if (!project || projectTasks.length === 0 || appUsageLogs.length === 0) return;

        // Find recent export logs (e.g., within the last 5 minutes to avoid processing old ones on every load)
        const recentExportLogs = appUsageLogs.filter(log =>
            log.activeWindow.startsWith('Deliverable Exported:') &&
            (new Date().getTime() - new Date(log.timestamp).getTime() < 5 * 60 * 1000)
        );

        if (recentExportLogs.length === 0) return;

        // For each log, try to find a relevant task that is NOT done
        recentExportLogs.forEach(log => {
            const fileName = log.activeWindow.replace('Deliverable Exported: ', '').trim();
            let fileExt = '';
            if (fileName.includes('.')) {
                fileExt = fileName.split('.').pop()?.toLowerCase() || '';
            }

            // We need a heuristic to match a file export to a task.
            // Simple heuristic: if a task title mentions "PDF", "DWG", "Revit", "Export", "Deliverable"
            // and the exported file matches the type.
            const pendingTasks = projectTasks.filter(t => t.status !== 'completed');

            let taskToComplete: Task | undefined;

            for (const task of pendingTasks) {
                const titleLower = task.title.toLowerCase();
                const descLower = (task.description || '').toLowerCase();

                if (fileExt === 'pdf' && (titleLower.includes('pdf') || descLower.includes('pdf'))) {
                    taskToComplete = task; break;
                }
                if (fileExt === 'dwg' && (titleLower.includes('dwg') || titleLower.includes('autocad') || descLower.includes('dwg'))) {
                    taskToComplete = task; break;
                }
                if (fileExt === 'rvt' && (titleLower.includes('rvt') || titleLower.includes('revit') || descLower.includes('revit'))) {
                    taskToComplete = task; break;
                }
                // Generic catch-all if task is explicitly named "Export Deliverable"
                if (titleLower.includes('export deliverable') || titleLower.includes('final submission')) {
                    taskToComplete = task; break;
                }
            }

            if (taskToComplete) {
                // To prevent infinite loops if the hook runs again before state updates,
                // we should check if we already processed it (in a robust app, we'd mark the log as processed).
                // Here, we just rely on the 'done' status check above and optimistic updates.
                console.log(`Smart Verification: Completing task "${taskToComplete.title}" based on export: ${fileName}`);
                updateTask({ ...taskToComplete, status: 'completed' });
                addNotification({
                    id: crypto.randomUUID(),
                    engineerId: currentEngineerId || '', // Notify the person looking at the page, or ideally the assigned engineer
                    message: `Smart Scanner verified deliverable "${fileName}" and auto-completed task: "${taskToComplete.title}"`,
                    isRead: false
                });
            }
        });

    }, [appUsageLogs, projectTasks, project, addNotification, currentEngineerId, updateTask]);

    const [activeTab, setActiveTab] = useState<'milestones' | 'gantt' | 'files' | 'entries'>('milestones');

    // UI state
    const [isAddingMilestone, setIsAddingMilestone] = useState(false);
    const [milestoneName, setMilestoneName] = useState('');
    const [milestoneTargetDate, setMilestoneTargetDate] = useState('');

    const [isAddingTask, setIsAddingTask] = useState<string | null>(null); // milestone ID
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskEngineer, setTaskEngineer] = useState('');
    const [taskStartDate, setTaskStartDate] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');

    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const totalCost = projectEntries.reduce((sum, entry) => {
        const engineer = engineers.find(e => e.id === entry.engineerId);
        const rate = (engineer?.hourlyRate || project?.hourlyRate || 0);
        return sum + (entry.timeSpent * rate);
    }, 0);

    const rfiEntries = projectEntries.filter(e => e.entryType === 'rfi');
    const revisionEntries = projectEntries.filter(e => e.entryType === 'revision');

    const totalRfiHours = rfiEntries.reduce((sum, e) => sum + e.timeSpent, 0);
    const totalRevisionHours = revisionEntries.reduce((sum, e) => sum + e.timeSpent, 0);

    const rfiCost = rfiEntries.reduce((sum, entry) => {
        const engineer = engineers.find(e => e.id === entry.engineerId);
        const rate = (engineer?.hourlyRate || project?.hourlyRate || 0);
        return sum + (entry.timeSpent * rate);
    }, 0);

    const revisionCost = revisionEntries.reduce((sum, entry) => {
        const engineer = engineers.find(e => e.id === entry.engineerId);
        const rate = (engineer?.hourlyRate || project?.hourlyRate || 0);
        return sum + (entry.timeSpent * rate);
    }, 0);

    const extraHours = totalRfiHours + totalRevisionHours;
    const extraCost = rfiCost + revisionCost;

    const budget = project?.budget || 0;
    const burnRate = budget > 0 ? (totalCost / budget) * 100 : 0;

    let burnStatusColor = 'text-emerald-500';
    let burnStatusBg = 'bg-emerald-500/10 border-emerald-500/20';
    if (burnRate > 100) {
        burnStatusColor = 'text-red-500';
        burnStatusBg = 'bg-red-500/10 border-red-500/20';
    } else if (burnRate > 80) {
        burnStatusColor = 'text-amber-500';
        burnStatusBg = 'bg-amber-500/10 border-amber-500/20';
    }

    if (!project) {
        if (isLoading) {
            return (
                <div className="min-h-[50vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Loading Project Data</p>
                    </div>
                </div>
            );
        }
        return <div className="p-8 text-center text-slate-500">Project not found</div>;
    }

    const handleAddMilestone = (e: React.FormEvent) => {
        e.preventDefault();
        if (!milestoneName.trim()) return;
        addMilestone({
            id: crypto.randomUUID(),
            projectId: project.id,
            name: milestoneName,
            targetDate: milestoneTargetDate || undefined,
            completedPercentage: 0
        });
        setMilestoneName('');
        setMilestoneTargetDate('');
        setIsAddingMilestone(false);
    };

    const handleAddTask = (milestoneId: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!taskTitle.trim()) return;
        addTask({
            id: crypto.randomUUID(),
            projectId: project.id,
            milestoneId,
            engineerId: taskEngineer || undefined,
            title: taskTitle,
            description: taskDesc,
            status: 'not_started',
            startDate: taskStartDate || undefined,
            dueDate: taskDueDate || undefined
        });

        if (taskEngineer && taskEngineer !== currentEngineerId) {
            addNotification({
                id: crypto.randomUUID(),
                engineerId: taskEngineer,
                message: `You've been assigned a new task: "${taskTitle}" in ${project.name}`,
                isRead: false
            });
        }

        setTaskTitle('');
        setTaskDesc('');
        setTaskEngineer('');
        setTaskStartDate('');
        setTaskDueDate('');
        setIsAddingTask(null);
    };

    const handleStatusMove = (task: Task, newStatus: Task['status']) => {
        updateTask({ ...task, status: newStatus });

        if (task.engineerId && task.engineerId !== currentEngineerId) {
            const statusLabel = newStatus.replace('_', ' ');
            addNotification({
                id: crypto.randomUUID(),
                engineerId: task.engineerId,
                message: `Status of your task "${task.title}" was changed to ${statusLabel}.`,
                isRead: false
            });
        }
    };

    // New function to handle task status update
    const updateTaskStatus = (taskId: string, newStatus: Task['status']) => {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (taskToUpdate) {
            handleStatusMove(taskToUpdate, newStatus);
        }
    };

    const handleGenerateReport = async () => {
        if (!reportRef.current) return;
        setIsGeneratingReport(true);
        try {
            // Give a micro tick for React to render just in case
            await new Promise(r => setTimeout(r, 100));
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Status_Report_${project?.name?.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Error generating report:", error);
        } finally {
            setIsGeneratingReport(false);
        }
    };



    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <button
                onClick={() => navigate('/projects')}
                className="flex items-center text-slate-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px] group"
            >
                <div className="p-2 bg-white/5 rounded-lg mr-3 group-hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Return to Library
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">
                            {project.name} <span className="text-orange-400">Venture</span>
                        </h2>
                        <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold tracking-widest uppercase">
                            {project.phase || 'Planning'}
                        </div>
                    </div>
                    <div className="h-1 w-20 bg-orange-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Strategic Milestone & Task Command Center</p>
                </div>
                <div className="flex gap-4">
                    {activeTab === 'milestones' && (
                        <button
                            onClick={handleGenerateReport}
                            disabled={isGeneratingReport}
                            className={`flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl transition-all duration-300 border border-white/5 shadow-xl font-bold uppercase tracking-widest text-[11px] ${isGeneratingReport ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>{isGeneratingReport ? 'Compiling...' : 'Client Report'}</span>
                        </button>
                    )}
                    {activeTab === 'milestones' && role === 'admin' && (
                        <button
                            onClick={() => setIsAddingMilestone(true)}
                            className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-1 disabled:opacity-50 font-bold uppercase tracking-widest text-[11px]"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Establish Milestone</span>
                        </button>
                    )}
                    {activeTab === 'files' && (
                        <div className="flex gap-4">
                            {project?.googleDriveLink && (
                                <a
                                    href={project.googleDriveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl transition-all duration-300 shadow-xl font-bold uppercase tracking-widest text-[11px] border border-white/5"
                                >
                                    <Folder className="w-4 h-4 text-orange-400" />
                                    <span>Google Drive</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Health Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#1a1a1a]/40 p-6 rounded-[32px] border border-white/5 backdrop-blur-3xl flex items-center gap-6 group hover:border-orange-500/30 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500/20 transition-all">
                        <DollarSign className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Project Budget</p>
                        <p className="text-3xl font-black text-white">${budget.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-[#1a1a1a]/40 p-6 rounded-[32px] border border-white/5 backdrop-blur-3xl flex items-center gap-6 group hover:border-orange-500/30 transition-all">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${burnStatusBg} group-hover:bg-white/10`}>
                        <TrendingUp className={`w-6 h-6 ${burnStatusColor}`} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Current Cost</p>
                        <p className={`text-3xl font-black ${burnStatusColor}`}>${totalCost.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-[#1a1a1a]/40 p-6 rounded-[32px] border border-white/5 backdrop-blur-3xl flex items-center gap-6 group hover:border-orange-500/30 transition-all">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${burnStatusBg} group-hover:bg-white/10`}>
                        {burnRate > 100 ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <Clock className={`w-6 h-6 ${burnStatusColor}`} />}
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Burn Rate</p>
                        <div className="flex items-end gap-2">
                            <p className={`text-3xl font-black ${burnStatusColor}`}>{burnRate.toFixed(1)}%</p>
                            {burnRate > 100 && <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Over Budget</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Order Impact Alert */}
            {extraHours > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[32px] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-rose-500/30">
                            <AlertCircle className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg">Out of Scope Impact (Change Order Data)</h3>
                            <p className="text-rose-400 text-sm font-bold mt-1">
                                {totalRfiHours}h RFI Processing • {totalRevisionHours}h Client Revisions
                            </p>
                        </div>
                    </div>
                    <div className="relative z-10 text-right">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Calculated Impact Cost</p>
                        <p className="text-3xl font-black text-rose-500">${extraCost.toLocaleString()}</p>
                    </div>
                </div>
            )}

            <div className="flex space-x-4 border-b border-white/10 mb-8">
                <button
                    onClick={() => setActiveTab('milestones')}
                    className={`px-6 py-4 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 ${activeTab === 'milestones' ? 'text-orange-400 border-orange-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                >
                    Milestones & Tasks
                </button>
                <button
                    onClick={() => setActiveTab('gantt')}
                    className={`px-6 py-4 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 ${activeTab === 'gantt' ? 'text-orange-400 border-orange-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                >
                    Timeline (Gantt)
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`px-6 py-4 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 ${activeTab === 'files' ? 'text-orange-400 border-orange-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                >
                    Project Files
                </button>
                <button
                    onClick={() => setActiveTab('entries')}
                    className={`px-6 py-4 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 ${activeTab === 'entries' ? 'text-orange-400 border-orange-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                >
                    Activity Log ({projectEntries.length})
                </button>
            </div>

            {isAddingMilestone && activeTab === 'milestones' && (
                <div className="bg-[#1a1a1a]/60 p-10 rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500"></div>
                    <form onSubmit={handleAddMilestone} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Milestone Designation</label>
                                <input
                                    type="text"
                                    value={milestoneName}
                                    onChange={e => setMilestoneName(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="e.g. Concept Submission"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Target Completion</label>
                                <input
                                    type="date"
                                    value={milestoneTargetDate}
                                    onChange={e => setMilestoneTargetDate(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsAddingMilestone(false)}
                                className="px-8 py-4 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[11px] transition-all"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-4 bg-white text-black hover:bg-orange-500 hover:text-white rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-xl font-bold uppercase tracking-widest text-[11px]"
                            >
                                <Check className="w-4 h-4" />
                                <span>Save Milestone</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-8">
                {activeTab === 'milestones' && (
                    <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[32px] flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden group">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center border border-orange-500/30 shrink-0">
                            <Info className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg mb-1">How System Works: Milestones & Active Tasks</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                <strong className="text-slate-300">Milestones</strong> act as major deliverables or phases for the project. Create them first. Once created, you can add <strong className="text-slate-300">Active Tasks</strong> directly under each milestone, assign them to engineers, and track their lifecycle (Queued, Executing, Verified) using the + and ✓ buttons.
                            </p>
                        </div>
                    </div>
                )}

                {projectMilestones.length === 0 && !isAddingMilestone && (
                    <div className="text-center py-20 bg-[#1a1a1a]/40 rounded-[40px] border border-dashed border-white/5 backdrop-blur-3xl">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <FolderKanban className="w-10 h-10 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight">No milestones established</h3>
                        <p className="text-slate-500 font-medium mt-2">Initialize your project architecture by adding a milestone.</p>
                    </div>
                )}

                {projectMilestones.map(milestone => {
                    const mTasks = projectTasks.filter(t => t.milestoneId === milestone.id);
                    const completedTasks = mTasks.filter(t => t.status === 'completed');

                    const progressVal = mTasks.length > 0 ? Math.round((completedTasks.length / mTasks.length) * 100) : 0;

                    return (
                        <div key={milestone.id} className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl relative group">
                            <div className="p-8 border-b border-white/5 bg-white/0 flex justify-between items-center relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight mb-2 group-hover:text-orange-400 transition-colors">{milestone.name}</h3>
                                    {milestone.targetDate && (
                                        <div className="flex items-center gap-3">
                                            <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center">
                                                    <AlertCircle className="w-3 h-3 mr-1.5" />
                                                    Deadline: {new Date(milestone.targetDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-white mb-1">{progressVal}%</div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Efficiency Rating</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/5 relative z-10 w-full overflow-x-auto">
                                {[
                                    { id: 'not_started', label: 'Pending', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500', shadow: 'shadow-[0_0_10px_rgba(148,163,184,0.5)]', containerBg: 'bg-white/0', tasks: mTasks.filter(t => t.status === 'not_started'), next: 'in_progress' },
                                    { id: 'in_progress', label: 'Executing', icon: Settings2, color: 'text-orange-400', bg: 'bg-orange-500', shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.5)]', containerBg: 'bg-orange-500/[0.02]', tasks: mTasks.filter(t => t.status === 'in_progress'), next: 'under_review' },
                                    { id: 'under_review', label: 'Under Review', icon: Settings2, color: 'text-purple-400', bg: 'bg-purple-500', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]', containerBg: 'bg-purple-500/[0.02]', tasks: mTasks.filter(t => t.status === 'under_review'), next: 'client_approved' },
                                    { id: 'client_approved', label: 'Client Apprv.', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500', shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]', containerBg: 'bg-blue-500/[0.02]', tasks: mTasks.filter(t => t.status === 'client_approved'), next: 'authority_approved' },
                                    { id: 'authority_approved', label: 'Auth Apprv.', icon: CheckCircle2, color: 'text-indigo-400', bg: 'bg-indigo-500', shadow: 'shadow-[0_0_10px_rgba(99,102,241,0.5)]', containerBg: 'bg-indigo-500/[0.02]', tasks: mTasks.filter(t => t.status === 'authority_approved'), next: 'completed' },
                                    { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500', shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]', containerBg: 'bg-emerald-500/[0.02]', tasks: mTasks.filter(t => t.status === 'completed'), next: null },
                                ].map((col, colIndex) => (
                                    <div key={col.id} className={`p-6 ${col.containerBg} min-w-[300px]`}>
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${col.bg} ${col.shadow}`}></div>
                                                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${col.id === 'not_started' ? 'text-slate-500' : 'text-white'}`}>{col.label}</h4>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border border-white/5 bg-white/5 ${col.color}`}>{col.tasks.length}</span>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Allow adding tasks only in the first column for UI simplicity */}
                                            {colIndex === 0 && isAddingTask === milestone.id && (
                                                <div className="bg-[#1a1a1a]/60 p-5 rounded-[24px] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500/50 to-purple-500/50"></div>
                                                    <form onSubmit={(e) => handleAddTask(milestone.id, e)} className="space-y-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Task Objective</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Describe the operation..."
                                                                value={taskTitle}
                                                                onChange={e => setTaskTitle(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all text-sm font-medium"
                                                                autoFocus
                                                                required
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assignee</label>
                                                            <select
                                                                value={taskEngineer}
                                                                onChange={e => setTaskEngineer(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all text-xs font-medium appearance-none"
                                                            >
                                                                <option value="" className="bg-[#1a1a1a]">Assign Operative...</option>
                                                                {engineers.map(e => (
                                                                    <option key={e.id} value={e.id} className="bg-[#1a1a1a]">{e.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                                                                <input
                                                                    type="date"
                                                                    value={taskStartDate}
                                                                    onChange={e => setTaskStartDate(e.target.value)}
                                                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all text-xs font-medium"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Due Date</label>
                                                                <input
                                                                    type="date"
                                                                    value={taskDueDate}
                                                                    onChange={e => setTaskDueDate(e.target.value)}
                                                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all text-xs font-medium"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2 pt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsAddingTask(null)}
                                                                className="px-3 py-2 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[9px] transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all duration-300 shadow-lg shadow-orange-600/20 font-bold uppercase tracking-widest text-[9px]"
                                                            >
                                                                Launch Task
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}

                                            {col.tasks.map(task => (
                                                <div key={task.id} className={`group/task ${col.id === 'completed' ? 'bg-white/5 opacity-60' : 'bg-[#1a1a1a]/40'} p-5 rounded-[20px] border border-white/5 hover:border-${col.id === 'not_started' ? 'slate' : col.bg.split('-')[1]}-500/30 transition-all duration-300 shadow-xl`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <p className={`${col.id === 'completed' ? 'text-slate-400 line-through' : 'text-white'} font-bold text-sm leading-relaxed`}>{task.title}</p>
                                                        <button className="text-slate-600 hover:text-white transition-colors shrink-0 ml-2">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Progress/Dependencies could go here in future */}
                                                    {task.engineerId && (
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-black text-white shrink-0">
                                                                {engineers.find(e => e.id === task.engineerId)?.name.charAt(0) || '?'}
                                                            </div>
                                                            <span className="text-[9px] font-medium text-slate-400 truncate tracking-wide">
                                                                {engineers.find(e => e.id === task.engineerId)?.name || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                        <div className={`flex items-center text-[9px] font-bold uppercase tracking-widest ${col.color}`}>
                                                            {React.createElement(col.icon, { className: `w-3 h-3 mr-1.5 ${col.id === 'in_progress' ? 'animate-spin-slow' : ''}` })}
                                                            {col.label}
                                                        </div>
                                                        {col.next && (
                                                            <button
                                                                onClick={() => updateTaskStatus(task.id, col.next as Task['status'])}
                                                                className={`p-1.5 bg-white/5 text-slate-400 rounded-lg border border-white/5 hover:${col.bg} hover:text-white transition-all`}
                                                                title={`Move to ${col.next}`}
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {col.tasks.length === 0 && (
                                                <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-[24px]">
                                                    <p className="text-slate-700 text-[9px] font-bold uppercase tracking-widest">Empty</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {activeTab === 'gantt' && (
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl overflow-x-auto"
                    >
                        {(() => {
                            const scheduledTasks = projectTasks.filter(t => t.startDate && t.dueDate).sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

                            if (scheduledTasks.length === 0) {
                                return (
                                    <div className="text-center py-20">
                                        <h3 className="text-xl font-black text-white tracking-tight">No Timeline Data</h3>
                                        <p className="text-slate-500 font-medium mt-2">Ensure tasks have both a start date and due date to appear in the Gantt chart.</p>
                                    </div>
                                );
                            }

                            // 1. Find min start and max due date across all tasks
                            const allStarts = scheduledTasks.map(t => new Date(t.startDate!).getTime());
                            const allDues = scheduledTasks.map(t => new Date(t.dueDate!).getTime());

                            // 2. Expand to full weeks (Sunday to Saturday)
                            const minDate = new Date(Math.min(...allStarts));
                            let maxDate = new Date(Math.max(...allDues));

                            let gridStartDate = startOfWeek(minDate, { weekStartsOn: 0 }); // Sunday
                            let gridEndDate = endOfWeek(maxDate, { weekStartsOn: 0 });   // Saturday

                            // 3. Enforce a minimum of 4 weeks (28 days) if the project timeline is very short
                            if (differenceInDays(gridEndDate, gridStartDate) < 27) {
                                gridEndDate = endOfWeek(addDays(gridStartDate, 27), { weekStartsOn: 0 });
                            }

                            const daysInGrid = eachDayOfInterval({ start: gridStartDate, end: gridEndDate });

                            // Group days into weeks for the header
                            const weeks = [];
                            for (let i = 0; i < daysInGrid.length; i += 7) {
                                weeks.push(daysInGrid.slice(i, i + 7));
                            }

                            return (
                                <div className="min-w-fit pr-4 pb-4">
                                    <div className="grid border border-white/10 rounded-2xl overflow-hidden bg-[#1a1a1a]/80" style={{ gridTemplateColumns: `minmax(200px, 250px) repeat(${daysInGrid.length}, minmax(28px, 1fr))` }}>

                                        {/* --- Row 1: Week Headers --- */}
                                        <div className="border-b border-r border-white/10 bg-white/5 p-4 flex items-center justify-end">
                                            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Timeline</span>
                                        </div>
                                        {weeks.map((_, wIndex) => (
                                            <div key={`week-${wIndex}`} className="border-b border-r border-white/10 bg-white/5 p-2 text-center" style={{ gridColumn: `span 7` }}>
                                                <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">Week {wIndex + 1}</span>
                                            </div>
                                        ))}

                                        {/* --- Row 2: Day Letters (S M T W T F S) --- */}
                                        <div className="border-b border-r border-white/10 bg-white/5 px-4 py-2 flex items-center justify-between">
                                            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Task</span>
                                            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Assignee</span>
                                        </div>
                                        {daysInGrid.map((day, dIndex) => (
                                            <div key={`day-header-${dIndex}`} className="border-b border-r border-white/10 bg-white/[0.02] py-2 flex items-center justify-center">
                                                <span className={`text-[10px] font-black ${day.getDay() === 0 || day.getDay() === 6 ? 'text-orange-500/50' : 'text-slate-500'}`}>
                                                    {format(day, 'eeeee')}
                                                </span>
                                            </div>
                                        ))}

                                        {/* --- Rows: Tasks --- */}
                                        {scheduledTasks.map((task, tIndex) => {
                                            const taskStart = startOfDay(new Date(task.startDate!));
                                            const taskDue = startOfDay(new Date(task.dueDate!));
                                            const now = startOfDay(new Date());
                                            const isOverdue = task.status !== 'completed' && taskDue < now;
                                            const assignee = engineers.find(e => e.id === task.engineerId)?.name || 'Unassigned';

                                            return (
                                                <React.Fragment key={task.id}>
                                                    {/* Task Info Cell */}
                                                    <div className={`border-b border-r border-white/10 p-3 flex items-center justify-between gap-2 bg-white/[0.01] hover:bg-white/[0.05] transition-colors ${tIndex === scheduledTasks.length - 1 ? 'border-b-0' : ''}`}>
                                                        <div className="truncate flex-1">
                                                            <p className={`font-bold ${isOverdue ? 'text-red-400' : 'text-slate-200'} truncate text-xs`} title={task.title}>{task.title}</p>
                                                        </div>
                                                        <div className="shrink-0 w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[9px] font-black text-white" title={assignee}>
                                                            {assignee.charAt(0)}
                                                        </div>
                                                    </div>

                                                    {/* Grid Cells for this Task */}
                                                    {daysInGrid.map((day, dIndex) => {
                                                        const currentDay = startOfDay(day);
                                                        const isTaskDay = currentDay >= taskStart && currentDay <= taskDue;

                                                        let cellColor = '';
                                                        if (isTaskDay) {
                                                            if (task.status === 'completed') cellColor = 'bg-emerald-500';
                                                            else if (isOverdue) cellColor = 'bg-red-500';
                                                            else if (task.status === 'in_progress') cellColor = 'bg-orange-500';
                                                            else if (task.status === 'under_review') cellColor = 'bg-purple-500';
                                                            else if (task.status === 'client_approved') cellColor = 'bg-blue-500';
                                                            else if (task.status === 'authority_approved') cellColor = 'bg-indigo-500';
                                                            else cellColor = 'bg-slate-500';
                                                        }

                                                        return (
                                                            <div
                                                                key={`cell-${task.id}-${dIndex}`}
                                                                className={`border-b border-r border-white/10 ${tIndex === scheduledTasks.length - 1 ? 'border-b-0' : ''} ${dIndex === daysInGrid.length - 1 ? 'border-r-0' : ''} ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-white/[0.02]' : ''}`}
                                                            >
                                                                {isTaskDay && (
                                                                    <div className="w-full h-full p-1 cursor-help" title={`${format(taskStart, 'MMM d')} - ${format(taskDue, 'MMM d')} | ${task.title}`}>
                                                                        <div className={`w-full h-full rounded-sm ${cellColor} shadow-sm opacity-90 hover:opacity-100 transition-opacity`}></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center gap-6 px-4">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">To Do</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-orange-500"></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Done</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500 animate-pulse"></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overdue</span></div>
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>

                    {/* Unscheduled Tasks Section */}
                    {projectTasks.filter(t => !t.startDate || !t.dueDate).length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Unscheduled Tasks</h4>
                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-500 border border-white/5">
                                    {projectTasks.filter(t => !t.startDate || !t.dueDate).length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projectTasks.filter(t => !t.startDate || !t.dueDate).map(task => (
                                    <div key={task.id} className="bg-white/5 p-5 rounded-[24px] border border-white/5 hover:border-orange-500/30 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-white font-bold leading-relaxed">{task.title}</p>
                                        </div>
                                        <div className="space-y-3 mt-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest w-12">Start:</span>
                                                <input
                                                    type="date"
                                                    value={task.startDate || ''}
                                                    onChange={(e) => updateTask({ ...task, startDate: e.target.value })}
                                                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:ring-1 focus:ring-orange-500/50"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest w-12">Due:</span>
                                                <input
                                                    type="date"
                                                    value={task.dueDate || ''}
                                                    onChange={(e) => updateTask({ ...task, dueDate: e.target.value })}
                                                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:ring-1 focus:ring-orange-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {activeTab === 'files' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-[600px] md:h-[700px] bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl overflow-hidden relative"
                >
                    {(() => {
                        let folderId = '1g8vpZW2ZUtmYVHCpoDGHfiv01qqLM-BG';
                        let linkForButton = 'https://drive.google.com/drive/folders/1g8vpZW2ZUtmYVHCpoDGHfiv01qqLM-BG?usp=sharing';

                        if (project?.googleDriveLink) {
                            linkForButton = project.googleDriveLink;
                            const match = project.googleDriveLink.match(/folders\/([a-zA-Z0-9_-]+)/);
                            if (match && match[1]) {
                                folderId = match[1];
                            } else if (project.googleDriveLink.includes('id=')) {
                                const idMatch = project.googleDriveLink.match(/id=([a-zA-Z0-9_-]+)/);
                                if (idMatch && idMatch[1]) folderId = idMatch[1];
                            }
                        }

                        const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;

                        return (
                            <div className="relative w-full h-full">
                                {/* Fallback Background Message */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#1a1a1a]/40 backdrop-blur-3xl z-0">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 animate-pulse">
                                        <Folder className="w-8 h-8 text-slate-500" />
                                    </div>
                                    <h3 className="text-xl font-black text-white tracking-tight mb-2">Google Drive Integration</h3>
                                    <p className="text-slate-400 font-medium max-w-md mb-6">
                                        Loading folder contents... If you only see a blank white space, your browser might be blocking cross-site tracking or you may need to sign in.
                                    </p>
                                    <a
                                        href={linkForButton}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors border border-white/10 flex items-center gap-2"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        Open in New Tab Instead
                                    </a>
                                </div>
                                {/* Iframe (sits above background) */}
                                <iframe
                                    src={embedUrl}
                                    width="100%"
                                    height="100%"
                                    className="relative border-0 bg-transparent w-full h-full z-10"
                                    title="Google Drive Folder"
                                    allow="fullscreen"
                                    loading="lazy"
                                ></iframe>
                            </div>
                        );
                    })()}
                </motion.div>
            )}
            {activeTab === 'entries' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                >
                    {projectEntries.length === 0 ? (
                        <div className="text-center py-32 bg-[#1a1a1a]/40 rounded-[40px] border border-dashed border-white/5 backdrop-blur-3xl">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                                <ClipboardList className="w-10 h-10 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tight">No entries logged</h3>
                            <p className="text-slate-500 font-medium mt-2">Engineers haven't logged any work for this project yet.</p>
                        </div>
                    ) : (
                        <div className="bg-[#1a1a1a]/40 rounded-[32px] border border-white/5 overflow-hidden backdrop-blur-3xl">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Engineer</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Date</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Task</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Software</th>
                                            <th className="text-right px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectEntries.map(entry => {
                                            const engineer = engineers.find(e => e.id === entry.engineerId);
                                            return (
                                                <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400 font-black text-xs border border-orange-500/20">
                                                                {engineer?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <span className="text-white font-bold text-sm">{engineer?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 text-sm font-medium">
                                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-white text-sm font-medium max-w-xs">
                                                        <p className="truncate">{entry.taskDescription}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {entry.softwareUsed?.map((sw, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-slate-400 border border-white/5">{sw}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-white font-black text-lg">{entry.timeSpent}</span>
                                                        <span className="text-slate-600 text-xs ml-1">hrs</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-white/10">
                                            <td colSpan={4} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-orange-400 font-black text-lg">{projectEntries.reduce((sum, e) => sum + e.timeSpent, 0).toFixed(1)}</span>
                                                <span className="text-slate-600 text-xs ml-1">hrs</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Hidden Report Wrapper */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                <ClientReportTemplate
                    ref={reportRef}
                    project={project}
                    milestones={projectMilestones}
                    tasks={projectTasks}
                />
            </div>
        </motion.div>
    );
};
