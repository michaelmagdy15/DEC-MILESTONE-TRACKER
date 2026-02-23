import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Login: React.FC = () => {
    const { user, isLoadingAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('Engineer');
    const [hourlyRate, setHourlyRate] = useState('');
    const [weeklyGoalHours, setWeeklyGoalHours] = useState('40');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
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
            if (mode === 'signup') {
                if (!name.trim()) throw new Error('Full Name is required for signup.');

                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                        data: {
                            name: name.trim(),
                            role,
                            hourly_rate: parseFloat(hourlyRate) || 0,
                            weekly_goal_hours: parseInt(weeklyGoalHours, 10) || 40,
                        }
                    }
                });
                if (signUpError) throw signUpError;
                setMessage('Account created! Please check your email for confirmation.');
            } else if (mode === 'login') {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
            } else if (mode === 'forgot-password') {
                const { data, error: resetError } = await supabase.functions.invoke('reset-password-email', {
                    body: { email }
                });

                if (resetError) throw resetError;
                setMessage(data.message || 'If an account exists, a new password has been sent to your email.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {mode === 'login' ? 'Sign in to your account' :
                            mode === 'signup' ? 'Create a new account' :
                                'Reset your password'}
                    </h2>
                    {mode === 'forgot-password' && (
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    )}
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {mode !== 'forgot-password' && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                                    {mode === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => setMode('forgot-password')}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-500"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        )}

                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 pt-4 border-t border-slate-100 overflow-hidden"
                                >
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                        <input
                                            id="name"
                                            type="text"
                                            required={mode === 'signup'}
                                            className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="e.g. John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Role / Type of Engineer</label>
                                        <select
                                            id="role"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="appearance-none relative block w-full px-3 py-2 border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                        >
                                            <option value="Engineer">Engineer</option>
                                            <option value="Senior Engineer">Senior Engineer</option>
                                            <option value="Architect">Architect</option>
                                            <option value="Project Manager">Project Manager</option>
                                            <option value="Draftsman">Draftsman</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="hourly-rate" className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate (AED)</label>
                                            <input
                                                id="hourly-rate"
                                                type="number"
                                                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="e.g. 50"
                                                min="0"
                                                step="0.01"
                                                value={hourlyRate}
                                                onChange={(e) => setHourlyRate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="weekly-goal" className="block text-sm font-medium text-slate-700 mb-1">Weekly Goal (Hrs)</label>
                                            <input
                                                id="weekly-goal"
                                                type="number"
                                                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="e.g. 40"
                                                min="0"
                                                value={weeklyGoalHours}
                                                onChange={(e) => setWeeklyGoalHours(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm text-center">
                            {message}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Processing...' :
                                mode === 'login' ? 'Sign In' :
                                    mode === 'signup' ? 'Sign Up' :
                                        'Send Reset Link'}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <button
                            type="button"
                            onClick={() => {
                                if (mode === 'forgot-password') {
                                    setMode('login');
                                } else {
                                    setMode(mode === 'login' ? 'signup' : 'login');
                                }
                                setMessage(null);
                                setError(null);
                            }}
                            className="font-medium text-blue-600 hover:text-blue-500"
                        >
                            {mode === 'login' ? "Don't have an account? Sign up" :
                                mode === 'signup' ? 'Already have an account? Sign in' :
                                    'Back to Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
