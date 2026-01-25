/**
 * QuestionGeneratorBlock
 * Responsibility: Generate the next interview question based on context and history.
 */
class QuestionGeneratorBlock {
    constructor(groqClient) {
        this.groq = groqClient;
        this.model = process.env.GROQ_MODEL || "llama3-8b-8192";
    }

    async execute(roleContextPrompt, history, interviewConfig) {
        if (!this.groq) throw new Error("Groq client not initialized");

        const messages = [
            { role: "system", content: roleContextPrompt }
        ];

        // Add conversation history for context
        if (history && history.length > 0) {
            // Add all previous Q&A to maintain full context
            history.forEach(h => {
                messages.push({ role: "assistant", content: h.question });
                messages.push({ role: "user", content: h.answer });
            });
        }

        // Add adaptive instruction for the next turn
        if (!history || history.length === 0) {
            // First question - role-specific opening
            const openingStrategy = this._getOpeningStrategy(interviewConfig.role, interviewConfig.experiencePreset);
            messages.push({
                role: "system",
                content: `Generate the FIRST opening question for this ${interviewConfig.interviewType} interview.

CRITICAL REQUIREMENTS:
1. Make it SPECIFIC to the role: "${interviewConfig.role}"
2. Focus on their skills: ${interviewConfig.skills?.join(', ') || 'general competencies'}
3. Match their experience level: ${interviewConfig.experiencePreset || 'junior'}
4. Start with something engaging and role-relevant
5. DO NOT ask generic "tell me about yourself" questions
6. Ask about a SPECIFIC scenario or skill from their role

Context: ${openingStrategy}

Return ONLY the question text, no preamble.`
            });
        } else {
            // Subsequent questions - HIGHLY ADAPTIVE based on previous answer
            const lastExchange = history[history.length - 1];
            const previousAnswer = lastExchange.answer;
            const previousQuestion = lastExchange.question;

            // Extract key concepts from previous answer for next question
            const adaptiveInstruction = `
CRITICAL: Generate the NEXT interview question with MAXIMUM ADAPTIVITY.

ANALYZE THE PREVIOUS EXCHANGE:
Previous Question: "${previousQuestion}"
Candidate's Answer: "${previousAnswer}"

YOUR ADAPTIVE STRATEGY (MANDATORY):
1. **Deep Dive**: If the answer mentioned a specific technology, project, or concept, ask a FOLLOW-UP question that digs deeper into that exact topic
2. **Related Exploration**: If they showed strength in an area, explore a related but different aspect of that skill
3. **Gap Probing**: If the answer was shallow or vague, ask a "why" or "how" question to uncover depth
4. **Skill Pivoting**: Move to a different required skill from [${interviewConfig.skills?.join(', ')}] while still connecting to their previous answer
5. **Role-Specific**: ALWAYS frame questions in the context of "${interviewConfig.role}" responsibilities

VARIATION REQUIREMENTS:
- DO NOT repeat or rephrase previous questions
- DO NOT ask about the same exact topic twice
- VARY question structure (scenario-based, problem-solving, explanation, comparison, etc.)
- Make each question progressively more specific based on accumulated context

DIFFICULTY ADJUSTMENT:
- If they're doing well (detailed, accurate answers): INCREASE difficulty with trade-offs, edge cases, or architectural questions
- If they're struggling: Ask foundational questions or provide scenario hints
- Experience level: ${interviewConfig.experiencePreset}

MANDATORY: The question MUST reference or build upon something from their previous answer.

Return ONLY the question text.`;

            messages.push({
                role: "system",
                content: adaptiveInstruction
            });
        }

        const completion = await this.groq.chat.completions.create({
            messages,
            model: this.model,
            temperature: 0.7,  // Increased from 0.3 for more variation
            max_tokens: 1024,
            top_p: 0.95  // Add top_p for more diverse outputs
        });

        return this._cleanQuestion(completion.choices[0]?.message?.content || "");
    }

    _formatHistory(history) {
        return (history || []).map(h => ([
            { role: "assistant", content: h.question },
            { role: "user", content: h.answer }
        ])).flat();
    }

    _getOpeningStrategy(role, experiencePreset) {
        if (!role) return "Ask a specific technical question about their experience.";

        const level = experiencePreset || 'junior';
        const strategies = {
            'fresh': `Ask about a recent academic project or learning experience related to ${role}`,
            'junior': `Ask about a specific feature or component they've built as a ${role}`,
            'senior': `Ask about a complex architectural decision or system design challenge they've faced as a ${role}`
        };

        return strategies[level] || strategies['junior'];
    }

    _cleanQuestion(text) {
        return text.replace(/^["']|["']$/g, '').replace(/^Question:\s*/i, '').trim();
    }
}

module.exports = QuestionGeneratorBlock;
