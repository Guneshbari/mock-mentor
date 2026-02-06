/**
 * FeedbackBlock
 * Responsibility: Generate final comprehensive feedback / report.
 * Calculates overall score from individual answer evaluations.
 */
class FeedbackBlock {
    constructor(geminiClient) {
        this.gemini = geminiClient;
    }

    async execute(history, interviewConfig) {
        if (!this.gemini) return {
            overallScore: 0,
            feedback: "No AI provider",
            calculatedScore: 0,
            individualScores: []
        };

        // CRITICAL: Evaluate all answers NOW if they don't have evaluations
        // This happens because we removed real-time evaluation during interview
        console.log('[FeedbackBlock] Evaluating all answers for final report...');

        const evaluationBlock = require('./EvaluationBlock');
        const evalBlock = new evaluationBlock(this.gemini);

        // Evaluate each answer that doesn't have an evaluation
        for (let i = 0; i < history.length; i++) {
            if (!history[i].evaluation) {
                console.log(`[FeedbackBlock] Evaluating Q${i + 1}...`);
                const evaluation = await evalBlock.execute(
                    history[i].question,
                    history[i].answer,
                    interviewConfig,
                    i // Pass index for Roadmap Topic awareness
                );
                history[i].evaluation = evaluation;
                console.log(`[FeedbackBlock] Q${i + 1} Score: ${evaluation.score}`);
            }
        }

        // Calculate overall score from individual evaluations
        const scoreData = this._calculateOverallScore(history);

        const systemPrompt = `Generate a comprehensive interview report in JSON format.
  
Schema:
{
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
      "summary": string (brief summary of answer, max 100 chars),
      "score": number (0-100),
      "key_feedback": string (one sentence)
    }
  ]
}

IMPORTANT: 
- DO NOT include "overallScore" in your response - it's already calculated from individual answer scores
- Calculate category scores by analyzing all answers holistically
- Use individual evaluation scores and feedback to inform your analysis
- Ensure category scores reflect the actual performance shown in answer evaluations
- Be specific and actionable in feedback`;

        // Build conversation text including evaluations if available
        const conversationParts = (history || []).map((h, i) => {
            let part = `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`;
            if (h.evaluation) {
                part += `\nEvaluation Score: ${h.evaluation.score}/100`;
                part += `\nBreakdown: Completeness=${h.evaluation.breakdown?.completeness || 'N/A'}, `;
                part += `Accuracy=${h.evaluation.breakdown?.technicalAccuracy || 'N/A'}, `;
                part += `Depth=${h.evaluation.breakdown?.depth || 'N/A'}, `;
                part += `Clarity=${h.evaluation.breakdown?.clarity || 'N/A'}`;
                part += `\nFeedback: ${h.evaluation.feedback}`;
            }
            return part;
        }).join('\n\n');

        try {
            const userPrompt = `Analyze this interview and generate a comprehensive report:\n\n${conversationParts}`;
            const report = await this.gemini.generateReport(systemPrompt, userPrompt);

            // Add the calculated overall score
            report.overallScore = scoreData.overallScore;
            report.individualScores = scoreData.individualScores;
            report.scoreCalculation = scoreData.scoreCalculation;

            // Ensure questionAnswerHistory is populated with scores
            if (!report.questionAnswerHistory || report.questionAnswerHistory.length === 0) {
                report.questionAnswerHistory = (history || []).map((h, i) => ({
                    question: h.question,
                    answer: h.answer,
                    summary: h.answer.length > 100 ? `${h.answer.substring(0, 97)}...` : h.answer,
                    score: h.evaluation?.score || 0,
                    key_feedback: h.evaluation?.feedback || 'No feedback available',
                    strengths: h.evaluation?.strengths || [],
                    improvements: h.evaluation?.improvements || []
                }));
            } else {
                // Ensure each history item has a score
                report.questionAnswerHistory = report.questionAnswerHistory.map((item, i) => ({
                    ...item,
                    score: history[i]?.evaluation?.score || item.score || 0,
                    key_feedback: item.key_feedback || history[i]?.evaluation?.feedback || 'No feedback',
                    strengths: history[i]?.evaluation?.strengths || [],
                    improvements: history[i]?.evaluation?.improvements || [],
                    confidence_score: history[i]?.evaluation?.breakdown?.confidence ||
                        (history[i]?.evaluation?.breakdown ? Math.round((history[i].evaluation.breakdown.depth + history[i].evaluation.breakdown.completeness) / 2) : 0)
                }));
            }

            // Adjust category scores based on individual score breakdowns if available
            if (history.some(h => h.evaluation?.breakdown)) {
                const avgBreakdown = this._calculateAverageBreakdown(history);
                report.categoryScores = {
                    communication: report.categoryScores?.communication || avgBreakdown.clarity,
                    clarity: report.categoryScores?.clarity || avgBreakdown.clarity,
                    technicalDepth: report.categoryScores?.technicalDepth || avgBreakdown.technicalAccuracy,
                    confidence: report.categoryScores?.confidence || Math.round((avgBreakdown.depth + avgBreakdown.completeness) / 2)
                };
            }

            return report;
        } catch (error) {
            console.error("Feedback Block Error:", error);

            // Fallback: create basic report from history with calculated scores
            return {
                overallScore: scoreData.overallScore,
                individualScores: scoreData.individualScores,
                scoreCalculation: scoreData.scoreCalculation,
                categoryScores: {
                    communication: scoreData.overallScore,
                    clarity: scoreData.overallScore,
                    technicalDepth: scoreData.overallScore,
                    confidence: scoreData.overallScore
                },
                identifiedStrengths: ["Unable to generate detailed analysis"],
                areasForImprovement: ["Error generating report"],
                actionableFeedback: ["Please try again"],
                questionAnswerHistory: (history || []).map((h, i) => ({
                    question: h.question,
                    answer: h.answer,
                    summary: h.answer.length > 100 ? `${h.answer.substring(0, 97)}...` : h.answer,
                    score: h.evaluation?.score || 0,
                    key_feedback: h.evaluation?.feedback || 'No feedback available'
                }))
            };
        }
    }

