// AI service for generating adaptive, role-specific questions and evaluations
// Uses Google Gemini API (gemini-1.5-pro preferred, flash as fallback) with intelligent fallbacks

/**
 * Get the appropriate Gemini model with fallback strategy
 */
function getGeminiModel(genAI, preferPro = true) {
  const primaryModel = preferPro ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
  const fallbackModel = preferPro ? 'gemini-1.5-flash' : 'gemini-1.5-pro';
  const configuredModel = process.env.GEMINI_MODEL || primaryModel;
  
  try {
    return genAI.getGenerativeModel({ model: configuredModel });
  } catch (error) {
    console.warn(`Failed to use ${configuredModel}, falling back to ${fallbackModel}`);
    return genAI.getGenerativeModel({ model: fallbackModel });
  }
}

/**
 * Determine dynamic total rounds based on interview state and answer quality
 */
function determineTotalRounds(interviewState) {
  const { history, interviewConfig } = interviewState;
  const { interviewType, role, skills } = interviewConfig;
  
  // Base rounds: 5 minimum
  let totalRounds = 5;
  
  // Analyze answer quality from history
  if (history.length > 0) {
    const avgAnswerLength = history.reduce((sum, entry) => sum + (entry.answer?.length || 0), 0) / history.length;
    const hasDetailedAnswers = avgAnswerLength > 150;
    const hasTechnicalTerms = history.some(entry => 
      /algorithm|architecture|optimization|scalability|design pattern|framework/i.test(entry.answer)
    );
    
    // Increase rounds for strong candidates
    if (hasDetailedAnswers && hasTechnicalTerms && interviewType === 'technical') {
      totalRounds = Math.min(10, totalRounds + 3);
    } else if (hasDetailedAnswers) {
      totalRounds = Math.min(8, totalRounds + 2);
    }
    
    // Reduce rounds for weak/repetitive answers
    const uniqueWords = new Set();
    history.forEach(entry => {
      entry.answer.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 4) uniqueWords.add(word);
      });
    });
    const diversityRatio = uniqueWords.size / (history.reduce((sum, e) => sum + e.answer.split(/\s+/).length, 0) || 1);
    
    if (diversityRatio < 0.3 && avgAnswerLength < 100) {
      totalRounds = Math.max(5, totalRounds - 1);
    }
  }
  
  // Ensure at least one question per core skill for technical interviews
  if (interviewType === 'technical' && skills && skills.length > 0) {
    totalRounds = Math.max(totalRounds, Math.min(10, skills.length + 3));
  }
  
  return Math.min(10, Math.max(5, totalRounds));
}

/**
 * Generate next question based on interview state (adaptive, role-specific)
 * @param {object} interviewState - Current interview state
 * @returns {Promise<string>} Next question
 */
async function generateNextQuestion(interviewState) {
  const { interviewConfig, history, currentStep } = interviewState;
  const { interviewType, role, skills, resumeText } = interviewConfig;

  // If no API key, use adaptive placeholder logic
  if (!process.env.GEMINI_API_KEY) {
    return generateAdaptivePlaceholderQuestion(interviewState);
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use gemini-1.5-pro for question generation (better quality)
    const model = getGeminiModel(genAI, true);
    
    const generationConfig = {
      temperature: 0.7, // Balanced creativity for adaptive questions
      maxOutputTokens: 200,
    };
    
    const modelWithConfig = genAI.getGenerativeModel({ 
      model: model.model || 'gemini-1.5-pro',
      generationConfig
    });

    // Build rich context from interview history
    const historyContext = buildHistoryContext(history);
    
    // Extract signals from previous answers for adaptation
    const answerSignals = extractAnswerSignals(history, interviewConfig);
    
    // Build role-specific, adaptive prompt
    const systemPrompt = buildAdvancedQuestionPrompt(interviewType, role, skills, resumeText);
    const userPrompt = buildAdaptiveQuestionPrompt(historyContext, currentStep, history.length, answerSignals);
    
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await modelWithConfig.generateContent(fullPrompt);
    const response = await result.response;
    const question = response.text().trim();

    if (question && question.length > 10) {
      // Clean up question (remove quotes, numbering, etc.)
      return cleanQuestion(question);
    }
  } catch (error) {
    console.error('Error generating AI question:', error.message);
    // Try fallback to flash model
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const flashModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
      });
      
      const systemPrompt = buildAdvancedQuestionPrompt(interviewType, role, skills, resumeText);
      const userPrompt = buildAdaptiveQuestionPrompt(
        buildHistoryContext(history), 
        currentStep, 
        history.length, 
        extractAnswerSignals(history, interviewConfig)
      );
      
      const result = await flashModel.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const response = await result.response;
      const question = response.text().trim();
      
      if (question && question.length > 10) {
        return cleanQuestion(question);
      }
    } catch (fallbackError) {
      console.error('Fallback model also failed:', fallbackError.message);
    }
  }

  // Fallback to adaptive placeholder
  return generateAdaptivePlaceholderQuestion(interviewState);
}

