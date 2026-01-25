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

        // Validate session with backend by making a test request
        // This ensures the session is still valid after server restarts
        try {
          const response = await fetch('/api/interview/next', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: data.sessionId,
              previousAnswerText: '',
              inputMode: 'validation'
            }),
          });

          // If session is invalid (400/404), clear session and redirect to home
          if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('Invalid sessionId')) {
              console.log('Session invalid or expired, redirecting to setup...');
              sessionStorage.removeItem('interviewSession');
              sessionStorage.removeItem('reportSessionId');
              sessionStorage.removeItem('audioModeEnabled');
              router.push('/');
              return;
            }
          }
        } catch (validationError) {
          console.error('Session validation failed:', validationError);
          // If backend is unreachable or session is invalid, redirect to setup
          sessionStorage.removeItem('interviewSession');
          sessionStorage.removeItem('reportSessionId');
          sessionStorage.removeItem('audioModeEnabled');
          router.push('/');
          return;
        }

        // Session is valid, proceed with interview
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
      <main className="interview-app-container">
        <ThemeToggle />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Validating session...</p>
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
