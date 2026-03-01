import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import type { LogEntry, Milestone } from '../types';

interface RiskIndicatorProps {
    milestone: Milestone;
    entries: LogEntry[];
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ milestone, entries }) => {
    const milestoneEntries = entries.filter(e => e.milestone === milestone.name);
    const revisions = milestoneEntries.filter(e => e.entryType === 'revision').length;
    const rfis = milestoneEntries.filter(e => e.entryType === 'rfi').length;

    // Risk Calculation logic
    // Low risk: < 2 revisions
    // Med risk: 2-4 revisions
    // High risk: > 4 revisions
    const riskScore = revisions + (rfis * 0.5);

    let status: 'low' | 'medium' | 'high' = 'low';
    if (riskScore > 4) status = 'high';
    else if (riskScore > 2) status = 'medium';

    const config = {
        low: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Stable' },
        medium: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'At Risk' },
        high: { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Critical' }
    };

    const { icon: Icon, color, bg, label } = config[status];

    return (
        <div className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5", bg)}>
            <Icon className={clsx("w-3.5 h-3.5", color)} />
            <div className="text-left">
                <p className={clsx("text-[10px] font-black uppercase tracking-widest", color)}>{label}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase">{revisions} Revisions Identified</p>
            </div>
        </div>
    );
};
