import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// We map user role from the engineers table
interface AuthContextType {
    user: User | null;
    role: string | null;
    engineerId: string | null;
    isLoadingAuth: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [engineerId, setEngineerId] = useState<string | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // HARD SAFETY: Force auth loading to stop after 8 seconds no matter what.
    // This prevents the "Synchronizing Session" screen from hanging forever.
    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            setIsLoadingAuth(prev => {
                if (prev) console.warn('AuthContext: Safety timeout fired — forcing isLoadingAuth to false');
                return false;
            });
        }, 8000);
        return () => clearTimeout(safetyTimer);
    }, []);

    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('engineers')
                .select('id, role')
                .eq('id', userId);

            if (error) {
                console.warn('AuthContext: Could not fetch role for user:', error.message);
                setRole('engineer');
                setEngineerId(userId);
            } else if (data && data.length > 0) {
                setRole(data[0].role);
                setEngineerId(data[0].id);
            } else {
                // No engineer record — auto-create one from auth user metadata
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const meta = authUser?.user_metadata || {};
                const { error: insertError } = await supabase.from('engineers').insert({
                    id: userId,
                    name: meta.name || authUser?.email?.split('@')[0] || 'User',
                    role: meta.role?.toLowerCase().replace(/ /g, '_') || 'engineer',
                    hourly_rate: meta.hourly_rate || 0,
                    weekly_goal_hours: meta.weekly_goal_hours || 40,
                });
                if (insertError) {
                    console.warn('AuthContext: Could not auto-create engineer record:', insertError.message);
                }
                setRole(meta.role?.toLowerCase().replace(/ /g, '_') || 'engineer');
                setEngineerId(userId);
            }
        } catch (err) {
            console.error('AuthContext: fetchUserRole Exception:', err);
            setRole('engineer');
            setEngineerId(userId);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Race getSession against a timeout to prevent infinite "Synchronizing Session" hang.
                // This commonly happens when multiple tabs compete for navigator.locks.
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Session init timeout')), 5000)
                );

                let session;
                try {
                    const result = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<typeof sessionPromise>;
                    if (result.error) throw result.error;
                    session = result.data.session;
                } catch (timeoutErr) {
                    console.warn('AuthContext: getSession timed out, attempting localStorage fallback');
                    // Fallback: read the session directly from localStorage.
                    // Supabase default key format: sb-<project-ref>-auth-token
                    const storageKey = 'dec-tracker-auth';
                    const raw = localStorage.getItem(storageKey);
                    if (raw) {
                        try {
                            const parsed = JSON.parse(raw);
                            if (parsed?.access_token && parsed?.refresh_token) {
                                const { data, error } = await supabase.auth.setSession({
                                    access_token: parsed.access_token,
                                    refresh_token: parsed.refresh_token
                                });
                                if (!error && data.session) {
                                    session = data.session;
                                }
                            }
                        } catch { /* corrupt storage, ignore */ }
                    }
                }

                if (session?.user) {
                    if (mounted) setUser(session.user);
                    await fetchUserRole(session.user.id);
                }
            } catch (err) {
                console.error('AuthContext: getSession Exception:', err);
                if (mounted) {
                    setUser(null);
                    setRole(null);
                    setEngineerId(null);
                }
            } finally {
                if (mounted) setIsLoadingAuth(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                // INITIAL_SESSION is handled by initializeAuth — skip to avoid double processing
                if (event === 'INITIAL_SESSION') return;

                // For ALL events: silently update user and role without showing loading screen.
                // The loading screen is ONLY controlled by initializeAuth + safety timeout.
                try {
                    if (session?.user) {
                        setUser(session.user);
                        // Only re-fetch role on SIGNED_IN (new login)
                        if (event === 'SIGNED_IN') {
                            await fetchUserRole(session.user.id);
                        }
                    } else if (event === 'SIGNED_OUT') {
                        setUser(null);
                        setRole(null);
                        setEngineerId(null);
                    }
                } catch (err) {
                    console.error('Auth state change error:', err);
                } finally {
                    // Always ensure loading is cleared after any auth event
                    if (mounted) setIsLoadingAuth(false);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            // Force remove all channels so signOut doesn't hang on WebSocket closure
            await supabase.removeAllChannels();

            // Race signOut against a 2-second timeout to ensure the UI NEVER freezes
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Signout timeout')), 2000)
            );
            await Promise.race([supabase.auth.signOut(), timeoutPromise]);
        } catch (err) {
            console.error('AuthContext: signOut Exception:', err);
        } finally {
            setUser(null);
            setRole(null);
            setEngineerId(null);
            setIsLoadingAuth(false);
            window.location.href = '/login';
        }
    };

    // ─── Idle timeout: auto-logout after 30 min inactivity ────────
    const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const resetIdleTimer = useCallback(() => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        if (!user) return;
        idleTimer.current = setTimeout(() => {
            console.warn('AuthContext: Idle timeout — auto-signing out');
            void signOut();
        }, IDLE_TIMEOUT_MS);
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        const handler = () => resetIdleTimer();
        events.forEach(e => window.addEventListener(e, handler, { passive: true }));
        resetIdleTimer(); // start timer
        return () => {
            events.forEach(e => window.removeEventListener(e, handler));
            if (idleTimer.current) clearTimeout(idleTimer.current);
        };
    }, [user, resetIdleTimer]);

    return (
        <AuthContext.Provider value={{ user, role, engineerId, isLoadingAuth, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
