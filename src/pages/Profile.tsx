
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { User, Mail, Shield, Save, Key, AlertCircle, CheckCircle2, DollarSign, Target, Award, ShieldCheck, Copy, Activity } from 'lucide-react';

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
    const [copied, setCopied] = useState(false);

    const handleCopyId = () => {
        if (engineerId) {
            navigator.clipboard.writeText(engineerId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        if (engineer) {
            setName(engineer.name);
            setHourlyRate(engineer.hourlyRate?.toString() || '');
            setWeeklyGoal(engineer.weeklyGoalHours?.toString() || '40');
        }
    }, [engineer, engineerId]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        console.log("Profile Update Trace:");
        console.log("- engineerId from useAuth:", engineerId);
        console.log("- user from useAuth:", !!user, user?.id);
        console.log("- engineers array length in useData:", engineers.length);
        console.log("- resulting matched engineer object:", !!engineer, engineer?.id);

        try {
            if (!name.trim()) throw new Error('Name is required');
            if (engineerId) {
                // If a record exists in state, spread it; else use minimum object.
                // updateEngineer in DataContext handles the upsert logic.
                const engineerData = engineer || {
                    id: engineerId,
                    name: name.trim() || user?.email?.split('@')[0] || 'User',
                    role: role || 'engineer',
                    hourlyRate: 0,
                    weeklyGoalHours: 40
                };

                await updateEngineer({
                    ...engineerData,
                    name: name.trim(),
                    hourlyRate: parseFloat(hourlyRate) || 0,
                    weeklyGoalHours: parseInt(weeklyGoal, 10) || 40
                });

                const { error: authError } = await supabase.auth.updateUser({
                    data: { name: name.trim() }
                });
                if (authError) throw authError;

                setSuccess('Profile updated successfully!');
            } else {
                setError('Could not identify your engineer profile. Please log in again.');
            }
        } catch (err: any) {
            console.error("Profile: Error during update:", err);
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
            if (newPassword !== confirmPassword) throw new Error('New passwords do not match');
            if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');

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
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
                        Operative <span className="text-orange-400">Profile</span>
                    </h2>
                    <div className="h-1 w-20 bg-orange-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Managing specialist credentials and security clearance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Main Profile Settings */}
                <div className="xl:col-span-2 space-y-8">
                    {/* General Settings */}
                    <div className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-orange-600/10 transition-colors"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-4">
                                    <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                        <ShieldCheck className="w-6 h-6 text-orange-400" />
                                    </div>
                                    General Intel
                                </h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-14">Core specialist identification</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Terminal</label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-slate-500 cursor-not-allowed font-medium opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Hourly Compensation (AED)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="number"
                                            value={hourlyRate}
                                            onChange={(e) => setHourlyRate(e.target.value)}
                                            className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Weekly Operation Goal (Hrs)</label>
                                    <div className="relative">
                                        <Target className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="number"
                                            value={weeklyGoal}
                                            onChange={(e) => setWeeklyGoal(e.target.value)}
                                            className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 bg-white text-black hover:bg-orange-600 hover:text-white rounded-2xl transition-all duration-300 shadow-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 mr-3 inline-block" />
                                <span>{loading ? 'Transmitting...' : 'Update Credentials'}</span>
                            </button>
                        </form>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full -ml-16 -mt-16 blur-3xl group-hover:bg-purple-500/10 transition-colors"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                        <Key className="w-6 h-6 text-purple-400" />
                                    </div>
                                    Security Protocol
                                </h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-14">Access key synchronization</p>
                            </div>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-8 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Access Key</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Access Key</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-600/20 rounded-2xl transition-all duration-300 shadow-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                            >
                                <Key className="w-4 h-4 mr-3 inline-block" />
                                <span>{loading ? 'Re-keying...' : 'Update Protocol'}</span>
                            </button>
                        </form>
                    </div>

                    {/* Companion App Settings */}
                    <div className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                        <Activity className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    Companion Link
                                </h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-14">Connect background tracking</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <p className="text-slate-400 text-sm leading-relaxed">
                                To track your active software automatically, install the DEC Companion App and provide your Engineer ID.
                            </p>

                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2 flex-1 w-full relative">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Unique Engineer ID</label>
                                    <div className="flex items-center bg-white/5 border border-white/5 rounded-2xl px-5 py-4 w-full">
                                        <code className="text-emerald-400 font-mono text-sm break-all select-all flex-1">{engineerId || 'N/A'}</code>
                                        <button
                                            onClick={handleCopyId}
                                            disabled={!engineerId}
                                            className="ml-4 p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors border border-emerald-500/20 disabled:opacity-50"
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Info Metrics */}
                <div className="space-y-8">
                    <div className="bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Service Metrics</h4>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-orange-500/10 rounded-xl">
                                        <Award className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">Clearance Level</span>
                                </div>
                                <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">{role}</span>
                            </div>
                            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                        <Award className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">Activation Date</span>
                                </div>
                                <span className="text-white text-sm font-bold">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Baseline'}</span>
                            </div>
                        </div>

                        {(error || success) && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={clsx(
                                    "mt-8 p-6 rounded-3xl border flex items-start gap-4",
                                    error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                )}
                            >
                                {error ? <AlertCircle className="w-6 h-6 flex-shrink-0" /> : <CheckCircle2 className="w-6 h-6 flex-shrink-0" />}
                                <span className="text-sm font-bold uppercase tracking-widest text-[10px] leading-relaxed">{error || success}</span>
                            </motion.div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-orange-600/10 to-purple-600/10 border border-white/5 rounded-[40px] p-8 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <Shield className="w-8 h-8 text-orange-400" />
                        </div>
                        <h4 className="text-white font-black uppercase tracking-tight mb-2">Security Compliance</h4>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">Your account is secured with Grade-A encryption. Ensure your access keys are rotated periodically.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
