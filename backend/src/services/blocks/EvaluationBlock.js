/**
 * EvaluationBlock - Gemini Version
 * Score candidate answers with detailed performance metrics
 */
const { MASTER_ROADMAPS } = require('./RoleStrategies');

class EvaluationBlock {
    constructor(geminiClient) {
        this.gemini = geminiClient;
    }

    async execute(question, answer, interviewConfig, questionIndex = 0) {
        if (!this.gemini) return {
            score: 0,
            feedback: "No AI provider",
            breakdown: { completeness: 0, technicalAccuracy: 0, depth: 0, clarity: 0 }
        };

        const { role, experiencePreset, interviewType } = interviewConfig;

        // Resolve Expected Topic from Roadmap
        const level = this._resolveExperienceLevel(experiencePreset);
        const typeLower = (interviewType || 'technical').toLowerCase();

        // 1. Get Role Data (e.g. MasterRoadmaps["Frontend Developer"])
        const roleData = MASTER_ROADMAPS[role] || MASTER_ROADMAPS["Frontend Developer"];

        // 2. Get Level Data
        const levelData = roleData[level] || roleData['mid'];

        // 3. Get Type Data (e.g. levelData["hr"])
        const roadmap = levelData[typeLower] || levelData['technical'];

        const expectedTopic = roadmap[questionIndex] || "General Concepts";

        const rubric = this._getRubric(experiencePreset, interviewType);

        const systemMessage = `You are an expert technical interviewer conducting a ${interviewType || 'technical'} interview for a ${role} position (${level.toUpperCase()} level).

CURRENT QUESTION CONTEXT:
- Question Number: ${questionIndex + 1} of 5
- REQUIRED TOPIC: "${expectedTopic}"

YOUR TASK: Evaluate the candidate's answer based on how well they address this specific topic.

EVALUATION CRITERIA (0-100 for each):
1. Completeness (25%): Did they cover "${expectedTopic}" thoroughly?
2. Technical Accuracy (30%): Is their knowledge of "${expectedTopic}" correct?
3. Depth & Detail (25%): Did they provide ${level} level insights?
4. Clarity & Structure (20%): Communication quality.

${rubric}

SCORING GUIDELINES:
- 90-100: Exceptional mastery of ${expectedTopic}
- 75-89: Strong understanding covering key aspects
- 60-74: Basic understanding but missed advanced nuances
- 40-59: Weak answer, missed core concepts of ${expectedTopic}
- 0-39: Off-topic or incorrect

Return JSON with this exact structure:
{
  "score": <overall score 0-100>,
  "breakdown": {
    "completeness": <score 0-100>,
    "technicalAccuracy": <score 0-100>,
    "depth": <score 0-100>,
    "clarity": <score 0-100>
  },
  "feedback": "<2-3 sentence feedback focusing on their knowledge of ${expectedTopic}>",
  "strengths": "<specific strong points>",
  "improvements": "<what was missing regarding ${expectedTopic}>"
}`;

        const userPrompt = `Question: ${question}\n\nCandidate's Answer: ${answer}`;

        try {
            const result = await this.gemini.evaluateAnswer(systemMessage, userPrompt);

            // Ensure all required fields exist
            if (!result.breakdown) {
                result.breakdown = { completeness: 0, technicalAccuracy: 0, depth: 0, clarity: 0 };
            }
            if (!result.score) {
                // Calculate score from breakdown if missing
                const breakdown = result.breakdown;
                result.score = Math.round(
                    breakdown.completeness * 0.25 +
                    breakdown.technicalAccuracy * 0.30 +
                    breakdown.depth * 0.25 +
                    breakdown.clarity * 0.20
                );
            }

            console.log(`[Evaluation] Score: ${result.score}, Breakdown:`, result.breakdown);
            return result;
        } catch (error) {
            console.error("Evaluation Block Error:", error);
            return {
                score: 50,
                feedback: "Error evaluating response.",
                breakdown: { completeness: 50, technicalAccuracy: 50, depth: 50, clarity: 50 },
                strengths: "Unable to analyze",
                improvements: "Please try again"
            };
        }
    }

