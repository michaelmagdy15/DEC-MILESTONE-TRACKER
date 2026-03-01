
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LayoutGrid, Users, Download, BarChart2, Calendar, FileText, ChevronRight, Activity, Shield, ChevronLeft, AlertCircle, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceTemplate } from '../components/InvoiceTemplate';

// Helper to determine if a date falls in Ramadan (approximate for 2026 for example, or generally checking a range)
// Note: In a real app, you'd want a dynamic way to set Ramadan dates or an API.
const isRamadan = (date: Date) => {
    // Example: Ramadan 2026 is approx Feb 17 to March 19
    const year = date.getFullYear();
    if (year === 2026) {
        const start = new Date(2026, 1, 17); // Month is 0-indexed, 1 = Feb
        const end = new Date(2026, 2, 20);   // 2 = March, Ramadan ends March 20
        return date >= start && date <= end;
    }
    return false; // Add logic for other years if needed
};

// Helper to calculate expected daily hours based on location, day of week, and Ramadan
const getExpectedDailyHours = (date: Date, location: 'Abu Dhabi' | 'Cairo' | string | undefined) => {
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
    const isFriday = dayOfWeek === 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Saturday & Sunday

    if (isWeekend) return 0;

    const inRamadan = isRamadan(date);

    if (inRamadan) {
        // Ramadan: 8:30 AM to 3:00 PM = 6.5 hours (same for both locations)
        return 6.5;
    }

    if (isFriday) {
        if (location === 'Abu Dhabi') {
            // Abu Dhabi Friday: 8:30 AM to 5:00 PM with 12:30-2:00 PM break (1.5h) = 7h effective
            return 7;
        } else {
            // Cairo Friday: 8:30 AM to 3:30 PM = 7 hours
            return 7;
        }
    }

    // Normal weekday: 8:30 AM to 5:00 PM = 8.5 hours
    return 8.5;
};

const getExpectedWeeklyHours = (date: Date, location: 'Abu Dhabi' | 'Cairo' | string | undefined) => {
    let total = 0;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Start on Monday

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        total += getExpectedDailyHours(currentDay, location);
    }
    return total;
};

