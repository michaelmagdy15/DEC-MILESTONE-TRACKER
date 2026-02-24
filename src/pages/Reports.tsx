
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LayoutGrid, Users, Download, BarChart2, Calendar, FileText, ChevronRight, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceTemplate } from '../components/InvoiceTemplate';

export const Reports: React.FC = () => {
    const { projects, engineers, entries, attendance, timeEntries } = useData();
    const [view, setView] = useState<'projects' | 'engineers' | 'timeclock'>('projects');
    const [generatingInvoiceFor, setGeneratingInvoiceFor] = useState<string | null>(null);
    const invoiceRef = React.useRef<HTMLDivElement>(null);

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
        const totalHours = engineerEntries.reduce((sum, e) => sum + e.timeSpent, 0);
        const projectCount = new Set(engineerEntries.map(e => e.projectId)).size;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyHours = engineerEntries
            .filter(e => new Date(e.date) >= oneWeekAgo)
            .reduce((sum, e) => sum + e.timeSpent, 0);

        const weeklyAbsences = attendance.filter(a =>
            a.engineerId === engineer.id &&
            a.status === 'Absent' &&
            new Date(a.date) >= oneWeekAgo
        ).length;

        const hourlyRate = engineer.hourlyRate || 0;
        const weeklyGoal = engineer.weeklyGoalHours || 0;

        const expectedPayment = weeklyGoal * hourlyRate;
        const deduction = weeklyAbsences * 8 * hourlyRate;
        const weeklyPayment = Math.max(0, expectedPayment - deduction);

        return { ...engineer, totalHours, projectCount, weeklyHours, weeklyAbsences, weeklyPayment };
    });

    // Calculate Timeclock Stats
    const timeclockStats = engineers.map(engineer => {
        const engEntries = timeEntries.filter(e => e.engineerId === engineer.id);

        let totalWorkMs = 0;
        let totalBreakMs = 0;

        engEntries.forEach(te => {
            const start = new Date(te.startTime).getTime();
            const end = te.endTime ? new Date(te.endTime).getTime() : new Date().getTime();
            const duration = end - start;

            if (te.entryType === 'work') {
                totalWorkMs += duration;
            } else if (te.entryType === 'break') {
                totalBreakMs += duration;
            }
        });

        const activeWorkDuration = Math.max(0, totalWorkMs - totalBreakMs);

        const totalWorkHours = activeWorkDuration / (1000 * 60 * 60);
        const totalBreakHours = totalBreakMs / (1000 * 60 * 60);

        return {
            id: engineer.id,
            name: engineer.name,
            totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
            totalBreakHours: parseFloat(totalBreakHours.toFixed(2)),
            expectedWeeklyHours: engineer.weeklyGoalHours || 40,
        };
    });

    const exportCSV = (data: any[], fileName: string) => {
        let headers: string[] = [];
        if (view === 'projects') {
            headers = ['Project Name', 'Total Hours', 'Total Cost (AED)', 'Engineers', 'Last Activity'];
        } else if (view === 'engineers') {
            headers = ['Engineer Name', 'Role', 'Projects', 'Total Hours', 'Weekly Payment (AED)'];
        } else {
            headers = ['Engineer Name', 'Work Hours', 'Break Hours', 'Expected Weekly Hours'];
        }

        const csvContent = [
            headers.join(','),
            ...data.map(item => {
                if (view === 'projects') {
                    return [`"${item.name}"`, item.totalHours.toFixed(2), item.cost.toFixed(2), item.uniqueEngineers, item.lastActivity?.toISOString().split('T')[0] || 'N/A'];
                } else if (view === 'engineers') {
                    return [`"${item.name}"`, `"${item.role || 'Engineer'}"`, item.projectCount, item.totalHours.toFixed(2), item.weeklyPayment.toFixed(2)];
                } else {
                    return [`"${item.name}"`, item.totalWorkHours, item.totalBreakHours, item.expectedWeeklyHours];
                }
            }).map(row => row.join(','))
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
                            onClick={() => setView('timeclock')}
                            className={clsx(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3",
                                view === 'timeclock' ? "bg-white text-black shadow-xl" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Clock className="w-4 h-4" />
                            Timeclock
                        </button>
                    </div>

                    <button
                        onClick={() => exportCSV(view === 'projects' ? projectStats : view === 'engineers' ? engineerStats : timeclockStats, view)}
                        className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-3.5 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 font-bold uppercase tracking-widest text-[10px]"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Intelligence</span>
                    </button>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-orange-600/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                <BarChart2 className="w-6 h-6 text-orange-400" />
                            </div>
                            {view === 'timeclock' ? 'Timeclock Analytics' : 'Performance Calibration'}
                        </h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-14">
                            {view === 'timeclock' ? 'Visualizing Work vs Break Duration' : 'Visualizing Resource Distribution'}
                        </p>
                    </div>
                </div>

                <div className="h-[400px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        {view === 'timeclock' ? (
                            <BarChart layout="vertical" data={timeclockStats} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff05" />
                                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
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
                                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{value}</span>} />
                                <Bar dataKey="totalWorkHours" name="Work Hours" fill="#10b981" radius={[0, 10, 10, 0]} maxBarSize={40} />
                                <Bar dataKey="totalBreakHours" name="Break Hours" fill="#f59e0b" radius={[0, 10, 10, 0]} maxBarSize={40} />
                            </BarChart>
                        ) : (
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
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* DATA CARDS/TABLE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {(view === 'projects' ? projectStats : view === 'engineers' ? engineerStats : timeclockStats).map((stat, idx) => (
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
                                    {view === 'projects' ? <LayoutGrid className="w-8 h-8 text-slate-500 group-hover:text-orange-400" /> : view === 'engineers' ? <Users className="w-8 h-8 text-slate-500 group-hover:text-orange-400" /> : <Clock className="w-8 h-8 text-slate-500 group-hover:text-orange-400" />}
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
                                        {view === 'projects' ? 'Project' : view === 'engineers' ? ((stat as any).role || 'Operative') : 'Time Tracking'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-6 border-y border-white/5">
                                    {view === 'timeclock' ? (
                                        <>
                                            <div>
                                                <div className="text-2xl font-black text-emerald-400">
                                                    {(stat as any).totalWorkHours.toFixed(1)}
                                                    <span className="text-[10px] ml-1 text-slate-600">H</span>
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Work</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-black text-amber-400">
                                                    {(stat as any).totalBreakHours.toFixed(1)}
                                                    <span className="text-[10px] ml-1 text-slate-600">H</span>
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Break</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="text-2xl font-black text-white">
                                                    {(stat as any).totalHours.toFixed(1)}
                                                    <span className="text-[10px] ml-1 text-slate-600">H</span>
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Total Hours</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-black text-white">
                                                    {view === 'projects' ? (stat as any).cost.toLocaleString() : (stat as any).projectCount}
                                                    <span className="text-[10px] ml-1 text-slate-600">{view === 'projects' ? 'AED' : 'VNT'}</span>
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{view === 'projects' ? 'Est. Cost' : 'Active Ventures'}</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    <Calendar className="w-3.5 h-3.5 mr-2 text-orange-500" />
                                    {view === 'projects'
                                        ? `Audit: ${(stat as any).lastActivity ? (stat as any).lastActivity.toLocaleDateString() : 'Baseline'}`
                                        : view === 'engineers'
                                            ? `Payout: ${(stat as any).weeklyPayment.toLocaleString()} AED`
                                            : `Discrepancy: ${((stat as any).totalWorkHours - (stat as any).expectedWeeklyHours).toFixed(1)}H`}
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Hidden Invoice Wrapper */}
            {generatingInvoiceFor && (
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
            )}
        </motion.div>
    );
};
