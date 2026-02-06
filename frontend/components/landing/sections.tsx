"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, ArrowRight, Zap, Briefcase, BrainCircuit, LineChart, Github, Star, CheckCircle } from "lucide-react";

export function Hero() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();
    }, []);

    return (
        <section className="relative pt-32 pb-16 md:pt-48 md:pb-32 overflow-hidden">
            <div className="container-responsive relative z-10 text-center">
                <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl max-w-4xl mx-auto">
                    Master Your Interviews with <span className="text-primary">AI-Powered</span> Mock Sessions
                </h1>
                <p className="max-w-2xl mx-auto mb-10 text-lg text-muted-foreground">
                    Practice standard, role-specific, and behavioral interviews with our advanced AI mentor. Get real-time feedback and improve your confidence.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <Button asChild size="lg" className="w-full sm:w-auto text-lg h-12 px-8">
                        <Link href="/dashboard">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                    {!user && (
                        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg h-12 px-8">
                            <Link href="/login">Login</Link>
                        </Button>
                    )}
                </div>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none" />
        </section>
    );
}

export function Features() {
    const features = [
        {
            icon: Zap,
            title: "Real-Time Feedback",
            description: "Receive instant analysis on your answers, tone, and pacing during the interview."
        },
        {
            icon: Briefcase,
            title: "Role-Specific Questions",
            description: "Practice with questions tailored to software engineering, product management, and more."
        },
        {
            icon: BrainCircuit,
            title: "Behavioral & Technical",
            description: "Cover both soft skills and technical knowledge with our comprehensive question bank."
        },
        {
            icon: LineChart,
            title: "Performance Analytics",
            description: "Track your progress over time with detailed reports and improvement insights."
        }
    ];

    return (
        <section className="py-20 bg-muted/30">
            <div className="container-responsive">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to succeed</h2>
                    <p className="text-muted-foreground">Comprehensive tools designed to help you ace your next interview.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="p-6 bg-background rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                                <Icon className="w-10 h-10 text-primary mb-4" />
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}


export function OpenSourceSection() {
    return (
        <section className="py-24">
            <div className="container-responsive">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-6">Why Choose Mock Mentor?</h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Our platform is designed specifically for students and early-career professionals who want to build confidence and improve their interview performance.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Build confidence for real interviews",
                                "Identify strengths and weaknesses",
                                "Practice at your own pace",
                                "Improve communication skills"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                    <span className="text-foreground">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-muted/30 p-8 rounded-2xl border relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Github className="w-32 h-32" />
                        </div>

                        <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
                        <p className="text-muted-foreground mb-6">
                            Join thousands of users improving their interview skills. Mock Mentor is completely open source!
                        </p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between border-b pb-4">
                                <span className="font-medium">Open Source Access</span>
                                <span className="font-bold text-xl">$0</span>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    "Unlimited practice sessions",
                                    "Full AI feedback & analytics",
                                    "Community support"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button asChild size="lg" className="w-full">
                                <Link href="/signup">Create Free Account</Link>
                            </Button>

                            <Button asChild variant="outline" size="lg" className="w-full">
                                <Link href="https://github.com/Guneshbari/mock-mentor" target="_blank" rel="noopener noreferrer">
                                    <Star className="w-4 h-4 mr-2" />
                                    Star on GitHub
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function Footer() {
    return (
        <section className="py-24 pb-32 bg-muted/30">
            <div className="container-responsive text-center">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Start Practicing Today</h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Don't let interview anxiety hold you back. Build your confidence with Mock Mentor.
                </p>
                <Button asChild size="lg" className="h-12 px-8 text-lg">
                    <Link href="/dashboard">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
            </div>
        </section>
    );
}
