import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Attendance = () => {
    const { engineers, attendance, addAttendance, updateAttendance } = useData();
    const { role } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
                    Attendance Tracker
                </h2>

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
                            {(role === 'admin' || role === 'engineer') && (
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Action</th>
                            )}
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
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </motion.div>
    );
};
