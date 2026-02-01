"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export function Hero() {
    return (
        <section className="relative pt-32 pb-16 md:pt-48 md:pb-32 overflow-hidden">
            <div className="container relative z-10 px-4 mx-auto text-center">
                <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl max-w-4xl mx-auto">
                    Master Your Interviews with <span className="text-primary">AI-Powered</span> Mock Sessions
                </h1>
                <p className="max-w-2xl mx-auto mb-10 text-lg text-muted-foreground">
                    Practice standard, role-specific, and behavioral interviews with our advanced AI mentor. Get real-time feedback and improve your confidence.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button asChild size="lg" className="w-full sm:w-auto text-lg h-12 px-8">
                        <Link href="/signup">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg h-12 px-8">
                        <Link href="/login">Login</Link>
                    </Button>
                </div>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none" />
        </section>
    );
}

export function Features() {
    const features = [
        {
            title: "Real-Time Feedback",
            description: "Receive instant analysis on your answers, tone, and pacing during the interview."
        },
        {
            title: "Role-Specific Questions",
            description: "Practice with questions tailored to software engineering, product management, and more."
        },
        {
            title: "Behavioral & Technical",
            description: "Cover both soft skills and technical knowledge with our comprehensive question bank."
        },
        {
            title: "Performance Analytics",
            description: "Track your progress over time with detailed reports and improvement insights."
        }
    ];

    return (
        <section className="py-20 bg-muted/30">
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to succeed</h2>
                    <p className="text-muted-foreground">Comprehensive tools designed to help you ace your next interview.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="p-6 bg-background rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                            <CheckCircle2 className="w-10 h-10 text-primary mb-4" />
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function Footer() {
    return (
        <footer className="py-12 border-t mt-auto">
            <div className="container px-4 mx-auto text-center text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Mock Mentor AI. All rights reserved.</p>
            </div>
        </footer>
    );
}
