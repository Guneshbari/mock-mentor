"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // User selections
    const [profile, setProfile] = useState<string[]>([]);
    const [experience, setExperience] = useState<string[]>([]);
    const [goals, setGoals] = useState<string[]>([]);

    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    const toggleSelection = (value: string, currentArray: string[], setter: (arr: string[]) => void) => {
        if (currentArray.includes(value)) {
            setter(currentArray.filter(item => item !== value));
        } else {
            setter([...currentArray, value]);
        }
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error("Not authenticated");
                return;
            }

            // Save onboarding via backend API (uses service role key, bypasses RLS)
            const response = await fetch('http://localhost:8000/api/dashboard/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    profile_types: profile,
                    experience_years: experience[0] || null,
                    goals: goals,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Onboarding save error:", errorData);
                toast.error(errorData.message || "Failed to save preferences");
                return;
            }

            toast.success("Profile setup complete!");
            router.push("/dashboard");
        } catch (error) {
            console.error("Unexpected error:", error);
            const errMsg = error instanceof Error ? error.message : String(error);
            toast.error(`Error: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const canContinue = () => {
        if (step === 1) return profile.length > 0;
        if (step === 2) return experience.length > 0;
        if (step === 3) return goals.length > 0;
        return false;
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
                            M
                        </div>
                        <span className="text-xl font-semibold">Mock Mentor</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Let's Get You Started</h1>
                    <p className="text-muted-foreground">Help us personalize your experience</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="ml-4 text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">Step {step} of {totalSteps}</p>
                </div>

                {/* Question Card */}
                <Card className="p-8">
                    {/* Step 1: Profile */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-2">What best describes you?</h2>
                            <p className="text-muted-foreground mb-6">This helps us customize your practice sessions</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {["Student", "Recent Graduate", "Career Switcher", "Early Professional"].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => toggleSelection(option, profile, setProfile)}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${profile.includes(option)
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{option}</span>
                                            {profile.includes(option) && <Check className="w-5 h-5 text-primary" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleNext} disabled={!canContinue()} size="lg">
                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Experience */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-2">How many years of experience do you have?</h2>
                            <p className="text-muted-foreground mb-6">Select the range that fits best</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {["0-1 years", "1-3 years", "3-5 years", "5+ years"].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => toggleSelection(option, experience, setExperience)}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${experience.includes(option)
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{option}</span>
                                            {experience.includes(option) && <Check className="w-5 h-5 text-primary" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between">
                                <Button onClick={handleBack} variant="outline" size="lg">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button onClick={handleNext} disabled={!canContinue()} size="lg">
                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Goals */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-2">What are your goals?</h2>
                            <p className="text-muted-foreground mb-6">Select all that apply</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {["Land First Job", "Switch Careers", "Get Promotion", "Improve Confidence"].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => toggleSelection(option, goals, setGoals)}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${goals.includes(option)
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{option}</span>
                                            {goals.includes(option) && <Check className="w-5 h-5 text-primary" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between">
                                <Button onClick={handleBack} variant="outline" size="lg">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button onClick={handleComplete} disabled={!canContinue() || loading} size="lg">
                                    {loading ? "Saving..." : "Get Started"} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
