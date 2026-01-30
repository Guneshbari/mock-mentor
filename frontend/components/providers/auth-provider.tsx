"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isLoading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error("Error checking auth session:", error);
            } finally {
                setIsLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (_event, session) => {
                    setSession(session);
                    setUser(session?.user ?? null);
                    setIsLoading(false);

                    if (_event === 'SIGNED_OUT') {
                        router.push('/');
                        router.refresh();
                    } else if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
                        router.refresh();
                        if (_event === 'SIGNED_IN') router.push('/dashboard');
                    }
                }
            );

            return () => subscription.unsubscribe();
        };

        initializeAuth();
    }, [router]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
