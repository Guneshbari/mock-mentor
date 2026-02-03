"use client";

import { Play, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionItemProps {
    type: string;
    date: string;
    score: number;
    sessionId?: string;
}

export function SessionItem({ type, date, score, sessionId }: SessionItemProps) {
    const getScoreColor = (score: number) => {
        if (score >= 85) return "text-green-600 bg-green-50 dark:bg-green-950/30";
        if (score >= 70) return "text-blue-600 bg-blue-50 dark:bg-blue-950/30";
        return "text-amber-600 bg-amber-50 dark:bg-amber-950/30";
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border hover:bg-accent/50 transition-all group">
            <div className="flex items-center gap-3 flex-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex-shrink-0"
                >
                    <Play className="h-4 w-4 fill-current" />
                </Button>

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                        {type}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{date}</span>
                    </div>
                </div>
            </div>

            <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getScoreColor(score)}`}>
                {score}%
            </div>
        </div>
    );
}
