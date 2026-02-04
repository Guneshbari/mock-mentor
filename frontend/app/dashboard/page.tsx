"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { SessionItem } from "@/components/dashboard/session-item";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { AchievementBadge } from "@/components/dashboard/achievement-badge";
import { ProfileSection } from "@/components/dashboard/profile-section";
import { SessionsSection } from "@/components/dashboard/sessions-section";
import { useTheme } from "next-themes";
import { getDashboardStats, getSessionHistory, type DashboardStats, type Session } from "@/lib/api/dashboard";
import {
    Play,
    Target,
    Clock,
    Award,
    TrendingUp,
    User,
    LayoutDashboard,
    History,
    Lightbulb,
    Sun,
    Moon,
    LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardPage() {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"dashboard" | "sessions" | "profile">("dashboard");

    // Dashboard data state
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            setUser(user);
            setLoading(false);
        };

        checkAuth();

        // Check URL parameters for tab
        const tabParam = searchParams.get('tab');
        if (tabParam && ['dashboard', 'sessions', 'profile'].includes(tabParam)) {
            setActiveTab(tabParam as "dashboard" | "sessions" | "profile");
        }
    }, [router, searchParams]);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;

            try {
                setDataLoading(true);
                setDataError(null);

                // Fetch stats and recent sessions in parallel
                const [stats, sessionsData] = await Promise.all([
                    getDashboardStats(),
                    getSessionHistory({ limit: 5, sortBy: 'date' })
                ]);

                setDashboardStats(stats);
                setRecentSessions(sessionsData.sessions);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setDataError(error instanceof Error ? error.message : 'Failed to load dashboard data');
            } finally {
                setDataLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    const userName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

    // Convert dashboard stats to stat cards
    const formatTime = (minutes: number) => {
        if (minutes === 0) return "0h";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const stats = dashboardStats ? [
        {
            icon: Target,
            iconColor: "text-primary",
            iconBgColor: "oklch(0.52 0.14 240)",
            label: "Sessions Completed",
            value: dashboardStats.totalSessions,
            subtitle: dataLoading ? "Loading..." : "Total sessions",
            delay: 0,
        },
        {
            icon: TrendingUp,
            iconColor: "text-blue-600",
            iconBgColor: "oklch(0.60 0.18 250)",
            label: "Average Score",
            value: dataLoading ? "--" : `${dashboardStats.averageScore}%`,
            subtitle: dataLoading ? "Loading..." : (dashboardStats.recentTrend > 0 ? `+${dashboardStats.recentTrend}% improvement` : dashboardStats.recentTrend < 0 ? `${dashboardStats.recentTrend}% decline` : "No change"),
            delay: 100,
        },
        {
            icon: Clock,
            iconColor: "text-purple-600",
            iconBgColor: "oklch(0.60 0.18 290)",
            label: "Total Practice Time",
            value: dataLoading ? "--" : formatTime(dashboardStats.totalTime),
            subtitle: "All time",
            delay: 200,
        },
        {
            icon: Award,
            iconColor: "text-amber-600",
            iconBgColor: "oklch(0.72 0.16 75)",
            label: "Best Score",
            value: dataLoading ? "--" : `${dashboardStats.bestScore}%`,
            subtitle: "Personal best",
            delay: 300,
        },
    ] : [];

    const goals = [
        {
            goal: "Complete 15 practice sessions",
            progress: 80,
            delay: 0,
        },
        {
            goal: "Master behavioral questions",
            progress: 60,
            delay: 100,
        },
        {
            goal: "Achieve 90% average score",
            progress: 45,
            delay: 200,
        },
    ];

    const achievements = [
        { icon: "🎯", name: "First Session" },
        { icon: "🔥", name: "10 Sessions" },
        { icon: "⭐", name: "Perfect Score" },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Custom Navbar for Dashboard */}
            <nav className="fixed top-0 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-md border-b border-border">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-3">
                        {/* Logo */}
                        <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0">
                            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-sm">M</span>
                            </div>
                            <div className="text-lg font-bold text-foreground hidden sm:block">
                                Mock Mentor
                            </div>
                        </a>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center max-w-md">
                            <Button
                                variant={activeTab === "dashboard" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setActiveTab("dashboard")}
                                className="gap-2"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Button>
                            <Button
                                variant={activeTab === "sessions" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setActiveTab("sessions")}
                                className="gap-2"
                            >
                                <History className="h-4 w-4" />
                                <span className="hidden sm:inline">Sessions</span>
                            </Button>
                            <Button
                                variant={activeTab === "profile" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setActiveTab("profile")}
                                className="gap-2"
                            >
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">Profile</span>
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="rounded-md hover:bg-muted mr-1"
                                aria-label="Toggle theme"
                            >
                                {theme === "dark" ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </Button>
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
                                    <DropdownMenuItem
                                        onClick={async () => {
                                            const supabase = createClient();
                                            await supabase.auth.signOut();
                                            router.push("/");
                                        }}
                                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-16">
                {activeTab === "dashboard" && (
                    <div className="container-responsive py-8 space-y-8">
                        {/* Welcome Section */}
                        <div className="animate-fade-down">
                            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                                Welcome back, {userName}
                            </h1>
                            <p className="text-muted-foreground">
                                Here's your progress overview
                            </p>
                        </div>

                        {/* Ready to Practice Section */}
                        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 animate-fade-up">
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                                            Ready to practice?
                                        </h2>
                                        <p className="text-muted-foreground">
                                            Start a new session and continue improving your skills
                                        </p>
                                    </div>
                                    <Button
                                        size="lg"
                                        className="gap-2 flex-shrink-0 w-full sm:w-auto"
                                        onClick={() => router.push("/interview-setup")}
                                    >
                                        <Play className="h-5 w-5" />
                                        Start New Session
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {stats.map((stat, index) => (
                                <StatCard key={index} {...stat} />
                            ))}
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Sessions */}
                            <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "100ms" }}>
                                <CardHeader>
                                    <CardTitle>Recent Sessions</CardTitle>
                                    <CardDescription>Your latest practice sessions</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {recentSessions.map((session, index) => (
                                        <SessionItem key={index} {...session} />
                                    ))}
                                    <Button
                                        variant="ghost"
                                        className="w-full mt-4"
                                        onClick={() => setActiveTab("sessions")}
                                    >
                                        View All Sessions
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Your Goals */}
                            <Card className="animate-fade-up" style={{ animationDelay: "200ms" }}>
                                <CardHeader>
                                    <CardTitle>Your Goals</CardTitle>
                                    <CardDescription>Track your progress</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {goals.map((goal, index) => (
                                        <GoalProgress key={index} {...goal} />
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bottom Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Performance Trend Placeholder */}
                            <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "300ms" }}>
                                <CardHeader>
                                    <CardTitle>Performance Trend</CardTitle>
                                    <CardDescription>Your progress over the last 30 days</CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-center h-48">
                                    <div className="text-center">
                                        <TrendingUp className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                        <p className="text-sm text-muted-foreground">Chart visualization</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Right Sidebar */}
                            <div className="space-y-6">
                                {/* Recent Achievements */}
                                <Card className="animate-fade-up" style={{ animationDelay: "400ms" }}>
                                    <CardHeader>
                                        <CardTitle>Recent Achievements</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {achievements.map((achievement, index) => (
                                            <AchievementBadge key={index} {...achievement} />
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Pro Tip */}
                                <Card className="animate-fade-up bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800" style={{ animationDelay: "500ms" }}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                                            <Lightbulb className="h-5 w-5" />
                                            Pro Tip
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            Practice for 15-20 minutes daily for best results. Consistency is key to improving your interview skills!
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "sessions" && (
                    <div className="container-responsive py-8">
                        <SessionsSection />
                    </div>
                )}

                {activeTab === "profile" && (
                    <div className="container-responsive py-8">
                        <ProfileSection user={user} />
                    </div>
                )}
            </main>
        </div>
    );
}
