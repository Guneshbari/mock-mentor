"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  RotateCcw,
  Trophy,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { InterviewEvaluationResults } from "./interview-session";

interface AudioSummary {
  text: string;
  speechParams: {
    rate: number;
    pitch: number;
    volume: number;
    lang: string;
  };
}

interface InterviewReportSummaryProps {
  evaluationResults: InterviewEvaluationResults;
  onRestartInterview: () => void;
  audioSummary?: AudioSummary;
}

export function InterviewReportSummary({ evaluationResults, onRestartInterview, audioSummary }: InterviewReportSummaryProps) {
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Speak the audio summary
  const speakSummary = () => {
    if (!audioSummary || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(audioSummary.text);
    utterance.rate = audioSummary.speechParams?.rate || 0.85;
    utterance.pitch = audioSummary.speechParams?.pitch || 1.0;
    utterance.volume = audioSummary.speechParams?.volume || 1.0;
    utterance.lang = audioSummary.speechParams?.lang || 'en-US';

    utterance.onstart = () => setIsSpeakingSummary(true);
    utterance.onend = () => setIsSpeakingSummary(false);
    utterance.onerror = () => setIsSpeakingSummary(false);

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeakingSummary(false);
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 80) return "bg-success/10";
    if (score >= 60) return "bg-warning/10";
    return "bg-destructive/10";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  const categoryMetrics = [
    {
      label: "Communication",
      score: evaluationResults.categoryScores.communication,
      icon: MessageSquare,
    },
    {
      label: "Clarity",
      score: evaluationResults.categoryScores.clarity,
      icon: Sparkles,
    },
    {
      label: "Technical Depth",
      score: evaluationResults.categoryScores.technicalDepth,
      icon: Target,
    },
    {
      label: "Confidence",
      score: evaluationResults.categoryScores.confidence,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen page-gradient-bg p-4 lg:p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-5 animate-fade-in">
        {/* Header */}
        <Card className="report-header-card shadow-xl border-border/50 bg-card">
          <CardHeader className="text-center pb-5">
            <div className="flex justify-center mb-5">
              <div className="w-18 h-18 rounded-full bg-primary/10 flex items-center justify-center shadow-[0_0_20px_4px_oklch(0.55_0.18_280_/_0.15)]">
                <Trophy className="h-9 w-9 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground tracking-tight text-balance">
              Interview Performance Report
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-3">
              Here&apos;s how you performed in your mock interview session
            </p>
          </CardHeader>
        </Card>

        {/* Overall Score Card */}
        <Card className="overall-score-card shadow-xl border-border/50 bg-card">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center gap-3">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Overall Score</p>
              <div className={`score-display flex items-baseline gap-1 px-6 py-3 rounded-xl ${getScoreBgClass(evaluationResults.overallScore)}`}>
                <span
                  className={`text-6xl font-bold ${getScoreColorClass(evaluationResults.overallScore)}`}
                >
                  {evaluationResults.overallScore}
                </span>
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
              <Badge
                variant="secondary"
                className={`px-4 py-1.5 text-sm font-medium bg-muted ${getScoreColorClass(evaluationResults.overallScore)} border-0`}
              >
                {getScoreLabel(evaluationResults.overallScore)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Category Scores Grid */}
        <div className="category-scores-grid grid grid-cols-2 lg:grid-cols-4 gap-3">
          {categoryMetrics.map((category) => (
            <Card key={category.label} className="category-metric-card shadow-md border-border/50 bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <category.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {category.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className={`text-2xl font-bold ${getScoreColorClass(category.score)}`}
                    >
                      {category.score}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                  <Progress
                    value={category.score}
                    className="h-1.5 bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Feedback Group */}
        <div className="report-feedback-group flex flex-col gap-4">
          {/* Strengths Section */}
          <Card className="strengths-section-card shadow-md border-border/50 bg-card border-l-4 border-l-success">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-4.5 w-4.5 text-success" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Strengths
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="strengths-list flex flex-col gap-2.5">
                {evaluationResults.identifiedStrengths.map((strength, index) => (
                  <li key={index} className="strength-item flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-success">
                        {index + 1}
                      </span>
                    </span>
                    <span className="text-foreground text-sm leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement Section */}
          <Card className="improvements-section-card shadow-md border-border/50 bg-card border-l-4 border-l-warning">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="h-4.5 w-4.5 text-warning" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Areas for Improvement
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="improvements-list flex flex-col gap-2.5">
                {evaluationResults.areasForImprovement.map((improvement, index) => (
                  <li key={index} className="improvement-item flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-warning">
                        {index + 1}
                      </span>
                    </span>
                    <span className="text-foreground text-sm leading-relaxed">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Actionable Feedback Section */}
          <Card className="feedback-section-card shadow-md border-border/50 bg-card border-l-4 border-l-primary">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="h-4.5 w-4.5 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Actionable Feedback
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="feedback-list flex flex-col gap-2.5">
                {evaluationResults.actionableFeedback.map((feedback, index) => (
                  <li key={index} className="feedback-item flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                    </span>
                    <span className="text-foreground text-sm leading-relaxed">{feedback}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Question-by-Question Performance Breakdown */}
        {evaluationResults.questionAnswerHistory && evaluationResults.questionAnswerHistory.length > 0 && (
          <Card className="performance-breakdown-card shadow-md border-border/50 bg-card">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Question-by-Question Performance
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Review your performance on each question
              </p>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col gap-3">
                {evaluationResults.questionAnswerHistory.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="question-performance-item p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Question {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.question}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-lg font-bold ${getScoreColorClass(item.score || 0)}`}>
                          {item.score || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    </div>
                    {item.key_feedback && (
                      <p className="text-xs text-muted-foreground italic mt-2 pl-2 border-l-2 border-primary/30">
                        {item.key_feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Score Calculation Transparency */}
              {evaluationResults.scoreCalculation && (
                <>
                  <Separator className="my-4" />
                  <div className="score-calculation-info p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1 flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      How Your Score Was Calculated
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evaluationResults.scoreCalculation}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer with Audio Summary and Restart Button */}
        <div className="report-footer-section pt-2 pb-8">
          <Separator className="mb-6" />
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            {/* Audio Summary Button */}
            {audioSummary && (
              <Button
                onClick={() => isSpeakingSummary ? stopSpeaking() : speakSummary()}
                variant="outline"
                size="lg"
                className={`audio-summary-button font-medium border-border text-foreground hover:scale-[1.02] transition-all duration-200 bg-transparent ${isSpeakingSummary ? 'border-primary text-primary' : ''
                  }`}
              >
                {isSpeakingSummary ? (
                  <>
                    <VolumeX className="h-4 w-4 mr-2" />
                    Stop Audio Summary
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Listen to Summary
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={onRestartInterview}
              variant="outline"
              size="lg"
              className="restart-interview-button font-medium border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-[1.02] transition-all duration-200 bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start New Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
