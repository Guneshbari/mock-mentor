/**
 * Role-Specific Focus Areas and Interview Type Strategies
 * Expanded for 45 Unique Questions per Role
 */

// Helper to generate distinct HR/Behavioral topics based on Role context
const getRoleContext = (role) => {
    const contexts = {
        "Frontend Developer": { task: "UI Component", struggle: "Browser Compatibility", stakeholder: "Designer" },
        "Backend Developer": { task: "API Endpoint", struggle: "Database Latency", stakeholder: "Frontend Dev" },
        "Full Stack Developer": { task: "Feature End-to-End", struggle: "Context Switching", stakeholder: "Product Manager" },
        "DevOps Engineer": { task: "CI Pipeline", struggle: "Production Outage", stakeholder: "Dev Team" },
        "Data Scientist": { task: "Model Accuracy", struggle: "Dirty Data", stakeholder: "Business Analyst" },
        "Machine Learning Engineer": { task: "Model Deployment", struggle: "Inference Speed", stakeholder: "Data Scientist" },
        "Mobile Developer": { task: "App Crash", struggle: "Platform Specifics", stakeholder: "QA Engineer" },
        "QA Engineer": { task: "Bug Report", struggle: "Flaky Tests", stakeholder: "Developer" },
        "Product Manager": { task: "Roadmap Item", struggle: "Conflicting Priorities", stakeholder: "Engineering Lead" },
        "UI/UX Designer": { task: "Design System", struggle: "Feasibility constraints", stakeholder: "Developer" },
        "Software Architect": { task: "System Design", struggle: "Legacy Constraints", stakeholder: "CTO" },
        "Cloud Engineer": { task: "Infrastructure", struggle: "Cost Overrun", stakeholder: "Security Team" },
        "Security Engineer": { task: "Vulnerability Fix", struggle: "Access Controls", stakeholder: "DevOps" },
        "Database Administrator": { task: "Schema Change", struggle: "Data Loss Risk", stakeholder: "Backend Dev" }
    };
    return contexts[role] || { task: "Task", struggle: "Problem", stakeholder: "Teammate" };
};

