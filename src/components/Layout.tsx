import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Users, FileText, PieChart, Menu, X, LogOut, CalendarCheck, Search, Bell } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-300 relative overflow-hidden group',
                isActive
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'bg-transparent border-transparent text-slate-400 hover:border-slate-700/50 hover:text-slate-200 hover:bg-slate-800/40'
            )}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(16, 185, 129, 0.05))' }} />
            <div className={clsx(
                "p-2 rounded-lg transition-all duration-300 relative z-10",
                isActive ? "bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50 group-hover:text-slate-300"
            )}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="relative z-10 font-medium">{label}</span>
        </Link>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { role, signOut, user, engineerId } = useAuth();
    const { projects, engineers, tasks, entries, notifications, markNotificationRead } = useData();
    const navigate = useNavigate();

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
        <div className="min-h-screen bg-[#0B1121] font-sans text-slate-200 flex relative">
            {/* Subtle glow background matching 'Intelligence in Action' */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 1) 2px, transparent 0px), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.5) 2px, transparent 0px)' }}></div>

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-[#0B1121]/80 backdrop-blur-xl border-r border-slate-800/60 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block h-full shadow-2xl shadow-black/50",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col p-6">
                    <div className="mb-10 flex items-center justify-between lg:justify-start space-x-3">
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
                        {role === 'admin' && <NavItem to="/engineers" icon={Users} label="Engineers" />}
                        {role !== 'client' && <NavItem to="/entries" icon={FileText} label="Daily Entries" />}
                        {role !== 'client' && <NavItem to="/attendance" icon={CalendarCheck} label="Attendance" />}
                        {role === 'admin' && <NavItem to="/reports" icon={PieChart} label="Reports" />}
                    </nav>

                    <div className="pt-6 border-t border-slate-100 flex flex-col space-y-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20">
                            <p className="text-xs font-semibold opacity-80 mb-1">DEC Engineering</p>
                            <p className="text-sm font-medium">Milestone Tracking System</p>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-600">
                            <div className="flex flex-col">
                                <span className="font-semibold">{user?.email?.split('@')[0] || 'User'}</span>
                                <span className="text-xs text-slate-400 capitalize">{role || 'Engineer'}</span>
                            </div>
                            <button onClick={signOut} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sign Out">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Mobile Header */}
                <div className="lg:hidden bg-[#0B1121]/80 backdrop-blur-xl border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
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
                                        className={clsx("p-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors cursor-pointer", !notif.isRead && "bg-blue-500/10")}
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
                <div className="hidden lg:flex items-center justify-between p-6 pb-0">
                    <div ref={searchRef} className="relative w-full max-w-md z-30">
                        <div className="bg-slate-800/40 backdrop-blur-sm px-4 py-2.5 rounded-xl text-slate-400 border border-slate-700/50 flex items-center w-full shadow-inner opacity-70 focus-within:opacity-100 transition-all duration-300 focus-within:border-blue-500/40 focus-within:bg-slate-800/60">
                            <Search className="w-5 h-5 mr-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search projects, engineers, entries (or tags)..."
                                className="bg-transparent w-full outline-none text-slate-200 placeholder-slate-500"
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
                                                            <span className="font-medium text-blue-400 mr-2">{result.type}</span>
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
                                                className={clsx("p-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors cursor-pointer", !notif.isRead && "bg-blue-500/10")}
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

                <div className="w-full h-full p-6 lg:p-8 overflow-y-auto">
                    {children}
                </div>
            </main>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};
