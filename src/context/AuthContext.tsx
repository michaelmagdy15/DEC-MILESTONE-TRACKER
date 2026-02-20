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
            // Assume the engineers table id matches auth.uid(), or we map it via auth user id.
            // For now, let's query the engineers table where the email matches or where id = auth.uid()
            const { data, error } = await supabase
                .from('engineers')
                .select('id, role')
                .eq('id', userId)
                .single();

            if (error) {
                // If no profile found, maybe it's a completely new user.
                console.warn('Could not fetch role for user:', error.message);
                setRole('engineer'); // Default restriction
                setEngineerId(null);
            } else if (data) {
                setRole(data.role);
                setEngineerId(data.id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            // ensure we map correctly
        }
    };

    useEffect(() => {
        // Initialize Auth Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                fetchUserRole(session.user.id).finally(() => setIsLoadingAuth(false));
            } else {
                setUser(null);
                setRole(null);
                setIsLoadingAuth(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    await fetchUserRole(session.user.id);
                } else {
                    setUser(null);
                    setRole(null);
                    setEngineerId(null);
                }
                setIsLoadingAuth(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        setIsLoadingAuth(true);
        await supabase.auth.signOut();
        setIsLoadingAuth(false);
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
