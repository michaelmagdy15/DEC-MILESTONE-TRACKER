import { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Project, LogEntry } from '../types';

interface InvoiceTemplateProps {
    project: Project;
    entries: LogEntry[];
    totalHours: number;
    totalCost: number;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
    ({ project, entries, totalHours, totalCost }, ref) => {
        const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return (
            <div ref={ref} className="bg-white text-slate-900 w-[800px] font-sans p-12 box-border">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-orange-600 mb-2">INVOICE</h1>
                        <p className="text-slate-500 font-medium">Ref: {project.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-slate-500 font-medium">Date: {format(new Date(), 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-slate-800">DEC Engineering</h2>
                        <p className="text-slate-500 mt-1">123 Corporate Ave, Suite 400</p>
                        <p className="text-slate-500">Dubai, United Arab Emirates</p>
                        <p className="text-slate-500">contact@deceng.com</p>
                    </div>
                </div>

                {/* Billed To */}
                <div className="mb-10">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Billed To</h3>
                    <p className="text-xl font-semibold text-slate-800">{project.name}</p>
                    <p className="text-slate-500 mt-1">Client Contact / Representative</p>
                    <p className="text-slate-500">Address Placeholder</p>
                </div>

                {/* Services summary */}
                <div className="mb-12">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Services Rendered</h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-800 text-slate-800">
                                <th className="py-3 font-semibold w-2/3">Description</th>
                                <th className="py-3 font-semibold text-center w-1/6">Hours</th>
                                <th className="py-3 font-semibold text-right w-1/6">Amount (AED)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedEntries.slice(0, 15).map((entry, idx) => (
                                <tr key={idx} className="text-slate-600">
                                    <td className="py-4">
                                        <p className="font-medium text-slate-800">{entry.taskDescription}</p>
                                        <p className="text-sm mt-1 text-slate-500">{format(new Date(entry.date), 'MMM d, yyyy')}</p>
                                    </td>
                                    <td className="py-4 text-center">{entry.timeSpent.toFixed(1)}</td>
                                    <td className="py-4 text-right">{(entry.timeSpent * (project.hourlyRate || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                            {sortedEntries.length > 15 && (
                                <tr className="text-slate-600">
                                    <td className="py-4 italic">...and {sortedEntries.length - 15} more entries.</td>
                                    <td className="py-4 text-center">-</td>
                                    <td className="py-4 text-right">-</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-16">
                    <div className="w-1/2">
                        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                            <span>Subtotal (Hours)</span>
                            <span>{totalHours.toFixed(1)} hrs</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                            <span>Rate (AED/hr)</span>
                            <span>{project.hourlyRate?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between py-4 text-xl font-bold text-slate-900 border-t-2 border-slate-800 mt-2">
                            <span>Total Due</span>
                            <span>{totalCost.toFixed(2)} AED</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-slate-500 text-sm mt-auto pt-8 border-t border-slate-100">
                    <p className="font-medium mb-1">Thank you for your business!</p>
                    <p>Payment is due within 30 days. Please include the invoice reference number on your check.</p>
                </div>
            </div>
        );
    }
);