/**
 * Build rich history context with analysis
 */
function buildHistoryContext(history) {
  if (history.length === 0) return 'No previous questions yet.';
  
  return history.map((entry, idx) => {
    const answerLength = entry.answer.length;
    const answerQuality = answerLength > 200 ? 'detailed' : answerLength > 100 ? 'moderate' : 'brief';
    return `Q${idx + 1}: ${entry.question}\nA${idx + 1} (${answerQuality}): ${entry.answer}`;
  }).join('\n\n');
}

/**
 * Extract signals from answers for adaptive questioning
 */
function extractAnswerSignals(history, interviewConfig) {
  if (history.length === 0) return { tools: [], concepts: [], depth: 'unknown', confidence: 'unknown' };
  
  const lastAnswer = history[history.length - 1].answer.toLowerCase();
  const allAnswers = history.map(e => e.answer.toLowerCase()).join(' ');
  
  // Extract mentioned tools/technologies
  const techKeywords = ['react', 'node', 'python', 'javascript', 'typescript', 'docker', 'kubernetes', 
    'aws', 'sql', 'mongodb', 'redis', 'graphql', 'rest', 'api', 'git', 'ci/cd', 'agile', 'scrum'];
  const tools = techKeywords.filter(keyword => allAnswers.includes(keyword));
  
  // Extract concepts mentioned
  const conceptKeywords = ['algorithm', 'data structure', 'design pattern', 'architecture', 
    'optimization', 'scalability', 'performance', 'security', 'testing', 'refactoring'];
  const concepts = conceptKeywords.filter(keyword => allAnswers.includes(keyword));
  
  // Assess depth
  const avgLength = history.reduce((sum, e) => sum + e.answer.length, 0) / history.length;
  const depth = avgLength > 200 ? 'deep' : avgLength > 100 ? 'moderate' : 'surface';
  
  // Assess confidence (based on structure and detail)
  const hasStructure = /first|then|next|finally|step|approach/i.test(lastAnswer);
  const hasExamples = /example|instance|project|experience|worked|implemented/i.test(lastAnswer);
  const confidence = (hasStructure && hasExamples) ? 'high' : hasStructure || hasExamples ? 'moderate' : 'low';
  
  return { tools, concepts, depth, confidence };
}

/**
 * Build advanced, role-specific question generation prompt
 */