const MASTER_ROADMAPS = {
    "Frontend Developer": {
        fresh: {
            technical: ["HTML5 Semantic Elements & Accessibility", "CSS Box Model & Flexbox/Grid", "JavaScript ES6+ Syntax & DOM Manipulation", "Basic React Components & Props", "Git Basics & Version Control"],
            hr: ["Passion for Frontend Development", "Learning New UI Libraries", "Handling Feedback on Code Reviews", "Preferred Work Environment (Remote/Office)", "Career Goals as a Developer"],
            behavioral: ["Adapting to a Design Change", "Debugging a simple UI issue", "Collaboration with a Designer", "Handling a tight deadline", "Learning from a syntax error"]
        },
        mid: {
            technical: ["React Lifecycle & Hooks Deep Dive", "State Management (Redux/Context)", "Performance Optimization (Rendering)", "API Integration & Async Patterns", "CSS Architecture (BEM/Styled Components)"],
            hr: ["Career Progression & Mentorship", "Ideal Development Culture", "Handling repetitive UI tasks", "Contributing to Open Source/Internal Tools", "Work-Life Balance during Crunch"],
            behavioral: ["Conflict with a Designer on feasibility", "Mentoring a Junior Developer", "Advocating for Refactoring UI Code", "Handling a Production Bug", "Disagreeing with a Product Requirement"]
        },
        senior: {
            technical: ["Frontend System Design & Architecture", "Web Performance & Core Web Vitals", "Micro-frontends & Monorepos", "Advanced Security (XSS/CSRF/Auth)", "Testing Strategies at Scale"],
            hr: ["Leadership Philosophy in Engineering", "Strategic Alignment with Product", "Building High-Performing Frontend Teams", "Retention & Culture", "Technical Vision & Roadmap"],
            behavioral: ["Leading a major UI Overhaul", "Handling strategic disagreement with Backend", "Managing Technical Debt visibility", "Crisis Management during Launch", "Building consensus across teams"]
        }
    },
    "Backend Developer": {
        fresh: {
            technical: ["HTTP Protocol, Status Codes & REST", "Basic SQL Queries & Relationships", "Server-side Logic (Node/Python)", "Authentication Basics (Sessions)", "Error Handling & Logging"],
            hr: ["Why Backend Development?", "Interest in Scalability", "Preferred Programming Language", "Learning Style for new Tech", "Question for Engineering Team"],
            behavioral: ["Debugging a logic error", "Explaining technical concept to non-tech", "Working in a group project", "Meeting a course/project deadline", "Overcoming a setup issue"]
        },
        mid: {
            technical: ["Advanced API Design (REST/GraphQL)", "Database Indexing & Optimization", "Caching Strategies (Redis)", "Auth Flows (OAuth2/JWT)", "Containerization (Docker)"],
            hr: ["Growth into Architecture", "Ideal Engineering Practices", "Handling Legacy Code", "Peer Review Philosophy", "Contribution to Team Standards"],
            behavioral: ["Disagreement on API contract", "Optimizing a slow query under pressure", "Mentoring on Code Quality", "Handling production outage", "Convincing Product to delay for quality"]
        },
        senior: {
            technical: ["Distributed Systems Architecture", "Database Sharding & Replication", "Message Queues & Event-Driven Design", "Cloud Infrastructure & Security", "Observability & Reliability SRE"],
            hr: ["Building Backend Strategy", "Hiring & Team Topology", "Cross-functional Leadership", "Engineering Culture Stewardship", "Aligning Tech with Business Goals"],
            behavioral: ["Architecture decision that failed", "Navigating organization politics", "Leading a rewrite vs refactor decision", "Handling a security breach response", "Influencing other teams' roadmaps"]
        }
    },
    "Full Stack Developer": {
        fresh: {
            technical: ["Client-Server Communication", "Basic CRUD Operations", "Database connection & ORM", "Responsive UI Basics", "Deployment to PaaS"],
            hr: ["Balancing Frontend vs Backend interest", "Why Full Stack?", "Adaptability to different stacks", "Project Management basics", "Learning Curve expectations"],
            behavioral: ["Switching context between FE/BE", "Debugging an integration issue", "Collaborating with pure FE/BE devs", "Prioritizing tasks in a solo project", "Asking for help when stuck"]
        },
        mid: {
            technical: ["Type Safety across the stack", "State Sync (BE->FE)", "Auth & Security End-to-End", "API Rate Limiting & Performance", "CI/CD Pipelines"],
            hr: ["Specialization preference?", "Product-minded Engineering", "Handling Context Switching", "Code Ownership philosophy", "Team Collaboration style"],
            behavioral: ["Trade-off: UI Polish vs Backend Robustness", "Negotiating features with PM", "Improving Developer Experience", "Fixing a full-stack bug live", "Mentoring on the 'other' side of stack"]
        },
        senior: {
            technical: ["Scalable Full Stack Architecture", "Serverless vs Containers Trade-offs", "Data Consistency in Distributed Systems", "Infrastructure as Code", "System Bottleneck Analysis"],
            hr: ["Technical Strategy Leadership", "Scaling Engineering Processes", "Business Value Focus", "Building Cross-functional Squads", "Mentoring Seniors"],
            behavioral: ["Strategic Tech Stack Migration", "Handling conflicting stakeholder needs", "Leading a major feature launch", "Post-mortem leadership", "Building buy-in for major architectural change"]
        }
    },
    "DevOps Engineer": {
        fresh: {
            technical: ["Linux Shell & Scripting", "Git Version Control", "Basic CI concepts", "Intro to Docker", "Server Troubleshooting"],
            hr: ["Interest in Infrastructure", "Problem Solving under pressure", "Learning new tools", "Communication with Devs", "Reliability mindset"],
            behavioral: ["Automating a manual task", "Fixing a broken build", "Explaining infra to a dev", "Handling a server crash", "Learning a tool from scratch"]
        },
        mid: {
            technical: ["CI/CD Pipeline Construction", "Container Orchestration (K8s basics)", "Cloud Provider Services (AWS/Azure)", "Monitoring & Alerting", "IaC (Terraform/Ansible)"],
            hr: ["DevOps Culture fit", "On-call expectations", "Balancing Speed vs Stability", "Evangelizing DevOps", "Career growth in SRE"],
            behavioral: ["Push-back on unsafe deployment", "Handling a 3am outage", "Improving build times significantly", "Mediating between Dev and Ops", "Recovering from a bad config change"]
        },
        senior: {
            technical: ["Kubernetes Scaling & Management", "Advanced IaC & Drift Detection", "SRE Practices (SLO/SLI)", "DevSecOps Integration", "Multi-Cloud Strategy"],
            hr: ["Building DevOps Strategy", "Budget & Cost Management", "Leading SRE Teams", "Organizational Change Management", "Vendor Negotiation"],
            behavioral: ["Architecting for Disaster Recovery", "Leading a cloud migration", "Changing engineering culture", "Handling major security incident", "Strategic buy vs build decision"]
        }
    },
    // Fallback for others - Programmatically generated structure for brevity, 
    // but the system treats them as distinct.
    "Product Manager": {
        fresh: { technical: ["User Personas", "User Stories", "Agile Basics", "Competitor Analysis", "Communication"], hr: ["Why PM?", "Empathy", "Organization", "Learning", "Goals"], behavioral: ["Prioritization", "Communication Conflict", "Group Leadership", "Understanding Users", "Mistake"] },
        mid: { technical: ["Roadmap Planning", "Data Decisions", "Stakeholder Mgmt", "Discovery", "GTM Strategy"], hr: ["Career Path", "Leadership Style", "Influence", "Culture", "Integrity"], behavioral: ["Saying No", "Failed Feature", "Team Conflict", "Pivot Decision", "Success Metric"] },
        senior: { technical: ["Product Vision", "Unit Economics", "Leadership", "Scaling Teams", "Complex Alignment"], hr: ["Strategy", "Executive Comm", "Hiring", "Visionary", "Legacy"], behavioral: ["Portfolio Strategy", "killing a product", "Org Change", "Crisis", "Market Shift"] }
    }
};

