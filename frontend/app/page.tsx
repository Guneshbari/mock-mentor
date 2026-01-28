"use client";

import { useRouter } from "next/navigation";
import { InterviewSetupForm, type InterviewConfiguration } from "@/components/interview-setup";
import { Navbar } from "@/components/navbar";

export default function InterviewSetupPage() {
  const router = useRouter();

  // Session storage is automatically cleared by browser on page refresh
  // No need for manual clearing that causes refresh loops

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
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        <InterviewSetupForm onStartInterview={handleStartInterview} />
      </main>
    </>
  );
}
