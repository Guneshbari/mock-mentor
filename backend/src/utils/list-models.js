require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('No GEMINI_API_KEY found in .env');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Note: listModels is not directly exposed on genAI instance in some SDK versions,
        // usually it's via a model manager or we can try a direct fetch if SDK doesn't support it easily.
        // Checking SDK docs pattern, usually it's not simpler.
        // Let's try getting a model and asking for list if possible, or simple heuristic.
        // Actually, newer SDKs might expose it differently. 
        // Let's try a direct REST call which is more reliable for "what does this key see".

        // Using fetch to call the API directly
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        const fs = require('fs');
        let output = 'Available Models:\n';
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    output += `- ${m.name} (${m.displayName})\n`;
                }
            });
            fs.writeFileSync('models.txt', output);
            console.log('Models written to models.txt');
        } else {
            console.error('Failed to list models:', data);
        }

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
