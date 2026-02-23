import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, FolderKanban, Activity, Briefcase, ChevronRight, Award, Plus, ChevronLeft, UserCheck, X, AlertCircle, FileText, Check } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Attendance = () => {
    const { engineers, attendance, addAttendance, updateAttendance, leaveRequests, addLeaveRequest, updateLeaveRequest } = useData();
    const { role, engineerId: currentEngineerId } = useAuth();
    const [activeTab, setActiveTab] = useState<'attendance' | 'leave'>('attendance');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Leave Request Form State
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [leaveStartDate, setLeaveStartDate] = useState('');
    const [leaveEndDate, setLeaveEndDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');

    // Generate days for the current selected week
    const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    const getAttendanceStatus = (engineerId: string, date: Date) => {
        return attendance.find(a =>
            a.engineerId === engineerId &&
            a.date === format(date, 'yyyy-MM-dd')
        );
    };

    const handleStatusChange = async (engineerId: string, status: 'Present' | 'Absent' | 'Half-Day') => {
        const existingRecord = getAttendanceStatus(engineerId, selectedDate);
        if (existingRecord) {
            await updateAttendance({ ...existingRecord, status });
        } else {
            await addAttendance({
                id: crypto.randomUUID(),
                engineerId,
                date: format(selectedDate, 'yyyy-MM-dd'),
                status
            });
        }
    };

    const handleLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentEngineerId) return;
        await addLeaveRequest({
            id: crypto.randomUUID(),
            engineerId: currentEngineerId,
            startDate: leaveStartDate,
            endDate: leaveEndDate,
            reason: leaveReason,
            status: 'pending'
        });
        setShowLeaveForm(false);
        setLeaveStartDate('');
        setLeaveEndDate('');
        setLeaveReason('');
    };

    const handleLeaveAction = async (requestId: string, status: 'approved' | 'rejected') => {
        const request = leaveRequests.find(r => r.id === requestId);
        if (request) {
            await updateLeaveRequest({ ...request, status });
        }
    };

    const myLeaveRequests = leaveRequests.filter(r => r.engineerId === currentEngineerId);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
                        Operational <span className="text-indigo-400">Presence</span>
                    </h2>
                    <div className="h-1 w-20 bg-indigo-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Tracking operative availability and mission readiness.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white/5 p-1.5 rounded-2xl border border-white/5 flex backdrop-blur-3xl">
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={clsx(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3",
                                activeTab === 'attendance' ? "bg-white text-black shadow-xl" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <UserCheck className="w-4 h-4" />
                            Attendance
                        </button>
                        <button
                            onClick={() => setActiveTab('leave')}
                            className={clsx(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3",
                                activeTab === 'leave' ? "bg-white text-black shadow-xl" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Leave Bank
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'attendance' && (
                <div className="space-y-8">
                    {/* Week Selector */}
                    <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-600/10 transition-colors"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                        <CalendarIcon className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    Timeline Navigation
                                </h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-14">Synchronizing Operative Logs</p>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-2 flex items-center gap-4">
                                <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-2 text-slate-500 hover:text-white transition-all"><ChevronLeft className="w-5 h-5" /></button>
                                <input
                                    type="date"
                                    value={format(selectedDate, 'yyyy-MM-dd')}
                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                    className="bg-transparent text-white font-black uppercase tracking-widest text-[10px] focus:outline-none cursor-pointer"
                                />
                                <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 text-slate-500 hover:text-white transition-all"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="flex justify-between gap-4 overflow-x-auto pb-4 scrollbar-hide relative z-10">
                            {weekDays.map(date => {
                                const isSelected = isSameDay(date, selectedDate);
                                return (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => setSelectedDate(date)}
                                        className={clsx(
                                            "flex flex-col items-center justify-center p-6 rounded-[28px] min-w-[100px] transition-all duration-300 border",
                                            isSelected
                                                ? "bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-600/40 scale-105"
                                                : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
                                        )}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-60">{format(date, 'EEE')}</span>
                                        <span className="text-3xl font-black">{format(date, 'd')}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Attendance Logs */}
                    <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/0">
                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Presence Registry</h3>
                            <div className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5">
                                {format(selectedDate, 'MMMM d, yyyy')}
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {engineers.map((engineer, idx) => {
                                const record = getAttendanceStatus(engineer.id, selectedDate);
                                return (
                                    <motion.div
                                        key={engineer.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-8 hover:bg-white/[0.02] transition-colors group relative overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all duration-500">
                                                    <span className="text-lg font-black text-slate-500 group-hover:text-indigo-400">{engineer.name?.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{engineer.name}</h4>
                                                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">{engineer.role || 'Specialist'}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-6">
                                                {record ? (
                                                    <span className={clsx(
                                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2",
                                                        record.status === 'Present' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                        record.status === 'Absent' && "bg-red-500/10 text-red-500 border-red-500/20",
                                                        record.status === 'Half-Day' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                                    )}>
                                                        {record.status === 'Present' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                        {record.status === 'Absent' && <XCircle className="w-3.5 h-3.5" />}
                                                        {record.status === 'Half-Day' && <Clock className="w-3.5 h-3.5" />}
                                                        {record.status}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Pending Assignment</span>
                                                )}

                                                {(role === 'admin' || currentEngineerId === engineer.id) && (
                                                    <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                                                        <button
                                                            onClick={() => handleStatusChange(engineer.id, 'Present')}
                                                            className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                        >Present</button>
                                                        <button
                                                            onClick={() => handleStatusChange(engineer.id, 'Half-Day')}
                                                            className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
                                                        >Half</button>
                                                        <button
                                                            onClick={() => handleStatusChange(engineer.id, 'Absent')}
                                                            className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                                        >Absent</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'leave' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* LEAVE STATS/FORM */}
                    <div className="xl:col-span-1 space-y-8">
                        {role !== 'admin' && (
                            <div className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full -ml-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase">Leave Request</h3>
                                    <button
                                        onClick={() => setShowLeaveForm(!showLeaveForm)}
                                        className="p-3 bg-white/5 text-slate-500 hover:text-white rounded-xl border border-white/5 transition-all"
                                    >
                                        {showLeaveForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    </button>
                                </div>

                                {showLeaveForm ? (
                                    <form onSubmit={handleLeaveSubmit} className="space-y-6 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mission Stand-down Start</label>
                                            <input
                                                type="date"
                                                required
                                                value={leaveStartDate}
                                                onChange={(e) => setLeaveStartDate(e.target.value)}
                                                className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Duration</label>
                                            <input
                                                type="date"
                                                required
                                                value={leaveEndDate}
                                                onChange={(e) => setLeaveEndDate(e.target.value)}
                                                className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Deployment Reason</label>
                                            <textarea
                                                required
                                                value={leaveReason}
                                                onChange={(e) => setLeaveReason(e.target.value)}
                                                rows={3}
                                                className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium resize-none shadow-inner"
                                                placeholder="State the objective for leave..."
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-4 bg-white text-black hover:bg-indigo-600 hover:text-white rounded-2xl transition-all duration-300 shadow-xl font-black uppercase tracking-widest text-[10px]"
                                        >
                                            Commit Request
                                        </button>
                                    </form>
                                ) : (
                                    <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                                        <AlertCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Awaiting New Intel</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl">
                            <h3 className="text-xl font-black text-white tracking-tight uppercase mb-6">Leave Allocation</h3>
                            <div className="space-y-4">
                                <div className="p-6 bg-white/5 rounded-[24px] border border-white/5">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="text-3xl font-black text-white">24</div>
                                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Annual Balance</div>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[70%]"></div>
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 rounded-[24px] border border-white/5">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="text-3xl font-black text-white">08</div>
                                        <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Sick Leave Used</div>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 w-[20%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LEAVE LOGS/APPROVAL */}
                    <div className="xl:col-span-2">
                        <div className="bg-[#1a1a1a]/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl">
                            <div className="p-8 border-b border-white/5 bg-white/0 flex justify-between items-center">
                                <h3 className="text-xl font-black text-white tracking-tight uppercase">Operational Stand-downs</h3>
                            </div>
                            <div className="divide-y divide-white/5">
                                {leaveRequests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((request, idx) => {
                                    const eng = engineers.find(e => e.id === request.engineerId);
                                    return (
                                        <motion.div
                                            key={request.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="p-8 hover:bg-white/[0.02] transition-colors group relative overflow-hidden"
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                                <div className="flex items-start gap-6 flex-1">
                                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all duration-500 flex-shrink-0">
                                                        <FileText className="w-6 h-6 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                            <h4 className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors uppercase leading-none">
                                                                {eng?.name || 'Unknown Specialist'}
                                                            </h4>
                                                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-500 border border-white/5 uppercase tracking-widest">
                                                                {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-500 font-medium text-sm line-clamp-2 max-w-xl">{request.reason}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 justify-between md:justify-end">
                                                    <span className={clsx(
                                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                                        request.status === 'approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                            request.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    )}>
                                                        {request.status}
                                                    </span>

                                                    {role === 'admin' && request.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleLeaveAction(request.id, 'approved')} className="p-3 bg-white/5 text-emerald-500 hover:bg-emerald-500/10 rounded-xl border border-white/5 transition-all"><Check className="w-5 h-5" /></button>
                                                            <button onClick={() => handleLeaveAction(request.id, 'rejected')} className="p-3 bg-white/5 text-red-500 hover:bg-red-500/10 rounded-xl border border-white/5 transition-all"><X className="w-5 h-5" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {leaveRequests.length === 0 && (
                                    <div className="py-32 text-center">
                                        <AlertCircle className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                                        <h3 className="text-2xl font-black text-white tracking-tight uppercase">No deployment changes</h3>
                                        <p className="text-slate-600 font-medium mt-2">All specialists are current at their assigned posts.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
