"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, TrendingUp, Zap } from "lucide-react";

export function FeaturesSection() {
    const features = [
        {
            title: "Realistic Mock Interviews",
            description: "Practice with AI-powered interviews that adapt to your responses and skill level.",
            icon: Target,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: "Expert Mentorship",
            description: "Get personalized guidance and feedback from industry professionals.",
            icon: Users,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            title: "Track Your Progress",
            description: "Monitor your improvement over time with detailed analytics and insights.",
            icon: TrendingUp,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
        },
        {
            title: "Instant Feedback",
            description: "Receive real-time feedback on your responses and areas for improvement.",
            icon: Zap,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
        },
    ];

    return (
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`animate-fade-up`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <Card className="h-full border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                <CardHeader className="flex flex-col items-center pt-8 pb-4">
                                    <div className={`p-4 rounded-xl ${feature.bg} mb-4`}>
                                        <feature.icon className={`h-8 w-8 ${feature.color}`} />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-center">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-center text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
