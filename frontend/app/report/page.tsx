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
        const audioParam = audioModeEnabled ? '&audioSummary=true' : '';
        const response = await fetch(`/api/interview/report?sessionId=${sessionId}${audioParam}`);

        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }

        const data = await response.json();

        // Check for specific error messages
        if (!response.ok) {
          if (data.error === 'Invalid sessionId' || data.error === 'Interview not completed yet') {
            throw new Error(`Session expired or interview not completed. Please start a new interview.`);
          }
          throw new Error(data.error || 'Failed to fetch report');
        }

        setFinalReport(data.finalReport);

        // Set audio summary if available
        if (data.audioSummary) {
          setAudioSummary(data.audioSummary);
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
        // Fallback: use mock data for now
        setFinalReport({
          overallScore: 78,
          categoryScores: {
            communication: 82,
            clarity: 75,
            technicalDepth: 80,
            confidence: 74,
          },
          identifiedStrengths: [
            "Clear articulation of technical concepts",
            "Strong problem-solving approach demonstrated",
            "Good use of specific examples from past experience",
          ],
          areasForImprovement: [
            "Could provide more quantifiable results in examples",
            "Consider structuring responses using STAR method",
            "Expand on leadership and collaboration experiences",
          ],
          actionableFeedback: [
            "Practice summarizing complex topics in 2-3 sentences",
            "Prepare 3-5 specific project stories with measurable outcomes",
            "Research common behavioral interview frameworks",
          ],
          questionAnswerHistory: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [router]);

  const handleRestartInterview = () => {
    // Clear session data
    sessionStorage.removeItem('interviewSession');
    sessionStorage.removeItem('reportSessionId');
    router.push('/interview-setup');
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
          audioSummary={audioSummary}
        />
      </main>
    </>
  );
}
