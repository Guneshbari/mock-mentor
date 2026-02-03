"use client";

import React from "react"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { X, Briefcase, Code, Users, Mic, MicOff, Play, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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

const interviewTypeDescriptions = {
  hr: "General questions about your background, experience, and career goals",
  technical: "Role-specific technical questions and problem-solving scenarios",
  behavioral: "Situational questions about how you handle workplace scenarios",
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
  const [loading, setLoading] = useState(false);

  // Check microphone permission when audio mode is enabled
  const handleAudioModeToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Release immediately
        setMicPermissionStatus('granted');
        setAudioMode(true);
        toast.success("Microphone access granted");
      } catch (error) {
        console.error('Microphone permission denied:', error);
        setMicPermissionStatus('denied');
        setAudioMode(false);
        toast.error("Microphone access denied. Please enable it in your browser settings.");
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
    setLoading(true);
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
      setLoading(false);
      return;
    }
    if (!role.trim()) {
      setFormError("Please enter a job role to continue.");
      setLoading(false);
      return;
    }
    if (finalSkills.length === 0) {
      setFormError("Please add at least one skill to continue.");
      setLoading(false);
      return;
    }
    if (!resumeText.trim()) {
      setFormError("Please provide your resume or background summary to continue.");
      setLoading(false);
      return;
    }
    if (!experiencePreset) {
      setFormError("Please select an experience level preset to continue.");
      setLoading(false);
      return;
    }
    setFormError("");

    try {
      // Import auth headers helper
      const { getAuthHeaders } = await import('@/lib/auth-headers');
      const headers = await getAuthHeaders();

      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ interviewConfig }),
      });

      if (!response.ok) throw new Error('Failed to start interview');

      const data = await response.json();
      toast.success("Interview session started!");
      onStartInterview({
        ...interviewConfig,
        sessionId: data.sessionId,
        firstQuestion: data.firstQuestion,
        totalSteps: data.totalSteps,
        questionAudio: data.questionAudio,
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error("Failed to start interview. Please try again.");
      // Fallback: still call onStartInterview for now
      onStartInterview({
        ...interviewConfig,
        sessionId: 'temp-' + Date.now(),
        firstQuestion: 'Tell me about yourself.',
        totalSteps: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = interviewTypeIcons[selectedInterviewType];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background animate-fade-up">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
              <SelectedIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Setup Your Interview
              </h2>
              <p className="text-sm text-muted-foreground">
                {interviewTypeDescriptions[selectedInterviewType]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout for Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="candidate-name">
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="candidate-name"
                  placeholder="Enter your full name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidate-gender">Gender</Label>
                <Select value={candidateGender} onValueChange={(value: any) => setCandidateGender(value)}>
                  <SelectTrigger id="candidate-gender">
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
            </CardContent>
          </Card>

          {/* Interview Type */}
          <Card className="animate-fade-up" style={{ animationDelay: "150ms" }}>
            <CardHeader>
              <CardTitle>Interview Type <span className="text-destructive">*</span></CardTitle>
              <CardDescription>Choose the type of interview</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={selectedInterviewType}
                onValueChange={(value) =>
                  setSelectedInterviewType(value as "hr" | "technical" | "behavioral")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                  <TabsTrigger value="hr" className="gap-2 py-3">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">HR</span>
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="gap-2 py-3">
                    <Code className="h-4 w-4" />
                    <span className="hidden sm:inline">Technical</span>
                  </TabsTrigger>
                  <TabsTrigger value="behavioral" className="gap-2 py-3">
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">Behavioral</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle>Skills <span className="text-destructive">*</span></CardTitle>
              <CardDescription>Add your key skills (press Enter)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                id="candidate-skills"
                placeholder="Type a skill and press Enter"
                value={skillInputValue}
                onChange={(e) => setSkillInputValue(e.target.value)}
                onKeyDown={handleAddSkill}
              />
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-3 py-1.5 text-sm flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-0.5 hover:text-destructive transition-colors"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio Mode */}
          <Card className="animate-fade-up" style={{ animationDelay: "250ms" }}>
            <CardHeader>
              <CardTitle>Interview Mode</CardTitle>
              <CardDescription>Voice or text interaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${audioMode ? 'bg-primary/10' : 'bg-muted'}`}>
                    {audioMode ? (
                      <Mic className="h-5 w-5 text-primary" />
                    ) : (
                      <MicOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="audio-mode" className="font-semibold cursor-pointer">
                      Voice Mode
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {audioMode ? "Voice enabled" : "Text only"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="audio-mode"
                  checked={audioMode}
                  onCheckedChange={handleAudioModeToggle}
                />
              </div>
              {micPermissionStatus === 'denied' && (
                <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-destructive">
                    Microphone access denied. Enable it in browser settings.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Role & Experience */}
          <Card className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle>Role & Experience</CardTitle>
              <CardDescription>What position are you preparing for?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-job-role">
                  Target Role <span className="text-destructive">*</span>
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="target-job-role">
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

              <div className="space-y-2">
                <Label htmlFor="experience-preset">
                  Experience Level <span className="text-destructive">*</span>
                </Label>
                <Select value={experiencePreset} onValueChange={setExperiencePreset}>
                  <SelectTrigger id="experience-preset">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fresh">Fresh Graduate / Entry Level</SelectItem>
                    <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                    <SelectItem value="senior">Senior (3+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Resume */}
          <Card className="animate-fade-up" style={{ animationDelay: "150ms" }}>
            <CardHeader>
              <CardTitle>Resume / Background <span className="text-destructive">*</span></CardTitle>
              <CardDescription>Your experience summary</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="resume-content"
                placeholder="Paste your resume or provide a brief summary of your experience and background..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[280px] lg:min-h-[443px] resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Message */}
      {formError && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 animate-shake">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive font-medium">{formError}</p>
        </div>
      )}

      {/* Start Button */}
      <Button
        onClick={handleStartInterview}
        disabled={loading}
        className="w-full h-12 text-base font-semibold gap-2 shadow-lg hover:shadow-xl transition-all"
        size="lg"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Starting Interview...
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            Start Interview Session
          </>
        )}
      </Button>
    </div>
  );
}
