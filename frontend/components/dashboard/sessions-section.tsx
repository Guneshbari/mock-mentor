"use client";

import { useState } from "react";
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
    Filter
} from "lucide-react";

// Mock data - will be replaced with real data from backend
const mockSessions = [
    {
        id: "1",
        type: "Technical Interview",
        role: "Software Engineer",
        date: "2026-01-26",
        duration: "25 min",
        score: 88,
        questions: 5,
        status: "completed",
    },
    {
        id: "2",
        type: "Behavioral Questions",
        role: "Product Manager",
        date: "2026-01-24",
        duration: "30 min",
        score: 92,
        questions: 6,
        status: "completed",
    },
    {
        id: "3",
        type: "Case Study",
        role: "Business Analyst",
        date: "2026-01-22",
        duration: "45 min",
        score: 79,
        questions: 3,
        status: "completed",
    },
    {
        id: "4",
        type: "Technical Interview",
        role: "Frontend Developer",
        date: "2026-01-20",
        duration: "28 min",
        score: 85,
        questions: 5,
        status: "completed",
    },
    {
        id: "5",
        type: "Behavioral Questions",
        role: "Software Engineer",
        date: "2026-01-18",
        duration: "22 min",
        score: 91,
        questions: 4,
        status: "completed",
    },
    {
        id: "6",
        type: "Technical Interview",
        role: "Backend Developer",
        date: "2026-01-15",
        duration: "32 min",
        score: 76,
        questions: 6,
        status: "completed",
    },
];

export function SessionsSection() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortBy, setSortBy] = useState("recent");

    const getScoreColor = (score: number) => {
        if (score >= 85) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
        if (score >= 70) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const filteredSessions = mockSessions
        .filter((session) => {
            const matchesSearch =
                session.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                session.role.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === "all" || session.type === filterType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === "recent") {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            if (sortBy === "score") {
                return b.score - a.score;
            }
            return 0;
        });

    // Calculate statistics
    const totalSessions = mockSessions.length;
    const averageScore = Math.round(
        mockSessions.reduce((sum, s) => sum + s.score, 0) / mockSessions.length
    );
    const totalTime = mockSessions.reduce((sum, s) => {
        const minutes = parseInt(s.duration);
        return sum + minutes;
    }, 0);
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;

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
                                    {Math.max(...mockSessions.map((s) => s.score))}%
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
                                <SelectItem value="Technical Interview">Technical</SelectItem>
                                <SelectItem value="Behavioral Questions">Behavioral</SelectItem>
                                <SelectItem value="Case Study">Case Study</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Most Recent</SelectItem>
                                <SelectItem value="score">Highest Score</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Sessions List */}
            <div className="space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
                {filteredSessions.length > 0 ? (
                    filteredSessions.map((session, index) => (
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
                                                {session.type}
                                            </h3>
                                            <Badge variant="secondary" className="w-fit">
                                                {session.role}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={`w-fit ${getScoreColor(session.score)}`}
                                            >
                                                Score: {session.score}%
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(session.date)}
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
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                            <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">
                                No sessions found matching your criteria
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Load More */}
            {filteredSessions.length > 0 && (
                <div className="flex justify-center pt-4">
                    <Button variant="outline" size="lg">
                        Load More Sessions
                    </Button>
                </div>
            )}
        </div>
    );
}
