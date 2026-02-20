

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DollarSign, LayoutGrid, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export const Reports: React.FC = () => {
    const { projects, engineers, entries, attendance } = useData();
    const [view, setView] = useState<'projects' | 'engineers'>('projects');

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

        // Calculate weekly hours (last 7 days)
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyHours = engineerEntries
            .filter(e => new Date(e.date) >= oneWeekAgo)
            .reduce((sum, e) => sum + e.timeSpent, 0);

        // Calculate weekly absences
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>

                <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                    <button
                        onClick={() => setView('projects')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            view === 'projects' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Projects
                    </button>
                    <button
                        onClick={() => setView('engineers')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            view === 'engineers' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        Engineers & Tracking
                    </button>
                </div>
            </div>

            {view === 'projects' ? (
                <div className="grid grid-cols-1 gap-6">
                    {/* Project Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {projectStats.map(stat => (
                            <div key={stat.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{stat.name}</h3>
                                        <p className="text-sm text-slate-500">
                                            Last active: {stat.lastActivity ? stat.lastActivity.toLocaleDateString() : 'Never'}
                                        </p>
                                    </div>
                                    <div className={clsx(
                                        "p-2 rounded-lg",
                                        stat.hourlyRate ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Time Logged</p>
                                        <p className="text-xl font-bold text-slate-800 flex items-center gap-1">
                                            {stat.totalHours.toFixed(1)} <span className="text-sm font-normal text-slate-500">hrs</span>
                                        </p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3">
                                        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Est. Cost</p>
                                        <p className="text-xl font-bold text-emerald-700">
                                            {stat.cost.toFixed(2)} AED
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-sm">
                                    <div className="flex items-center text-slate-500">
                                        <Users className="w-4 h-4 mr-2" />
                                        {stat.uniqueEngineers} Engineers involved
                                    </div>
                                    {stat.hourlyRate && (
                                        <span className="text-slate-400">Rate: {stat.hourlyRate} AED/hr</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Engineer</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Active Projects</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">This Week (Hrs)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-center">Absences (7d)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Weekly Payout (AED)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {engineerStats.map(stat => (
                                    <tr key={stat.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {stat.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{stat.name}</div>
                                                    <div className="text-xs text-slate-500">{stat.role || 'Engineer'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <LayoutGrid className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-600">{stat.projectCount}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                stat.weeklyHours > 40 ? "bg-red-100 text-red-700" :
                                                    stat.weeklyHours > 30 ? "bg-emerald-100 text-emerald-700" :
                                                        "bg-slate-100 text-slate-600"
                                            )}>
                                                {stat.weeklyHours.toFixed(1)} hrs
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                                <span className={clsx(
                                                    "font-medium text-sm",
                                                    stat.weeklyAbsences > 0 ? "text-red-600" : "text-slate-600"
                                                )}>
                                                    {stat.weeklyAbsences}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-slate-900">{stat.weeklyPayment.toFixed(2)} AED</span>
                                                {stat.weeklyAbsences > 0 && (
                                                    <span className="text-xs text-red-500 font-medium">
                                                        -{((stat.weeklyAbsences * 8) * (stat.hourlyRate || 0)).toFixed(2)} AED deduction
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