export const Reports: React.FC = () => {
    const { projects, engineers, entries, attendance, appUsageLogs, auditLogs, tasks } = useData();
    const [view, setView] = useState<'projects' | 'engineers' | 'activity' | 'audit' | 'capacity'>('projects');
    const [generatingInvoiceFor, setGeneratingInvoiceFor] = useState<string | null>(null);
    const invoiceRef = React.useRef<HTMLDivElement>(null);

    // Filters & Pagination
    const [filterEngineer, setFilterEngineer] = useState('');
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    // Calculate Project Stats
    const projectStats = projects.map(project => {
        const projectEntries = entries.filter(e => e.projectId === project.id);
        const totalHours = projectEntries.reduce((sum, e) => sum + e.timeSpent, 0);
        const cost = totalHours * (project.hourlyRate || 0);
        const uniqueEngineers = new Set(projectEntries.map(e => e.engineerId)).size;
        const lastActivity = projectEntries.length > 0
            ? new Date(Math.max(...projectEntries.map(e => new Date(e.date).getTime())))
            : null;

        return { ...project, totalHours, cost, uniqueEngineers, lastActivity };
    });

    // Calculate Engineer Stats
    const engineerStats = engineers.map(engineer => {
        const engineerEntries = entries.filter(e => e.engineerId === engineer.id);
        const engineerLogs = appUsageLogs.filter(l => l.engineerId === engineer.id);

        const calculateActiveHours = (logs: any[], sinceDate?: Date) => {
            const filtered = sinceDate ? logs.filter(l => new Date(l.timestamp) >= sinceDate) : logs;
            const IDLE_THRESHOLD = 300;
            let activeSecs = 0;
            filtered.forEach(log => {
                const isLock = log.activeWindow.toLowerCase().includes('lock') || log.activeWindow.toLowerCase().includes('login');
                if (isLock) return;
                activeSecs += Math.min(log.durationSeconds, IDLE_THRESHOLD);
            });
            return activeSecs / 3600;
        };

        const totalAppHours = calculateActiveHours(engineerLogs);
        const totalHours = engineerEntries.reduce((sum, e) => sum + e.timeSpent, 0) + totalAppHours;
        const projectCount = new Set(engineerEntries.map(e => e.projectId)).size;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weeklyAppHours = calculateActiveHours(engineerLogs, oneWeekAgo);
        const weeklyHours = engineerEntries
            .filter(e => new Date(e.date) >= oneWeekAgo)
            .reduce((sum, e) => sum + e.timeSpent, 0) + weeklyAppHours;

        const weeklyAbsences = attendance.filter(a =>
            a.engineerId === engineer.id &&
            a.status === 'Absent' &&
            new Date(a.date) >= oneWeekAgo
        ).length;

        const hourlyRate = engineer.hourlyRate || 0;
        const calculatedWeeklyGoal = engineer.location ? getExpectedWeeklyHours(now, engineer.location) : (engineer.weeklyGoalHours || 40);
        const weeklyGoal = calculatedWeeklyGoal;

        const weeklyOvertime = Math.max(0, weeklyHours - weeklyGoal);
        const overtimePayment = weeklyOvertime * hourlyRate;

        const expectedPayment = (weeklyGoal * hourlyRate) + overtimePayment;
        const deduction = weeklyAbsences * 8 * hourlyRate;
        const weeklyPayment = Math.max(0, expectedPayment - deduction);

        return { ...engineer, totalHours, projectCount, weeklyHours, weeklyOvertime, weeklyAbsences, weeklyPayment };
    });


    // App Usage Daily Stats
    const dailyActivityStats = React.useMemo(() => {
        const stats: any[] = [];
        appUsageLogs
            .filter(l => !filterEngineer || l.engineerId === filterEngineer)
            .filter(l => !filterFrom || l.timestamp >= filterFrom)
            .filter(l => !filterTo || l.timestamp <= filterTo + 'T23:59:59')
            .forEach(log => {
                const date = new Date(log.timestamp).toISOString().split('T')[0];
                const eng = engineers.find(e => e.id === log.engineerId);
                if (!eng) return;

                stats.push({
                    id: log.id,
                    date,
                    timestamp: new Date(log.timestamp).toLocaleTimeString(),
                    rawTimestamp: log.timestamp,
                    engineerName: eng.name,
                    activeWindow: log.activeWindow,
                    durationSeconds: log.durationSeconds
                });
            });
        return stats.sort((a, b) => new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime()); // sort newest first
    }, [appUsageLogs, engineers, filterEngineer, filterFrom, filterTo]);

    // Capacity Map Stats (Restored)
    const capacityStats = React.useMemo(() => {
        return engineers.map(engineer => {
            const allocations = [0, 0, 0, 0];
            tasks
                .filter(t => t.engineerId === engineer.id && t.status !== 'done')
                .forEach(task => {
                    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                    if (!dueDate) return;
                    const diffWeeks = Math.floor((dueDate.getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000));
                    if (diffWeeks >= 0 && diffWeeks < 4) {
                        allocations[diffWeeks] += 10; // Placeholder 10h per task
                    }
                });

            const weeklyGoal = engineer.location ? getExpectedWeeklyHours(new Date(), engineer.location) : (engineer.weeklyGoalHours || 40);
            return {
                id: engineer.id,
                name: engineer.name,
                role: engineer.role || 'Specialist',
                allocations,
                weeklyGoal
            };
        });
    }, [engineers, tasks]);

    // Filtered Audit Logs with pagination
    const filteredAudit = React.useMemo(() => {
        return auditLogs
            .filter(a => !filterFrom || (a.createdAt && a.createdAt >= filterFrom))
            .filter(a => !filterTo || (a.createdAt && a.createdAt <= filterTo + 'T23:59:59'))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [auditLogs, filterFrom, filterTo]);

    const totalAuditPages = Math.max(1, Math.ceil(filteredAudit.length / PAGE_SIZE));
    const pagedAudit = React.useMemo(() => {
        return filteredAudit.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    }, [filteredAudit, page, PAGE_SIZE]);

    const exportCSV = (data: any[], fileName: string) => {
        let headers: string[] = [];
        let exportData: any[] = data;

        if (view === 'projects') {
            headers = ['Project Name', 'Total Hours', 'Total Cost (AED)', 'Engineers', 'Last Activity'];
        } else if (view === 'engineers') {
            headers = ['Engineer Name', 'Role', 'Projects', 'Location', 'Weekly Goal (Hrs)', 'Weekly Hours', 'Weekly Overtime', 'Weekly Payment (AED)'];
        } else if (view === 'activity') {
            headers = ['Date', 'Time', 'Engineer Name', 'Active Window', 'Duration (Seconds)'];
            exportData = dailyActivityStats;
        } else if (view === 'capacity') {
            headers = ['Engineer Name', 'Role', 'Week 1', 'Week 2', 'Week 3', 'Week 4'];
            exportData = capacityStats;
        }

        const csvContent = [
            headers.join(','),
            ...exportData.map(item => {
                if (view === 'projects') {
                    return [`"${item.name}"`, item.totalHours.toFixed(2), item.cost.toFixed(2), item.uniqueEngineers, item.lastActivity?.toISOString().split('T')[0] || 'N/A'];
                } else if (view === 'engineers') {
                    const eng = engineers.find(e => e.id === item.id);
                    const weeklyGoal = eng?.location ? getExpectedWeeklyHours(new Date(), eng.location) : (eng?.weeklyGoalHours || 40);
                    return [`"${item.name}"`, `"${item.role || 'Engineer'}"`, item.projectCount, `"${item.location || 'HQ'}"`, weeklyGoal.toFixed(1), item.weeklyHours.toFixed(2), item.weeklyOvertime.toFixed(2), item.weeklyPayment.toFixed(2)];
                } else if (view === 'activity') {
                    return [item.date, item.timestamp, `"${item.engineerName}"`, `"${item.activeWindow.replace(/"/g, '""')}"`, item.durationSeconds];
                } else if (view === 'capacity') {
                    return [`"${item.name}"`, `"${item.role}"`, ...item.allocations];
                }
            }).filter((row): row is any[] => row !== undefined).map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleDownloadInvoice = async (stat: any) => {
        setGeneratingInvoiceFor(stat.id);
        setTimeout(async () => {
            if (!invoiceRef.current) {
                setGeneratingInvoiceFor(null);
                return;
            }
            try {
                const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Invoice_${stat.name.replace(/\s+/g, '_')}.pdf`);
            } catch (error) {
                console.error("Error generating invoice:", error);
            } finally {
                setGeneratingInvoiceFor(null);
            }
        }, 300);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
                        Intelligence <span className="text-orange-400">Reports</span>
                    </h2>
                    <div className="h-1 w-20 bg-orange-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">High-fidelity analytics and performance auditing.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white/5 p-1.5 rounded-2xl border border-white/5 flex backdrop-blur-3xl">
                        <button
                            onClick={() => setView('projects')}
                            className={clsx(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3",
                                view === 'projects' ? "bg-white text-black shadow-xl" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Projects
                        </button>
                        <button
                            onClick={() => setView('engineers')}
                            className={clsx(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3",
                                view === 'engineers' ? "bg-white text-black shadow-xl" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Users className="w-4 h-4" />
                            Engineers
                        </button>
                        <button
                            onClick={() => setView('activity')}
                            className={clsx(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3",
                                view === 'activity' ? "bg-white text-black shadow-xl" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Activity className="w-4 h-4" />
                            App Activity
                        </button>
                        <button
                            onClick={() => { setView('audit'); setPage(1); }}
                            className={clsx(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3",
                                view === 'audit' ? "bg-white text-black shadow-xl" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Shield className="w-4 h-4" />
                            Audit Trail
                        </button>
                        <button
                            onClick={() => { setView('capacity'); setPage(1); }}
                            className={clsx(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3",
                                view === 'capacity' ? "bg-white text-black shadow-xl" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Calendar className="w-4 h-4" />
                            Capacity Map
                        </button>
                    </div>

                    <button
                        onClick={() => exportCSV(view === 'projects' ? projectStats : view === 'engineers' ? engineerStats : dailyActivityStats, view)}
                        className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-3.5 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 font-bold uppercase tracking-widest text-[10px]"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Intelligence</span>
                    </button>
                </div>
            </div>

            {/* CHARTS SECTION */}
            {view !== 'activity' && view !== 'audit' && view !== 'capacity' && (
                <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-orange-600/10 transition-colors"></div>
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                    <BarChart2 className="w-6 h-6 text-orange-400" />
                                </div>
                                Performance Calibration
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-14">
                                Visualizing Resource Distribution
                            </p>
                        </div>
                    </div>

                    <div className="h-[400px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={view === 'projects' ? projectStats : engineerStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                    dy={20}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: '#ffffff05' }}
                                    contentStyle={{
                                        backgroundColor: '#0f0f0f',
                                        border: '1px solid #ffffff10',
                                        borderRadius: '16px',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                    }}
                                    itemStyle={{ color: '#f3f3f3', fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#6366f1', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '40px' }}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{value}</span>}
                                />
                                <Bar
                                    dataKey={view === 'projects' ? "totalHours" : "weeklyHours"}
                                    name={view === 'projects' ? "Resource Hours" : "Weekly Activity"}
                                    fill="#6366f1"
                                    radius={[10, 10, 0, 0]}
                                    maxBarSize={40}
                                />
                                {view === 'projects' && (
                                    <Bar
                                        dataKey="cost"
                                        name="Fiscal Value (AED)"
                                        fill="#10b981"
                                        radius={[10, 10, 0, 0]}
                                        maxBarSize={40}
                                    />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* DATA CARDS/TABLE */}
            {view === 'audit' && (
                <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl p-8 mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                            <Shield className="w-5 h-5 text-orange-500" />
                            Audit Trail
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            <input type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
                                className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
                            <span className="text-slate-600 text-xs font-bold">→</span>
                            <input type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
                                className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
                            {(filterFrom || filterTo) && (
                                <button onClick={() => { setFilterFrom(''); setFilterTo(''); setPage(1); }}
                                    className="px-3 py-2 text-[10px] font-bold text-orange-400 hover:text-white bg-orange-500/10 border border-orange-500/20 rounded-xl uppercase tracking-widest transition-all">
                                    Clear
                                </button>
                            )}
                            <div className="px-3 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5">
                                {filteredAudit.length} Events
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                                <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="py-4 px-3">Timestamp</th>
                                    <th className="py-4 px-3">User</th>
                                    <th className="py-4 px-3">Action</th>
                                    <th className="py-4 px-3">Table</th>
                                    <th className="py-4 px-3">Record ID</th>
                                    <th className="py-4 px-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-slate-300 font-medium">
                                {pagedAudit.map((log) => {
                                    const eng = engineers.find(e => e.id === log.userId);
                                    return (
                                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 px-3 text-white font-mono text-xs whitespace-nowrap">
                                                {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                                            </td>
                                            <td className="py-4 px-3 font-bold text-white">{eng?.name || log.userId?.slice(0, 8) || 'System'}</td>
                                            <td className="py-4 px-3">
                                                <span className={clsx(
                                                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                                    log.action === 'created' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        log.action === 'updated' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                                )}>{log.action}</span>
                                            </td>
                                            <td className="py-4 px-3 text-slate-400 uppercase text-xs">{log.tableName}</td>
                                            <td className="py-4 px-3 text-slate-600 font-mono text-xs">{log.recordId?.slice(0, 8) || '—'}...</td>
                                            <td className="py-4 px-3 text-indigo-400 text-xs max-w-[250px] truncate" title={JSON.stringify(log.changes)}>
                                                {Object.keys(log.changes || {}).length > 0 ? JSON.stringify(log.changes).slice(0, 60) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pagedAudit.length === 0 && (
                                    <tr><td colSpan={6} className="py-8 text-center text-slate-500 font-medium italic">No audit records yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalAuditPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all border border-white/5">
                                <ChevronLeft className="w-3.5 h-3.5" /> Previous
                            </button>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Page {page} of {totalAuditPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalAuditPages, p + 1))} disabled={page >= totalAuditPages}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all border border-white/5">
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {view === 'activity' ? (
                <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl p-8 mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                            <Activity className="w-5 h-5 text-orange-500" />
                            APPLICATION ACTIVITY TIMELINE
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            <select
                                value={filterEngineer}
                                onChange={(e) => { setFilterEngineer(e.target.value); setPage(1); }}
                                className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none"
                            >
                                <option value="" className="bg-[#1a1a1a]">All Engineers</option>
                                {engineers.map(e => <option key={e.id} value={e.id} className="bg-[#1a1a1a]">{e.name}</option>)}
                            </select>
                            <input type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
                                className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
                            <span className="text-slate-600 text-xs font-bold">→</span>
                            <input type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
                                className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
                            {(filterEngineer || filterFrom || filterTo) && (
                                <button onClick={() => { setFilterEngineer(''); setFilterFrom(''); setFilterTo(''); setPage(1); }}
                                    className="px-3 py-2 text-[10px] font-bold text-orange-400 hover:text-white bg-orange-500/10 border border-orange-500/20 rounded-xl uppercase tracking-widest transition-all">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                                <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="py-4 font-bold text-left px-4">Date</th>
                                    <th className="py-4 font-bold text-left px-4">Time</th>
                                    <th className="py-4 font-bold text-left px-4">Engineer</th>
                                    <th className="py-4 font-bold text-left px-4">Active Application/Window</th>
                                    <th className="py-4 font-bold text-left px-4">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-slate-300 font-medium whitespace-nowrap">
                                {dailyActivityStats.map((stat, idx) => (
                                    <tr key={`${stat.id}_${idx}`} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-4 font-bold text-white">{stat.date}</td>
                                        <td className="py-4 px-4 text-slate-400">{stat.timestamp}</td>
                                        <td className="py-4 px-4 font-bold text-white">{stat.engineerName}</td>
                                        <td className="py-4 px-4 text-indigo-400 max-w-[300px] truncate" title={stat.activeWindow}>{stat.activeWindow}</td>
                                        <td className="py-4 px-4 text-emerald-400 font-black">{stat.durationSeconds} s</td>
                                    </tr>
                                ))}
                                {dailyActivityStats.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium italic">No background activity tracked yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : view === 'capacity' ? (
                <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl p-8 mt-8">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3 mb-6">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        RESOURCE CAPACITY HEATMAP (NEXT 4 WEEKS)
                    </h3>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                                <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="py-4 font-bold text-left px-4">Engineer</th>
                                    {capacityStats[0]?.allocations.map((_, i) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + (i * 7) - date.getDay());
                                        return <th key={i} className="py-4 font-bold text-center px-4">Week of {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</th>
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm font-medium whitespace-nowrap">
                                {capacityStats.map(stat => (
                                    <tr key={stat.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-4">
                                            <p className="font-bold text-white">{stat.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">{stat.role}</p>
                                        </td>
                                        {stat.allocations.map((hours, i) => {
                                            const percent = (hours / stat.weeklyGoal) * 100;
                                            let bgColor = 'bg-white/5 text-slate-400';
                                            if (percent > 100) bgColor = 'bg-red-500/20 text-red-500 border border-red-500/30';
                                            else if (percent > 75) bgColor = 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
                                            else if (hours > 0) bgColor = 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30';

                                            return (
                                                <td key={i} className="py-4 px-4 text-center">
                                                    <div className={`px-3 py-2 rounded-xl text-xs font-black mx-auto w-24 flex items-center justify-center gap-1 ${bgColor}`}>
                                                        {hours} <span className="text-[9px] opacity-70">/ {Math.round(stat.weeklyGoal)}H</span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-500" />
                                Overloaded Resources
                            </h4>
                            <div className="space-y-4">
                                {capacityStats.filter(s => s.allocations.some(h => h > s.weeklyGoal)).map(s => (
                                    <div key={s.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 font-bold text-[10px]">
                                                !
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{s.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                    Peak: {Math.max(...s.allocations)}H / {Math.round(s.weeklyGoal)}H
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Immediate Risk</p>
                                        </div>
                                    </div>
                                ))}
                                {capacityStats.filter(s => s.allocations.some(h => h > s.weeklyGoal)).length === 0 && (
                                    <p className="text-sm text-slate-600 font-medium italic">No critical overloading detected.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-orange-500/10 rounded-3xl p-6 border border-orange-500/10">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-orange-400" />
                                Capacity Rebalance Suggestions
                            </h4>
                            <div className="space-y-4">
                                {(() => {
                                    const overloaded = capacityStats.filter(s => s.allocations.some(h => h > s.weeklyGoal));
                                    const available = capacityStats.filter(s => s.allocations.every(h => h < s.weeklyGoal * 0.7));

                                    if (overloaded.length > 0 && available.length > 0) {
                                        return overloaded.map(o => (
                                            <div key={o.id} className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 border-dashed">
                                                <p className="text-[11px] font-bold text-white leading-relaxed">
                                                    Suggest delegating tasks from <span className="text-orange-400">{o.name}</span> to{' '}
                                                    <span className="text-emerald-400">{available[0].name}</span>
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Available bandwidth: {Math.round(available[0].weeklyGoal - Math.max(...available[0].allocations))}H</p>
                                            </div>
                                        ));
                                    }
                                    return <p className="text-sm text-slate-600 font-medium italic">Resource distribution is currently optimal.</p>
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(view === 'projects' ? projectStats : engineerStats).map((stat, idx) => (
                        <motion.div
                            key={(stat as any).id || (stat as any).name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-[#1a1a1a]/40 p-8 rounded-[32px] border border-white/5 hover:border-orange-500/30 transition-all duration-500 backdrop-blur-3xl shadow-xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
                            <div className="flex flex-col h-full relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-orange-500/20 group-hover:bg-orange-500/10 transition-all duration-500">
                                        {view === 'projects' ? <LayoutGrid className="w-8 h-8 text-slate-500 group-hover:text-orange-400" /> : <Users className="w-8 h-8 text-slate-500 group-hover:text-orange-400" />}
                                    </div>
                                    <button
                                        onClick={() => view === 'projects' ? handleDownloadInvoice(stat) : null}
                                        disabled={generatingInvoiceFor === (stat as any).id}
                                        className={clsx(
                                            "p-3 rounded-xl border transition-all",
                                            view === 'projects'
                                                ? "bg-white/5 text-slate-500 hover:text-white border-white/5 hover:bg-orange-600 hover:border-orange-600"
                                                : "bg-white/5 text-slate-700 border-white/5 cursor-not-allowed opacity-30"
                                        )}
                                    >
                                        <FileText className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-orange-400 transition-colors">{(stat as any).name}</h3>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-500 border border-white/5 uppercase tracking-widest group-hover:border-orange-500/20 group-hover:text-orange-400">
                                            {view === 'projects' ? 'Project' : ((stat as any).role || 'Operative')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-white/5">
                                        <div>
                                            <div className="text-2xl font-black text-white">
                                                {view === 'projects' ? (stat as any).totalHours.toFixed(1) : (stat as any).weeklyHours.toFixed(1)}
                                                <span className="text-[10px] ml-1 text-slate-600">H</span>
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{view === 'projects' ? 'Total Hours' : 'Weekly Activity'}</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-white">
                                                {view === 'projects' ? (stat as any).cost.toLocaleString() : (stat as any).weeklyOvertime.toFixed(1)}
                                                <span className="text-[10px] ml-1 text-slate-600">{view === 'projects' ? 'AED' : 'H'}</span>
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{view === 'projects' ? 'Est. Cost' : 'Auto Overtime'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                        <Calendar className="w-3.5 h-3.5 mr-2 text-orange-500" />
                                        {view === 'projects'
                                            ? `Audit: ${(stat as any).lastActivity ? (stat as any).lastActivity.toLocaleDateString() : 'Baseline'}`
                                            : `Payout: ${(stat as any).weeklyPayment.toLocaleString()} AED`}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )
            }

            {/* Hidden Invoice Wrapper */}
            {
                generatingInvoiceFor && (
                    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                        {(() => {
                            const targetProject = projectStats.find(p => p.id === generatingInvoiceFor);
                            if (!targetProject) return null;
                            const targetEntries = entries.filter(e => e.projectId === generatingInvoiceFor);
                            return (
                                <InvoiceTemplate
                                    ref={invoiceRef}
                                    project={targetProject}
                                    entries={targetEntries}
                                    totalHours={targetProject.totalHours}
                                    totalCost={targetProject.cost}
                                />
                            );
                        })()}
                    </div>
                )
            }
        </motion.div >
    );
};
