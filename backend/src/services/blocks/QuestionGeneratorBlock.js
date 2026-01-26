/**
 * QuestionGeneratorBlock - Gemini Version
 * STRICT non-repetition with topic/intent tracking and dimension-shifting follow-ups
 * NOW ENFORCING: 5-Step Logic Roadmaps per Role AND Experience Level AND Interview Type
 */
const AnswerAnalyzer = require('./AnswerAnalyzer');
const { ROLE_ROADMAPS, BEHAVIORAL_ROADMAPS, HR_ROADMAPS, INTERVIEW_TYPE_STRATEGIES } = require('./RoleStrategies');

class QuestionGeneratorBlock {
    constructor(geminiClient) {
        this.gemini = geminiClient;
    }

    async execute(roleContextPrompt, history, interviewConfig) {
        if (!history || history.length === 0) {
            return await this._generateFirstQuestion(roleContextPrompt, interviewConfig);
        }

        return await this._generateStrictlyUniqueFollowUp(roleContextPrompt, history, interviewConfig);
    }

    async _generateFirstQuestion(roleContextPrompt, interviewConfig) {
        // Resolve Experience Level & Type to Roadmap
        const level = this._resolveExperienceLevel(interviewConfig.experiencePreset);
        const roadmap = this._resolveRoadmap(interviewConfig, level);

        const targetTopic = roadmap[0] || "Core Fundamentals";
        const strategy = INTERVIEW_TYPE_STRATEGIES[interviewConfig.interviewType.toLowerCase()] || INTERVIEW_TYPE_STRATEGIES["technical"];

        const systemPrompt = `${roleContextPrompt}

TASK: Generate the FIRST interview question for ${interviewConfig.role} (${level.toUpperCase()} Level).

STRICT REQUIREMENT: You MUST ask a question about "${targetTopic}".
This is Step 1 of 5 in the ${interviewConfig.interviewType} roadmap.

FORBIDDEN GENERIC QUESTIONS:
❌ "Tell me about yourself"
❌ "Tell me about a challenging project" (unless topic requires it)
❌ "What are your strengths"

INTERVIEW TYPE: ${interviewConfig.interviewType}
Strategy: ${strategy.focus.join(', ')}

Return JSON with this exact format:
{
  "question": "your specific question about ${targetTopic}",
  "topic": "${targetTopic}",
  "intent": "conceptual_understanding"
}`;

        try {
            const result = await this.gemini.generateQuestion(systemPrompt, "Generate the first question as JSON.");
            return result.question || `Can you explain your experience with ${targetTopic}?`;
        } catch (error) {
            console.error('[QuestionGenerator] Error:', error);
            return `Can you explain your experience with ${targetTopic}?`;
        }
    }

    async _generateStrictlyUniqueFollowUp(roleContextPrompt, history, interviewConfig) {
        const lastExchange = history[history.length - 1];
        const previousAnswer = lastExchange.answer;
        const previousQuestion = lastExchange.question;

        // Resolve Experience Level & Type to Roadmap
        const level = this._resolveExperienceLevel(interviewConfig.experiencePreset);
        const roadmap = this._resolveRoadmap(interviewConfig, level);

        const currentStepIndex = history.length; // 1 means we need Q2 (index 1)
        const targetTopic = roadmap[currentStepIndex] || "Advanced/Scenario Challenge";

        console.log(`[QuestionGenerator] Step ${currentStepIndex + 1}/5. Level: ${level}. Type: ${interviewConfig.interviewType}. Enforcing Topic: "${targetTopic}"`);

        // Analyze answer depth and extract concepts
        const mentionedConcepts = AnswerAnalyzer.extractMentionedConcepts(previousAnswer);
        const connectionHints = this._findConnectionHints(previousAnswer, mentionedConcepts);

        const previousQuestions = history.map((h, i) => `Q${i + 1}: ${h.question}`).join('\n');

        const strictPrompt = `${roleContextPrompt}

LAST QUESTION & ANSWER:
Q: "${previousQuestion}"
A: "${previousAnswer}"

=== INTERVIEW ROADMAP ENFORCEMENT ===
Current Stage: ${currentStepIndex + 1} of 5
Topic Level: ${level.toUpperCase()}
MANDATORY TOPIC: "${targetTopic}"

PREVIOUS QUESTIONS:
${previousQuestions}

${connectionHints ? `POSSIBLE CONNECTION: ${connectionHints} (Try to bridge to the new topic if natural)` : ''}

=== YOUR MISSION ===
Generate a follow-up question that:
1. STRICTLY covers the Mandatory Topic: "${targetTopic}"
2. Tries to transition smoothly from the previous answer IF POSSIBLE (but Topic Priority > Transition)
3. Aligns with ${interviewConfig.role} role at ${level.toUpperCase()} level
4. Follows ${interviewConfig.interviewType} style

Return JSON:
{
  "question": "your question here",
  "topic": "${targetTopic}",
  "intent": "roadmap_progression"
}`;

        try {
            const result = await this.gemini.generateQuestion(strictPrompt, `Generate Q${currentStepIndex + 1} about "${targetTopic}" as JSON.`);
            return result.question || this._getFallbackFollowUp(history.length);
        } catch (error) {
            console.error('[QuestionGenerator] Error:', error);
            return this._getFallbackFollowUp(history.length);
        }
    }

    _resolveExperienceLevel(preset) {
        if (!preset) return 'mid';
        const p = preset.toLowerCase();
        if (p.includes('fresh') || p.includes('entry') || p.includes('intern')) return 'fresh';
        if (p.includes('senior') || p.includes('lead') || p.includes('principal')) return 'senior';
        return 'mid';
    }

    _resolveRoadmap(interviewConfig, level) {
        const type = (interviewConfig.interviewType || 'technical').toLowerCase();

        if (type === 'behavioral') {
            return BEHAVIORAL_ROADMAPS[level] || BEHAVIORAL_ROADMAPS['mid'];
        }
        if (type === 'hr') {
            return HR_ROADMAPS[level] || HR_ROADMAPS['mid'];
        }

        // Technical (Role Based)
        const roleData = ROLE_ROADMAPS[interviewConfig.role] || ROLE_ROADMAPS["Full Stack Developer"];
        return roleData[level] || roleData['mid'];
    }

    _getFallbackFollowUp(index) {
        const fallbacks = [
            "Can you elaborate on the technical trade-offs you considered?",
            "What were the biggest challenges you faced in that situation?",
            "How did you measure the success or impact of that?",
            "If you could do it again, what would you change?",
            "How does this relate to other parts of the system?"
        ];
        return fallbacks[index % fallbacks.length];
    }

    _findConnectionHints(previousAnswer, mentionedConcepts) {
        if (mentionedConcepts.length > 0) return `Candidate mentioned: ${mentionedConcepts.slice(0, 3).join(', ')}`;
        return null;
    }
}

module.exports = QuestionGeneratorBlock;
