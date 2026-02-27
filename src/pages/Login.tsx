import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

export const Login: React.FC = () => {
    const { user, isLoadingAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'forgot-password'>('login');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    if (isLoadingAuth) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-gray-600">Loading session...</div>
        </div>;
    }

    if (user && mode !== 'forgot-password') {
        return <Navigate to="/" replace />;
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'login') {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
            } else if (mode === 'forgot-password') {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });

                if (resetError) throw resetError;
                setMessage('If an account with that email exists, a password reset link has been sent.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-md w-full space-y-6 md:space-y-8 bg-[#1a1a1a]/40 backdrop-blur-2xl p-6 md:p-10 rounded-2xl md:rounded-[32px] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-500 hover:border-white/10">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 mb-8 relative">
                        <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full"></div>
                        <img src={logo} alt="DEC Logo" className="w-full h-full object-contain relative z-10 animate-pulse-slow" />
                    </div>
                    <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
                        {mode === 'login' ? 'Welcome Back' : 'Reset Access'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-400 font-medium">
                        {mode === 'login' ? 'DEC Engineering Consultant Tracker' :
                            'Enter your email to receive a reset link'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/5 placeholder-slate-600 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all duration-300 sm:text-sm font-medium"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {mode !== 'forgot-password' && (
                            <div>
                                <div className="flex items-center justify-between mb-2 ml-1">
                                    <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => setMode('forgot-password')}
                                        className="text-[11px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider transition-colors"
                                    >
                                        Reset?
                                    </button>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/5 placeholder-slate-600 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 transition-all duration-300 sm:text-sm font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold text-center"
                        >
                            {message}
                        </motion.div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-orange-600 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-[#0f0f0f] disabled:opacity-50 transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) :
                                mode === 'login' ? 'Sign In' : 'Reset Password'}
                        </button>
                    </div>

                    {mode === 'forgot-password' && (
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('login');
                                    setMessage(null);
                                    setError(null);
                                }}
                                className="text-[11px] font-bold text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