    /**
     * Calculate overall score from individual answer evaluations
     * Uses weighted average: recent answers weighted more heavily
     */
    _calculateOverallScore(history) {
        if (!history || history.length === 0) {
            return {
                overallScore: 0,
                individualScores: [],
                scoreCalculation: "No answers to evaluate"
            };
        }

        const individualScores = [];
        let totalWeightedScore = 0;
        let totalWeight = 0;

        history.forEach((item, index) => {
            const score = item.evaluation?.score || 0;

            // Weight calculation: more recent questions get higher weight
            // Early questions (first 1/3): weight 0.8
            // Middle questions (middle 1/3): weight 1.0
            // Recent questions (last 1/3): weight 1.2
            const position = index / history.length;
            let recencyWeight = 1.0;
            if (position < 0.33) {
                recencyWeight = 0.8; // Early questions
            } else if (position > 0.66) {
                recencyWeight = 1.2; // Recent questions
            }

            const weight = recencyWeight;
            totalWeightedScore += score * weight;
            totalWeight += weight;

            individualScores.push({
                questionNumber: index + 1,
                score: score,
                weight: weight,
                weightedScore: score * weight
            });
        });

        const overallScore = totalWeight > 0
            ? Math.round(totalWeightedScore / totalWeight)
            : 0;

        const scoreCalculation = `Calculated from ${history.length} answers using weighted average (recent answers weighted higher)`;

        return {
            overallScore,
            individualScores,
            scoreCalculation
        };
    }

    /**
     * Calculate average breakdown scores from all evaluations
     */
    _calculateAverageBreakdown(history) {
        const breakdowns = history
            .map(h => h.evaluation?.breakdown)
            .filter(b => b);

        if (breakdowns.length === 0) {
            return { completeness: 50, technicalAccuracy: 50, depth: 50, clarity: 50 };
        }

        const avg = {
            completeness: 0,
            technicalAccuracy: 0,
            depth: 0,
            clarity: 0
        };

        breakdowns.forEach(b => {
            avg.completeness += b.completeness || 0;
            avg.technicalAccuracy += b.technicalAccuracy || 0;
            avg.depth += b.depth || 0;
            avg.clarity += b.clarity || 0;
        });

        const count = breakdowns.length;
        return {
            completeness: Math.round(avg.completeness / count),
            technicalAccuracy: Math.round(avg.technicalAccuracy / count),
            depth: Math.round(avg.depth / count),
            clarity: Math.round(avg.clarity / count)
        };
    }
}

module.exports = FeedbackBlock;
