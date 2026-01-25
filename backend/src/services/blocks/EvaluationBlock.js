/**
 * EvaluationBlock
 * Responsibility: Score candidate answers and provide immediate feedback with detailed performance metrics.
 */
class EvaluationBlock {
    constructor(groqClient) {
        this.groq = groqClient;
        this.model = process.env.GROQ_MODEL || "llama3-8b-8192";
    }

    async execute(question, answer, interviewConfig) {
        if (!this.groq) return {
            score: 0,
            feedback: "No AI provider",
            breakdown: { completeness: 0, technicalAccuracy: 0, depth: 0, clarity: 0 }
        };

        const { role, experiencePreset, skills, interviewType } = interviewConfig;
        const rubric = this._getRubric(experiencePreset, interviewType);

        const systemMessage = `You are an expert technical interviewer conducting a ${interviewType || 'technical'} interview for a ${role} position (${experiencePreset || 'mid'} level).

EVALUATION CRITERIA (0-100 for each):
1. Completeness (25%): Did they fully address all parts of the question?
2. Technical Accuracy (30%): Correctness and validity of information provided
3. Depth & Detail (25%): Level of insight, examples, and elaboration
4. Clarity & Structure (20%): Organization, articulation, and communication quality

${rubric}

SCORING GUIDELINES:
- 90-100: Exceptional answer with deep insights and perfect execution
- 75-89: Strong answer with good understanding and examples
- 60-74: Adequate answer covering basics but lacking depth
- 40-59: Weak answer with gaps or inaccuracies
- 0-39: Very poor answer with major issues or off-topic

Return JSON with this exact structure:
{
  "score": <overall score 0-100>,
  "breakdown": {
    "completeness": <score 0-100>,
    "technicalAccuracy": <score 0-100>,
    "depth": <score 0-100>,
    "clarity": <score 0-100>
  },
  "feedback": "<2-3 sentence constructive feedback>",
  "strengths": "<what they did well>",
  "improvements": "<what could be better>"
}`;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemMessage },
                    { role: "user", content: `Question: ${question}\n\nCandidate's Answer: ${answer}` }
                ],
                model: this.model,
                temperature: 0.3,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

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
