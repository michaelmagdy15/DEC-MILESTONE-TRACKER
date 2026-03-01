import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DollarSign, FileText, AlertCircle, Building2, TrendingUp, BarChart3, Download, Briefcase, Calculator, Calendar, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Wallet, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import clsx from 'clsx';

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

    const generateFinancialReport = async () => {
        const monthStr = format(selectedMonth, 'MMMM yyyy');
        const { createStyledWorkbook, embedLogo, writeTableHeader, exportWorkbook } = await import('../utils/excelUtils');

        const { workbook, worksheet, saveAs } = await createStyledWorkbook({
            sheetName: `Financials - ${monthStr}`,
            columns: [{ width: 5 }, { width: 20 }, { width: 30 }, { width: 20 }, { width: 25 }, { width: 5 }],
        });

        // Logo + Header
        await embedLogo(workbook, worksheet);

        worksheet.mergeCells('D2:E2');
        const titleCell = worksheet.getCell('D2');
        titleCell.value = 'EXECUTIVE FINANCIAL REPORT';
        titleCell.font = { name: 'Arial', family: 2, size: 18, bold: true, color: { argb: 'FF10B981' } };
        titleCell.alignment = { horizontal: 'right' };

        worksheet.mergeCells('D3:E3');
        const periodCell = worksheet.getCell('D3');
        periodCell.value = `Period: ${monthStr}`;
        periodCell.font = { name: 'Arial', family: 2, size: 11, bold: true, color: { argb: 'FF777777' } };
        periodCell.alignment = { horizontal: 'right' };

        worksheet.mergeCells('D4:E4');
        const genDateCell = worksheet.getCell('D4');
        genDateCell.value = `Generated: ${format(new Date(), 'MMM dd, yyyy')}`;
        genDateCell.font = { name: 'Arial', family: 2, size: 10, italic: true, color: { argb: 'FFAAAAAA' } };
        genDateCell.alignment = { horizontal: 'right' };

        let currentRow = 7;

        // Iterate over locations
        (['Abu Dhabi', 'Cairo'] as const).forEach(loc => {
            const d = opsData[loc];
            const isAbuDhabi = loc === 'Abu Dhabi';
            const themeColor = isAbuDhabi ? 'FF10B981' : 'FFF97316';
            const bgHeaderColor = isAbuDhabi ? 'FFE8F5E9' : 'FFFFF3E0';

            // Section Header
            worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
            const locHeader = worksheet.getCell(`B${currentRow}`);
            locHeader.value = `${loc} Operations (${d.currency})`;
            locHeader.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            locHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColor } };
            locHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            worksheet.getRow(currentRow).height = 25;
            currentRow += 2;

            // Summary Block
            worksheet.getCell(`B${currentRow}`).value = 'Total Salaries';
            worksheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF555555' } };
            worksheet.getCell(`C${currentRow}`).value = d.salaries;
            worksheet.getCell(`C${currentRow}`).numFmt = '#,##0.00';
            worksheet.getCell(`C${currentRow}`).font = { name: 'Arial', size: 11, bold: true };
            worksheet.getCell(`D${currentRow}`).value = 'Total Expenses';
            worksheet.getCell(`D${currentRow}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF555555' } };
            worksheet.getCell(`E${currentRow}`).value = d.expenses;
            worksheet.getCell(`E${currentRow}`).numFmt = '#,##0.00';
            worksheet.getCell(`E${currentRow}`).font = { name: 'Arial', size: 11, bold: true };
            currentRow += 1;

            worksheet.getCell(`D${currentRow}`).value = 'Total Outgoings';
            worksheet.getCell(`D${currentRow}`).font = { name: 'Arial', size: 12, bold: true, color: { argb: themeColor } };
            worksheet.getCell(`E${currentRow}`).value = d.salaries + d.expenses;
            worksheet.getCell(`E${currentRow}`).numFmt = `"${d.currency}" #,##0.00`;
            worksheet.getCell(`E${currentRow}`).font = { name: 'Arial', size: 12, bold: true, color: { argb: themeColor } };
            currentRow += 3;

            // Salaries Table
            if (d.salaryDetails.length > 0) {
                worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
                const salTitle = worksheet.getCell(`B${currentRow}`);
                salTitle.value = 'SALARY BREAKDOWN';
                salTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: themeColor } };
                salTitle.border = { bottom: { style: 'thick', color: { argb: themeColor } } };
                currentRow += 1;

                writeTableHeader(worksheet, currentRow, ['B', 'C', 'D', 'E'],
                    ['Engineer Name', 'Total Hours', 'Hourly Rate', 'Total Salary'],
                    { bgColor: bgHeaderColor, fontColor: 'FF333333' }
                );
                currentRow += 1;

                d.salaryDetails.forEach((s: any) => {
                    worksheet.getCell(`B${currentRow}`).value = s.name;
                    worksheet.getCell(`C${currentRow}`).value = s.hours;
                    worksheet.getCell(`D${currentRow}`).value = s.rate;
                    worksheet.getCell(`D${currentRow}`).numFmt = '#,##0.00';
                    worksheet.getCell(`E${currentRow}`).value = s.total;
                    worksheet.getCell(`E${currentRow}`).numFmt = '#,##0.00';
                    currentRow += 1;
                });
                currentRow += 2;
            }

            // Expenses Table
            if (d.expenseList.length > 0) {
                worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
                const expTitle = worksheet.getCell(`B${currentRow}`);
                expTitle.value = 'OPERATING EXPENSES';
                expTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: themeColor } };
                expTitle.border = { bottom: { style: 'thick', color: { argb: themeColor } } };
                currentRow += 1;

                writeTableHeader(worksheet, currentRow, ['B', 'C', 'D', 'E'],
                    ['Date', 'Category', 'Description', 'Amount'],
                    { bgColor: bgHeaderColor, fontColor: 'FF333333' }
                );
                currentRow += 1;

                d.expenseList.forEach((e: any) => {
                    worksheet.getCell(`B${currentRow}`).value = format(new Date(e.date), 'MMM dd, yyyy');
                    worksheet.getCell(`C${currentRow}`).value = e.category;
                    worksheet.getCell(`D${currentRow}`).value = e.description || '-';
                    worksheet.getCell(`E${currentRow}`).value = e.amount;
                    worksheet.getCell(`E${currentRow}`).numFmt = '#,##0.00';
                    currentRow += 1;
                });
                currentRow += 3;
            } else {
                currentRow += 2;
            }
        });

        // Confidential Footer
        worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
        const footerInfo = worksheet.getCell(`B${currentRow}`);
        footerInfo.value = 'CONFIDENTIAL - INTERNAL USE ONLY';
        footerInfo.font = { name: 'Arial', size: 8, italic: true, bold: true, color: { argb: 'FF999999' } };
        footerInfo.alignment = { horizontal: 'center' };

        await exportWorkbook(workbook, saveAs, `DEC_Financials_${format(selectedMonth, 'yyyy_MM')}.xlsx`);
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
            const profitability = budget > 0 ? (variance / budget) * 100 : 100;

            return {
                ...project,
                totalSpent,
                budget,
                variance,
                percentUsed,
                profitability,
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

    const generateInvoice = async (projectData: typeof financialsData[0]) => {
        const { createStyledWorkbook, embedLogo, writeTableHeader, exportWorkbook } = await import('../utils/excelUtils');

        const { workbook, worksheet, saveAs } = await createStyledWorkbook({
            sheetName: `Invoice - ${projectData.name.substring(0, 20)}`,
            columns: [
                { width: 5 },  // A - Padding
                { width: 30 }, // B - Personnel
                { width: 25 }, // C - Designation
                { width: 15 }, // D - Hours
                { width: 20 }, // E - Rate (AED/hr)
                { width: 25 }, // F - Subtotal (AED)
                { width: 5 }   // G - Padding
            ],
            maxRows: 60
        });

        // Add DEC Logo
        await embedLogo(workbook, worksheet);

        // Title
        worksheet.mergeCells('E2:F2');
        const titleCell = worksheet.getCell('E2');
        titleCell.value = 'INVOICE';
        titleCell.font = { name: 'Arial', size: 24, bold: true, color: { argb: 'FFEA580C' } }; // Orange-600
        titleCell.alignment = { horizontal: 'right' };

        // Meta info
        worksheet.mergeCells('E3:F3');
        worksheet.getCell('E3').value = `Date: ${format(new Date(), 'MMM dd, yyyy')}`;
        worksheet.getCell('E3').font = { name: 'Arial', size: 10, color: { argb: 'FF777777' } };
        worksheet.getCell('E3').alignment = { horizontal: 'right' };

        worksheet.mergeCells('E4:F4');
        worksheet.getCell('E4').value = `Project: ${projectData.name}`;
        worksheet.getCell('E4').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF333333' } };
        worksheet.getCell('E4').alignment = { horizontal: 'right' };

        if (projectData.budget > 0) {
            worksheet.mergeCells('E5:F5');
            worksheet.getCell('E5').value = `Approved Budget: AED ${projectData.budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
            worksheet.getCell('E5').font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF888888' } };
            worksheet.getCell('E5').alignment = { horizontal: 'right' };
        }

        let currentRow = 8;

        // Table Title
        worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
        const tableTitle = worksheet.getCell(`B${currentRow}`);
        tableTitle.value = 'Professional Services Rendering';
        tableTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF333333' } };
        currentRow += 2;

        // Headers
        writeTableHeader(worksheet, currentRow, ['B', 'C', 'D', 'E', 'F'],
            ['Personnel', 'Designation', 'Hours', 'Rate (AED/hr)', 'Subtotal (AED)'],
            { rightAlignFrom: 2 }
        );
        currentRow += 1;

        // Rows
        projectData.expenseBreakdown.forEach(eb => {
            worksheet.getCell(`B${currentRow}`).value = eb.engineerName;
            worksheet.getCell(`C${currentRow}`).value = eb.role;

            const hoursCell = worksheet.getCell(`D${currentRow}`);
            hoursCell.value = Number(eb.hours);
            hoursCell.alignment = { horizontal: 'right' };

            const rateCell = worksheet.getCell(`E${currentRow}`);
            rateCell.value = Number(eb.rate);
            rateCell.numFmt = '#,##0.00';
            rateCell.alignment = { horizontal: 'right' };

            const totalCell = worksheet.getCell(`F${currentRow}`);
            totalCell.value = Number(eb.total);
            totalCell.numFmt = '#,##0.00';
            totalCell.alignment = { horizontal: 'right' };

            currentRow += 1;
        });

        currentRow += 1;

        // Total
        worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
        const totalLabel = worksheet.getCell(`D${currentRow}`);
        totalLabel.value = 'Total Amount Due:';
        totalLabel.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF555555' } };
        totalLabel.alignment = { horizontal: 'right' };

        const finalTotal = worksheet.getCell(`F${currentRow}`);
        finalTotal.value = Number(projectData.totalSpent);
        finalTotal.numFmt = '"AED" #,##0.00';
        finalTotal.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFEA580C' } };
        finalTotal.border = { top: { style: 'medium', color: { argb: 'FFEA580C' } } };

        currentRow += 3;

        // Footer
        worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
        const footerInfo = worksheet.getCell(`B${currentRow}`);
        footerInfo.value = 'Thank you for your business.';
        footerInfo.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF999999' } };
        footerInfo.alignment = { horizontal: 'center' };

        await exportWorkbook(workbook, saveAs, `Invoice_${projectData.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
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
                                        <div className="mb-8 p-6 bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl border border-white/5">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-4">
                                                <span className="text-slate-500">Capital Utilization</span>
                                                <span className={project.percentUsed > 90 ? 'text-red-400' : 'text-emerald-400'}>
                                                    {project.percentUsed.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${project.percentUsed > 90 ? 'bg-red-500' : project.percentUsed > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(project.percentUsed, 100)}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Profitability Mirror</p>
                                                    <p className={clsx("text-xl font-black", project.profitability > 20 ? "text-emerald-400" : project.profitability > 0 ? "text-amber-400" : "text-rose-400")}>
                                                        {project.profitability.toFixed(1)}%
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Projected Net</p>
                                                    <p className="text-sm font-black text-white">
                                                        AED {project.variance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </p>
                                                </div>
                                            </div>
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
