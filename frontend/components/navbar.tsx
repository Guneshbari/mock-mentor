"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        const checkUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setUser(session?.user ?? null);
            });

            return () => {
                subscription.unsubscribe();
            };
        };
        checkUser();

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!mounted) {
        return (
            <nav className="fixed top-0 left-0 right-0 z-[1000] bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-3">
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                            <div className="text-lg font-bold text-foreground">
                                Mock Mentor AI
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 bg-background/80 backdrop-blur-md border-b ${scrolled
                ? "border-border/50 shadow-sm"
                : "border-border/20"
                }`}
        >
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-3">
                    {/* Logo / Brand */}
                    <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0">
                        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">M</span>
                        </div>
                        <div className="text-lg font-bold text-foreground">
                            Mock Mentor AI
                        </div>
                    </a>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="rounded-md hover:bg-muted"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-4 w-4" />
                            ) : (
                                <Moon className="h-4 w-4" />
                            )}
                        </Button>

                        {/* Auth Buttons */}
                        {loading ? (
                            <div className="w-20 h-8 animate-pulse bg-muted rounded flex-shrink-0" />
                        ) : user ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-medium hidden sm:inline-block">
                                    {user.email?.split('@')[0]}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                        const supabase = createClient();
                                        await supabase.auth.signOut();
                                        setUser(null);
                                        window.location.href = "/";
                                    }}
                                >
                                    Logout
                                </Button>
                                <Button asChild size="sm">
                                    <a href="/dashboard">Dashboard</a>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button asChild variant="ghost" size="sm">
                                    <a href="/login">Login</a>
                                </Button>
                                <Button asChild size="sm">
                                    <a href="/signup">Sign Up</a>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
