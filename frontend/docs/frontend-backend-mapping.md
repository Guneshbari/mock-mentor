## Page → Backend Interaction Mapping

### app/page.tsx (Interview Setup Page)
Sends:
- interviewConfig.interviewType
- interviewConfig.role
- interviewConfig.skills
- interviewConfig.resumeText

Receives:
- sessionId
- firstQuestion
- totalSteps

---

### app/interview/page.tsx (Interview Session Page)
Sends:
- sessionId
- currentQuestionIndex
- previousAnswerText

Receives:
- nextQuestion OR finalReport
- currentStep
- totalSteps

---

### app/report/page.tsx (Final Report Page)
Consumes:
- finalReport (already computed by backend)

## Component → Backend Field Mapping

InterviewTypeSelector
→ interviewConfig.interviewType

JobRoleInput
→ interviewConfig.role

SkillsInput
→ interviewConfig.skills[]

ResumeTextarea
→ interviewConfig.resumeText

InterviewQuestionCard
→ response.question

InterviewProgressBar
→ response.currentStep, response.totalSteps

AnswerTextarea
→ request.previousAnswerText

InterviewMemoryPanel
→ backend-owned session.history[]

InterviewReportScore
→ finalReport.overallScore

InterviewMetricCard
→ finalReport.breakdown.*

## State Ownership

| Data | Owner |
|----|----|
| interviewType | Frontend |
| role | Frontend |
| skills | Frontend |
| resumeText | Frontend |
| sessionId | Backend (frontend stores) |
| currentStep | Backend |
| questions | Backend |
| answers | Backend |
| evaluation scores | Backend |
| final report | Backend |
| dark/light mode | Frontend |

## Backend Logical Blocks (Problem Statement Alignment)

RoleBlock
→ interviewConfig

QuestionGeneratorBlock
→ generateNextQuestion()

MemoryBlock
→ session.history[]

EvaluationBlock
→ evaluateAnswer()

FeedbackBlock
→ generateFinalReport()
