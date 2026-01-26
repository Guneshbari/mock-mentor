/**
 * QuestionElaborationBlock
 * Responsibility: Elaborate and rephrase questions when candidate provides gibberish answers
 */
class QuestionElaborationBlock {
    constructor(geminiClient) {
        this.gemini = geminiClient;
    }

    async elaborate(originalQuestion, interviewConfig) {
        if (!this.gemini) {
            return {
                elaboratedQuestion: originalQuestion + " (Please provide a detailed answer.)",
                elaborationType: "fallback"
            };
        }

        const { role, candidateName, candidateGender, interviewType } = interviewConfig;

        const systemMessage = `You are an experienced interviewer helping ${candidateName || 'the candidate'} in a ${interviewType} interview for a ${role} position.

The candidate's previous answer was unclear/gibberish. Your job is to rephrase the question to be more specific and helpful:

1. Keep the core intent of the original question
2. Make it more specific with examples
3. Break down complex questions into parts
4. Use encouraging language
5. Reference ${candidateName ? candidateName + "'s" : "the candidate's"} background when possible

Return JSON with this structure:
{
  "elaboratedQuestion": "the rephrased question with more detail",
  "elaborationType": "specific" | "breakdown" | "example-driven"
}`;

        try {
            const userPrompt = `Original question: "${originalQuestion}"\n\nPlease rephrase this to be more detailed and helpful. Address the candidate by name if provided.`;
            const result = await this.gemini.generateQuestion(systemMessage, userPrompt);

            if (!result.elaboratedQuestion) {
                result.elaboratedQuestion = originalQuestion + " Please provide a more detailed answer.";
                result.elaborationType = "fallback";
            }

            console.log(`[Question Elaboration] Original: "${originalQuestion}"`);
            console.log(`[Question Elaboration] Elaborated: "${result.elaboratedQuestion}"`);

            return result;
        } catch (error) {
            console.error("Question Elaboration Error:", error);
            return {
                elaboratedQuestion: originalQuestion + " Let me rephrase: please provide a detailed answer with examples.",
                elaborationType: "error-fallback"
            };
        }
    }
}

module.exports = QuestionElaborationBlock;
