"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewSessionPanel } from "@/components/interview-session";
import { ThemeToggle } from "@/components/theme-toggle";
import type { InterviewConfiguration } from "@/components/interview-setup";

interface QuestionAudio {
  text: string;
  speechParams: {
    rate: number;
    pitch: number;
    volume: number;
    lang: string;
  };
}

export default function InterviewSessionPage() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<{
    sessionId: string;
    firstQuestion: string;
    totalSteps: number;
    interviewConfig: InterviewConfiguration;
    questionAudio?: QuestionAudio;
  } | null>(null);

  useEffect(() => {
    // Retrieve session data from sessionStorage
    const stored = sessionStorage.getItem('interviewSession');
    if (!stored) {
      // No session data, redirect to setup
      router.push('/');
      return;
    }

    try {
      const data = JSON.parse(stored);
      setSessionData(data);
    } catch (error) {
      console.error('Error parsing session data:', error);
      router.push('/');
    }
  }, [router]);

  const handleInterviewComplete = (sessionId: string) => {
    // Store sessionId for report page
    sessionStorage.setItem('reportSessionId', sessionId);
    
    // Store audio mode setting for report page
    if (sessionData?.interviewConfig?.audioMode) {
      sessionStorage.setItem('audioModeEnabled', 'true');
    }
    
    router.push('/report');
  };

  if (!sessionData) {
    return (
      <main className="interview-app-container">
        <ThemeToggle />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading interview session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="interview-app-container">
      <ThemeToggle />
      <InterviewSessionPanel
        interviewConfig={{
          ...sessionData.interviewConfig,
          sessionId: sessionData.sessionId,
          firstQuestion: sessionData.firstQuestion,
          totalSteps: sessionData.totalSteps,
          questionAudio: sessionData.questionAudio,
        }}
        onInterviewComplete={handleInterviewComplete}
      />
    </main>
  );
}