function buildAdvancedQuestionPrompt(interviewType, role, skills, resumeText) {
  const roleSpecificGuidance = getRoleSpecificGuidance(role, interviewType);
  const skillsContext = skills && skills.length > 0 ? `\nRequired skills: ${skills.join(', ')}` : '';
  const resumeContext = resumeText ? `\nCandidate resume summary: ${resumeText.substring(0, 300)}` : '';
  
  return `You are a senior ${interviewType === 'technical' ? 'technical' : interviewType === 'behavioral' ? 'behavioral' : 'HR'} interviewer conducting a realistic industry-level interview${role ? ` for a ${role} position` : ''}.${skillsContext}${resumeContext}

${roleSpecificGuidance}

Question Generation Strategy:
1. Start with conceptual questions, then move to practical implementation, then real-world scenarios
2. Rotate question types: Conceptual → Practical → Scenario → Debugging/Optimization → Best Practices
3. If candidate mentions a tool/technology, drill deeper into it in the next question
4. If answer is vague, ask clarifying follow-ups
5. If answer is confident and detailed, escalate difficulty
6. Ensure at least one deep-dive question per core skill mentioned
7. Avoid generic interview questions - ask realistic, industry-level questions

Question Types by Round:
- Early rounds (1-3): Conceptual understanding, background, motivation
- Mid rounds (4-6): Practical implementation, problem-solving, experience
- Late rounds (7+): Advanced scenarios, optimization, trade-offs, edge cases

Return ONLY the question text (1-2 sentences), no explanations, numbering, or formatting.`;
}

/**
 * Get role-specific guidance for question generation
 */
function getRoleSpecificGuidance(role, interviewType) {
  const roleLower = (role || '').toLowerCase();
  
  if (interviewType === 'behavioral' || interviewType === 'hr') {
    return `Focus on:
- Past experiences and how they handled challenges
- Team collaboration and conflict resolution
- Leadership and decision-making
- Cultural fit and motivation
- Career goals and growth mindset`;
  }
  
  if (roleLower.includes('frontend')) {
    return `Focus on:
- JavaScript/TypeScript fundamentals (event loop, closures, async/await)
- React/Vue/Angular concepts (state management, lifecycle, hooks)
- Performance optimization (virtualization, code splitting, lazy loading)
- Browser APIs and debugging techniques
- CSS architecture and responsive design
- Accessibility and web standards`;
  }
  
  if (roleLower.includes('backend')) {
    return `Focus on:
- System design and architecture patterns
- Database design and optimization
- API design (REST, GraphQL)
- Caching strategies and performance
- Security best practices
- Scalability and distributed systems
- Error handling and monitoring`;
  }
  
  if (roleLower.includes('full stack') || roleLower.includes('fullstack')) {
    return `Focus on:
- End-to-end system understanding
- Frontend-backend integration
- API design and consumption
- Database design and optimization
- Deployment and DevOps practices
- Performance across the stack
- Security at all layers`;
  }
  
  // Default technical guidance
  return `Focus on:
- Core technical concepts and fundamentals
- Problem-solving approach and methodology
- Practical implementation experience
- Real-world scenarios and trade-offs
- Best practices and industry standards`;
}

/**
 * Build adaptive question prompt based on history and signals
 */
function buildAdaptiveQuestionPrompt(historyContext, currentStep, historyLength, answerSignals) {
  if (historyLength === 0) {
    return 'Generate the first opening question that sets the tone and assesses initial fit.';
  }
  
  const adaptationHints = [];
  
  if (answerSignals.tools.length > 0) {
    adaptationHints.push(`Candidate mentioned: ${answerSignals.tools.slice(0, 3).join(', ')}. Drill deeper into one of these.`);
  }
  
  if (answerSignals.depth === 'surface') {
    adaptationHints.push('Previous answer was brief. Ask a clarifying follow-up or request more detail.');
  } else if (answerSignals.depth === 'deep' && answerSignals.confidence === 'high') {
    adaptationHints.push('Candidate is performing well. Escalate difficulty with an advanced scenario or optimization question.');
  }
  
  if (currentStep <= 3) {
    adaptationHints.push('Early stage: Focus on fundamentals and understanding.');
  } else if (currentStep <= 6) {
    adaptationHints.push('Mid stage: Focus on practical implementation and problem-solving.');
  } else {
    adaptationHints.push('Late stage: Focus on advanced scenarios, optimization, and trade-offs.');
  }
  
  const adaptationText = adaptationHints.length > 0 ? `\n\nAdaptation hints:\n${adaptationHints.join('\n')}` : '';
  
  return `Previous Q&A:\n${historyContext}\n\nGenerate question #${currentStep + 1} that:${adaptationText}

Build on previous answers, explore new relevant areas, and adapt based on candidate performance.`;
}

