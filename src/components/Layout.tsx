import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Users, FileText, PieChart, Menu, X, LogOut, CalendarCheck, Search, Bell, User, DollarSign, Mail, Calendar } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Logo } from './Logo';
import { MailNotifier } from './MailNotifier';
import { TimeclockWidget } from './TimeclockWidget';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-500 relative overflow-hidden group',
                isActive
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]'
                    : 'bg-transparent border-transparent text-slate-400 hover:border-white/5 hover:text-white hover:bg-white/5'
            )}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(16, 185, 129, 0.05))' }} />
            <div className={clsx(
                "p-2 rounded-lg transition-all duration-300 relative z-10",
                isActive ? "bg-orange-500/20 text-orange-400" : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
            )}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="relative z-10 font-medium tracking-wide">{label}</span>
        </Link>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { role, signOut, user, engineerId } = useAuth();
    const { projects, engineers, tasks, entries, notifications, markNotificationRead, addNotification } = useData();
    const navigate = useNavigate();

    const notifiedTasksRef = useRef<Set<string>>(new Set());

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const myNotifications = notifications.filter(n => n.engineerId === engineerId).sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    const unreadCount = myNotifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Check for overdue tasks
    useEffect(() => {
        if (!engineerId || tasks.length === 0) return;
        const now = new Date();
        tasks.forEach(task => {
            if (task.status !== 'done' && task.dueDate && new Date(task.dueDate) < now) {
                if (task.engineerId === engineerId) {
                    const alreadyInDb = notifications.some(n => n.type === 'overdue_task' && n.projectId === task.id && n.engineerId === engineerId);
                    if (!alreadyInDb && !notifiedTasksRef.current.has(task.id)) {
                        notifiedTasksRef.current.add(task.id);
                        if (addNotification) {
                            addNotification({
                                id: crypto.randomUUID(),
                                engineerId: engineerId,
                                message: `Overdue Task: ${task.title}`,
                                isRead: false,
                                createdAt: new Date().toISOString(),
                                type: 'overdue_task',
                                projectId: task.id
                            });
                        }
                    }
                }
            }
        });
    }, [tasks, notifications, engineerId, addNotification]);

    const searchResults = React.useMemo(() => {
        if (!searchQuery.trim()) return [];

        const q = searchQuery.toLowerCase();
        const results: Array<{ type: string; title: string; subtitle?: string; id: string; url: string; icon: React.ElementType }> = [];

        // Search Projects
        projects.forEach(p => {
            if (p.name.toLowerCase().includes(q)) {
                results.push({ type: 'Project', title: p.name, id: p.id, url: `/projects/${p.id}`, icon: FolderKanban });
            }
        });

        // Search Engineers
        engineers.forEach(e => {
            if (e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q)) {
                results.push({ type: 'Engineer', title: e.name, subtitle: e.role, id: e.id, url: `/engineers`, icon: Users });
            }
        });

        // Search Tasks
        tasks.forEach(t => {
            if (t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
                const project = projects.find(p => p.id === t.projectId);
                results.push({ type: 'Task', title: t.title, subtitle: `In ${project?.name || 'Unknown'}`, id: t.id, url: `/projects/${t.projectId}`, icon: LayoutDashboard });
            }
        });

        // Search Entries
        entries.forEach(e => {
            if (e.taskDescription.toLowerCase().includes(q) || e.tags?.some(tag => tag.toLowerCase().includes(q))) {
                results.push({ type: 'Entry', title: e.taskDescription.length > 40 ? e.taskDescription.slice(0, 40) + '...' : e.taskDescription, subtitle: `Log Entry`, id: e.id, url: `/entries`, icon: FileText });
            }
        });

        return results.slice(0, 8);
    }, [searchQuery, projects, engineers, tasks, entries]);

    return (
        <div className="min-h-screen bg-[#0f0f0f] font-sans text-dec-text flex relative selection:bg-orange-500/30">
            {/* Subtle glow background matching 'Intelligence in Action' */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0)' }}></div>

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] backdrop-blur-3xl border-r border-white/5 transform transition-all duration-500 ease-in-out lg:translate-x-0 lg:static lg:block h-full shadow-[20px_0_40px_rgba(0,0,0,0.5)]",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar">
                    <div className="mb-10 flex items-center justify-between lg:justify-start space-x-3 shrink-0">
                        <div className="flex items-center justify-center lg:justify-start w-full mb-8">
                            <Logo />
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="space-y-2 flex-1">
                        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                        {role !== 'client' && <NavItem to="/projects" icon={FolderKanban} label="Projects" />}
                        {role !== 'client' && <NavItem to="/meetings" icon={Calendar} label="Meetings" />}
                        {role === 'admin' && <NavItem to="/engineers" icon={Users} label="Engineers" />}
                        {role !== 'client' && <NavItem to="/entries" icon={FileText} label="Daily Entries" />}
                        {role !== 'client' && <NavItem to="/attendance" icon={CalendarCheck} label="Attendance" />}
                        {role === 'admin' && <NavItem to="/financials" icon={DollarSign} label="Financials" />}
                        {role === 'admin' && <NavItem to="/reports" icon={PieChart} label="Reports" />}
                        {role !== 'client' && <NavItem to="/emails" icon={Mail} label="Emails" />}
                        <NavItem to="/profile" icon={User} label="My Profile" />
                    </nav>

                    <div className="pt-6 border-t border-white/5 flex flex-col space-y-4 shrink-0 mt-auto">
                        <TimeclockWidget />

                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/5 rounded-2xl p-4 text-white shadow-xl">
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 mb-1">DEC Engineering</p>
                            <p className="text-sm font-semibold tracking-tight">Milestone Tracker</p>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-white text-xs truncate uppercase tracking-wider">{user?.email?.split('@')[0] || 'User'}</span>
                                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">{role || 'Engineer'}</span>
                            </div>
                            <button onClick={signOut} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors group" title="Sign Out">
                                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Mobile Header */}
                <div className="lg:hidden bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center">
                        <Logo className="scale-75 origin-left opacity-90 brightness-150" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <Bell className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Mobile Notifications Dropdown (Absolute overlay) */}
                {isNotifOpen && (
                    <div className="lg:hidden absolute top-16 right-4 left-4 bg-[#0B1121]/95 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl overflow-hidden z-50">
                        <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-200">Notifications</h3>
                            <span className="text-xs font-medium text-slate-400 px-2 py-1 bg-slate-800/50 rounded-full border border-slate-700">{unreadCount} unread</span>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                            {myNotifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No new notifications</div>
                            ) : (
                                myNotifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={clsx("p-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors cursor-pointer", !notif.isRead && "bg-orange-500/10")}
                                        onClick={() => {
                                            if (!notif.isRead) markNotificationRead(notif.id);
                                            setIsNotifOpen(false);
                                        }}
                                    >
                                        <p className={clsx("text-sm", notif.isRead ? "text-slate-400" : "text-slate-200 font-medium")}>{notif.message}</p>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(notif.createdAt || '').toLocaleString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Top Desktop Bar (Search & Notifications placeholder) */}
                <div className="hidden lg:flex items-center justify-between p-8 pb-0">
                    <div ref={searchRef} className="relative w-full max-w-lg z-30">
                        <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl text-slate-400 border border-white/5 flex items-center w-full shadow-2xl focus-within:border-orange-500/50 focus-within:bg-white/10 transition-all duration-300 group">
                            <Search className="w-5 h-5 mr-3 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="bg-transparent w-full outline-none text-white placeholder-slate-600 text-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchOpen(true);
                                }}
                                onFocus={() => setIsSearchOpen(true)}
                            />
                        </div>

                        {isSearchOpen && searchQuery.trim() && (
                            <div className="absolute top-14 left-0 w-full bg-[#0B1121]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-800 overflow-hidden">
                                {searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm">No results found for "{searchQuery}"</div>
                                ) : (
                                    <div className="max-h-96 overflow-y-auto py-2 no-scrollbar">
                                        {searchResults.map((result, idx) => {
                                            const Icon = result.icon;
                                            return (
                                                <button
                                                    key={`${result.type}-${result.id}-${idx}`}
                                                    onClick={() => {
                                                        navigate(result.url);
                                                        setIsSearchOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-800/60 flex items-start transition-colors"
                                                >
                                                    <div className="bg-slate-800 p-2 rounded-lg mr-3 text-slate-400 border border-slate-700/50">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-200 text-sm">{result.title}</p>
                                                        <div className="flex items-center text-xs text-slate-500 mt-0.5">
                                                            <span className="font-medium text-orange-400 mr-2">{result.type}</span>
                                                            {result.subtitle && <span>• {result.subtitle}</span>}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notifications Desktop */}
                    <div ref={notifRef} className="relative z-30 ml-4 hidden lg:block">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <Bell className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <div className="absolute top-12 right-0 w-80 bg-[#0B1121]/95 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                                    <h3 className="font-semibold text-slate-200">Notifications</h3>
                                    <span className="text-xs font-medium text-slate-400 px-2 py-1 bg-slate-800/50 rounded-full border border-slate-700">{unreadCount} unread</span>
                                </div>
                                <div className="max-h-96 overflow-y-auto no-scrollbar">
                                    {myNotifications.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500 text-sm">No new notifications</div>
                                    ) : (
                                        myNotifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={clsx("p-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors cursor-pointer", !notif.isRead && "bg-orange-500/10")}
                                                onClick={() => {
                                                    if (!notif.isRead) markNotificationRead(notif.id);
                                                    setIsNotifOpen(false);
                                                }}
                                            >
                                                <p className={clsx("text-sm", notif.isRead ? "text-slate-400" : "text-slate-200 font-medium")}>{notif.message}</p>
                                                <p className="text-xs text-slate-500 mt-1">{new Date(notif.createdAt || '').toLocaleString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full h-full p-3 md:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </div>
            </main>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Email Notifications & Permissions Prompt */}
            {role !== 'client' && <MailNotifier />}
        </div>
    );
};
