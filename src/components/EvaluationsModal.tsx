import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Star, Calendar, User, Trash2, Check, ArrowLeft, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Engineer, PerformanceEvaluation } from '../types';
import { format } from 'date-fns';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    engineer: Engineer | null;
}

const CRITERIA = [
    { id: 'timeEfficiency', label: 'Time efficiency and adherence to project schedules' },
    { id: 'softwareProficiency', label: 'Software Analytics (Revit, AutoCAD, etc.) proficiency' },
    { id: 'qualityOfDeliverables', label: 'Quality of deliverables' },
    { id: 'communication', label: 'Effective communication (internal/external)' },
    { id: 'problemSolving', label: 'Problem-solving abilities' },
    { id: 'adaptability', label: 'Adaptability to changing requirements' },
    { id: 'teamwork', label: 'Collaboration and teamwork' },
    { id: 'technicalProficiency', label: 'Technical proficiency' },
    { id: 'meetingBudgets', label: 'Meeting project budgets' },
    { id: 'continuousLearning', label: 'Continuous learning and development' },
    { id: 'leadership', label: 'Leadership potential' },
    { id: 'clientSatisfaction', label: 'Client satisfaction' },
    { id: 'overallPerformance', label: 'Overall performance' },
];

export const EvaluationsModal: React.FC<Props> = ({ isOpen, onClose, engineer }) => {
    const { performanceEvaluations, addPerformanceEvaluation, deletePerformanceEvaluation } = useData();
    const { user } = useAuth();

    const [view, setView] = useState<'list' | 'create' | 'view'>('list');
    const [selectedEval, setSelectedEval] = useState<PerformanceEvaluation | null>(null);

    // Form State
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [strengths, setStrengths] = useState('');
    const [improvements, setImprovements] = useState('');
    const [developmentPlan, setDevelopmentPlan] = useState('');

    const evaluations = useMemo(() => {
        if (!engineer) return [];
        return performanceEvaluations.filter(e => e.engineerId === engineer.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [performanceEvaluations, engineer]);

    if (!isOpen || !engineer) return null;

    const handleRatingChange = (id: string, value: number) => {
        setRatings(prev => ({ ...prev, [id]: value }));
    };

    const overallRating = useMemo(() => {
        const values = Object.values(ratings);
        if (values.length === 0) return 0;
        const sum = values.reduce((acc, curr) => acc + curr, 0);
        return Number((sum / values.length).toFixed(1));
    }, [ratings]);

    const handleSave = async () => {
        if (!user) return;

        const evaluation: PerformanceEvaluation = {
            id: crypto.randomUUID(),
            engineerId: engineer.id,
            evaluatorId: user.id,
            date: new Date().toISOString(),
            ratings,
            strengths,
            improvements,
            developmentPlan,
            overallRating
        };

        await addPerformanceEvaluation(evaluation);
        setView('list');
        resetForm();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this evaluation?')) {
            await deletePerformanceEvaluation(id);
            if (view === 'view' && selectedEval?.id === id) {
                setView('list');
            }
        }
    };

    const resetForm = () => {
        setRatings({});
        setStrengths('');
        setImprovements('');
        setDevelopmentPlan('');
    };

    const openCreate = () => {
        resetForm();
        setView('create');
    };

    const openView = (evaluation: PerformanceEvaluation) => {
        setSelectedEval(evaluation);
        setView('view');
    };

    const StarRating = ({ value, onChange, readonly = false }: { value: number, onChange?: (val: number) => void, readonly?: boolean }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        onClick={() => onChange?.(star)}
                        className={`p-1 transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'} ${value >= star ? 'text-amber-500' : 'text-slate-600 hover:text-amber-500/50'}`}
                    >
                        <Star className={`w-5 h-5 ${value >= star ? 'fill-amber-500' : ''}`} />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#1a1a1a] rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl relative"
                >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-emerald-500"></div>

                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-4">
                            {view !== 'list' && (
                                <button onClick={() => setView('list')} className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                    <Star className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                                    Performance Evaluations
                                </h2>
                                <p className="text-slate-400 text-sm font-medium mt-1">
                                    Evaluating <span className="text-white font-bold">{engineer.name}</span>
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {view === 'list' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Evaluation History</h3>
                                        <p className="text-slate-400 text-sm">Past performance reviews and metrics</p>
                                    </div>
                                    <button onClick={openCreate} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors shadow-lg shadow-amber-600/20 hover:-translate-y-0.5">
                                        <Plus className="w-4 h-4" />
                                        New Evaluation
                                    </button>
                                </div>

                                {evaluations.length === 0 ? (
                                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                        <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                        <p className="text-white font-bold text-lg">No evaluations yet</p>
                                        <p className="text-slate-500 text-sm mt-1">Click "New Evaluation" to rate this operative.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {evaluations.map(ev => (
                                            <div key={ev.id} className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/5 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex flex-col items-center justify-center border border-amber-500/20">
                                                        <span className="text-2xl font-black text-amber-500">{ev.overallRating?.toFixed(1) || 'N/A'}</span>
                                                        <span className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest">Score</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Calendar className="w-4 h-4 text-slate-500" />
                                                            <span className="text-white font-bold">{format(new Date(ev.date), 'MMMM d, yyyy')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> Evaluator ID: {ev.evaluatorId?.substring(0, 6) || 'Unknown'}..</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openView(ev)} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
                                                        View Details
                                                    </button>
                                                    <button onClick={() => handleDelete(ev.id)} className="p-2.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded-xl transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {view === 'create' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                                    <div>
                                        <h4 className="text-amber-500 font-bold mb-1">Performance Quality Measurement</h4>
                                        <p className="text-amber-500/80 text-sm">Please rate the engineer across the standard 13 criteria (1 = Poor, 5 = Excellent). Provide detailed feedback for continuous improvement.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6 col-span-1 md:col-span-2 text-center py-6 bg-white/5 rounded-2xl border border-white/5">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">Overall Rating (Calculated)</span>
                                        <div className="text-6xl font-black text-amber-500 tracking-tighter">
                                            {overallRating.toFixed(1)} <span className="text-2xl text-amber-500/50">/ 5.0</span>
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {CRITERIA.map(criterion => (
                                            <div key={criterion.id} className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl border border-white/5">
                                                <label className="text-sm font-bold text-slate-300">{criterion.label}</label>
                                                <StarRating value={ratings[criterion.id] || 0} onChange={(val) => handleRatingChange(criterion.id, val)} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 col-span-1 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            Strengths
                                        </label>
                                        <textarea
                                            value={strengths}
                                            onChange={e => setStrengths(e.target.value)}
                                            rows={3}
                                            placeholder="What does the operative do exceptionally well?"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-2 col-span-1 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            Areas for Improvement
                                        </label>
                                        <textarea
                                            value={improvements}
                                            onChange={e => setImprovements(e.target.value)}
                                            rows={3}
                                            placeholder="Where can the operative improve?"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 resize-none transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-2 col-span-1 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-blue-500" />
                                            Action / Development Plan
                                        </label>
                                        <textarea
                                            value={developmentPlan}
                                            onChange={e => setDevelopmentPlan(e.target.value)}
                                            rows={3}
                                            placeholder="Specific goals or training for the next period..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === 'view' && selectedEval && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex gap-8 items-center bg-white/5 p-8 rounded-3xl border border-white/5">
                                    <div className="w-32 h-32 bg-amber-500/10 rounded-[32px] flex flex-col items-center justify-center border border-amber-500/20 rotate-3">
                                        <span className="text-5xl font-black text-amber-500">{selectedEval.overallRating?.toFixed(1) || 'N/A'}</span>
                                        <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mt-1">Overall</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Evaluation Review</h3>
                                        <div className="flex flex-col gap-2 text-sm text-slate-400">
                                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /> {format(new Date(selectedEval.date), 'MMMM d, yyyy h:mm a')}</span>
                                            <span className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /> Evaluator ID: {selectedEval.evaluatorId}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {CRITERIA.map(criterion => (
                                        <div key={criterion.id} className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex justify-between items-start">
                                                <label className="text-sm font-bold text-slate-300 w-3/4">{criterion.label}</label>
                                                <span className="text-lg font-black text-white">{selectedEval.ratings?.[criterion.id] || 0}<span className="text-xs text-slate-600 ml-0.5">/5</span></span>
                                            </div>
                                            <StarRating value={selectedEval.ratings?.[criterion.id] || 0} readonly />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 pt-6 border-t border-white/10">
                                    {selectedEval.strengths && (
                                        <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                            <h4 className="text-emerald-500 font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-xs"><TrendingUp className="w-4 h-4" /> Strengths</h4>
                                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedEval.strengths}</p>
                                        </div>
                                    )}
                                    {selectedEval.improvements && (
                                        <div className="p-6 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                                            <h4 className="text-orange-500 font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-xs"><AlertCircle className="w-4 h-4" /> Areas for Improvement</h4>
                                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedEval.improvements}</p>
                                        </div>
                                    )}
                                    {selectedEval.developmentPlan && (
                                        <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                            <h4 className="text-blue-500 font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-xs"><Target className="w-4 h-4" /> Action / Development Plan</h4>
                                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedEval.developmentPlan}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {view === 'create' && (
                        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-4">
                            <button onClick={() => setView('list')} className="px-8 py-3 text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="flex items-center gap-2 bg-white text-black hover:bg-amber-500 hover:text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg hover:-translate-y-0.5">
                                <Check className="w-4 h-4" />
                                Submit Evaluation
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