/**
 * Clean question text (remove quotes, numbering, etc.)
 */
function cleanQuestion(question) {
  return question
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/^\d+[\.\)]\s*/, '') // Remove leading numbers
    .replace(/^Q\d*:?\s*/i, '') // Remove Q: prefix
    .trim();
}

/**
 * Generate adaptive placeholder question when AI is unavailable
 */
function generateAdaptivePlaceholderQuestion(interviewState) {
  const { interviewConfig, history, currentStep } = interviewState;
  const { interviewType, role, skills } = interviewConfig;

  // Role-specific question banks
  const roleQuestions = {
    'frontend': [
      "Explain the JavaScript event loop and how it affects UI performance.",
      "How would you optimize a slow React component?",
      "How do you handle large lists efficiently in the browser?",
      "Describe how you would debug a memory leak in a frontend app.",
      "What's the difference between useMemo and useCallback, and when would you use each?",
    ],
    'backend': [
      "How would you design a scalable API that handles millions of requests?",
      "Explain database indexing and when you'd use different index types.",
      "How do you handle rate limiting in a distributed system?",
      "Describe your approach to caching strategies.",
      "How would you ensure data consistency in a microservices architecture?",
    ],
    'full stack': [
      "How would you design a full-stack application from scratch?",
      "Explain how you'd handle authentication and authorization across frontend and backend.",
      "How do you optimize performance across the entire stack?",
      "Describe your approach to API design and versioning.",
      "How would you handle real-time updates in a full-stack application?",
    ],
  };

  // Determine role category
  const roleLower = (role || '').toLowerCase();
  let roleCategory = 'general';
  if (roleLower.includes('frontend')) roleCategory = 'frontend';
  else if (roleLower.includes('backend')) roleCategory = 'backend';
  else if (roleLower.includes('full')) roleCategory = 'full stack';

  const questions = roleQuestions[roleCategory] || [
    "Tell me about yourself and your technical background.",
    "What interests you most about this role?",
    "Describe a challenging project you've worked on recently.",
    "How do you approach debugging complex issues?",
    "What are your strongest technical skills and areas for growth?",
  ];

  const questionIndex = Math.min((currentStep - 1) % questions.length, questions.length - 1);
  return questions[questionIndex];
}

/**
 * Evaluate an answer with AI
 * @param {string} question - The question that was asked
 * @param {string} answer - The candidate's answer
 * @param {object} interviewState - Current interview state
 * @returns {Promise<object>} Evaluation result
 */
