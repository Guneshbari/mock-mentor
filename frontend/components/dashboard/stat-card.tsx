"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
    label: string;
    value: string | number;
    subtitle?: string;
    delay?: number;
}

export function StatCard({
    icon: Icon,
    iconColor,
    iconBgColor,
    label,
    value,
    subtitle,
    delay = 0,
}: StatCardProps) {
    return (
        <Card
            className="hover-lift animate-fade-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                            {label}
                        </p>
                        <p className="text-3xl font-bold text-foreground mb-1">
                            {value}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div
                        className={`p-3 rounded-lg ${iconBgColor}`}
                        style={{ backgroundColor: `${iconBgColor}15` }}
                    >
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
