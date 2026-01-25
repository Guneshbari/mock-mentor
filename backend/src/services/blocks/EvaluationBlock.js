/**
 * EvaluationBlock
 * Responsibility: Score candidate answers and provide immediate feedback.
 */
class EvaluationBlock {
    constructor(groqClient) {
        this.groq = groqClient;
        this.model = process.env.GROQ_MODEL || "llama3-8b-8192";
    }

    async execute(question, answer, interviewConfig) {
        if (!this.groq) return { score: 0, feedback: "No AI provider" };

        const { role, experiencePreset, skills } = interviewConfig;
        const rubric = this._getRubric(experiencePreset);

        const systemMessage = `Act as a strict technical interviewer. Evaluate the candidate's answer.
Context: Role: ${role}, Level: ${experiencePreset}, Skills: ${skills?.join(', ')}.
Rubric: ${rubric}

Return JSON with "score" (0-100) and "feedback" (string).`;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemMessage },
                    { role: "user", content: `Question: ${question}\nAnswer: ${answer}` }
                ],
                model: this.model,
                temperature: 0.3,
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0]?.message?.content || "{}");
        } catch (error) {
            console.error("Evaluation Block Error:", error);
            return { score: 50, feedback: "Error evaluating response." };
        }
    }

    _getRubric(experiencePreset) {
        if (experiencePreset === 'fresh') {
            return "- Expect basic theoretical understanding.\n- Reward clarity.";
        } else if (experiencePreset === 'senior') {
            return "- PENALIZE shallow answers.\n- EXPECT trade-offs and depth.";
        } else {
            return "- Expect practical implementation details.";
        }
    }
}

module.exports = EvaluationBlock;
