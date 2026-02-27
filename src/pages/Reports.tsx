
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LayoutGrid, Users, Download, BarChart2, Calendar, FileText, ChevronRight, Clock, Activity, Shield, ChevronLeft, Filter } from 'lucide-react';
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
        const end = new Date(2026, 2, 19);   // 2 = March
        return date >= start && date <= end;
    }
    return false; // Add logic for other years if needed
};

// Helper to calculate expected daily hours based on location, day of week, and Ramadan
const getExpectedDailyHours = (date: Date, location: 'Abu Dhabi' | 'Cairo' | undefined) => {
    const dayOfWeek = date.getDay(); // 0 is Sunday, 5 is Friday
    const isFriday = dayOfWeek === 5;
    const isWeekend_AD = dayOfWeek === 6 || dayOfWeek === 0; // Saturday, Sunday
    const isWeekend_Cairo = dayOfWeek === 5 || dayOfWeek === 6; // Friday, Saturday

    const inRamadan = isRamadan(date);

    if (location === 'Abu Dhabi') {
        if (isWeekend_AD) return 0;
        if (inRamadan) {
            // Ramadan: 9:30 AM to 3:30 PM (6 hours)
            // Exception: Friday break 12:30 PM to 2:00 PM (1.5 hours break) => 4.5 hours
            return isFriday ? 4.5 : 6;
        } else {
            // Normal: 8:00 AM to 4:00 PM
            return 8;
        }
    } else {
        // Cairo (or default)
        if (isWeekend_Cairo) return 0;
        if (inRamadan) {
            // Ramadan: 9:00 AM to 3:00 PM (6 hours)
            return 6;
        } else {
            // Normal: 8:00 AM to 4:00 PM
            return 8;
        }
    }
};

