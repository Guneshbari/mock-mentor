"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Checkbox } from "lucide-react";
import { HelpCircle } from "lucide-react";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (!agreeTerms) {
            setError("You must agree to the Terms of Service and Privacy Policy");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: fullName,
                    },
                },
            });

            if (error) throw error;

            // Note: Trigger will auto-create public user.
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-4">
                    <span className="text-primary-foreground font-bold text-xl">M</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Create Your Account</h1>
                <p className="text-muted-foreground mt-2">Start your interview practice journey</p>
            </div>

            <Card className="w-full max-w-md border-border/50 shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        Sign Up
                    </CardTitle>
                    <CardDescription>
                        Create a free account to get started
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                    <CardContent className="grid gap-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="full-name">Full Name</Label>
                            <Input
                                id="full-name"
                                placeholder="John Doe"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-background"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">At least 8 characters</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-background"
                            />
                        </div>

                        <div className="flex items-center space-x-2 mt-2">
                            <div
                                className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${agreeTerms ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'}`}
                                onClick={() => setAgreeTerms(!agreeTerms)}
                            >
                                {agreeTerms && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>}
                            </div>
                            <Label
                                htmlFor="terms"
                                className="text-sm font-normal text-muted-foreground cursor-pointer"
                                onClick={() => setAgreeTerms(!agreeTerms)}
                            >
                                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                            </Label>
                        </div>

                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full h-11 text-base" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>

                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Or sign up with
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" type="button" disabled className="w-full opacity-50 cursor-not-allowed">
                                Google
                            </Button>
                            <Button variant="outline" type="button" disabled className="w-full opacity-50 cursor-not-allowed">
                                GitHub
                            </Button>
                        </div>
                        <div className="mt-2 text-center text-sm text-muted-foreground">
                            Note: Social logins are currently disabled for this open source demo.
                        </div>

                        <div className="mt-2 text-center text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>

            <div className="fixed bottom-6 right-6">
                <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 shadow-lg">
                    <HelpCircle className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
