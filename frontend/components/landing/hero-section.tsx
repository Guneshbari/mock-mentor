"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden py-24 lg:py-32">
            {/* Background Gradient/Effects */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute left-0 top-0 -z-10 h-full w-full bg-background/50 radial-gradient-[circle_800px_at_100%_200px,#7c3aed0a,transparent]"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center animate-fade-in space-y-8">
                    <div className="relative rounded-full px-3 py-1 text-sm leading-6 ring-1 ring-border/50 hover:ring-border transition-all duration-300">
                        <span className="text-muted-foreground mr-1">New:</span>
                        <span className="font-semibold text-primary">Gemini 2.0 Integration</span>
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
                        Master Your Interview Skills with{" "}
                        <span className="text-primary">AI-Powered Practice</span>
                    </h1>

                    <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
                        Mock Mentor helps students and early professionals prepare for interviews with realistic practice sessions and personalized feedback from industry-standard AI.
                    </p>

                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Button asChild size="lg" className="h-12 px-8 text-lg rounded-full elevation-2 hover:elevation-4 transition-all duration-300 bg-primary hover:bg-primary/90">
                            <Link href="/signup">
                                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full hover:bg-muted transition-all duration-300">
                            <Link href="/login">
                                Sign In
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