// Auto-fill missing roles with a smart template to ensure 45 distinct questions
const DEFAULT_ROLES = [
    "Data Scientist", "Machine Learning Engineer", "Mobile Developer",
    "QA Engineer", "UI/UX Designer", "Software Architect",
    "Cloud Engineer", "Security Engineer", "Database Administrator"
];

const TEMPLATES = {
    technical: {
        fresh: ["Basic Concepts of [ROLE]", "Tools & Languages usage", "Simple Problem Solving in [DOMAIN]", "Understanding of [CORE_SKILL]", "Debugging/Fixing simple [TASK]"],
        mid: ["Advanced [ROLE] Techniques", "Optimization of [TASK]", "Best Practices in [DOMAIN]", "Integration with other systems", "Handling Complex [STRUGGLE]"],
        senior: ["System Design for [ROLE]", "Scalability & Performance of [DOMAIN]", "Strategy & Architecture", "Security & Compliance in [ROLE]", "Leadership in [DOMAIN]"]
    },
    hr: {
        fresh: ["Motivation for [ROLE]", "Learning Style", "Team Collaboration", "Career Aspirations", "Work Environment"],
        mid: ["Professional Growth", "Mentorship experience", "Ideal Culture", "Handling Pressure", "Contribution to [ROLE] community"],
        senior: ["Leadership Style", "Strategic Vision", "Building Teams", "Retention", "Business Impact"]
    },
    behavioral: {
        fresh: ["Adapting to [TASK]", "Conflict with [STAKEHOLDER]", "Learning from failure", "Meeting deadlines", "Teamwork on [TASK]"],
        mid: ["Resolving [STRUGGLE]", "Mentoring juniors", "Advocating for [DOMAIN]", "Handling [STAKEHOLDER] feedback", "Impact of work"],
        senior: ["Leading [DOMAIN] strategy", "Disagreement with Management", "Crisis in [STRUGGLE]", "Building consensus", "Long-term vision"]
    }
};

DEFAULT_ROLES.forEach(role => {
    if (!MASTER_ROADMAPS[role]) {
        const context = getRoleContext(role);
        MASTER_ROADMAPS[role] = {
            fresh: {
                technical: TEMPLATES.technical.fresh.map(q => q.replace('[ROLE]', role).replace('[DOMAIN]', role.split(' ')[0]).replace('[CORE_SKILL]', context.task).replace('[TASK]', context.task)),
                hr: TEMPLATES.hr.fresh.map(q => q.replace('[ROLE]', role)),
                behavioral: TEMPLATES.behavioral.fresh.map(q => q.replace('[TASK]', context.task).replace('[STAKEHOLDER]', context.stakeholder))
            },
            mid: {
                technical: TEMPLATES.technical.mid.map(q => q.replace('[ROLE]', role).replace('[TASK]', context.task).replace('[DOMAIN]', role.split(' ')[0]).replace('[STRUGGLE]', context.struggle)),
                hr: TEMPLATES.hr.mid.map(q => q.replace('[ROLE]', role)),
                behavioral: TEMPLATES.behavioral.mid.map(q => q.replace('[STRUGGLE]', context.struggle).replace('[DOMAIN]', role).replace('[STAKEHOLDER]', context.stakeholder))
            },
            senior: {
                technical: TEMPLATES.technical.senior.map(q => q.replace('[ROLE]', role).replace('[DOMAIN]', role.split(' ')[0])),
                hr: TEMPLATES.hr.senior.map(q => q),
                behavioral: TEMPLATES.behavioral.senior.map(q => q.replace('[DOMAIN]', role).replace('[STRUGGLE]', context.struggle))
            }
        };
    }
});

const INTERVIEW_TYPE_STRATEGIES = {
    "technical": { focus: ["problem-solving", "technical depth", "system understanding"], followUpRules: ["Dig deep"], questionTemplates: { shallow: "Explain?", moderate: "Apply?", strong: "Trade-offs?" } },
    "hr": { focus: ["culture", "motivation", "career"], followUpRules: ["Ask for examples"], questionTemplates: { shallow: "Example?", moderate: "Learning?", strong: "Growth?" } },
    "behavioral": { focus: ["STAR method", "soft skills"], followUpRules: ["Situation/Action/Result"], questionTemplates: { shallow: "Situation?", moderate: "Action?", strong: "Result?" } }
};

module.exports = { MASTER_ROADMAPS, INTERVIEW_TYPE_STRATEGIES };
