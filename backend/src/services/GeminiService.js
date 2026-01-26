/**
 * Gemini AI Service
 * Wrapper for Google Gemini API
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('[Gemini] No API key provided');
            this.genAI = null;
            return;
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.questionModel = process.env.QUESTION_MODEL || 'gemini-2.0-flash-exp';
        this.evaluationModel = process.env.EVALUATION_MODEL || 'gemini-1.5-pro';
        this.reportModel = process.env.REPORT_MODEL || 'gemini-1.5-pro';
    }

    /**
     * Generate content with JSON response
     */
    async generateJSON(systemPrompt, userPrompt, modelName = null) {
        if (!this.genAI) {
            throw new Error('Gemini API not initialized');
        }

        const model = this.genAI.getGenerativeModel({
            model: modelName || this.questionModel,
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 1024,
                responseMimeType: 'application/json',
            },
        });

        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Cleanup markdown code blocks if present (Gemini often adds them)
        if (text.includes('```')) {
            text = text.replace(/```json\n?|```/g, '').trim();
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('[Gemini] JSON Parse Error. Raw text:', text);
            // Attempt to find JSON object within text if strict parse fails
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (innerE) {
                    throw e;
                }
            }
            throw e;
        }
    }

    /**
     * Generate text content
     */
    async generateText(systemPrompt, userPrompt, modelName = null, temperature = 0.7) {
        if (!this.genAI) {
            throw new Error('Gemini API not initialized');
        }

        const model = this.genAI.getGenerativeModel({
            model: modelName || this.questionModel,
            generationConfig: {
                temperature,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048,
            },
        });

        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        const result = await model.generateContent(prompt);
        const response = result.response;

        return response.text();
    }

    /**
     * For question generation (uses gemini-2.0-flash-exp)
     */
    async generateQuestion(systemPrompt, userPrompt) {
        return await this.generateJSON(systemPrompt, userPrompt, this.questionModel);
    }

    /**
     * For evaluation (uses gemini-1.5-pro for better reasoning)
     */
    async evaluateAnswer(systemPrompt, userPrompt) {
        return await this.generateJSON(systemPrompt, userPrompt, this.evaluationModel);
    }

    /**
     * For final report (uses gemini-1.5-pro)
     */
    async generateReport(systemPrompt, userPrompt) {
        return await this.generateJSON(systemPrompt, userPrompt, this.reportModel);
    }
}

module.exports = GeminiService;
