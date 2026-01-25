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
        await submitAudioAnswer(audioBase64);
      }
    } else {
      startRecording();
    }
  };

  // Submit audio answer
  const submitAudioAnswer = async (audioBase64: string) => {
    setIsEvaluatingResponse(true);
    setTranscriptionPreview("Transcribing...");

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
      setCandidateAnswer("");

      // Check if we received finalReport or nextQuestion
      if (data.finalReport) {
        onInterviewComplete(interviewConfig.sessionId);
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setCurrentStep(data.currentStep);
        setTotalSteps(data.totalSteps);

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

      if (!response.ok) throw new Error('Failed to submit answer');

      const data = await response.json();

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
        setCurrentStep(data.currentStep);
        setTotalSteps(data.totalSteps);

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
    <div className="min-h-screen page-gradient-bg p-4 lg:p-6">
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - AI Interviewer */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card className="ai-interviewer-card shadow-lg border-border/50 bg-card/95 backdrop-blur-sm border-l-4 border-l-primary">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      AI Interviewer
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="adaptive-questioning-badge text-xs font-medium border-primary/50 text-primary bg-primary/5 glow-effect"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Adaptive Questioning
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRestartDialog(true)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restart
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="current-question-display bg-muted/30 rounded-lg p-5 border border-border/50">
                  <p className="text-foreground text-lg leading-relaxed font-medium">
                    {currentQuestion}
                  </p>
                </div>
                <div className="interview-progress-tracker flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Question Progress
                  </span>
                  <div className="flex-1 relative">
                    <Progress
                      value={interviewProgress}
                      className="h-2 bg-muted/50"
                    />
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {currentStep} / {totalSteps}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Answer Input Card */}
            <Card className="candidate-answer-card shadow-lg border-border/50 bg-card/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Your Answer
                    </CardTitle>
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
                  placeholder={isAudioModeEnabled && isRecording ? "Recording your answer..." : "Type your answer here..."}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  className="answer-input-field min-h-[150px] resize-none bg-muted/20 border-border/50 transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-card"
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
                      className="submit-answer-button font-medium bg-primary text-primary-foreground hover:scale-[1.02] glow-effect transition-all duration-200"
                    >
                      {isEvaluatingResponse ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="h-4 w-4" />
                          Evaluating...
                        </span>
                      ) : (
                        "Submit Answer"
                      )}
                    </Button>
                  </div>
                </div>
                {isEvaluatingResponse && (
                  <div className="evaluation-status flex items-center justify-center gap-2 text-primary text-sm py-2">
                    <Spinner className="h-4 w-4" />
                    AI is evaluating your response...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Real-Time Evaluation Display */}
            {lastEvaluation && (
              <Card className="evaluation-card shadow-lg border-l-4 border-l-success bg-card/95 backdrop-blur-sm animate-fade-in">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <h3 className="text-sm font-semibold text-foreground">Answer Evaluated</h3>
                    </div>
                    <Badge
                      variant={lastEvaluation.score >= 75 ? "default" : lastEvaluation.score >= 50 ? "secondary" : "destructive"}
                      className="text-base px-3 py-1"
                    >
                      {lastEvaluation.score}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{lastEvaluation.feedback}</p>
                  {lastEvaluation.breakdown && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Completeness: {lastEvaluation.breakdown.completeness}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Accuracy: {lastEvaluation.breakdown.technicalAccuracy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Depth: {lastEvaluation.breakdown.depth}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Clarity: {lastEvaluation.breakdown.clarity}</span>
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
              <Card className="interview-memory-panel shadow-lg border-border/50 bg-card/95 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between cursor-pointer group">
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Interview Memory
                      </CardTitle>
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
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
                      <p className="text-muted-foreground text-sm">
                        Previous questions and answers will appear here as you
                        progress through the interview.
                      </p>
                    ) : (
                      <div className="memory-items-list flex flex-col gap-3">
                        {questionAnswerHistory.map((item, index) => (
                          <div key={index} className="memory-item">
                            {index > 0 && <Separator className="mb-3" />}
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-primary">
                                  Q{index + 1}
                                </p>
                                {item.score !== undefined && (
                                  <Badge
                                    variant={item.score >= 75 ? "default" : item.score >= 50 ? "secondary" : "destructive"}
                                    className="text-xs h-5"
                                  >
                                    {item.score}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground font-medium line-clamp-2">
                                {item.question}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
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
            <Card className="interview-config-panel shadow-lg border-border/50 bg-card/95 backdrop-blur-sm mt-4">
              <CardContent className="pt-4">
                <div className="config-details flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium text-foreground capitalize">
                      {interviewConfig.interviewType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <span className="font-medium text-foreground">
                      {interviewConfig.role || "Not specified"}
                    </span>
                  </div>
                  {interviewConfig.skills && interviewConfig.skills.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-muted-foreground">Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {interviewConfig.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs bg-primary/10 text-primary border-primary/20"
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
