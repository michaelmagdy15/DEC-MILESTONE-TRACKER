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
            console.log("AuthContext: fetchUserRole for", userId);
            const { data, error } = await supabase
                .from('engineers')
                .select('id, role')
                .eq('id', userId);

            if (error) {
                console.warn('AuthContext: Could not fetch role for user:', error.message);
                setRole('engineer');
                setEngineerId(userId);
            } else if (data && data.length > 0) {
                console.log("AuthContext: Found role:", data[0].role);
                setRole(data[0].role);
                setEngineerId(data[0].id);
            } else {
                console.warn("AuthContext: No engineer record found in DB for user, using defaults.");
                setRole('engineer');
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

        // Fallback timeout to ensure we never get stuck on the "Loading session..." screen indefinitely
        const timeoutId = setTimeout(() => {
            if (mounted && isLoadingAuth) {
                setIsLoadingAuth(false);
            }
        }, 2000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!mounted) return;

                console.log("AuthContext: onAuthStateChange event:", _event, "session:", !!session);

                try {
                    if (session?.user) {
                        console.log("AuthContext: Setting user from session:", session.user.id);
                        setUser(session.user);
                        await fetchUserRole(session.user.id);
                    } else {
                        console.log("AuthContext: Session user is null, clearing states.");
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

        // Fetch initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                console.log("AuthContext: getSession returned session:", !!session);
                if (session?.user) {
                    setUser(session.user);
                    fetchUserRole(session.user.id).finally(() => {
                        setIsLoadingAuth(false);
                    });
                } else {
                    setUser(null);
                    setIsLoadingAuth(false);
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId); // Clear timeout on unmount as well
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        console.log("AuthContext: signOut initiated");
        try {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('AuthContext: Supabase signOut error:', error);
            else console.log("AuthContext: Supabase signOut successful");
        } catch (err) {
            console.error('AuthContext: signOut Exception:', err);
        } finally {
            console.log("AuthContext: Clearing local auth state");
            setUser(null);
            setRole(null);
            setEngineerId(null);
            setIsLoadingAuth(false);
            // Optional: force redirect if Navigate doesn't catch it
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
