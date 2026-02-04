"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Calendar,
    Clock,
    TrendingUp,
    Award,
    Search,
    Play,
    Download,
    Filter,
    Loader2
} from "lucide-react";
import { getSessionHistory, type Session, type DashboardStats } from "@/lib/api/dashboard";
import { getDashboardStats } from "@/lib/api/dashboard";
import { formatSessionDate, getRelativeTime } from "@/lib/utils/timezone";

export function SessionsSection() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortBy, setSortBy] = useState<"date" | "score">("date");

    // Data state
    const [sessions, setSessions] = useState<Session[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0, hasMore: false });

    // Fetch sessions with current filters
    const fetchSessions = async (offset = 0) => {
        try {
            setLoading(true);
            setError(null);

            const [sessionsData, statsData] = await Promise.all([
                getSessionHistory({
                    limit: pagination.limit,
                    offset,
                    sortBy,
                    filterType: filterType !== "all" ? filterType : undefined,
                    search: searchQuery || undefined
                }),
                stats ? Promise.resolve(stats) : getDashboardStats()
            ]);

            setSessions(sessionsData.sessions);
            setPagination(sessionsData.pagination);
            if (!stats) setStats(statsData);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    // Initial load and refetch on filter changes
    useEffect(() => {
        fetchSessions(0);
    }, [sortBy, filterType]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== undefined) {
                fetchSessions(0);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const getScoreColor = (score: number) => {
        if (score >= 85) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
        if (score >= 70) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    };

    // Format date in IST timezone
    const formatDate = (dateString: string) => {
        return formatSessionDate(dateString);
    };

    // Calculate statistics from API data
    const totalSessions = stats?.totalSessions || 0;
    const averageScore = stats?.averageScore || 0;
    const totalTime = stats?.totalTime || 0;
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;
    const bestScore = stats?.bestScore || 0;

    const formatSessionType = (type: string) => {
        switch (type.toLowerCase()) {
            case 'hr': return 'HR Interview';
            case 'technical': return 'Technical Interview';
            case 'behavioral': return 'Behavioral Interview';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="animate-fade-down">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                    Session History
                </h1>
                <p className="text-muted-foreground">
                    Review all your practice sessions and track your progress
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Sessions</p>
                                <p className="text-2xl font-bold">{totalSessions}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Average Score</p>
                                <p className="text-2xl font-bold">{averageScore}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Clock className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Time</p>
                                <p className="text-2xl font-bold">
                                    {hours}h {minutes}m
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Award className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Best Score</p>
                                <p className="text-2xl font-bold">
                                    {bestScore}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="animate-fade-up" style={{ animationDelay: "100ms" }}>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search sessions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Filter by Type */}
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full sm:w-48">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="behavioral">Behavioral</SelectItem>
                                <SelectItem value="hr">HR</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort */}
                        <Select
                            value={sortBy}
                            onValueChange={(value) => setSortBy(value as "date" | "score")}
                        >
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">Most Recent</SelectItem>
                                <SelectItem value="score">Highest Score</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Sessions List */}
            <div className="space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
                {loading ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                            <Loader2 className="h-16 w-16 text-muted-foreground/30 mb-4 animate-spin" />
                            <p className="text-muted-foreground">Loading sessions...</p>
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                            <p className="text-destructive mb-2">Error loading sessions</p>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </CardContent>
                    </Card>
                ) : sessions.length > 0 ? (
                    sessions.map((session, index) => (
                        <Card
                            key={session.id}
                            className="group hover:shadow-md transition-all duration-200 hover:border-primary/30"
                            style={{ animationDelay: `${300 + index * 50}ms` }}
                        >
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Session Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <h3 className="text-lg font-semibold text-foreground">
                                                {formatSessionType(session.type)}
                                            </h3>
                                            <Badge variant="secondary" className="w-fit">
                                                {session.role}
                                            </Badge>
                                            {session.score !== null && (
                                                <Badge
                                                    variant="outline"
                                                    className={`w-fit ${getScoreColor(session.score)}`}
                                                >
                                                    Score: {session.score}%
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4" />
                                                <span title={formatDate(session.date)}>
                                                    {getRelativeTime(session.date)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-4 w-4" />
                                                {session.duration}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Award className="h-4 w-4" />
                                                {session.questions} questions
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                        >
                                            <Play className="h-4 w-4" />
                                            <span className="hidden sm:inline">Review</span>
                                        </Button>
                                        <Button variant="ghost" size="icon-sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                            <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No sessions found</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Load More */}
            {!loading && sessions.length > 0 && pagination.hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => fetchSessions(pagination.offset + pagination.limit)}
                    >
                        Load More Sessions
                    </Button>
                </div>
            )}
        </div>
    );
}
