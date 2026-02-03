"use client";

import { useEffect, useState } from "react";

interface GoalProgressProps {
    goal: string;
    progress: number;
    delay?: number;
}

export function GoalProgress({ goal, progress, delay = 0 }: GoalProgressProps) {
    const [animatedProgress, setAnimatedProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progress);
        }, delay);
        return () => clearTimeout(timer);
    }, [progress, delay]);

    const getProgressColor = (value: number) => {
        if (value >= 80) return "bg-primary";
        if (value >= 50) return "bg-blue-500";
        return "bg-primary/70";
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{goal}</span>
                <span className="text-muted-foreground font-semibold">{progress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full ${getProgressColor(progress)} transition-all duration-1000 ease-out rounded-full`}
                    style={{ width: `${animatedProgress}%` }}
                />
            </div>
        </div>
    );
}
