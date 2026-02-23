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
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Could not fetch role for user:', error.message);
                setRole('engineer');
                setEngineerId(null);
            } else if (data) {
                setRole(data.role);
                setEngineerId(data.id);
            }
        } catch (err) {
            console.error('fetchUserRole Error:', err);
            setRole('engineer');
            setEngineerId(null);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Add a timeout to prevent getSession from hanging indefinitely
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: any }, error: any }>((_, reject) =>
                    setTimeout(() => reject(new Error('Auth session fetch timeout')), 5000)
                );

                const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
                if (error) throw error;

                if (session?.user) {
                    if (mounted) setUser(session.user);
                    await fetchUserRole(session.user.id);
                } else {
                    if (mounted) {
                        setUser(null);
                        setRole(null);
                        setEngineerId(null);
                    }
                }
            } catch (err) {
                console.error("Auth Session Error:", err);
                if (mounted) {
                    setUser(null);
                    setRole(null);
                    setEngineerId(null);
                }
            } finally {
                setIsLoadingAuth(false);
            }
        };

        initializeAuth();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!mounted) return;

                try {
                    if (session?.user) {
                        setUser(session.user);
                        await fetchUserRole(session.user.id);
                    } else {
                        setUser(null);
                        setRole(null);
                        setEngineerId(null);
                    }
                } catch (err) {
                    console.error("Auth state change error:", err);
                } finally {
                    setIsLoadingAuth(false);
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
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Sign Out Error:', err);
            // Force local state clear if remote signout fails
            setUser(null);
            setRole(null);
            setEngineerId(null);
            setIsLoadingAuth(false);
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
