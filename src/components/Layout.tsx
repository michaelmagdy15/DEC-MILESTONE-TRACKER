import React from 'react';
import { LayoutDashboard, FolderKanban, Users, FileText, PieChart, Menu, X, LogOut, CalendarCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                    ? 'bg-blue-600/10 text-blue-600 font-medium'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            )}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </Link>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { role, signOut, user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block h-full",
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
                        {role === 'admin' && <NavItem to="/projects" icon={FolderKanban} label="Projects" />}
                        {role === 'admin' && <NavItem to="/engineers" icon={Users} label="Engineers" />}
                        <NavItem to="/entries" icon={FileText} label="Daily Entries" />
                        <NavItem to="/attendance" icon={CalendarCheck} label="Attendance" />
                        <NavItem to="/reports" icon={PieChart} label="Reports" />
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
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center">
                        <Logo className="scale-75 origin-left" />
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                <div className="w-full h-full p-6 lg:p-8">
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
