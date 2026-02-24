import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, X, Video, MapPin, Calendar, Clock, Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const Meetings: React.FC = () => {
    const { meetings, addMeeting, deleteMeeting } = useData();
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState<'online' | 'in-house'>('online');
    const [locationOrLink, setLocationOrLink] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !date || !time) return;

        addMeeting({
            id: crypto.randomUUID(),
            title,
            description,
            date,
            time,
            type,
            locationOrLink
        });

        resetForm();
    };

    const resetForm = () => {
        setIsAdding(false);
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setType('online');
        setLocationOrLink('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to cancel this meeting?')) {
            deleteMeeting(id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
                        Meeting <span className="text-emerald-400">Hub</span>
                    </h2>
                    <div className="h-1 w-20 bg-emerald-500 rounded-full mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Schedule and manage upcoming team collaborations.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="flex items-center justify-center space-x-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-1 disabled:opacity-50 font-bold uppercase tracking-widest text-[11px]"
                >
                    <Plus className="w-4 h-4" />
                    <span>Schedule Meeting</span>
                </button>
            </div>

            {isAdding && (
                <div className="bg-[#1a1a1a]/60 p-10 rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Configure New Meeting</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Coordination Protocol</p>
                        </div>
                        <button onClick={resetForm} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Meeting Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder="e.g. Client Kickoff"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all font-medium"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Time</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all font-medium"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Meeting Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as 'online' | 'in-house')}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all font-medium appearance-none"
                                >
                                    <option value="online" className="bg-[#1a1a1a]">Online (Zoom/Teams)</option>
                                    <option value="in-house" className="bg-[#1a1a1a]">In-House (Office)</option>
                                </select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    {type === 'online' ? 'Meeting Link' : 'Location (Room)'}
                                </label>
                                <input
                                    type="text"
                                    value={locationOrLink}
                                    onChange={(e) => setLocationOrLink(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all font-medium"
                                    placeholder={type === 'online' ? "https://zoom.us/..." : "e.g. Boardroom A"}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Description / Agenda</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all font-medium min-h-[100px]"
                                    placeholder="Brief agenda or summary of topics..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-4 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[11px] transition-all"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-4 bg-white text-black hover:bg-emerald-500 hover:text-white rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-xl font-bold uppercase tracking-widest text-[11px]"
                            >
                                <Check className="w-4 h-4" />
                                <span>Schedule Meeting</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {meetings.length === 0 && !isAdding && (
                    <div className="col-span-full text-center py-32 bg-[#1a1a1a]/20 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="w-10 h-10 text-slate-700" />
                        </div>
                        <p className="text-slate-400 font-black text-xl tracking-tight mb-2">No upcoming meetings</p>
                        <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">Schedule a new collaboration to get started</p>
                    </div>
                )}

                {meetings.map((meeting) => (
                    <div key={meeting.id} className="group bg-[#1a1a1a]/40 p-8 rounded-[40px] border border-white/5 hover:border-emerald-500/30 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="w-14 h-14 bg-white/5 text-white rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all duration-500 shadow-lg">
                                {meeting.type === 'online' ? <Video className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                <button
                                    onClick={() => handleDelete(meeting.id)}
                                    className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-black text-xl text-white mb-2 tracking-tight group-hover:text-emerald-400 transition-colors">{meeting.title}</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-0.5 w-8 bg-emerald-500/30 group-hover:w-12 transition-all duration-500"></div>
                                <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    <Calendar className="w-3 h-3 mr-2 text-emerald-500" />
                                    {new Date(meeting.date).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 mb-6">
                                <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5 mr-2" />
                                    {meeting.time}
                                </div>
                                {meeting.locationOrLink && (
                                    <div className="flex flex-col items-start gap-1">
                                        {meeting.type === 'online' ? (
                                            <a href={meeting.locationOrLink} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 text-xs font-bold underline truncate max-w-[200px]">Join Link</a>
                                        ) : (
                                            <span className="text-slate-400 text-xs font-bold">{meeting.locationOrLink}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {meeting.description && (
                                <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                                    {meeting.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
