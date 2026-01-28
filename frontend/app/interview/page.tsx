"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewSessionPanel } from "@/components/interview-session";
import { Navbar } from "@/components/navbar";
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
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAndLoadSession = async () => {
      // Retrieve session data from sessionStorage
      const stored = sessionStorage.getItem('interviewSession');
      if (!stored) {
        // No session data, redirect to setup
        router.push('/');
        return;
      }

      try {
        const data = JSON.parse(stored);

        // Session data exists in sessionStorage, use it
        // Backend will validate when actual answers are submitted
        setSessionData(data);
        setIsValidating(false);
      } catch (error) {
        console.error('Error parsing session data:', error);
        sessionStorage.removeItem('interviewSession');
        router.push('/');
      }
    };

    validateAndLoadSession();
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

  if (isValidating || !sessionData) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center pt-14">
          <p className="text-muted-foreground">Validating session...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
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
    </>
  );
}
