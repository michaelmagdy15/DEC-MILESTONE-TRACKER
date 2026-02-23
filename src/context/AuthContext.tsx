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
                setEngineerId(userId); // Fallback to userId
            } else if (data) {
                setRole(data.role);
                setEngineerId(data.id);
            }
        } catch (err) {
            console.error('fetchUserRole Error:', err);
            setRole('engineer');
            setEngineerId(userId);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Fallback timeout to ensure we never get stuck on the "Loading session..." screen indefinitely
        const timeoutId = setTimeout(() => {
            if (mounted && isLoadingAuth) {
                setIsLoadingAuth(false);
            }
        }, 2000);

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
                    setUser(null);
                    setRole(null);
                    setEngineerId(null);
                } finally {
                    clearTimeout(timeoutId);
                    if (mounted) setIsLoadingAuth(false);
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeoutId); // Clear timeout on unmount as well
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Sign Out Error:', err);
        } finally {
            // Force state clear to ensure UI updates regardless of remote success
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
