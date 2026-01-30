"use client";

import { Check, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PricingSection() {
    return (
        <section className="py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Side: Why Choose Us */}
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-bold sm:text-4xl text-foreground">
                            Why Choose Mock Mentor?
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-lg">
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
                                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-foreground">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Open Source Card */}
                    <div className="relative animate-fade-in" style={{ animationDelay: "200ms" }}>
                        <div className="absolute inset-0 bg-primary/10 blur-3xl transform rotate-3 scale-95 rounded-[3rem]"></div>
                        <div className="relative bg-card border border-border/50 rounded-3xl p-8 shadow-xl elevation-3">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold">Free & Open Source</h3>
                                <p className="text-muted-foreground mt-2">
                                    Mock Mentor is completely free to use and open source. Contribute, learn, and grow with the community.
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {[
                                    "Completely Free for Everyone",
                                    "No Hidden Fees or Subscriptions",
                                    "Community Driven Development",
                                    "Powered by Gemini 2.0 Flash"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col gap-3">
                                <Button asChild className="w-full text-lg h-12 rounded-xl shadow-lg hover:shadow-primary/25 transition-all duration-300">
                                    <Link href="/signup">
                                        Create Free Account
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full h-12 rounded-xl">
                                    <Link href="https://github.com/guneshbari/mock-mentor" target="_blank" rel="noreferrer">
                                        <Github className="mr-2 h-5 w-5" />
                                        Star on GitHub
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