    /**
     * Detect if answer is gibberish/low-quality
     * Returns true if answer should trigger question elaboration
     */
    isGibberishAnswer(answer) {
        if (!answer || typeof answer !== 'string') return true;

        const trimmed = answer.trim();

        // Too short (less than 15 characters)
        if (trimmed.length < 15) {
            console.log(`[Gibberish Detection] Answer too short: ${trimmed.length} chars`);
            return true;
        }

        // Check for repetitive words
        const words = trimmed.toLowerCase().split(/\s+/);
        if (words.length < 5) {
            console.log(`[Gibberish Detection] Too few words: ${words.length}`);
            return true;
        }

        const uniqueWords = new Set(words);
        const repetitionRatio = uniqueWords.size / words.length;

        // If less than 40% unique words, likely gibberish or repetitive
        if (repetitionRatio < 0.4) {
            console.log(`[Gibberish Detection] High repetition: ${(repetitionRatio * 100).toFixed(0)}% unique`);
            return true;
        }

        // Check for common gibberish patterns
        const gibberishPatterns = [
            /^(test|testing|hello|hi|ok|okay|yes|no|hmm|uh|um)+\s*$/i,
            /^[a-z]{1,3}\s+[a-z]{1,3}\s+[a-z]{1,3}$/i, // Random short words
            /^\d+$/,  // Just numbers
            /^(.)\1{10,}/, // Repeated characters
        ];

        if (gibberishPatterns.some(pattern => pattern.test(trimmed))) {
            console.log(`[Gibberish Detection] Matched gibberish pattern`);
            return true;
        }

        return false;
    }

    _resolveExperienceLevel(preset) {
        if (!preset) return 'mid';
        const p = preset.toLowerCase();
        if (p.includes('fresh') || p.includes('entry') || p.includes('intern')) return 'fresh';
        if (p.includes('senior') || p.includes('lead') || p.includes('principal')) return 'senior';
        return 'mid';
    }

    _getRubric(experiencePreset, interviewType) {
        let rubric = '';

        // Experience-level specific expectations
        if (experiencePreset === 'fresh') {
            rubric += `EXPERIENCE LEVEL (Fresher/Entry):
- Focus on fundamental concepts and theoretical understanding
- Look for eagerness to learn and basic problem-solving approach
- Reward clear explanations even if lacking practical experience
- Don't penalize for lack of real-world examples
- Expect some uncertainty but reward structured thinking\n\n`;
        } else if (experiencePreset === 'senior') {
            rubric += `EXPERIENCE LEVEL (Senior):
- DEMAND deep technical expertise and architectural thinking
- REQUIRE trade-off analysis and decision justification
- EXPECT real-world examples and production experience
- PENALIZE shallow or textbook-only answers severely
- Look for leadership, mentoring, and system design insights\n\n`;
        } else {
            rubric += `EXPERIENCE LEVEL (Mid-Level):
- Expect solid practical implementation knowledge
- Look for hands-on experience with relevant technologies
- Reward problem-solving approach and learning agility
- Expect some real-world examples
- Balance theory with practice\n\n`;
        }

        // Interview-type specific focus
        if (interviewType === 'technical') {
            rubric += `INTERVIEW TYPE (Technical):
- Prioritize technical accuracy and depth
- Evaluate problem-solving methodology
- Look for code quality awareness and best practices
- Assess understanding of algorithms, data structures, or domain concepts`;
        } else if (interviewType === 'behavioral') {
            rubric += `INTERVIEW TYPE (Behavioral):
- Focus on STAR method (Situation, Task, Action, Result)
- Evaluate soft skills: communication, teamwork, conflict resolution
- Look for self-awareness and growth mindset
- Assess leadership and collaboration examples`;
        } else if (interviewType === 'hr') {
            rubric += `INTERVIEW TYPE (HR):
- Assess cultural fit and motivation
- Evaluate career goals alignment
- Look for professionalism and communication skills
- Focus on clarity and honesty in responses`;
        }

        return rubric;
    }
}

module.exports = EvaluationBlock;
