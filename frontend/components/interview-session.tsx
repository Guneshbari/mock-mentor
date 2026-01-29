"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChevronDown, ChevronUp, Mic, MicOff, User, Bot, Sparkles, Volume2, VolumeX, Square, RotateCcw, TrendingUp, CheckCircle2 } from "lucide-react";
import type { InterviewConfiguration } from "./interview-setup";

interface QuestionAudio {
  text: string;
  speechParams: {
    rate: number;
    pitch: number;
    volume: number;
    lang: string;
  };
}

interface InterviewSessionPanelProps {
  interviewConfig: InterviewConfiguration & {
    sessionId: string;
    firstQuestion: string;
    totalSteps: number;
    questionAudio?: QuestionAudio;
  };
  onInterviewComplete: (sessionId: string) => void;
}

export interface InterviewEvaluationResults {
  overallScore: number;
  categoryScores: {
    communication: number;
    clarity: number;
    technicalDepth: number;
    confidence: number;
  };
  identifiedStrengths: string[];
  areasForImprovement: string[];
  actionableFeedback: string[];
  questionAnswerHistory: {
    question: string;
    answer: string;
    summary: string;
    score?: number;
    key_feedback?: string;
  }[];
  scoreCalculation?: string;
  individualScores?: {
    questionNumber: number;
    score: number;
    weight: number;
    weightedScore: number;
  }[];
}