async function evaluateAnswer(question, answer, interviewState) {
  // Evaluation is aggregated in final report, but we can provide real-time scoring
  if (!process.env.GEMINI_API_KEY) {
    return Promise.resolve({
      score: Math.min(100, Math.max(0, Math.floor(answer.length / 5))),
      feedback: '',
    });
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = getGeminiModel(genAI, false); // Use flash for faster evaluation
    
    const prompt = `Evaluate this interview answer on a scale of 0-100:

Question: ${question}
Answer: ${answer}

Consider: technical depth, problem-solving approach, clarity, practical applicability, and structure.
Return ONLY a number between 0-100, no explanation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const scoreText = response.text().trim();
    const score = parseInt(scoreText.match(/\d+/)?.[0] || '75');
    
    return {
      score: Math.max(0, Math.min(100, score)),
      feedback: '',
    };
  } catch (error) {
    console.error('Error evaluating answer:', error.message);
    return {
      score: Math.min(100, Math.max(0, Math.floor(answer.length / 5))),
      feedback: '',
    };
  }
}

/**
 * Generate final report with enhanced AI evaluation
 * @param {object} interviewState - Complete interview state with all Q&A
 * @returns {Promise<object>} Final evaluation report
 */
async function generateFinalReport(interviewState) {
  const { interviewConfig, history } = interviewState;
  const { interviewType, role, skills } = interviewConfig;

  // If no API key, use placeholder report
  if (!process.env.GEMINI_API_KEY) {
    return generatePlaceholderReport(interviewState);
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use gemini-1.5-pro for comprehensive evaluation
    const model = getGeminiModel(genAI, true);
    
    const modelWithConfig = genAI.getGenerativeModel({ 
      model: model.model || 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.3, // Low temperature for consistent, structured output
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      }
    });

    // Build comprehensive Q&A history
    const qaHistory = history.map((entry, idx) => 
      `Question ${idx + 1}: ${entry.question}\nAnswer ${idx + 1}: ${entry.answer}`
    ).join('\n\n');

    const systemPrompt = buildAdvancedReportPrompt(interviewType, role, skills);
    const userPrompt = buildAdvancedReportUserPrompt(qaHistory, history.length, interviewState);
    
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await modelWithConfig.generateContent(fullPrompt);
    const response = await result.response;
    const reportJson = response.text();

    if (reportJson) {
      const parsed = JSON.parse(reportJson);
      return structureReportResponse(parsed, interviewState);
    }
  } catch (error) {
    console.error('Error generating AI report:', error.message);
    // Try fallback to flash
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const flashModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        }
      });
      
      const qaHistory = history.map((entry, idx) => 
        `Question ${idx + 1}: ${entry.question}\nAnswer ${idx + 1}: ${entry.answer}`
      ).join('\n\n');
      
      const systemPrompt = buildAdvancedReportPrompt(interviewType, role, skills);
      const userPrompt = buildAdvancedReportUserPrompt(qaHistory, history.length, interviewState);
      
      const result = await flashModel.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const response = await result.response;
      const reportJson = response.text();
      
      if (reportJson) {
        const parsed = JSON.parse(reportJson);
        return structureReportResponse(parsed, interviewState);
      }
    } catch (fallbackError) {
      console.error('Fallback model also failed:', fallbackError.message);
    }
  }

  // Fallback to placeholder
  return generatePlaceholderReport(interviewState);
}

/**
 * Build advanced report generation prompt
 */
function buildAdvancedReportPrompt(interviewType, role, skills) {
  const roleContext = role ? ` for a ${role} position` : '';
  const skillsContext = skills && skills.length > 0 ? ` requiring: ${skills.join(', ')}` : '';
  
  return `You are a senior technical interviewer and evaluator conducting a ${interviewType} interview${roleContext}${skillsContext}.

Evaluate the candidate's performance across these dimensions:
- Communication: Clarity, articulation, professional communication, structure
- Clarity: How well-structured, understandable, and organized their responses are
- Technical Depth: Depth of technical knowledge, understanding of fundamentals, practical experience (for technical interviews) OR behavioral insight, self-awareness, and reflection (for behavioral interviews)
- Confidence: Self-assurance, poise, ability to handle questions, composure

Scoring Guidelines:
- Higher weight for hands-on explanations with examples
- Lower score for buzzword-only or vague answers
- Reward structured thinking (clear steps, trade-offs considered)
- Consider answer length, detail, and relevance
- Assess problem-solving approach and methodology

Return a JSON object with this EXACT structure (STRICT JSON ONLY):
{
  "overallScore": <number 0-100>,
  "categoryScores": {
    "communication": <number 0-100>,
    "clarity": <number 0-100>,
    "technicalDepth": <number 0-100>,
    "confidence": <number 0-100>
  },
  "identifiedStrengths": [<array of 3-5 specific, role-relevant strength strings>],
  "areasForImprovement": [<array of 3-5 specific, actionable improvement areas>],
  "actionableFeedback": [<array of 3-5 actionable tips as strings>]
}

Be specific, constructive, role-relevant, and based on actual performance. Scores must reflect real evaluation, not generic values.`;
}

/**
 * Build advanced user prompt for report generation
 */
function buildAdvancedReportUserPrompt(qaHistory, totalQuestions, interviewState) {
  const { interviewConfig } = interviewState;
  const { role, skills } = interviewConfig;
  
  // Analyze answer patterns
  const avgAnswerLength = interviewState.history.reduce((sum, e) => sum + e.answer.length, 0) / Math.max(interviewState.history.length, 1);
  const hasTechnicalDepth = interviewState.history.some(e => 
    /algorithm|architecture|optimization|design pattern|implementation|approach/i.test(e.answer)
  );
  const hasExamples = interviewState.history.some(e => 
    /example|project|experience|worked|implemented|built/i.test(e.answer)
  );
  
  const analysis = `
Answer Analysis:
- Average answer length: ${Math.round(avgAnswerLength)} characters
- Shows technical depth: ${hasTechnicalDepth ? 'Yes' : 'No'}
- Includes examples: ${hasExamples ? 'Yes' : 'No'}
- Total questions answered: ${totalQuestions}
`;
  
  return `Evaluate this interview based on the following Q&A:${analysis}

${qaHistory}

Provide a comprehensive, role-specific evaluation with:
1. Accurate scores (0-100) based on actual performance
2. Specific strengths related to ${role || 'the role'} and ${skills && skills.length > 0 ? skills.join(', ') : 'required skills'}
3. Concrete areas for improvement with actionable guidance
4. Practical feedback that helps the candidate prepare for real interviews

Focus on ${interviewConfig.interviewType === 'technical' ? 'technical competency, problem-solving, and implementation skills' : interviewConfig.interviewType === 'behavioral' ? 'behavioral competencies, teamwork, leadership, and communication' : 'cultural fit, motivation, and career alignment'}.`;
}

/**
 * Structure and validate the AI report response
 */
function structureReportResponse(aiResponse, interviewState) {
  // Ensure all required fields exist with proper types and validation
  const report = {
    overallScore: Math.max(0, Math.min(100, Math.floor(aiResponse.overallScore || 75))),
    categoryScores: {
      communication: Math.max(0, Math.min(100, Math.floor(aiResponse.categoryScores?.communication || 75))),
      clarity: Math.max(0, Math.min(100, Math.floor(aiResponse.categoryScores?.clarity || 75))),
      technicalDepth: Math.max(0, Math.min(100, Math.floor(aiResponse.categoryScores?.technicalDepth || 75))),
      confidence: Math.max(0, Math.min(100, Math.floor(aiResponse.categoryScores?.confidence || 75))),
    },
    identifiedStrengths: Array.isArray(aiResponse.identifiedStrengths)
      ? aiResponse.identifiedStrengths.slice(0, 5).filter(s => typeof s === 'string' && s.length > 0)
      : ["Strong communication skills", "Good problem-solving approach"],
    areasForImprovement: Array.isArray(aiResponse.areasForImprovement)
      ? aiResponse.areasForImprovement.slice(0, 5).filter(s => typeof s === 'string' && s.length > 0)
      : ["Could provide more specific examples", "Consider using STAR method"],
    actionableFeedback: Array.isArray(aiResponse.actionableFeedback)
      ? aiResponse.actionableFeedback.slice(0, 5).filter(s => typeof s === 'string' && s.length > 0)
      : ["Practice structuring responses", "Prepare specific project examples"],
    questionAnswerHistory: interviewState.history.map((entry) => ({
      question: entry.question,
      answer: entry.answer,
      summary: entry.answer.length > 60
        ? `${entry.answer.substring(0, 60)}...`
        : entry.answer,
    })),
  };

  return report;
}

/**
 * Generate placeholder report (fallback)
 */
function generatePlaceholderReport(interviewState) {
  const avgAnswerLength = interviewState.history.reduce((sum, entry) => {
    return sum + (entry.answer?.length || 0);
  }, 0) / Math.max(interviewState.history.length, 1);

  const baseScore = Math.min(85, Math.max(60, Math.floor(avgAnswerLength / 10)));
  const communication = baseScore + Math.floor(Math.random() * 10) - 5;
  const clarity = baseScore + Math.floor(Math.random() * 10) - 5;
  const technicalDepth = baseScore + Math.floor(Math.random() * 10) - 5;
  const confidence = baseScore + Math.floor(Math.random() * 10) - 5;

  const overallScore = Math.round(
    (communication + clarity + technicalDepth + confidence) / 4
  );

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    categoryScores: {
      communication: Math.max(0, Math.min(100, communication)),
      clarity: Math.max(0, Math.min(100, clarity)),
      technicalDepth: Math.max(0, Math.min(100, technicalDepth)),
      confidence: Math.max(0, Math.min(100, confidence)),
    },
    identifiedStrengths: [
      "Clear articulation of technical concepts",
      "Strong problem-solving approach demonstrated",
      "Good use of specific examples from past experience",
    ],
    areasForImprovement: [
      "Could provide more quantifiable results in examples",
      "Consider structuring responses using STAR method",
      "Expand on leadership and collaboration experiences",
    ],
    actionableFeedback: [
      "Practice summarizing complex topics in 2-3 sentences",
      "Prepare 3-5 specific project stories with measurable outcomes",
      "Research common behavioral interview frameworks",
    ],
    questionAnswerHistory: interviewState.history.map((entry) => ({
      question: entry.question,
      answer: entry.answer,
      summary: entry.answer.length > 60
        ? `${entry.answer.substring(0, 60)}...`
        : entry.answer,
    })),
  };
}

// ============================================
// AUDIO MODE CAPABILITIES
// ============================================

/**
 * Transcribe audio to text using Gemini
 * @param {string} audioBase64 - Base64 encoded audio data
 * @param {string} mimeType - Audio MIME type (e.g., 'audio/webm', 'audio/mp3')
 * @returns {Promise<{success: boolean, text: string, error?: string}>}
 */
async function transcribeAudio(audioBase64, mimeType = 'audio/webm') {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, text: '', error: 'No API key configured' };
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use gemini-1.5-pro for audio processing
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.1, // Very low temperature for accurate transcription
        maxOutputTokens: 1000,
      }
    });

    // Create audio part for Gemini
    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioBase64,
      },
    };

    const prompt = `Transcribe the following audio accurately. 
Return ONLY the transcribed text, no explanations, no quotes, no formatting.
If the audio is unclear or empty, return "[UNCLEAR]".
Do not penalize accent or speech style.`;

    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const transcribedText = response.text().trim();

    if (transcribedText && transcribedText !== '[UNCLEAR]' && transcribedText.length > 0) {
      return { success: true, text: transcribedText };
    } else {
      return { success: false, text: '', error: 'Audio unclear or empty' };
    }
  } catch (error) {
    console.error('Error transcribing audio:', error.message);
    
    // Try fallback to flash model
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      const flashModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      });

      const audioPart = {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64,
        },
      };

      const result = await flashModel.generateContent([
        'Transcribe this audio accurately. Return ONLY the text, no formatting.',
        audioPart
      ]);
      const response = await result.response;
      const text = response.text().trim();

      if (text && text.length > 0) {
        return { success: true, text };
      }
    } catch (fallbackError) {
      console.error('Fallback transcription also failed:', fallbackError.message);
    }

    return { success: false, text: '', error: error.message };
  }
}

/**
 * Generate audio for a question (Text-to-Speech simulation via description)
 * Note: Gemini doesn't directly generate audio, so we return speech parameters
 * Frontend can use Web Speech API with these parameters
 * @param {string} questionText - The question text to convert to speech
 * @returns {Promise<{text: string, speechParams: object}>}
 */
async function generateQuestionAudioParams(questionText) {
  // Return speech synthesis parameters for frontend to use
  // The frontend will use Web Speech API (SpeechSynthesis) with these params
  return {
    text: questionText,
    speechParams: {
      rate: 0.9,      // Slightly slower for clarity
      pitch: 1.0,     // Normal pitch
      volume: 1.0,    // Full volume
      lang: 'en-US',  // English US
      voicePreference: 'professional', // Hint for frontend to select appropriate voice
    }
  };
}

/**
 * Generate a spoken summary of final feedback
 * Returns text optimized for speech synthesis
 * @param {object} finalReport - The final report object
 * @returns {Promise<{text: string, speechParams: object}>}
 */
async function generateReportAudioSummary(finalReport) {
  if (!process.env.GEMINI_API_KEY) {
    // Fallback to simple summary
    return {
      text: generateFallbackAudioSummary(finalReport),
      speechParams: {
        rate: 0.85,
        pitch: 1.0,
        volume: 1.0,
        lang: 'en-US',
      }
    };
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', // Use flash for speed
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      }
    });

    const prompt = `Create a brief, spoken summary (30-60 seconds when read aloud) of this interview feedback.
Speak as if you are the interviewer giving verbal feedback to the candidate.
Be encouraging but honest. Use natural speech patterns.
Avoid technical jargon about scores. Instead, describe performance qualitatively.

Interview Results:
- Overall Score: ${finalReport.overallScore}/100
- Communication: ${finalReport.categoryScores.communication}/100
- Clarity: ${finalReport.categoryScores.clarity}/100
- Technical Depth: ${finalReport.categoryScores.technicalDepth}/100
- Confidence: ${finalReport.categoryScores.confidence}/100

Key Strengths:
${finalReport.identifiedStrengths.join('\n')}

Areas to Improve:
${finalReport.areasForImprovement.join('\n')}

Return ONLY the spoken text, no formatting or stage directions.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text().trim();

    return {
      text: summaryText || generateFallbackAudioSummary(finalReport),
      speechParams: {
        rate: 0.85,
        pitch: 1.0,
        volume: 1.0,
        lang: 'en-US',
      }
    };
  } catch (error) {
    console.error('Error generating audio summary:', error.message);
    return {
      text: generateFallbackAudioSummary(finalReport),
      speechParams: {
        rate: 0.85,
        pitch: 1.0,
        volume: 1.0,
        lang: 'en-US',
      }
    };
  }
}

