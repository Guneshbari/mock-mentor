"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FooterCTA() {
    return (
        <section className="py-24 bg-muted/50 text-center">
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl font-bold sm:text-4xl mb-6">
                    Start Practicing Today
                </h2>
                <p className="text-lg text-muted-foreground mb-10">
                    Don't let interview anxiety hold you back. Build your confidence with Mock Mentor.
                </p>
                <Button asChild size="lg" className="h-12 px-8 text-lg rounded-full elevation-2 hover:elevation-4 transition-all duration-300">
                    <Link href="/signup">
                        Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </section>
    );
}
