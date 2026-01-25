/**
 * FeedbackBlock
 * Responsibility: Generate final comprehensive feedback / report.
 */
class FeedbackBlock {
    constructor(groqClient) {
        this.groq = groqClient;
        this.model = process.env.GROQ_MODEL || "llama3-8b-8192";
    }

    async execute(history) {
        if (!this.groq) return { overallScore: 0, feedback: "No AI provider" };

        const systemPrompt = `Generate a comprehensive interview report in JSON format.
  
Schema:
{
  "overallScore": number (0-100),
  "categoryScores": {
    "communication": number (0-100),
    "clarity": number (0-100),
    "technicalDepth": number (0-100),
    "confidence": number (0-100)
  },
  "identifiedStrengths": string[],
  "areasForImprovement": string[],
  "actionableFeedback": string[],
  "questionAnswerHistory": [
    {
      "question": string,
      "answer": string,
      "summary": string (brief summary of answer, max 100 chars)
    }
  ]
}

IMPORTANT: Calculate scores by analyzing all answers holistically. If individual evaluations exist, use them as input but ensure overall coherence.`;

        // Build conversation text including evaluations if available
        const conversationParts = (history || []).map((h, i) => {
            let part = `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`;
            if (h.evaluation) {
                part += `\nEvaluation Score: ${h.evaluation.score}/100\nFeedback: ${h.evaluation.feedback}`;
            }
            return part;
        }).join('\n\n');

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this interview and generate a comprehensive report:\n\n${conversationParts}` }
                ],
                model: this.model,
                temperature: 0.3,
                response_format: { type: "json_object" }
            });

            const report = JSON.parse(completion.choices[0]?.message?.content || "{}");

            // Ensure questionAnswerHistory is populated if not provided by AI
            if (!report.questionAnswerHistory || report.questionAnswerHistory.length === 0) {
                report.questionAnswerHistory = (history || []).map(h => ({
                    question: h.question,
                    answer: h.answer,
                    summary: h.answer.length > 100 ? `${h.answer.substring(0, 97)}...` : h.answer
                }));
            }

            return report;
        } catch (error) {
            console.error("Feedback Block Error:", error);

            // Fallback: create basic report from history
            return {
                overallScore: 0,
                categoryScores: {
                    communication: 0,
                    clarity: 0,
                    technicalDepth: 0,
                    confidence: 0
                },
                identifiedStrengths: ["Unable to generate detailed analysis"],
                areasForImprovement: ["Error generating report"],
                actionableFeedback: ["Please try again"],
                questionAnswerHistory: (history || []).map(h => ({
                    question: h.question,
                    answer: h.answer,
                    summary: h.answer.length > 100 ? `${h.answer.substring(0, 97)}...` : h.answer
                }))
            };
        }
    }
}

module.exports = FeedbackBlock;
