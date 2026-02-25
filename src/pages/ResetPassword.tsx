
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error: resetError } = await supabase.auth.updateUser({
                password: password
            });

            if (resetError) throw resetError;

            // Sign out so the USER_UPDATED session doesn't auto-redirect to dashboard
            await supabase.auth.signOut();
            navigate('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full space-y-6 md:space-y-8 bg-[#1a1a1a]/60 p-6 md:p-10 rounded-2xl md:rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative z-10"
            >
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-[28px] bg-white/5 border border-white/5 shadow-inner">
                        <KeyRound className="h-10 w-10 text-orange-400" />
                    </div>
                    <h2 className="mt-8 text-4xl font-black text-white tracking-tighter uppercase">
                        Secure <span className="text-orange-400">Re-key</span>
                    </h2>
                    <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                        Establish new access protocol
                    </p>
                </div>

                <form className="mt-12 space-y-8" onSubmit={handleReset}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                New Access Key
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
                                placeholder="Min 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                Confirm Access Key
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                    </div>

                    {(error || message) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "p-4 rounded-2xl border flex items-start gap-4",
                                error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            )}
                        >
                            {error ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error || message}</span>
                        </motion.div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-white text-black hover:bg-orange-600 hover:text-white rounded-2xl transition-all duration-300 shadow-xl font-black uppercase tracking-widest text-[11px] disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>{loading ? 'Transmitting...' : 'Commit Protocol'}</span>
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft className="mr-3 h-4 w-4" />
                            Return to Interface
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
