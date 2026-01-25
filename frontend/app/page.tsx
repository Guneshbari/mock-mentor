"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { InterviewSetupForm, type InterviewConfiguration } from "@/components/interview-setup";
import { ThemeToggle } from "@/components/theme-toggle";

export default function InterviewSetupPage() {
  const router = useRouter();

  // Clear any existing session data when landing on setup page
  // This ensures a fresh start, especially after server restarts
  useEffect(() => {
    sessionStorage.removeItem('interviewSession');
    sessionStorage.removeItem('reportSessionId');
    sessionStorage.removeItem('audioModeEnabled');
  }, []);

  const handleStartInterview = (config: InterviewConfiguration & {
    sessionId: string;
    firstQuestion: string;
    totalSteps: number;
    questionAudio?: { text: string; speechParams: object };
  }) => {
    // Store session data in sessionStorage for the interview page
    sessionStorage.setItem('interviewSession', JSON.stringify({
      sessionId: config.sessionId,
      firstQuestion: config.firstQuestion,
      totalSteps: config.totalSteps,
      questionAudio: config.questionAudio,
      interviewConfig: {
        interviewType: config.interviewType,
        role: config.role,
        skills: config.skills,
        resumeText: config.resumeText,
        audioMode: config.audioMode,
      },
    }));

    // Navigate to interview page
    router.push('/interview');
  };

  return (
    <main className="interview-app-container">
      <ThemeToggle />
      <InterviewSetupForm onStartInterview={handleStartInterview} />
    </main>
  );
}
