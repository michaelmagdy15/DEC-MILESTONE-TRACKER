import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DollarSign, FileText, AlertCircle, Building2, TrendingUp, BarChart3, Download, Briefcase, Calculator, Calendar, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Wallet, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const OfficeOperations: React.FC = () => {
    const { engineers, entries, officeExpenses, addOfficeExpense, deleteOfficeExpense } = useData();
    const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

    // New Expense Form State
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [expenseLoc, setExpenseLoc] = useState<'Abu Dhabi' | 'Cairo'>('Abu Dhabi');
    const [expenseCat, setExpenseCat] = useState('Rent');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseDesc, setExpenseDesc] = useState('');

    const categories = ['Salary', 'Rent', 'Utilities', 'Equipment', 'Software', 'Repair', 'Other'];

    const handlePreviousMonth = () => setSelectedMonth(prev => startOfMonth(subMonths(prev, 1)));
    const handleNextMonth = () => setSelectedMonth(prev => startOfMonth(addMonths(prev, 1)));

    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // Calculate Salaries and Filter Expenses
    const opsData = useMemo(() => {
        const data = {
            'Abu Dhabi': { salaries: 0, expenses: 0, currency: 'AED', expenseList: [] as any[], salaryDetails: [] as any[] },
            'Cairo': { salaries: 0, expenses: 0, currency: 'EGP', expenseList: [] as any[], salaryDetails: [] as any[] }
        };

        // 1. Calculate Salaries per Engineer for the selected month
        engineers.forEach(eng => {
            const loc = eng.location || 'Cairo';
            // Find entries for this engineer in this month
            const engEntries = entries.filter(e =>
                e.engineerId === eng.id &&
                isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })
            );

            const totalHours = engEntries.reduce((sum, e) => sum + e.timeSpent, 0);
            const rate = eng.hourlyRate || 0;
            const salary = totalHours * rate;

            if (salary > 0) {
                data[loc].salaries += salary;
                data[loc].salaryDetails.push({ name: eng.name, hours: totalHours, rate, total: salary });
            }
        });

        // 2. Filter Expenses for the selected month
        const monthlyExpenses = officeExpenses.filter(e =>
            e.date && isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })
        );

        monthlyExpenses.forEach(exp => {
            const loc = exp.location;
            if (data[loc]) {
                data[loc].expenses += exp.amount;
                data[loc].expenseList.push(exp);
            }
        });

        // Sort details for better display
        data['Abu Dhabi'].salaryDetails.sort((a, b) => b.total - a.total);
        data['Cairo'].salaryDetails.sort((a, b) => b.total - a.total);
        data['Abu Dhabi'].expenseList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        data['Cairo'].expenseList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return data;
    }, [engineers, entries, officeExpenses, selectedMonth]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseAmount || isNaN(Number(expenseAmount))) return;

        await addOfficeExpense({
            id: crypto.randomUUID(),
            location: expenseLoc,
            category: expenseCat,
            amount: Number(expenseAmount),
            currency: expenseLoc === 'Abu Dhabi' ? 'AED' : 'EGP',
            description: expenseDesc,
            date: format(new Date(), 'yyyy-MM-dd')
        });

        setIsAddingExpense(false);
        setExpenseAmount('');
        setExpenseDesc('');
    };

    const generateFinancialReport = () => {
        const doc = new jsPDF();
        const monthStr = format(selectedMonth, 'MMMM yyyy');

        // Header
        doc.setFontSize(24);
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text("EXECUTIVE FINANCIAL REPORT", 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Period: ${monthStr}`, 14, 35);
        doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 40);

        // DEC details
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("DEC Engineering Consultants", 130, 25);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Dubai, UAE", 130, 32);

        let currentY = 55;

        // Generate tables for each location
        (['Abu Dhabi', 'Cairo'] as const).forEach(loc => {
            const d = opsData[loc];
            const locColor = loc === 'Abu Dhabi' ? [16, 185, 129] : [249, 115, 22]; // Emerald or Orange

            // Section Header
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text(`${loc} Operations (${d.currency})`, 14, currentY);
            currentY += 10;

            // Summary
            doc.setFontSize(11);
            doc.setTextColor(80);
            doc.text(`Total Salaries: ${d.salaries.toLocaleString()}`, 14, currentY);
            doc.text(`Total Expenses: ${d.expenses.toLocaleString()}`, 80, currentY);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Outgoings: ${d.currency} ${(d.salaries + d.expenses).toLocaleString()}`, 140, currentY);
            doc.setFont('helvetica', 'normal');
            currentY += 15;

            // Salaries Table
            if (d.salaryDetails.length > 0) {
                doc.setFontSize(12);
                doc.text("Salaries Breakdown", 14, currentY);
                currentY += 5;

                autoTable(doc, {
                    head: [["Name", "Hours", "Rate", "Total"]],
                    body: d.salaryDetails.map(s => [s.name, s.hours.toString(), s.rate.toString(), s.total.toLocaleString()]),
                    startY: currentY,
                    theme: 'grid',
                    headStyles: { fillColor: locColor as [number, number, number] },
                    styles: { fontSize: 9 }
                });
                currentY = (doc as any).lastAutoTable.finalY + 15;
            }

            // Expenses Table
            if (d.expenseList.length > 0) {
                // Check if page break is needed
                if (currentY > 230) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(12);
                doc.text("Operating Expenses", 14, currentY);
                currentY += 5;

                autoTable(doc, {
                    head: [["Date", "Category", "Description", "Amount"]],
                    body: d.expenseList.map(e => [
                        format(new Date(e.date), 'MM/dd'),
                        e.category,
                        e.description || '-',
                        e.amount.toLocaleString()
                    ]),
                    startY: currentY,
                    theme: 'grid',
                    headStyles: { fillColor: locColor as [number, number, number] },
                    styles: { fontSize: 9 }
                });
                currentY = (doc as any).lastAutoTable.finalY + 25;
            }
        });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("CONFIDENTIAL - Internal Use Only", 14, doc.internal.pageSize.getHeight() - 15);

        doc.save(`DEC_Financials_${format(selectedMonth, 'yyyy_MM')}.pdf`);
    };

    const renderOfficeCard = (loc: 'Abu Dhabi' | 'Cairo') => {
        const d = opsData[loc];
        const totalOutgoings = d.salaries + d.expenses;
        const locColor = loc === 'Abu Dhabi' ? 'emerald' : 'orange';

        return (
            <div className={`bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group hover:border-${locColor}-500/20 transition-all`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${locColor}-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-${locColor}-500/10 transition-colors`}></div>

                <h3 className="text-2xl font-black text-white tracking-tight mb-6 flex items-center justify-between">
                    {loc} Office
                    <span className={`text-[10px] font-bold uppercase tracking-widest bg-${locColor}-500/10 text-${locColor}-400 px-3 py-1 rounded-full border border-${locColor}-500/20`}>
                        {d.currency}
                    </span>
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Salaries</p>
                        <p className="text-xl font-black text-white">
                            {d.salaries.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Expenses</p>
                        <p className="text-xl font-black text-white">
                            {d.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>

                <div className="mb-8 p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Outgoings</p>
                    <p className={`text-2xl font-black text-${locColor}-400`}>
                        {d.currency} {totalOutgoings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Salaries Dropdown / List */}
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5" />
                            Salary Breakdown
                        </p>
                        {d.salaryDetails.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {d.salaryDetails.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                        <div>
                                            <p className="text-sm font-bold text-white">{s.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{s.hours} hrs @ {s.rate}/h</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-300 gap-1 flex items-center">
                                            {s.total.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 font-medium italic">No hours logged.</p>
                        )}
                    </div>

                    {/* Expenses List */}
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5" />
                            Recent Expenses
                        </p>
                        {d.expenseList.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {d.expenseList.map((exp, i) => (
                                    <div key={exp.id || i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 group/exp">
                                        <div>
                                            <p className="text-sm font-bold text-white">{exp.category}</p>
                                            <p className="text-[10px] text-slate-500 capitalize">{exp.description || 'No description'} • {format(new Date(exp.date), 'MMM dd')}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-bold text-slate-300">
                                                {exp.amount.toLocaleString()}
                                            </p>
                                            <button
                                                onClick={() => deleteOfficeExpense(exp.id)}
                                                className="opacity-0 group-hover/exp:opacity-100 text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                                                title="Delete Expense"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 font-medium italic">No expenses logged.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header: Month Selector & Add Button */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#1a1a1a]/40 p-4 rounded-3xl border border-white/5 backdrop-blur-3xl shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={handlePreviousMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="flex items-center gap-3 min-w-[200px] justify-center text-emerald-400">
                        <Calendar className="w-5 h-5 flex-shrink-0" />
                        <span className="text-lg font-black uppercase tracking-widest">
                            {format(selectedMonth, 'MMMM yyyy')}
                        </span>
                    </div>
                    <button onClick={handleNextMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={generateFinancialReport}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl font-bold uppercase tracking-wider text-xs transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Generate Report
                    </button>
                    <button
                        onClick={() => setIsAddingExpense(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg hover:shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Log Expense
                    </button>
                </div>
            </div>

            {/* Add Expense Inline Form */}
            {isAddingExpense && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-[#1a1a1a]/60 p-6 rounded-3xl border border-emerald-500/20 backdrop-blur-3xl shadow-2xl overflow-hidden"
                >
                    <form onSubmit={handleAddExpense} className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Location</label>
                                <select
                                    value={expenseLoc}
                                    onChange={(e) => setExpenseLoc(e.target.value as any)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="Abu Dhabi">Abu Dhabi (AED)</option>
                                    <option value="Cairo">Cairo (EGP)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                                <select
                                    value={expenseCat}
                                    onChange={(e) => setExpenseCat(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Amount</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={expenseAmount}
                                    onChange={(e) => setExpenseAmount(e.target.value)}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                                <input
                                    type="text"
                                    placeholder="Optional details..."
                                    value={expenseDesc}
                                    onChange={(e) => setExpenseDesc(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAddingExpense(false)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex-1 md:flex-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 flex-1 md:flex-none"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Side-by-side Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderOfficeCard('Abu Dhabi')}
                {renderOfficeCard('Cairo')}
            </div>
        </div>
    );
};

export const Financials: React.FC = () => {
    const { projects, engineers, entries } = useData();
    const [activeTab, setActiveTab] = useState<'projects' | 'office'>('projects');

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

            {/* Inner Tabs */}
            <div className="flex p-1 bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/5 rounded-2xl w-max mb-8">
                <button
                    onClick={() => setActiveTab('projects')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${activeTab === 'projects' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                    <Briefcase className="w-4 h-4" />
                    Client Projects
                </button>
                <button
                    onClick={() => setActiveTab('office')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${activeTab === 'office' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                    <Calculator className="w-4 h-4" />
                    Office Operations
                </button>
            </div>

            {activeTab === 'projects' && (
                <>
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
                </>
            )}

            {activeTab === 'office' && (
                <OfficeOperations />
            )}
        </motion.div>
    );
};
