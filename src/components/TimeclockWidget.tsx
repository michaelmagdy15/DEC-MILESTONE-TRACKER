import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Play, Square, Coffee, Clock } from 'lucide-react';

export const TimeclockWidget: React.FC = () => {
    const { role, engineerId } = useAuth();
    const { timeEntries, addTimeEntry, updateTimeEntry } = useData();

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Only Engineers use the timeclock
    if (role !== 'engineer' || !engineerId) return null;

    // Filter today's entries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEntries = timeEntries.filter(te => {
        if (te.engineerId !== engineerId) return false;
        const entryDate = new Date(te.startTime);
        return entryDate >= startOfToday;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Work Entry
    const activeWorkEntry = todayEntries.find(te => te.entryType === 'work' && !te.endTime);
    // Break Entry
    const activeBreakEntry = todayEntries.find(te => te.entryType === 'break' && !te.endTime);

    const handleClockIn = async () => {
        if (activeWorkEntry) return; // already clocked in
        await addTimeEntry({
            id: crypto.randomUUID(),
            engineerId,
            entryType: 'work',
            startTime: new Date().toISOString(),
        });
    };

    const handleClockOut = async () => {
        if (!activeWorkEntry) return;
        const now = new Date().toISOString();
        // End break first if active
        if (activeBreakEntry) {
            await updateTimeEntry({ ...activeBreakEntry, endTime: now });
        }
        // Clock out — this sends to Supabase and re-fetches
        await updateTimeEntry({ ...activeWorkEntry, endTime: now });
    };

    const handleStartBreak = async () => {
        if (!activeWorkEntry || activeBreakEntry) return;
        await addTimeEntry({
            id: crypto.randomUUID(),
            engineerId,
            entryType: 'break',
            startTime: new Date().toISOString(),
        });
    };

    const handleEndBreak = async () => {
        if (!activeBreakEntry) return;
        await updateTimeEntry({ ...activeBreakEntry, endTime: new Date().toISOString() });
    };

    // Calculate total worked time for today
    let totalWorkedMs = 0;
    let totalBreakMs = 0;

    todayEntries.forEach(te => {
        const start = new Date(te.startTime).getTime();
        const end = te.endTime ? new Date(te.endTime).getTime() : currentTime.getTime();
        const duration = end - start;

        if (te.entryType === 'work') {
            totalWorkedMs += duration;
        } else if (te.entryType === 'break') {
            totalBreakMs += duration;
        }
    });

    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Adjusted active work duration (total work ms minus total break ms)
    const activeWorkDuration = Math.max(0, totalWorkedMs - totalBreakMs);

    return (
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500 opacity-50"></div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-black text-sm tracking-tight">Timeclock</span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Worked Today</div>
                    <div className="text-sm font-black text-white">{formatDuration(activeWorkDuration)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {!activeWorkEntry ? (
                        <button
                            onClick={handleClockIn}
                            className="col-span-2 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-3 rounded-xl transition-all border border-emerald-500/20 font-bold uppercase tracking-widest text-[10px]"
                        >
                            <Play className="w-3.5 h-3.5" /> Clock In
                        </button>
                    ) : (
                        <>
                            {!activeBreakEntry ? (
                                <button
                                    onClick={handleStartBreak}
                                    className="flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 p-3 rounded-xl transition-all border border-amber-500/20 font-bold uppercase tracking-widest text-[10px]"
                                >
                                    <Coffee className="w-3.5 h-3.5" /> Break
                                </button>
                            ) : (
                                <button
                                    onClick={handleEndBreak}
                                    className="flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-emerald-500/20 text-emerald-400 p-3 rounded-xl transition-all border border-amber-500/20 font-bold uppercase tracking-widest text-[10px]"
                                >
                                    <Play className="w-3.5 h-3.5" /> Resume
                                </button>
                            )}

                            <button
                                onClick={handleClockOut}
                                className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-xl transition-all border border-red-500/20 font-bold uppercase tracking-widest text-[10px]"
                            >
                                <Square className="w-3.5 h-3.5" /> Clock Out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
