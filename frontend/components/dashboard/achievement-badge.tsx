"use client";

interface AchievementBadgeProps {
    icon: string;
    name: string;
}

export function AchievementBadge({ icon, name }: AchievementBadgeProps) {
    // Ensure icon is not duplicated (in case backend returns "🎉 🎉")
    const cleanIcon = icon ? icon.trim().split(' ')[0] : '🏆';
    
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
            <div className="text-2xl flex-shrink-0">{cleanIcon}</div>
            <span className="text-sm font-medium text-foreground">{name}</span>
        </div>
    );
}