const getExpectedWeeklyHours = (date: Date, location: 'Abu Dhabi' | 'Cairo' | undefined) => {
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
    const { projects, engineers, entries, attendance, timeEntries, appUsageLogs, auditLogs } = useData();
    const [view, setView] = useState<'projects' | 'engineers' | 'timeclock' | 'activity' | 'audit'>('projects');
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

    const getTimeclockMs = (f_entries: any[], filterFn?: (te: any) => boolean) => {
        let workMs = 0;
        let breakMs = 0;
        const filtered = filterFn ? f_entries.filter(filterFn) : f_entries;
        filtered.forEach(te => {
            const start = new Date(te.startTime).getTime();
            const end = te.endTime ? new Date(te.endTime).getTime() : new Date().getTime();
            if (te.entryType === 'work') workMs += (end - start);
            else if (te.entryType === 'break') breakMs += (end - start);
        });
        return Math.max(0, workMs - breakMs);
    };

    // Calculate Engineer Stats
    const engineerStats = engineers.map(engineer => {
        const engineerEntries = entries.filter(e => e.engineerId === engineer.id);
        const engineerTimeclock = timeEntries.filter(te => te.engineerId === engineer.id);

        const tcTotalMs = getTimeclockMs(engineerTimeclock);
        const totalHours = engineerEntries.reduce((sum, e) => sum + e.timeSpent, 0) + (tcTotalMs / 3600000);
        const projectCount = new Set(engineerEntries.map(e => e.projectId)).size;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const tcWeeklyMs = getTimeclockMs(engineerTimeclock, te => new Date(te.startTime) >= oneWeekAgo);

        const weeklyHours = engineerEntries
            .filter(e => new Date(e.date) >= oneWeekAgo)
            .reduce((sum, e) => sum + e.timeSpent, 0) + (tcWeeklyMs / 3600000);

        const weeklyAbsences = attendance.filter(a =>
            a.engineerId === engineer.id &&
            a.status === 'Absent' &&
            new Date(a.date) >= oneWeekAgo
        ).length;

        const hourlyRate = engineer.hourlyRate || 0;

        // Use dynamic weekly goal based on location and date (Ramadan) 
        // fallback to engineer.weeklyGoalHours if location is missing or explicitly overridden
        const calculatedWeeklyGoal = engineer.location ? getExpectedWeeklyHours(now, engineer.location) : (engineer.weeklyGoalHours || 40);
        const weeklyGoal = calculatedWeeklyGoal;

        // Auto-calculated overtime (smart overtime without intervening)
        const weeklyOvertime = Math.max(0, weeklyHours - weeklyGoal);
        const overtimePayment = weeklyOvertime * hourlyRate; // Or * 1.5 for OT standard

        const expectedPayment = (weeklyGoal * hourlyRate) + overtimePayment;
        const deduction = weeklyAbsences * 8 * hourlyRate;
        const weeklyPayment = Math.max(0, expectedPayment - deduction);

        return { ...engineer, totalHours, projectCount, weeklyHours, weeklyOvertime, weeklyAbsences, weeklyPayment };
    });

    // Calculate Timeclock Stats (All-Time Aggregate for Chart)
    const timeclockStats = engineers.map(engineer => {
        const engEntries = timeEntries.filter(e => e.engineerId === engineer.id);
        let totalWorkMs = 0;
        let totalBreakMs = 0;

        engEntries.forEach(te => {
            const start = new Date(te.startTime).getTime();
            // If currently clocked in, calculate until NOW, but only up to 24 hours to avoid huge outliers
            let end = te.endTime ? new Date(te.endTime).getTime() : new Date().getTime();

            // Safety clamp: if duration is somehow more than 24 hours (e.g. forgot to clock out), clamp to 12 hours
            if ((end - start) > 24 * 3600000) {
                end = start + (12 * 3600000);
            }

            const duration = Math.max(0, end - start);

            if (te.entryType === 'work') {
                totalWorkMs += duration;
            } else if (te.entryType === 'break') {
                totalBreakMs += duration;
            }
        });

        // 'work' entries from the tracker are already paused during breaks, 
        // DO NOT subtract break time from work time.
        return {
            id: engineer.id,
            name: engineer.name,
            totalWorkHours: parseFloat((totalWorkMs / 3600000).toFixed(2)),
            totalBreakHours: parseFloat((totalBreakMs / 3600000).toFixed(2)),
            expectedWeeklyHours: engineer.weeklyGoalHours || 40,
        };
    });

    // Daily Timeclock Stats for Table (Enhanced with start/end times, total time, break time)
    const dailyTimeclockStats = React.useMemo(() => {
        const stats: Record<string, any> = {};

        timeEntries.forEach(te => {
            const date = new Date(te.startTime).toISOString().split('T')[0];
            const eng = engineers.find(e => e.id === te.engineerId);
            if (!eng) return;

            const key = `${eng.id}_${date}`;
            if (!stats[key]) {
                const expectedToday = getExpectedDailyHours(new Date(date), eng.location);
                stats[key] = {
                    id: eng.id, name: eng.name, location: eng.location || 'HQ', date,
                    workMs: 0, breakMs: 0, expectedHours: expectedToday,
                    firstClockIn: null as string | null,
                    lastClockOut: null as string | null,
                };
            }

            const rawStart = new Date(te.startTime).getTime();
            let rawEnd = te.endTime ? new Date(te.endTime).getTime() : new Date().getTime();

            // Safety clamp: if duration is somehow more than 24 hours (e.g. forgot to clock out), clamp to 12 hours
            if ((rawEnd - rawStart) > 24 * 3600000) {
                rawEnd = rawStart + (12 * 3600000);
            }

            // Track first clock-in and last clock-out (across all entry types)
            if (!stats[key].firstClockIn || te.startTime < stats[key].firstClockIn) {
                stats[key].firstClockIn = te.startTime;
            }
            const endStr = new Date(rawEnd).toISOString();
            if (!stats[key].lastClockOut || endStr > stats[key].lastClockOut) {
                stats[key].lastClockOut = endStr;
            }

            // Clamp to the specific day
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const start = Math.max(rawStart, dayStart.getTime());
            const end = Math.min(rawEnd, dayEnd.getTime());
            const duration = Math.max(0, end - start);

            if (duration > 0) {
                if (te.entryType === 'work') stats[key].workMs += duration;
                else if (te.entryType === 'break') stats[key].breakMs += duration;
            }
        });

        return Object.values(stats).map(s => {
            // 'work' entries from the tracker are already paused during breaks, 
            // DO NOT subtract break time from work time.
            const totalWorkHours = parseFloat((s.workMs / 3600000).toFixed(2));
            const totalBreakHours = parseFloat((s.breakMs / 3600000).toFixed(2));
            const dailyOvertime = Math.max(0, totalWorkHours - s.expectedHours);

            // Total time = first clock-in to last clock-out
            let totalTimeMs = 0;
            if (s.firstClockIn && s.lastClockOut) {
                totalTimeMs = new Date(s.lastClockOut).getTime() - new Date(s.firstClockIn).getTime();
            }
            const totalTimeHours = parseFloat((totalTimeMs / 3600000).toFixed(2));

            const formatTime = (iso: string | null) => {
                if (!iso) return '-';
                return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };

            return {
                ...s,
                totalWorkHours,
                totalBreakHours,
                totalTimeHours,
                dailyOvertime: parseFloat(dailyOvertime.toFixed(2)),
                firstClockInFormatted: formatTime(s.firstClockIn),
                lastClockOutFormatted: formatTime(s.lastClockOut),
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [timeEntries, engineers]);

    // App Usage Daily Stats
    const dailyActivityStats = React.useMemo(() => {
        const stats: any[] = [];
        appUsageLogs.forEach(log => {
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
    }, [appUsageLogs, engineers]);

    const exportCSV = (data: any[], fileName: string) => {
        let headers: string[] = [];
        let exportData: any[] = data;

        if (view === 'projects') {
            headers = ['Project Name', 'Total Hours', 'Total Cost (AED)', 'Engineers', 'Last Activity'];
        } else if (view === 'engineers') {
            headers = ['Engineer Name', 'Role', 'Projects', 'Location', 'Weekly Goal (Hrs)', 'Weekly Hours', 'Weekly Overtime', 'Weekly Payment (AED)'];
        } else if (view === 'timeclock') {
            headers = ['Date', 'Engineer Name', 'Location', 'Expected Hours', 'Work Hours', 'Break Hours', 'Overtime'];
            exportData = dailyTimeclockStats;
        } else if (view === 'activity') {
            headers = ['Date', 'Time', 'Engineer Name', 'Active Window', 'Duration (Seconds)'];
            exportData = dailyActivityStats;
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
                } else if (view === 'timeclock') {
                    return [item.date, `"${item.name}"`, `"${item.location || 'HQ'}"`, item.expectedHours, item.totalWorkHours, item.totalBreakHours, item.dailyOvertime];
                } else if (view === 'activity') {
                    return [item.date, item.timestamp, `"${item.engineerName}"`, `"${item.activeWindow.replace(/"/g, '""')}"`, item.durationSeconds];
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
                            onClick={() => setView('timeclock')}
                            className={clsx(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3",
                                view === 'timeclock' ? "bg-white text-black shadow-xl" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Clock className="w-4 h-4" />
                            Timeclock
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
                    </div>

                    <button
                        onClick={() => exportCSV(view === 'projects' ? projectStats : view === 'engineers' ? engineerStats : view === 'timeclock' ? timeclockStats : dailyActivityStats, view)}
                        className="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-3.5 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 font-bold uppercase tracking-widest text-[10px]"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Intelligence</span>
                    </button>
                </div>
            </div>

            {/* CHARTS SECTION */}
            {view !== 'activity' && view !== 'audit' && (
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
            )}

            {/* DATA CARDS/TABLE */}
            {view === 'timeclock' ? (() => {
                // Apply filters
                const filtered = dailyTimeclockStats
                    .filter(s => !filterEngineer || s.id === filterEngineer)
                    .filter(s => !filterFrom || s.date >= filterFrom)
                    .filter(s => !filterTo || s.date <= filterTo);
                const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

                return (
                    <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl p-8 mt-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                                <Clock className="w-5 h-5 text-orange-500" />
                                Daily Timeclock Summary
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                                <Filter className="w-4 h-4 text-slate-600" />
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
                                <div className="px-3 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5">
                                    {filtered.length} Records
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <th className="py-4 font-bold text-left px-3">Date</th>
                                        <th className="py-4 font-bold text-left px-3">Engineer</th>
                                        <th className="py-4 font-bold text-left px-3">Location</th>
                                        <th className="py-4 font-bold text-left px-3">First In</th>
                                        <th className="py-4 font-bold text-left px-3">Last Out</th>
                                        <th className="py-4 font-bold text-left px-3">Total Time</th>
                                        <th className="py-4 font-bold text-left px-3">Effective</th>
                                        <th className="py-4 font-bold text-left px-3">Break</th>
                                        <th className="py-4 font-bold text-left px-3">Expected</th>
                                        <th className="py-4 font-bold text-left px-3">Overtime</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm text-slate-300 font-medium whitespace-nowrap">
                                    {paged.map((stat) => (
                                        <tr key={`${stat.id}_${stat.date}`} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 px-3 font-bold text-white">{stat.date}</td>
                                            <td className="py-4 px-3 font-bold text-white">{stat.name}</td>
                                            <td className="py-4 px-3 text-slate-400">{stat.location}</td>
                                            <td className="py-4 px-3 text-sky-400 font-mono">{stat.firstClockInFormatted}</td>
                                            <td className="py-4 px-3 text-purple-400 font-mono">{stat.lastClockOutFormatted}</td>
                                            <td className="py-4 px-3 text-white font-black">{stat.totalTimeHours} h</td>
                                            <td className="py-4 px-3 text-emerald-400 font-black">{stat.totalWorkHours} h</td>
                                            <td className="py-4 px-3 text-amber-400">{stat.totalBreakHours} h</td>
                                            <td className="py-4 px-3 text-slate-400">{stat.expectedHours} h</td>
                                            <td className="py-4 px-3 text-orange-400 font-black">{stat.dailyOvertime > 0 ? `+${stat.dailyOvertime} h` : '-'}</td>
                                        </tr>
                                    ))}
                                    {paged.length === 0 && (
                                        <tr><td colSpan={10} className="py-8 text-center text-slate-500 font-medium italic">No timeclock records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all border border-white/5">
                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                </button>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Page {page} of {totalPages}
                                </span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all border border-white/5">
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })() : view === 'audit' ? (() => {
                const filteredAudit = auditLogs
                    .filter(a => !filterFrom || (a.createdAt && a.createdAt >= filterFrom))
                    .filter(a => !filterTo || (a.createdAt && a.createdAt <= filterTo + 'T23:59:59'));
                const totalPages = Math.max(1, Math.ceil(filteredAudit.length / PAGE_SIZE));
                const paged = filteredAudit.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

                return (
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
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
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
                                    {paged.map((log) => {
                                        const eng = engineers.find(e => e.id === log.userId);
                                        return (
                                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-3 text-white font-mono text-xs whitespace-nowrap">
                                                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                                                </td>
                                                <td className="py-4 px-3 font-bold text-white">{eng?.name || log.userId.slice(0, 8)}</td>
                                                <td className="py-4 px-3">
                                                    <span className={clsx(
                                                        "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                                        log.action === 'created' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                            log.action === 'updated' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                                    )}>{log.action}</span>
                                                </td>
                                                <td className="py-4 px-3 text-slate-400 uppercase text-xs">{log.tableName}</td>
                                                <td className="py-4 px-3 text-slate-600 font-mono text-xs">{log.recordId.slice(0, 8)}...</td>
                                                <td className="py-4 px-3 text-indigo-400 text-xs max-w-[250px] truncate" title={JSON.stringify(log.changes)}>
                                                    {Object.keys(log.changes).length > 0 ? JSON.stringify(log.changes).slice(0, 60) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {paged.length === 0 && (
                                        <tr><td colSpan={6} className="py-8 text-center text-slate-500 font-medium italic">No audit records yet. Actions will appear here after CRUD operations.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all border border-white/5">
                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                </button>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all border border-white/5">
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })() : view === 'activity' ? (
                <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl p-8 mt-8">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3 mb-6">
                        <Activity className="w-5 h-5 text-orange-500" />
                        APPLICATION ACTIVITY TIMELINE (ADMIN VIEW)
                    </h3>
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
            )}

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