/**
 * Generate fallback audio summary when AI is unavailable
 */
function generateFallbackAudioSummary(finalReport) {
  const scoreDescription = 
    finalReport.overallScore >= 80 ? 'excellent' :
    finalReport.overallScore >= 70 ? 'good' :
    finalReport.overallScore >= 60 ? 'satisfactory' : 'developing';

  return `Thank you for completing this interview. Your overall performance was ${scoreDescription}, 
with a score of ${finalReport.overallScore} out of 100. 

Your key strengths include ${finalReport.identifiedStrengths.slice(0, 2).join(' and ')}. 

For future interviews, I'd recommend focusing on ${finalReport.areasForImprovement.slice(0, 2).join(' and ')}. 

Keep practicing, and you'll continue to improve. Good luck with your interview preparation!`;
}

/**
 * Process audio answer and return transcribed text
 * Handles the full flow: transcription, validation, and fallback
 * @param {string} audioBase64 - Base64 encoded audio
 * @param {string} mimeType - Audio MIME type
 * @returns {Promise<{success: boolean, transcribedText: string, error?: string, needsRetry?: boolean}>}
 */
async function processAudioAnswer(audioBase64, mimeType = 'audio/webm') {
  if (!audioBase64) {
    return { success: false, transcribedText: '', error: 'No audio data provided', needsRetry: true };
  }

  const transcriptionResult = await transcribeAudio(audioBase64, mimeType);

  if (transcriptionResult.success && transcriptionResult.text.length > 5) {
    return { 
      success: true, 
      transcribedText: transcriptionResult.text,
      needsRetry: false
    };
  }

  // If transcription is too short, might be unclear audio
  if (transcriptionResult.success && transcriptionResult.text.length <= 5) {
    return {
      success: false,
      transcribedText: transcriptionResult.text,
      error: 'Answer too short. Please provide a more detailed response.',
      needsRetry: true
    };
  }

  return {
    success: false,
    transcribedText: '',
    error: transcriptionResult.error || 'Could not transcribe audio. Please try again or type your answer.',
    needsRetry: true
  };
}

module.exports = {
  generateNextQuestion,
  evaluateAnswer,
  generateFinalReport,
  determineTotalRounds,
  // Audio mode functions
  transcribeAudio,
  generateQuestionAudioParams,
  generateReportAudioSummary,
  processAudioAnswer,
};
