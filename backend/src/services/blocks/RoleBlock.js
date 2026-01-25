/**
 * RoleBlock
 * Responsibility: Determine interview context and generate the system prompt.
 */
class RoleBlock {
    constructor() { }

    execute(interviewConfig) {
        const { interviewType, role, skills, resumeText, experiencePreset } = interviewConfig;

        const roleSpecificGuidance = this._getRoleSpecificGuidance(role, interviewType);
        const skillsContext = skills && skills.length > 0 ? `\n\n🎯 REQUIRED SKILLS (MUST TEST ALL): ${skills.join(', ')}\nCRITICAL: Your questions MUST cover these skills progressively throughout the interview. Reference these skills explicitly in your questions.` : '';
        const resumeContext = resumeText ? `\n\n📋 CANDIDATE BUILD / RESUME (SOURCE OF TRUTH):\n${resumeText.substring(0, 1000)}\n\nCRITICAL: Use specific details from their resume to personalize questions. Reference their mentioned projects, technologies, and experiences.` : '';
        const presetGuidance = this._getPresetGuidance(experiencePreset);

        return `You are a professional ${interviewType || 'technical'} interviewer conducting a realistic mock interview for a ${role || 'developer'} position.

🎭 INTERVIEW CONTEXT:
Role: ${role || 'Developer'}
Type: ${interviewType || 'technical'}
Experience Level: ${experiencePreset || 'junior'}
${skillsContext}
${resumeContext}

${presetGuidance}

${roleSpecificGuidance}

🔑 CORE RULES:
1. Be concise and professional - one question at a time
2. ADAPT questions based on candidate's previous answers
3. Questions MUST be role-specific and tied to "${role}"
4. If candidate mentions a technology/project, ASK FOLLOW-UP questions about it
5. Cover all required skills [${skills?.join(', ')}] throughout the interview
6. Never repeat questions - each must be unique and build on previous context
7. Strictly follow experience level constraints
8. Frame every question in the context of real "${role}" responsibilities
`;
    }

    _getRoleSpecificGuidance(role, type) {
        if (!role) return '';
        const roleLower = role.toLowerCase();

        if (roleLower.includes('frontend')) {
            return 'Focus on React, DOM, CSS, performance, and accessibility.';
        } else if (roleLower.includes('backend')) {
            return 'Focus on API design, database normalization, caching, and auth.';
        } else if (roleLower.includes('full')) {
            return 'Focus on system design, frontend-backend integration, and deployment.';
        }
        return '';
    }

    _getPresetGuidance(experiencePreset) {
        if (experiencePreset === 'fresh') {
            return `
STRICT CONSTRAINT: CANDIDATE IS A FRESH GRADUATE.
- Ask ONLY fundamental, theoretical, and basic conceptual questions.
- Focus on learning ability, basic algorithms, and core principles.
- DO NOT ask about complex architecture, system design, or advanced scaling.
- Keep questions simple and academic.`;
        } else if (experiencePreset === 'junior') {
            return `
STRICT CONSTRAINT: CANDIDATE IS A JUNIOR DEVELOPER.
- Ask about practical implementation of features.
- Focus on clean code, basic debugging, and using standard tools.
- Limit scope to single components or functions.
- Avoid high-level system architecture questions.`;
        } else if (experiencePreset === 'senior') {
            return `
STRICT CONSTRAINT: CANDIDATE IS A SENIOR DEVELOPER.
- Ask ONLY about architecture, scalability, trade-offs, and design patterns.
- Focus on "Why" not "How".
- Challenge them with complex scenarios, distributed systems, and leadership problems.
- DO NOT ask basic syntax or definition questions.`;
        }
        return "";
    }
}

module.exports = RoleBlock;
