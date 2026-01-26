/**
 * AnswerAnalyzer
 * Analyzes answer quality to determine next question difficulty
 */
class AnswerAnalyzer {
    static analyzeDepth(answer) {
        if (!answer || answer.trim().length < 20) {
            return { level: 'shallow', confidence: 'low' };
        }

        const wordCount = answer.trim().split(/\s+/).length;
        const hasExamples = /for example|for instance|such as|like when|specifically/i.test(answer);
        const hasTechnicalTerms = /\b(api|database|algorithm|framework|architecture|design|performance|optimization|testing|deployment)\b/i.test(answer);
        const hasMetrics = /\d+%|\d+ (users|requests|ms|seconds|times faster|improvement)/i.test(answer);
        const hasReflection = /learned|realized|understood|discovered|found out|challenging|difficult/i.test(answer);

        let score = 0;
        if (wordCount > 100) score += 3;
        else if (wordCount > 50) score += 2;
        else if (wordCount > 30) score += 1;

        if (hasExamples) score += 2;
        if (hasTechnicalTerms) score += 2;
        if (hasMetrics) score += 1;
        if (hasReflection) score += 1;

        if (score >= 7) return { level: 'strong', confidence: 'high' };
        if (score >= 4) return { level: 'moderate', confidence: 'medium' };
        return { level: 'shallow', confidence: 'low' };
    }

    static extractMentionedConcepts(answer) {
        const concepts = [];

        // Extract technical terms
        const techRegex = /\b([A-Z][a-z]+(?:[A-Z][a-z]+)*|[a-z]+\.js|SQL|API|REST|GraphQL|AWS|Docker|Kubernetes|React|Vue|Angular|Node|Python|Java|CI\/CD)\b/g;
        const matches = answer.match(techRegex) || [];
        concepts.push(...matches);

        // Extract project/product names (capitalized words or phrases in quotes)
        const projectRegex = /"([^"]+)"|'([^']+)'|\b([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)*)\b/g;
        const projectMatches = [...answer.matchAll(projectRegex)];
        projectMatches.forEach(match => {
            const name = match[1] || match[2] || match[3];
            if (name && !concepts.includes(name)) concepts.push(name);
        });

        return [...new Set(concepts)].slice(0, 5); // Return top 5 unique concepts
    }
}

module.exports = AnswerAnalyzer;
