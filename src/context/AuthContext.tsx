import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

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
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

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

                // USER_UPDATED fires when password/email is changed while already logged in.
                // We do NOT want to re-fetch role or clear state in that case.
                if (event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
                    return;
                }

                try {
                    setIsLoadingAuth(true);
                    if (session?.user) {
                        setUser(session.user);
                        await fetchUserRole(session.user.id);
                    } else {
                        setUser(null);
                        setRole(null);
                        setEngineerId(null);
                    }
                } catch (err) {
                    console.error('Auth state change error:', err);
                    setUser(null);
                    setRole(null);
                    setEngineerId(null);
                } finally {
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
