"use client";

import { useRouter } from "next/navigation";
import { InterviewSetupForm, type InterviewConfiguration } from "@/components/interview-setup";
import { Navbar } from "@/components/navbar";

export default function Home() {
  const router = useRouter();

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
