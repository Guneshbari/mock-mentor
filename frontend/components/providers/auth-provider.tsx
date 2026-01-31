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
                if (session) {
                    setSession(session);
                    setUser(session.user);
                } else {
                    // Inject Guest User
                    console.log("No session found, using guest user");
                    const guestUser: any = {
                        id: 'guest-user-123',
                        email: 'guest@mockmentor.ai',
                        user_metadata: {
                            name: 'Guest User',
                            avatar_url: '',
                        },
                        aud: 'authenticated',
                        role: 'authenticated',
                    };
                    setUser(guestUser);
                    setSession(null); // Keep session null to indicate no real auth
                }
            } catch (error) {
                console.error("Error checking auth session:", error);
            } finally {
                setIsLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (_event, session) => {
                    setSession(session);
                    if (session) {
                        setUser(session.user);
                    }
                    // If signed out, we might want to re-inject guest, but for now let's just leave it
                    // logic here is less critical since we removed auth pages
                    setIsLoading(false);
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