export function InterviewSessionPanel({
  interviewConfig,
  onInterviewComplete,
}: InterviewSessionPanelProps) {
  const [currentQuestion, setCurrentQuestion] = useState(interviewConfig.firstQuestion);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(interviewConfig.totalSteps);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [isEvaluatingResponse, setIsEvaluatingResponse] = useState(false);
  const [isAudioModeEnabled, setIsAudioModeEnabled] = useState(interviewConfig.audioMode || false);
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(true);
  const [questionAnswerHistory, setQuestionAnswerHistory] = useState<
    { question: string; answer: string; summary: string; score?: number }[]
  >([]);

  // Restart confirmation dialog
  const [showRestartDialog, setShowRestartDialog] = useState(false);

  // Last evaluation for immediate feedback
  const [lastEvaluation, setLastEvaluation] = useState<{
    score: number;
    feedback: string;
    breakdown?: {
      completeness: number;
      technicalAccuracy: number;
      depth: number;
      clarity: number;
    };
  } | null>(null);

  // Elaboration message
  const [elaborationMessage, setElaborationMessage] = useState<string | null>(null);

  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [transcriptionPreview, setTranscriptionPreview] = useState("");
  const [questionAudio, setQuestionAudio] = useState<QuestionAudio | undefined>(
    interviewConfig.questionAudio
  );

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const interviewProgress = (currentStep / totalSteps) * 100;

  // Speak the question when audio mode is enabled
  const speakQuestion = useCallback((text: string, params?: QuestionAudio['speechParams']) => {
    if (!isAudioModeEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = params?.rate || 0.9;
    utterance.pitch = params?.pitch || 1.0;
    utterance.volume = params?.volume || 1.0;
    utterance.lang = params?.lang || 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isAudioModeEnabled]);

  // Speak initial question if audio mode is enabled
  useEffect(() => {
    if (isAudioModeEnabled && currentStep === 1 && questionAudio) {
      speakQuestion(questionAudio.text, questionAudio.speechParams);
    }
  }, [isAudioModeEnabled, currentStep, questionAudio, speakQuestion]);

  // Stop speaking
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      setAudioError(null);

      // Enhanced audio constraints for noise filtering and voice isolation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,        // Reduces echo
          noiseSuppression: true,        // Filters background noise
          autoGainControl: true,         // Normalizes volume
          sampleRate: 16000,             // Sufficient for speech (reduces file size)
          channelCount: 1                // Mono audio (sufficient for voice)
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setTranscriptionPreview("Recording... (speak your answer)");
    } catch (error) {
      console.error('Error starting recording:', error);
      setAudioError('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording and process audio
  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    return new Promise<string>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result?.toString().split(',')[1] || '';
          resolve(base64Audio);
        };

        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current!.stop();
      setIsRecording(false);
      setTranscriptionPreview("Processing audio...");
    });
  };

  // Handle recording toggle
  const handleRecordingToggle = async () => {
    if (isRecording) {
      const audioBase64 = await stopRecording();
      if (audioBase64) {
        await transcribeAudioOnly(audioBase64);
      }
    } else {
      startRecording();
    }
  };

  // Transcribe audio without submitting
  const transcribeAudioOnly = async (audioBase64: string) => {
    setTranscriptionPreview("Transcribing...");
    setAudioError(null);

    try {
      const response = await fetch('/api/interview/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioAnswer: audioBase64,
          audioMimeType: 'audio/webm',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAudioError(data.error || 'Could not transcribe audio. Please try again or type your answer.');
        setTranscriptionPreview("");
        return;
      }

      // Display transcribed text in the text box
      setCandidateAnswer(data.transcribedText);
      setTranscriptionPreview("");

      // Clear any previous errors
      setAudioError(null);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setAudioError('Failed to transcribe audio. Please try again or type your answer.');
      setTranscriptionPreview("");
    }
  };

  // Submit audio answer
  const submitAudioAnswer = async (audioBase64: string) => {
    setIsEvaluatingResponse(true);
    setTranscriptionPreview("Transcribing...");
    stopSpeaking(); // Stop any ongoing speech when submitting

    try {
      const response = await fetch('/api/interview/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: interviewConfig.sessionId,
          previousAnswerText: '', // Will be transcribed on backend
          audioAnswer: audioBase64,
          audioMimeType: 'audio/webm',
          inputMode: 'audio',
          audioMode: isAudioModeEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.transcriptionFailed) {
          setAudioError(data.error || 'Could not transcribe audio. Please try again or type your answer.');
          setTranscriptionPreview("");
          return;
        }
        throw new Error(data.error || 'Failed to submit answer');
      }

      // Use transcribed answer for history
      const transcribedAnswer = data.transcribedAnswer || candidateAnswer || "(Audio answer)";
      setTranscriptionPreview("");

      // Display the transcribed text in the text box so user can see what was transcribed
      setCandidateAnswer(transcribedAnswer);

      // Store evaluation for immediate feedback
      storeEvaluation(data);

      const newAnswerEntry = {
        question: currentQuestion,
        answer: transcribedAnswer,
        summary: transcribedAnswer.length > 60
          ? `${transcribedAnswer.substring(0, 60)}...`
          : transcribedAnswer,
        score: data.evaluation?.score || 0,
      };

      const updatedHistory = [...questionAnswerHistory, newAnswerEntry];
      setQuestionAnswerHistory(updatedHistory);

      // Clear the answer after a brief moment so user can see the transcription
      setTimeout(() => setCandidateAnswer(""), 2000);

      // Check if we received finalReport or nextQuestion
      if (data.finalReport) {
        onInterviewComplete(interviewConfig.sessionId);
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);

        // If it's an elaboration (gibberish detected), don't advance step and show message
        if (data.isElaborated) {
          setElaborationMessage(data.message || "Please provide more details.");
          // Clear message after 5 seconds
          setTimeout(() => setElaborationMessage(null), 5000);
        } else {
          setCurrentStep(data.currentStep);
          setTotalSteps(data.totalSteps);
          setElaborationMessage(null);
        }

        // If audio mode, speak the next question
        if (isAudioModeEnabled && data.questionAudio) {
          setQuestionAudio(data.questionAudio);
          speakQuestion(data.questionAudio.text, data.questionAudio.speechParams);
        }
      }
    } catch (error) {
      console.error('Error submitting audio answer:', error);
      setAudioError('Failed to process audio. Please try again or type your answer.');
      setTranscriptionPreview("");
    } finally {
      setIsEvaluatingResponse(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim()) return;

    setIsEvaluatingResponse(true);
    stopSpeaking(); // Stop any ongoing speech when submitting

    try {
      const response = await fetch('/api/interview/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: interviewConfig.sessionId,
          previousAnswerText: candidateAnswer,
          inputMode: 'text',
          audioMode: isAudioModeEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || 'Failed to submit answer');
      }

      // Store evaluation for immediate feedback
      storeEvaluation(data);

      const newAnswerEntry = {
        question: currentQuestion,
        answer: candidateAnswer,
        summary:
          candidateAnswer.length > 60
            ? `${candidateAnswer.substring(0, 60)}...`
            : candidateAnswer,
        score: data.evaluation?.score || 0,
      };

      const updatedHistory = [...questionAnswerHistory, newAnswerEntry];
      setQuestionAnswerHistory(updatedHistory);
      setCandidateAnswer("");

      // Check if we received finalReport or nextQuestion
      if (data.finalReport) {
        // Interview is complete, navigate to report page
        onInterviewComplete(interviewConfig.sessionId);
      } else if (data.nextQuestion) {
        // Continue with next question
        setCurrentQuestion(data.nextQuestion);

        // If it's an elaboration (gibberish detected), don't advance step and show message
        if (data.isElaborated) {
          setElaborationMessage(data.message || "Please provide more details.");
          // Clear message after 5 seconds
          setTimeout(() => setElaborationMessage(null), 5000);
        } else {
          setCurrentStep(data.currentStep);
          setTotalSteps(data.totalSteps);
          setElaborationMessage(null);
        }

        // If audio mode, speak the next question
        if (isAudioModeEnabled && data.questionAudio) {
          setQuestionAudio(data.questionAudio);
          speakQuestion(data.questionAudio.text, data.questionAudio.speechParams);
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      // Fallback behavior
      const newAnswerEntry = {
        question: currentQuestion,
        answer: candidateAnswer,
        summary:
          candidateAnswer.length > 60
            ? `${candidateAnswer.substring(0, 60)}...`
            : candidateAnswer,
      };
      const updatedHistory = [...questionAnswerHistory, newAnswerEntry];
      setQuestionAnswerHistory(updatedHistory);
      setCandidateAnswer("");

      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        // Fallback: use a placeholder question
        setCurrentQuestion("Please continue with your next response.");
      } else {
        onInterviewComplete(interviewConfig.sessionId);
      }
    } finally {
      setIsEvaluatingResponse(false);
    }
  };

  // Restart interview handler
  const handleRestartInterview = () => {
    stopSpeaking();
    window.location.href = '/';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Enter to submit (when not in textarea and answer is not empty)
      if (e.key === 'Enter' && e.ctrlKey && candidateAnswer.trim() && !isEvaluatingResponse && !isRecording) {
        e.preventDefault();
        handleSubmitAnswer();
      }
      // Esc to clear answer
      if (e.key === 'Escape' && !isRecording && !isEvaluatingResponse) {
        setCandidateAnswer('');
        setLastEvaluation(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [candidateAnswer, isEvaluatingResponse, isRecording]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Store evaluation from response
  const storeEvaluation = (data: any) => {
    if (data.evaluation) {
      setLastEvaluation({
        score: data.evaluation.score || 0,
        feedback: data.evaluation.feedback || '',
        breakdown: data.evaluation.breakdown
      });

      // Auto-hide evaluation after 5 seconds
      setTimeout(() => setLastEvaluation(null), 5000);
    }
  };

  return (
    <div className="min-h-screen page-gradient-bg p-4 lg:p-6 pt-14">
      <div className="max-w-7xl mx-auto animate-fade-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - AI Interviewer */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Card className="ai-interviewer-card elevation-3 border-border/30 glass-card border-l-4 border-l-primary transition-all duration-300">
              <CardHeader className="pb-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-primary/10 transition-all duration-300 animate-subtle-pulse">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        AI Interviewer
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Powered by Gemini 2.0</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="adaptive-questioning-badge text-xs font-semibold border-primary/40 text-primary bg-primary/10 px-3 py-1 transition-all duration-200 hover:bg-primary/15"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Adaptive AI
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRestartDialog(true)}
                      className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      Restart
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="current-question-display bg-gradient-to-br from-muted/30 to-muted/20 rounded-xl p-6 border border-border/40 shadow-sm transition-all duration-300 hover:border-border/60">
                  <p className="text-foreground text-xl leading-relaxed font-medium">
                    {currentQuestion}
                  </p>
                </div>

                {elaborationMessage && (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg animate-scale-in flex items-center gap-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    </div>
                    <p className="text-sm text-primary font-semibold">{elaborationMessage}</p>
                  </div>
                )}

                <div className="interview-progress-tracker flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
                  <span className="text-sm font-semibold text-foreground">
                    Progress
                  </span>
                  <div className="flex-1 relative">
                    <Progress
                      value={interviewProgress}
                      className="h-2.5 bg-muted"
                    />
                  </div>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {currentStep} / {totalSteps}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Answer Input Card */}
            <Card className="candidate-answer-card elevation-3 border-border/30 glass-card transition-all duration-300">
              <CardHeader className="pb-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/40 to-secondary/20 flex items-center justify-center ring-2 ring-secondary/20">
                      <User className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        Your Response
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Take your time to answer</p>
                    </div>
                  </div>
                  {/* Audio playback control for question */}
                  {isAudioModeEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => isSpeaking ? stopSpeaking() : speakQuestion(currentQuestion, questionAudio?.speechParams)}
                      className="flex items-center gap-1"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="h-4 w-4" />
                          <span className="text-xs">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          <span className="text-xs">Repeat Question</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Audio recording indicator */}
                {isAudioModeEnabled && (transcriptionPreview || audioError) && (
                  <div className={`p-3 rounded-lg text-sm ${audioError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    {audioError || transcriptionPreview}
                    {audioError && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setAudioError(null)}
                        className="ml-2 text-xs"
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                )}

                <Textarea
                  placeholder={isAudioModeEnabled && isRecording ? "🎤 Recording your answer..." : "Type your detailed answer here..."}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  className="answer-input-field min-h-[160px] text-base resize-none bg-muted/30 border-border/60 transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background focus:shadow-sm hover:border-border"
                  disabled={isEvaluatingResponse || isRecording}
                />

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="audio-mode-toggle flex items-center gap-2">
                    <Switch
                      id="audio-mode-toggle"
                      checked={isAudioModeEnabled}
                      onCheckedChange={setIsAudioModeEnabled}
                    />
                    <Label
                      htmlFor="audio-mode-toggle"
                      className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer"
                    >
                      <Mic className="h-4 w-4" />
                      Audio Mode
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Voice Recording Button */}
                    {isAudioModeEnabled && (
                      <Button
                        onClick={handleRecordingToggle}
                        disabled={isEvaluatingResponse}
                        variant={isRecording ? "destructive" : "outline"}
                        className={`transition-all duration-200 ${isRecording ? 'animate-pulse' : ''}`}
                      >
                        {isRecording ? (
                          <span className="flex items-center gap-2">
                            <Square className="h-4 w-4" />
                            Stop Recording
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Mic className="h-4 w-4" />
                            Record Answer
                          </span>
                        )}
                      </Button>
                    )}

                    {/* Submit Text Answer Button */}
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={isEvaluatingResponse || !candidateAnswer.trim() || isRecording}
                      className="submit-answer-button font-semibold bg-primary text-primary-foreground hover:scale-[1.02] elevation-2 glow-effect transition-all duration-200 px-6"
                      size="lg"
                    >
                      {isEvaluatingResponse ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="h-4 w-4" />
                          Analyzing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Submit Answer
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
                {isEvaluatingResponse && (
                  <div className="evaluation-status flex items-center justify-center gap-3 text-primary text-sm py-3 px-4 bg-primary/5 rounded-lg border border-primary/20 animate-pulse">
                    <Spinner className="h-4 w-4" />
                    <span className="font-medium">AI is carefully evaluating your response...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Real-Time Evaluation Display */}
            {lastEvaluation && (
              <Card className="evaluation-card elevation-3 border-l-4 border-l-success glass-card animate-scale-in">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-success/10">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">Answer Evaluated</h3>
                    </div>
                    <Badge
                      variant={lastEvaluation.score >= 75 ? "default" : lastEvaluation.score >= 50 ? "secondary" : "destructive"}
                      className="text-lg font-bold px-4 py-1.5"
                    >
                      {lastEvaluation.score}<span className="text-sm">/100</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{lastEvaluation.feedback}</p>
                  {lastEvaluation.breakdown && (
                    <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-muted/20 rounded-lg border border-border/30">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">Completeness: <span className="text-primary">{lastEvaluation.breakdown.completeness}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">Accuracy: <span className="text-primary">{lastEvaluation.breakdown.technicalAccuracy}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">Depth: <span className="text-primary">{lastEvaluation.breakdown.depth}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">Clarity: <span className="text-primary">{lastEvaluation.breakdown.clarity}</span></span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Panel - Interview Memory */}
          <div className="lg:col-span-1">
            <Collapsible open={isMemoryPanelOpen} onOpenChange={setIsMemoryPanelOpen}>
              <Card className="interview-memory-panel elevation-2 border-border/30 glass-card">
                <CardHeader className="pb-3">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-foreground">
                          Interview History
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {questionAnswerHistory.length}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:scale-110">
                        {isMemoryPanelOpen ? (
                          <ChevronUp className="h-5 w-5 transition-transform" />
                        ) : (
                          <ChevronDown className="h-5 w-5 transition-transform" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent className="animate-fade-in">
                  <CardContent className="pt-0">
                    {questionAnswerHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Your interview history will appear here as you progress.
                          Answer questions to build your track record.
                        </p>
                      </div>
                    ) : (
                      <div className="memory-items-list flex flex-col gap-3">
                        {questionAnswerHistory.map((item, index) => (
                          <div key={index} className="memory-item">
                            {index > 0 && <Separator className="mb-3" />}
                            <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 hover:bg-muted/30 transition-all duration-200">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs font-bold bg-primary/10 text-primary">
                                  Q{index + 1}
                                </Badge>
                                {item.score && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.score}/100
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground font-semibold line-clamp-2">
                                {item.question}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.summary}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Interview Configuration Info */}
            <Card className="interview-config-panel elevation-2 border-border/30 glass-card mt-4">
              <CardContent className="pt-5 pb-5">
                <h3 className="text-sm font-bold text-foreground mb-3">Interview Details</h3>
                <div className="config-details flex flex-col gap-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground font-medium">Type</span>
                    <Badge variant="outline" className="font-semibold capitalize">
                      {interviewConfig.interviewType}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground font-medium">Role</span>
                    <span className="font-semibold text-foreground text-right">
                      {interviewConfig.role || "Not specified"}
                    </span>
                  </div>
                  {interviewConfig.skills && interviewConfig.skills.length > 0 && (
                    <div className="flex flex-col gap-2 p-2 rounded bg-muted/20">
                      <span className="text-muted-foreground font-medium">Skills ({interviewConfig.skills.length})</span>
                      <div className="flex flex-wrap gap-1.5">
                        {interviewConfig.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs bg-primary/10 text-primary border border-primary/20"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Restart Confirmation Dialog */}
      <ConfirmDialog
        open={showRestartDialog}
        onOpenChange={setShowRestartDialog}
        title="Restart Interview?"
        description="Are you sure you want to restart? Your current progress will be lost and you'll be taken back to the setup screen."
        confirmText="Restart"
        cancelText="Continue Interview"
        onConfirm={handleRestartInterview}
        variant="destructive"
      />
    </div>
  );
}
