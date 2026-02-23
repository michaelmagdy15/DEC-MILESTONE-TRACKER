import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { User, Mail, Shield, Save, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Profile: React.FC = () => {
    const { user, role, engineerId } = useAuth();
    const { engineers, updateEngineer } = useData();

    const engineer = engineers.find(e => e.id === engineerId);

    const [name, setName] = useState(engineer?.name || '');
    const [hourlyRate, setHourlyRate] = useState(engineer?.hourlyRate?.toString() || '');
    const [weeklyGoal, setWeeklyGoal] = useState(engineer?.weeklyGoalHours?.toString() || '40');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        console.log('Profile Mount - State:', { engineerId, engineer, engineersCount: engineers.length });
        if (engineer) {
            setName(engineer.name);
            setHourlyRate(engineer.hourlyRate?.toString() || '');
            setWeeklyGoal(engineer.weeklyGoalHours?.toString() || '40');
        }
    }, [engineer, engineerId]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Profile update started', { engineerId, name, hourlyRate, weeklyGoal });
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (!name.trim()) throw new Error('Name is required');

            console.log('Checking engineerId', engineerId);
            if (engineerId) {
                console.log('Updating engineer in DataContext...');
                await updateEngineer({
                    ...engineer!,
                    name: name.trim(),
                    hourlyRate: parseFloat(hourlyRate) || 0,
                    weeklyGoalHours: parseInt(weeklyGoal, 10) || 40
                });
                console.log('Engineer update successful in DataContext');

                // Also update user metadata in auth
                console.log('Updating auth user metadata...');
                const { error: authError } = await supabase.auth.updateUser({
                    data: { name: name.trim() }
                });
                if (authError) throw authError;
                console.log('Auth user metadata update successful');

                setSuccess('Profile updated successfully!');
            } else {
                console.error('No engineerId found!');
                setError('Could not identify your engineer profile. Please log in again.');
            }
        } catch (err: any) {
            console.error('Profile update error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (newPassword !== confirmPassword) {
                throw new Error('New passwords do not match');
            }
            if (newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            const { error: passError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (passError) throw passError;

            setSuccess('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
        >
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <User className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white">My Profile</h2>
                    <p className="text-slate-400">Manage your account settings and preferences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Shield className="w-32 h-32" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-blue-400" />
                            General Information
                        </h3>

                        <form onSubmit={handleUpdateProfile} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Hourly Rate (AED)</label>
                                    <input
                                        type="number"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Weekly Goal (Hrs)</label>
                                    <input
                                        type="number"
                                        value={weeklyGoal}
                                        onChange={(e) => setWeeklyGoal(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </form>
                    </section>

                    {/* Change Password */}
                    <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <Key className="w-5 h-5 mr-2 text-purple-400" />
                            Security
                        </h3>

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl transition-all border border-slate-700 disabled:opacity-50"
                            >
                                <Key className="w-4 h-4" />
                                <span>{loading ? 'Updating...' : 'Update Password'}</span>
                            </button>
                        </form>
                    </section>
                </div>

                {/* Account Status / Help */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5 rounded-3xl p-6">
                        <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Account Metrics</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Role</span>
                                <span className="text-blue-400 text-sm font-semibold capitalize">{role}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Joined</span>
                                <span className="text-white text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {(error || success) && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={clsx(
                                "p-4 rounded-2xl border flex items-start space-x-3",
                                error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            )}
                        >
                            {error ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                            <span className="text-sm">{error || success}</span>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
