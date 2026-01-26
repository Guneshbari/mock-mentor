/**
 * Groq AI Service
 * Powered by Llama 3 on Groq
 */
const Groq = require('groq-sdk');

class GroqService {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('[Groq] No API key provided');
            this.groq = null;
            return;
        }

        this.groq = new Groq({ apiKey });
        this.modelName = process.env.GROQ_MODEL || 'llama3-70b-8192'; // Use 70b for better reasoning
    }

    /**
     * Generate content with JSON response
     */
    async generateJSON(systemPrompt, userPrompt) {
        if (!this.groq) {
            throw new Error('Groq API not initialized');
        }

        const completion = await this.groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt + "\n\nIMPORTANT: Return ONLY valid JSON." },
                { role: 'user', content: userPrompt }
            ],
            model: this.modelName,
            temperature: 0.5,
            response_format: { type: 'json_object' }
        });

        const text = completion.choices[0]?.message?.content || '{}';

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('[Groq] JSON Parse Error. Raw text:', text);
            // Fallback: try to extract JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw e;
        }
    }

    /**
     * Generate Question
     */
    async generateQuestion(systemPrompt, userPrompt) {
        return await this.generateJSON(systemPrompt, userPrompt);
    }

    /**
     * Evaluate Answer
     */
    async evaluateAnswer(systemPrompt, userPrompt) {
        return await this.generateJSON(systemPrompt, userPrompt);
    }

    /**
     * Generate Report
     */
    async generateReport(systemPrompt, userPrompt) {
        return await this.generateJSON(systemPrompt, userPrompt);
    }

    /**
     * Audio Transcription (Whisper)
     */
    async transcribeAudio(fileStream) {
        return await this.groq.audio.transcriptions.create({
            file: fileStream,
            model: 'whisper-large-v3-turbo',
            response_format: 'text',
            language: 'en',
            temperature: 0.0
        });
    }
}

module.exports = GroqService;
