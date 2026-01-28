"use client";

import React from "react"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Briefcase, Code, Users, Mic, MicOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface QuestionAudio {
  text: string;
  speechParams: {
    rate: number;
    pitch: number;
    volume: number;
    lang: string;
  };
}

interface InterviewSetupFormProps {
  onStartInterview: (config: InterviewConfiguration & {
    sessionId: string;
    firstQuestion: string;
    totalSteps: number;
    questionAudio?: QuestionAudio;
  }) => void;
}

export interface InterviewConfiguration {
  interviewType: "hr" | "technical" | "behavioral";
  candidateName: string;
  candidateGender: "male" | "female" | "other" | "prefer-not-to-say";
  role: string;
  skills: string[];
  resumeText: string;
  experiencePreset?: string;
  audioMode?: boolean;
}

const interviewTypeIcons = {
  hr: Users,
  technical: Code,
  behavioral: Briefcase,
};

export function InterviewSetupForm({ onStartInterview }: InterviewSetupFormProps) {
  const [selectedInterviewType, setSelectedInterviewType] = useState<
    "hr" | "technical" | "behavioral"
  >("hr");
  const [candidateName, setCandidateName] = useState("");
  const [candidateGender, setCandidateGender] = useState<"male" | "female" | "other" | "prefer-not-to-say">("prefer-not-to-say");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInputValue, setSkillInputValue] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [experiencePreset, setExperiencePreset] = useState("");
  const [audioMode, setAudioMode] = useState(false);
  const [formError, setFormError] = useState("");
  const [micPermissionStatus, setMicPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // Check microphone permission when audio mode is enabled
  const handleAudioModeToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Release immediately
        setMicPermissionStatus('granted');
        setAudioMode(true);
      } catch (error) {
        console.error('Microphone permission denied:', error);
        setMicPermissionStatus('denied');
        setAudioMode(false);
      }
    } else {
      setAudioMode(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInputValue.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInputValue.trim())) {
        setSkills([...skills, skillInputValue.trim()]);
      }
      setSkillInputValue("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleStartInterview = async () => {
    // Auto-commit any pending skill input
    let finalSkills = [...skills];
    if (skillInputValue.trim()) {
      // Split by comma to handle multiple skills at once
      const newSkills = skillInputValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
      newSkills.forEach(s => {
        if (!finalSkills.includes(s)) {
          finalSkills.push(s);
        }
      });
      // Update state to reflect changes in UI (optional but good for consistency)
      setSkills(finalSkills);
      setSkillInputValue("");
    }

    const interviewConfig = {
      interviewType: selectedInterviewType,
      candidateName,
      candidateGender,
      role,
      skills: finalSkills, // Use the updated list
      resumeText,
      experiencePreset,
      audioMode,
    };

    // Validate mandatory fields
    if (!candidateName.trim()) {
      setFormError("Please enter your name to continue.");
      return;
    }
    if (!role.trim()) {
      setFormError("Please enter a job role to continue.");
      return;
    }
    if (finalSkills.length === 0) {
      setFormError("Please add at least one skill to continue.");
      return;
    }
    if (!resumeText.trim()) {
      setFormError("Please provide your resume or background summary to continue.");
      return;
    }
    if (!experiencePreset) {
      setFormError("Please select an experience level preset to continue.");
      return;
    }
    setFormError("");

    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewConfig }),
      });

      if (!response.ok) throw new Error('Failed to start interview');

      const data = await response.json();
      onStartInterview({
        ...interviewConfig,
        sessionId: data.sessionId,
        firstQuestion: data.firstQuestion,
        totalSteps: data.totalSteps,
        questionAudio: data.questionAudio,
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      // Fallback: still call onStartInterview for now
      onStartInterview({
        ...interviewConfig,
        sessionId: 'temp-' + Date.now(),
        firstQuestion: 'Tell me about yourself.',
        totalSteps: 5,
      });
    }
  };

  const SelectedIcon = interviewTypeIcons[selectedInterviewType];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-20 page-gradient-bg">
      <Card className="interview-setup-card w-full max-w-2xl elevation-3 border-border/30 bg-card/95 backdrop-blur-sm animate-fade-up">
        <CardHeader className="text-center pb-8 space-y-4">
          <div className="flex justify-center mb-2 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-primary/10 transition-all duration-300 hover:scale-110 hover:ring-primary/30">
              <SelectedIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
              Mock Mentor AI
            </CardTitle>
            <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
              Practice interviews with intelligent AI feedback and adaptive questioning
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Candidate Name */}
          <div className="candidate-name-input flex flex-col gap-2.5">
            <Label htmlFor="candidate-name" className="text-sm font-semibold text-foreground">
              Your Name <span className="text-destructive text-base">*</span>
            </Label>
            <Input
              id="candidate-name"
              placeholder="Enter your full name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="h-11 bg-muted/30 border-border/60 transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background focus:shadow-sm hover:border-border"
            />
          </div>

          {/* Candidate Gender */}
          <div className="candidate-gender-selector flex flex-col gap-2.5">
            <Label htmlFor="candidate-gender" className="text-sm font-semibold text-foreground">
              Gender
            </Label>
            <Select value={candidateGender} onValueChange={(value: any) => setCandidateGender(value)}>
              <SelectTrigger
                id="candidate-gender"
                className="h-11 bg-muted/30 border-border/60 transition-all duration-200 focus:ring-2 focus:ring-primary/50 hover:border-border"
              >
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interview Type Selection */}
          <div className="interview-type-selector flex flex-col gap-2.5">
            <Label className="text-sm font-semibold text-foreground">
              Interview Type <span className="text-destructive text-base">*</span>
            </Label>
            <Tabs
              value={selectedInterviewType}
              onValueChange={(value) =>
                setSelectedInterviewType(value as "hr" | "technical" | "behavioral")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 bg-muted/40 p-1 h-auto gap-1">
                <TabsTrigger
                  value="hr"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-muted data-[state=active]:scale-[1.02] py-2.5"
                >
                  <Users className="h-4 w-4 mr-2" />
                  HR
                </TabsTrigger>
                <TabsTrigger
                  value="technical"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-muted data-[state=active]:scale-[1.02] py-2.5"
                >
                  <Code className="h-4 w-4 mr-2" />
                  Technical
                </TabsTrigger>
                <TabsTrigger
                  value="behavioral"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-muted data-[state=active]:scale-[1.02] py-2.5"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Behavioral
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Job Role Input */}
          <div className="job-role-input flex flex-col gap-2.5">
            <Label htmlFor="target-job-role" className="text-sm font-semibold text-foreground">
              Target Role <span className="text-destructive text-base">*</span>
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger
                id="target-job-role"
                className="h-11 bg-muted/30 border-border/60 transition-all duration-200 focus:ring-2 focus:ring-primary/50 hover:border-border"
              >
                <SelectValue placeholder="Choose your target role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                <SelectItem value="Machine Learning Engineer">Machine Learning Engineer</SelectItem>
                <SelectItem value="Mobile Developer">Mobile Developer</SelectItem>
                <SelectItem value="QA Engineer">QA Engineer</SelectItem>
                <SelectItem value="Product Manager">Product Manager</SelectItem>
                <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                <SelectItem value="Software Architect">Software Architect</SelectItem>
                <SelectItem value="Cloud Engineer">Cloud Engineer</SelectItem>
                <SelectItem value="Security Engineer">Security Engineer</SelectItem>
                <SelectItem value="Database Administrator">Database Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Skills Input */}
          <div className="skills-input flex flex-col gap-2.5">
            <Label htmlFor="candidate-skills" className="text-sm font-semibold text-foreground">
              Skills <span className="text-destructive text-base">*</span>
            </Label>
            <Input
              id="candidate-skills"
              placeholder="Type a skill and press Enter (e.g. React, TypeScript, Node.js)"
              value={skillInputValue}
              onChange={(e) => setSkillInputValue(e.target.value)}
              onKeyDown={handleAddSkill}
              className="h-11 bg-muted/30 border-border/60 transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background focus:shadow-sm hover:border-border"
            />
            {skills.length > 0 && (
              <div className="skill-badges-container flex flex-wrap gap-2 mt-1">
                {skills.map((skill, index) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="skill-badge px-3 py-1.5 text-sm flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:scale-105 hover:shadow-sm transition-all duration-200 animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-0.5 hover:text-destructive hover:scale-110 transition-all duration-150"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Resume Input */}
          <div className="resume-input flex flex-col gap-2.5">
            <Label htmlFor="resume-content" className="text-sm font-semibold text-foreground">
              Resume / Background <span className="text-destructive text-base">*</span>
            </Label>
            <Textarea
              id="resume-content"
              placeholder="Paste your resume or provide a brief summary of your experience and background..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[120px] resize-none bg-muted/30 border-border/60 transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background focus:shadow-sm hover:border-border"
            />
          </div>

          {/* Experience Preset */}
          <div className="experience-preset-selector flex flex-col gap-2.5">
            <Label htmlFor="experience-preset" className="text-sm font-semibold text-foreground">
              Experience Level <span className="text-destructive text-base">*</span>
            </Label>
            <Select value={experiencePreset} onValueChange={setExperiencePreset}>
              <SelectTrigger
                id="experience-preset"
                className="h-11 bg-muted/30 border-border/60 transition-all duration-200 focus:ring-2 focus:ring-primary/50 hover:border-border"
              >
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fresh">Fresh Graduate / Entry Level</SelectItem>
                <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                <SelectItem value="senior">Senior (3+ years)</SelectItem>
              </SelectContent>
            </Select>
            {formError && (
              <p className="text-sm text-destructive mt-1 animate-shake flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                {formError}
              </p>
            )}
          </div>

          {/* Audio Mode Toggle */}
          <div className="audio-mode-toggle p-4 rounded-lg bg-muted/20 border border-border/40 transition-all duration-200 hover:border-border/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                {audioMode ? (
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Mic className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-lg bg-muted">
                    <MicOff className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <Label htmlFor="audio-mode" className="text-sm font-semibold text-foreground cursor-pointer">
                  Voice Interview Mode
                </Label>
              </div>
              <Switch
                id="audio-mode"
                checked={audioMode}
                onCheckedChange={handleAudioModeToggle}
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {audioMode
                ? "✓ Questions will be spoken aloud. You can answer using voice or text."
                : "Enable to hear questions read aloud and respond with your voice."}
            </p>
            {micPermissionStatus === 'denied' && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1 animate-shake">
                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                Microphone access denied. Please enable it in your browser settings.
              </p>
            )}
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStartInterview}
            className="start-interview-button w-full mt-4 h-12 font-semibold text-base bg-primary text-primary-foreground hover:scale-[1.02] hover:shadow-xl elevation-2 glow-effect transition-all duration-200"
            size="lg"
          >
            <span className="flex items-center gap-2">
              Start Interview Session
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
