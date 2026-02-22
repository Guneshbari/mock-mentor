"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewReportSummary } from "@/components/interview-report";
import { Navbar } from "@/components/navbar";
import { Spinner } from "@/components/ui/spinner";
import type { InterviewEvaluationResults } from "@/components/interview-session";

interface AudioSummary {
  text: string;
  speechParams: {
    rate: number;
    pitch: number;
    volume: number;
    lang: string;
  };
}

export default function InterviewReportPage() {
  const router = useRouter();
  const [finalReport, setFinalReport] = useState<InterviewEvaluationResults | null>(null);
  const [audioSummary, setAudioSummary] = useState<AudioSummary | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = sessionStorage.getItem('reportSessionId');
    const audioModeEnabled = sessionStorage.getItem('audioModeEnabled') === 'true';

    if (!sessionId) {
      // No sessionId, redirect to setup
      router.push('/');
      return;
    }

    // Fetch final report from backend (with audio summary if audio mode was enabled)
    const fetchReport = async () => {
      try {
        // Import auth headers helper
        const { getAuthHeaders } = await import('@/lib/auth-headers');
        const headers = await getAuthHeaders();

        const audioParam = audioModeEnabled ? '&audioSummary=true' : '';
        const response = await fetch(`/api/interview/report?sessionId=${sessionId}${audioParam}`, {
          headers,
        });

        const data = await response.json();

        // If backend returned an error shape, surface a friendly message
        if (!response.ok) {
          const message = data?.error || 'Failed to fetch report';
          if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('session not found')) {
            setError('No stored report was found for this session. Reports are saved for users after their first login.');
          } else if (message.toLowerCase().includes('not yet generated') || message.toLowerCase().includes('not generated')) {
            setError('The report for this session is not yet generated. Please try again later.');
          } else {
            setError(message);
          }
          setIsLoading(false);
          return;
        }

        // If backend returned but report is empty, show friendly message
        if (!data?.finalReport) {
          setError('No stored report was found for this session. Reports are saved for users after their first login.');
          setIsLoading(false);
          return;
        }

        setFinalReport(data.finalReport);

        // Set audio summary if available
        if (data.audioSummary) {
          setAudioSummary(data.audioSummary);
        }

        // Stop loading after successful data fetch
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
        setIsLoading(false);
        return;
      }
      // finally handled above by explicit returns and state updates
    };

    fetchReport();
  }, [router]);

  const handleRestartInterview = () => {
    // Clear session data
    sessionStorage.removeItem('interviewSession');
    sessionStorage.removeItem('reportSessionId');
    router.push('/interview-setup');
  };

  const handleGoToDashboard = () => {
    // Clear session data
    sessionStorage.removeItem('interviewSession');
    sessionStorage.removeItem('reportSessionId');
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center pt-14">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-8 w-8" />
            <p className="text-muted-foreground">Loading your report...</p>
          </div>
        </main>
      </>
    );
  }

  if (error && !finalReport) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center pt-14">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={handleRestartInterview}
              className="text-primary hover:underline"
            >
              Start New Interview
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!finalReport) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        <InterviewReportSummary
          evaluationResults={finalReport}
          onRestartInterview={handleRestartInterview}
          onGoToDashboard={handleGoToDashboard}
          audioSummary={audioSummary}
        />
      </main>
    </>
  );
}
