import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DollarSign, FileText, AlertCircle, Building2, TrendingUp, BarChart3, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const Financials: React.FC = () => {
    const { projects, engineers, entries } = useData();

    const financialsData = useMemo(() => {
        return projects.map(project => {
            const projectEntries = entries.filter(e => e.projectId === project.id);

            let totalSpent = 0;
            const expenseBreakdown: Array<{ engineerName: string, role: string, hours: number, rate: number, total: number }> = [];

            // Calculate costs based on time entries and engineer rates
            projectEntries.forEach(entry => {
                const engineer = engineers.find(eng => eng.id === entry.engineerId);
                // Use engineer's rate if available, fallback to project's generic rate, otherwise 0
                const rate = engineer?.hourlyRate || project.hourlyRate || 0;
                const cost = entry.timeSpent * rate;

                totalSpent += cost;

                if (engineer) {
                    const existingEng = expenseBreakdown.find(eb => eb.engineerName === engineer.name);
                    if (existingEng) {
                        existingEng.hours += entry.timeSpent;
                        existingEng.total += cost;
                    } else {
                        expenseBreakdown.push({
                            engineerName: engineer.name,
                            role: engineer.role,
                            hours: entry.timeSpent,
                            rate,
                            total: cost
                        });
                    }
                }
            });

            const budget = project.budget || 0;
            const variance = budget - totalSpent;
            const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;

            return {
                ...project,
                totalSpent,
                budget,
                variance,
                percentUsed,
                expenseBreakdown,
                projectEntries
            };
        });
    }, [projects, engineers, entries]);

    const globalStats = useMemo(() => {
        return financialsData.reduce((acc, curr) => ({
            totalBudget: acc.totalBudget + curr.budget,
            totalSpent: acc.totalSpent + curr.totalSpent,
        }), { totalBudget: 0, totalSpent: 0 });
    }, [financialsData]);

    const generateInvoice = (projectData: typeof financialsData[0]) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(28);
        doc.setTextColor(234, 88, 12); // Orange-600
        doc.text("INVOICE", 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 35);
        doc.text(`Project: ${projectData.name}`, 14, 40);

        if (projectData.budget > 0) {
            doc.text(`Approved Budget: AED ${projectData.budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 45);
        }

        // DEC details
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("DEC Engineering Consultants", 130, 25);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Dubai, UAE", 130, 32);

        // Expense Breakdown Table
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Professional Services Rendering", 14, 60);

        const tableColumn = ["Personnel", "Designation", "Hours", "Rate (AED/hr)", "Subtotal (AED)"];
        const tableRows = projectData.expenseBreakdown.map(eb => [
            eb.engineerName,
            eb.role,
            eb.hours.toString(),
            eb.rate.toLocaleString(),
            eb.total.toLocaleString(undefined, { minimumFractionDigits: 2 })
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            theme: 'striped',
            headStyles: { fillColor: [234, 88, 12] }
        });

        // Totals
        const finalY = (doc as any).lastAutoTable.finalY || 65;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(`Total Amount Due: AED ${projectData.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, finalY + 15);

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Thank you for your business.", 14, doc.internal.pageSize.getHeight() - 20);

        doc.save(`Invoice_${projectData.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
                        Financial <span className="text-emerald-400">Oversight</span>
                    </h2>
                    <div className="h-1 w-20 bg-emerald-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Monitor project budgets, operational costs, and generate invoices.</p>
                </div>
            </div>

            {/* Global Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-500">
                            <Building2 className="w-8 h-8 text-slate-500 group-hover:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Total Vault Portfolio</p>
                            <p className="text-4xl font-black text-white tracking-tighter">
                                <span className="text-xl text-slate-500 mr-1">AED</span>
                                {globalStats.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-all duration-500">
                            <TrendingUp className="w-8 h-8 text-slate-500 group-hover:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Total Capital Deployed</p>
                            <p className="text-4xl font-black text-white tracking-tighter">
                                <span className="text-xl text-slate-500 mr-1">AED</span>
                                {globalStats.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Financials Breakdown */}
            <div className="space-y-6">
                <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-slate-500" />
                    Project Financials
                </h3>

                {financialsData.length === 0 && (
                    <div className="py-20 text-center bg-[#1a1a1a]/40 border-2 border-dashed border-white/5 rounded-[32px] backdrop-blur-3xl">
                        <DollarSign className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-600 font-black uppercase tracking-widest text-sm">No financial data available</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {financialsData.map((project, idx) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-2xl font-black text-white tracking-tight">{project.name}</h4>
                                    {project.budget <= 0 && (
                                        <div className="flex items-center gap-2 mt-2 text-amber-500/80 text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 w-max">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>No Budget Allocated</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => generateInvoice(project)}
                                    disabled={project.totalSpent === 0}
                                    className="p-3 bg-white/5 hover:bg-orange-600 hover:text-white text-orange-400 rounded-2xl border border-white/5 hover:border-orange-500 transition-all shadow-xl disabled:opacity-50 disabled:hover:bg-white/5 disabled:text-slate-600"
                                    title="Generate Invoice PDF"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Approved Budget</p>
                                    <p className="text-xl font-black text-white">
                                        {project.budget > 0 ? `AED ${project.budget.toLocaleString()}` : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Cost (Logged)</p>
                                    <p className="text-xl font-black text-orange-400">
                                        AED {project.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </div>

                            {project.budget > 0 && (
                                <div className="mb-8">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                                        <span className="text-slate-500">Capital Utilization</span>
                                        <span className={project.percentUsed > 90 ? 'text-red-400' : 'text-emerald-400'}>
                                            {project.percentUsed.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${project.percentUsed > 90 ? 'bg-red-500' : project.percentUsed > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(project.percentUsed, 100)}%` }}
                                        ></div>
                                    </div>
                                    {project.variance < 0 && (
                                        <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                                            Over budget by AED {Math.abs(project.variance).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" />
                                    Resource Expenditure Breakdown
                                </p>
                                {project.expenseBreakdown.length > 0 ? (
                                    <div className="space-y-2">
                                        {project.expenseBreakdown.map((eb, i) => (
                                            <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{eb.engineerName}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{eb.hours} hrs @ {eb.rate} AED/h</p>
                                                </div>
                                                <p className="text-sm font-bold text-slate-300">
                                                    AED {eb.total.toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600 font-medium italic">No hours logged yet.</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
