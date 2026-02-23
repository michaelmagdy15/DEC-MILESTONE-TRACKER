import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, FileText, Check, X, AlertCircle } from 'lucide-react';
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
    const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start week on Monday
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
            await updateAttendance({
                ...existingRecord,
                status
            });
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
            await updateLeaveRequest({
                ...request,
                status
            });
        }
    };

    const myLeaveRequests = leaveRequests.filter(r => r.engineerId === currentEngineerId);
    const allLeaveRequests = leaveRequests; // Admin sees all

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                    Attendance & Leave
                </h2>

                <div className="bg-slate-100 p-1 rounded-xl inline-flex w-full md:w-auto overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            activeTab === 'attendance' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Daily Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('leave')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            activeTab === 'leave' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Leave Management
                    </button>
                </div>
            </div>

            {activeTab === 'attendance' && (
                <>
                    <div className="flex items-center justify-end gap-2">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                            <input
                                type="date"
                                value={format(selectedDate, 'yyyy-MM-dd')}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                className="outline-none text-slate-700 bg-transparent cursor-pointer font-medium"
                            />
                        </div>
                    </div>

                    {/* Week Selector */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between overflow-x-auto gap-2 scrollbar-hide">
                        {weekDays.map(date => {
                            const isSelected = isSameDay(date, selectedDate);
                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => setSelectedDate(date)}
                                    className={clsx(
                                        "flex flex-col items-center justify-center p-3 rounded-xl min-w-[4rem] transition-all",
                                        isSelected
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105"
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    )}
                                >
                                    <span className="text-xs font-semibold uppercase opacity-80 mb-1">{format(date, 'EEE')}</span>
                                    <span className="text-xl font-bold">{format(date, 'd')}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Engineers List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Engineer</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {engineers.map(engineer => {
                                    const record = getAttendanceStatus(engineer.id, selectedDate);

                                    return (
                                        <tr key={engineer.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                        {engineer.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{engineer.name || 'Unknown Engineer'}</div>
                                                        <div className="text-xs text-slate-500">{engineer.role || 'Engineer'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {record ? (
                                                    <span className={clsx(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                                                        record.status === 'Present' && "bg-emerald-100 text-emerald-700 border border-emerald-200",
                                                        record.status === 'Absent' && "bg-red-100 text-red-700 border border-red-200",
                                                        record.status === 'Half-Day' && "bg-yellow-100 text-yellow-700 border border-yellow-200",
                                                    )}>
                                                        {record.status === 'Present' && <CheckCircle2 className="w-4 h-4" />}
                                                        {record.status === 'Absent' && <XCircle className="w-4 h-4" />}
                                                        {record.status === 'Half-Day' && <Clock className="w-4 h-4" />}
                                                        {record.status}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-sm italic">Not marked</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                {(role === 'admin' || currentEngineerId === engineer.id) ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStatusChange(engineer.id, 'Present')}
                                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all"
                                                        >
                                                            Present
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(engineer.id, 'Half-Day')}
                                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-200 border border-transparent transition-all"
                                                        >
                                                            Half-Day
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(engineer.id, 'Absent')}
                                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition-all"
                                                        >
                                                            Absent
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'leave' && (
                <div className="space-y-6">
                    {/* Engineer Leave Request Form */}
                    {role !== 'admin' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800">My Leave Requests</h3>
                                <button
                                    onClick={() => setShowLeaveForm(!showLeaveForm)}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {showLeaveForm ? 'Cancel' : 'New Request'}
                                </button>
                            </div>

                            {showLeaveForm && (
                                <form onSubmit={handleLeaveSubmit} className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={leaveStartDate}
                                                onChange={(e) => setLeaveStartDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={leaveEndDate}
                                                onChange={(e) => setLeaveEndDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                                        <textarea
                                            required
                                            value={leaveReason}
                                            onChange={(e) => setLeaveReason(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Briefly explain the reason for your leave..."
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Submit Request
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* My Leaves List for Engineer */}
                            <div className="space-y-4">
                                {myLeaveRequests.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-4">You have no leave requests.</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {myLeaveRequests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map(request => (
                                            <div key={request.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FileText className="w-4 h-4 text-slate-400" />
                                                        <span className="font-semibold text-slate-800">
                                                            {format(new Date(request.startDate), 'MMM d, yyyy')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{request.reason}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className={clsx(
                                                        "px-3 py-1 text-xs font-medium rounded-full",
                                                        request.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                                                            request.status === 'rejected' ? "bg-red-100 text-red-700" :
                                                                "bg-yellow-100 text-yellow-700"
                                                    )}>
                                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Admin Leave Approval View */}
                    {role === 'admin' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800">Leave Requests</h3>
                            </div>

                            {allLeaveRequests.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                                    <p className="text-slate-500 font-medium">No leave requests found.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Engineer</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Dates</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Reason</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-center">Status</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {allLeaveRequests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map(request => {
                                            const eng = engineers.find(e => e.id === request.engineerId);
                                            return (
                                                <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                                {eng?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <span className="font-medium text-slate-900">{eng?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-slate-800 whitespace-nowrap">
                                                            {format(new Date(request.startDate), 'MMM d, yyyy')}
                                                        </div>
                                                        <div className="text-xs text-slate-500 whitespace-nowrap">
                                                            to {format(new Date(request.endDate), 'MMM d, yyyy')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                                        {request.reason}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={clsx(
                                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                            request.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                                                                request.status === 'rejected' ? "bg-red-100 text-red-700" :
                                                                    "bg-yellow-100 text-yellow-700"
                                                        )}>
                                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {request.status === 'pending' && (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleLeaveAction(request.id, 'approved')}
                                                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <Check className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleLeaveAction(request.id, 'rejected')}
                                                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                                    title="Reject"
                                                                >
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};
