"use client";

import { Moon, Sun, LogOut, LayoutDashboard, User, Settings, MessageSquare, History } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20">
                                        <Avatar className="h-9 w-9 border border-border bg-muted">
                                            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || "User"} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                {user.email?.charAt(0).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" side="bottom" sideOffset={10} forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <a href="/dashboard" className="cursor-pointer flex w-full items-center">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a href="/dashboard?tab=sessions" className="cursor-pointer flex w-full items-center">
                                            <History className="mr-2 h-4 w-4" />
                                            <span>Sessions</span>
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a href="/dashboard?tab=profile" className="cursor-pointer flex w-full items-center">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <a href="/interview-setup" className="cursor-pointer flex w-full items-center">
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            <span>Start Interview</span>
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={async () => {
                                            const supabase = createClient();
                                            await supabase.auth.signOut();
                                            setUser(null);
                                            window.location.href = "/";
                                        }}
                                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
