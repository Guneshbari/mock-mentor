/**
 * Role-Specific Focus Areas and Interview Type Strategies
 */
const ROLE_ROADMAPS = {
    "Frontend Developer": {
        fresh: [
            "HTML/CSS & DOM Fundamentals (Box model, semantic HTML)",
            "JavaScript Basics (ES6+, Arrays, Events)",
            "React/Framework Basics (Components, Props, State)",
            "Basic Debugging & Troubleshooting",
            "Git & Version Control Basics"
        ],
        mid: [
            "Component Lifecycle & Rendering Optimization",
            "Advanced State Management (Redux/Context/Zustand)",
            "Asynchronous Data Handling & API Integration",
            "Browser Storage, Cookies & Security (XSS/CSRF)",
            "Testing (Unit, Integration) & Code Quality"
        ],
        senior: [
            "Frontend System Design & Architecture (Scalability)",
            "Performance Engineering (Web Vitals, Code Splitting)",
            "Micro-frontends & Monorepo Strategies",
            "Advanced Security & Authentication patterns",
            "Leadership, Mentoring & Technical Strategy"
        ]
    },
    "Backend Developer": {
        fresh: [
            "HTTP Protocol & Rest API Basics",
            "Basic Database operations (CRUD, simple SQL)",
            "Server-side Language Fundamentals",
            "Authentication Concepts (Sessions/Tokens)",
            "Basic Error Handling & Logging"
        ],
        mid: [
            "Advanced API Design (REST vs GraphQL)",
            "Database Modeling & Optimization (Indexing, Normalization)",
            "Caching Strategies (Redis/Memcached)",
            "Authentication flows (OAuth2, JWT)",
            "Containerization & Basic CI/CD"
        ],
        senior: [
            "Distributed Systems & Microservices Architecture",
            "High Availability & Database Scaling (Sharding/Replication)",
            "Event-Driven Architecture & Message Queues",
            "System Security & Cloud Infrastructure Design",
            "Observability, Tracing & Production Reliability"
        ]
    },
    "Full Stack Developer": {
        fresh: [
            "Client-Server Communication Basics",
            "Simple CRUD Application Logic",
            "Basic Database Connectivity",
            "Responsive UI Implementation",
            "Deployment to PaaS (Heroku/Vercel/Netlify)"
        ],
        mid: [
            "End-to-End Type Safety & Data Validation",
            "State Synchronization (BE to FE)",
            "Authentication Implementation (Full flow)",
            "API Rate Limiting & Performance",
            "Integration Testing strategies"
        ],
        senior: [
            "Scalable Full Stack Architecture Plan",
            "Serverless vs Containerized Trade-offs",
            "Data Consistency in Distributed Systems",
            "Infrastructure as Code & CI/CD Pipelines",
            "System Bottleneck Analysis & Optimization"
        ]
    },
    "DevOps Engineer": {
        fresh: [
            "Linux/Shell Scripting Basics",
            "Version Control (Git) Fundamentals",
            "Basic CI concepts",
            "Introduction to Docker/Containers",
            "Troubleshooting Server Issues"
        ],
        mid: [
            "CI/CD Pipeline Construction",
            "Docker Compose & Container Orchestration",
            "Cloud Provider Basics (AWS/GCP/Azure)",
            "Monitoring Setup (Prometheus/Grafana)",
            "Infrastructure as Code Basics (Terraform)"
        ],
        senior: [
            "Kubernetes Cluster Management & Scaling",
            "Advanced IaC & Drift Detection",
            "Site Reliability Engineering (SRE) Practices",
            "Security Automation (DevSecOps)",
            "Multi-Cloud & Hybrid architectures"
        ]
    },
    "Data Scientist": {
        fresh: [
            "Data Cleaning & Python/Pandas Basics",
            "Basic Statistical Concepts",
            "Introduction to ML Algorithms (Linear/Logistic)",
            "Data Visualization",
            "SQL for Data Analysis"
        ],
        mid: [
            "Feature Engineering & Selection",
            "Model Validation & Cross-Validation",
            "Advanced ML Algorithms (Trees, Ensembles)",
            "Working with Big Data Tools (Spark/Dask)",
            "Experiment Design (A/B Testing)"
        ],
        senior: [
            "End-to-End ML Pipeline Architecture",
            "Deep Learning & Neural Network tuning",
            "Model Serving & Productionization",
            "Business Strategy from Data Insights",
            "Ethics, Bias & Model Interpretability"
        ]
    },
    "Machine Learning Engineer": {
        fresh: [
            "Python & ML Library Basics (Scikit-learn)",
            "Training a Simple Model",
            "Basic Data Preprocessing",
            "Model Evaluation Metrics",
            "Git for Data Science"
        ],
        mid: [
            "ML Pipelines (Airflow/Kubeflow)",
            "Deep Learning Frameworks (PyTorch/TensorFlow)",
            "Model Training at Scale",
            "API Deployment of Models (FastAPI/Flask)",
            "Feature Stores & Data Lineage"
        ],
        senior: [
            "ML System Design for High Scale",
            "Model Monitoring & Drift Detection",
            "Distributed Training Strategies",
            "Hardware Optimization (GPU/TPU)",
            "MLOps maturity & Platform Engineering"
        ]
    },
    "Mobile Developer": {
        fresh: [
            "UI Layouts & Basic Views",
            "Activity/View Lifecycle",
            "Basic Navigation",
            "Fetching Data from API",
            "IDE Familiarity (Android Studio/Xcode)"
        ],
        mid: [
            "Complex State Management",
            "Local Database (Room/CoreData)",
            "Background Processing & Services",
            "Push Notifications Integration",
            "Testing & Debugging"
        ],
        senior: [
            "App Architecture (Clean/MVVM/VIPER)",
            "Performance Optimization (FPS/Memory)",
            "CI/CD for Mobile Apps",
            "Security & Obfuscation",
            "Module/Library Development"
        ]
    },
    "QA Engineer": {
        fresh: [
            "Manual Testing Concepts",
            "Bug Life Cycle & Reporting",
            "Writing Test Cases",
            "Basic SQL/API Queries",
            "Testing Types (Blackbox vs Whitebox)"
        ],
        mid: [
            "Test Automation (Selenium/Cypress)",
            "API Testing Automation",
            "CI integration of tests",
            "Load/Performance Testing Basics",
            "Database Verification"
        ],
        senior: [
            "Test Framwork Architecture Design",
            "Quality Metrics & Strategy",
            "Security & Component Testing",
            "Shift-Left Testing Implementation",
            "Team Mentoring & Process Improvement"
        ]
    },
    "Product Manager": {
        fresh: [
            "Understanding User Personas",
            "Writing User Stories",
            "Basic Agile/Scrum Ceremonies",
            "Competitor Analysis",
            "Communication Skills"
        ],
        mid: [
            "Roadmap Planning & Prioritization",
            "Data-Driven Decision Making",
            "Stakeholder Management",
            "Product Discovery Techniques",
            "Go-to-Market Strategy Support"
        ],
        senior: [
            "Product Vision & Long-term Strategy",
            "Unit Economics & Business Viability",
            "Organizational Leadership & Influence",
            "Scaling Product Teams",
            "Complex Cross-Functional Alignment"
        ]
    },
    "UI/UX Designer": {
        fresh: [
            "Design Tools (Figma/Adobe)",
            "Basic Color/Typography Theory",
            "Creating Wireframes",
            "Conducting basic User Interviews",
            "Handing off to developers"
        ],
        mid: [
            "Interaction Design & Prototyping",
            "Information Architecture",
            "Usability Testing & Iteration",
            "Design Systems usage",
            "Accessibility Standards (WCAG)"
        ],
        senior: [
            "Design Strategy & Vision",
            "Design Systems Architecture",
            "Leading Design Workshops",
            "UX Metrics & ROI",
            "Cross-platform Experience Consistency"
        ]
    },
    "Software Architect": {
        fresh: [
            // Architects usually start Senior, but defined for fallback
            "Design Patterns Basics",
            "Code Quality Standards",
            "API Documentation",
            "Modular Code Structure",
            "Reviewing Pull Requests"
        ],
        mid: [
            "System Component Design",
            "Database Schema Optimization",
            "Service Communication Patterns",
            "Security Principles",
            "Cloud Service Selection"
        ],
        senior: [
            "Enterprise Architecture Patterns",
            "High-Availability & Disaster Recovery",
            "Technology Radar & Strategy",
            "Organizational Alignment & Governance",
            "Legacy Modernization Roadmap"
        ]
    },
    "Cloud Engineer": {
        fresh: [
            "Virtual Machines & Compute Basics",
            "Basic Networking (IP/DNS)",
            "Storage Options (S3/Blob)",
            "IAM Users & Permissions",
            "Cost Awareness"
        ],
        mid: [
            "VPC Design & Subnetting",
            "Load Balancing & Auto-scaling",
            "Serverless Functions",
            "Database Migration to Cloud",
            "Infrastructure as Code"
        ],
        senior: [
            "Multi-Region Architecture",
            "Hybrid Cloud Connectivity",
            "Advanced Security & Compliance",
            "FinOps and Cost Engineering",
            "Large-scale Migration Strategy"
        ]
    },
    "Security Engineer": {
        fresh: [
            "Basic Network Security (Firewalls)",
            "OWASP Top 10 Awareness",
            "Password Policies & Hashing",
            "Security Tools (Nmap/Wireshark)",
            "Risk Identification"
        ],
        mid: [
            "Vulnerability Scanning & Management",
            "Incident Response Procedures",
            "Identity & Access Management (IAM)",
            "Web App Penetration Testing",
            "Encryption Standards (PKI/TLS)"
        ],
        senior: [
            "Zero Trust Architecture",
            "Threat Hunting & Intelligence",
            "Compliance Frameworks (SOC2/ISO)",
            "Security Architecture Review",
            "CISO Level Strategy"
        ]
    },
    "Database Administrator": {
        fresh: [
            "SQL Fundamentals",
            "Backup & Restore Basics",
            "User Management",
            "Installation & Configuration",
            "Basic Troubleshooting"
        ],
        mid: [
            "Query Optimization & Indexing",
            "High Availability Setup",
            "Monitoring & Alerting",
            "Patch Management",
            "Schema Change Management"
        ],
        senior: [
            "Database Engine Internals",
            "Multi-Active Replication",
            "Capacity Planning & Scaling",
            "Disaster Recovery Tests",
            "Database Reliability Engineering"
        ]
    }
};

const INTERVIEW_TYPE_STRATEGIES = {
    "technical": {
        focus: ["problem-solving", "technical depth", "system understanding", "best practices"],
        followUpRules: [
            "If candidate mentions a tool → ask how they used it in detail",
            "If candidate gives high-level answer → ask implementation specifics",
            "If candidate solves problem → ask about optimization or edge cases",
            "If candidate mentions a decision → ask about alternatives and trade-offs"
        ],
        questionTemplates: {
            shallow: "Can you explain how [CONCEPT] works in more detail?",
            moderate: "How would you apply [CONCEPT] to solve [SCENARIO]?",
            strong: "What are the trade-offs between [CONCEPT] and alternatives? When would you choose each?"
        }
    },
    "hr": {
        focus: ["communication", "teamwork", "motivation", "career goals", "culture fit"],
        followUpRules: [
            "Ask for specific examples from their experience",
            "Probe decision-making and reflection",
            "Avoid technical depth, focus on soft skills",
            "Ask about lessons learned and growth"
        ],
        questionTemplates: {
            shallow: "Can you give a specific example of when you [SITUATION]?",
            moderate: "What did you learn from that experience?",
            strong: "How has that experience shaped your approach to [SITUATION] today?"
        }
    },
    "behavioral": {
        focus: ["conflict resolution", "leadership", "adaptability", "accountability", "teamwork"],
        followUpRules: [
            "Use STAR-style probing (Situation, Task, Action, Result)",
            "Ask what they learned or would change",
            "Explore impact on team or outcome",
            "Dig into decision-making process"
        ],
        questionTemplates: {
            shallow: "Tell me about a time when you [SITUATION]. What was the context?",
            moderate: "What specific actions did you take? Why did you choose that approach?",
            strong: "What was the outcome? What would you do differently knowing what you know now?"
        }
    }
};

const BEHAVIORAL_ROADMAPS = {
    fresh: [
        "Adaptability in a new environment",
        "Handling constructive criticism",
        "Teamwork & Collaboration experience",
        "Time management & Deadlines",
        "Learning from a mistake"
    ],
    mid: [
        "Conflict Resolution with peers",
        "Mentoring or helping juniors",
        "Handling ambiguous requirements",
        "Advocating for technical debt/improvements",
        "Impact of your work on the user"
    ],
    senior: [
        "Leading through influence",
        "Handling strategic disagreement with management",
        "Crisis Management & Resilience",
        "Building consensus across teams",
        "Vision & Long-term planning"
    ]
};

const HR_ROADMAPS = {
    fresh: [
        "Career Goals & Motivation",
        "Why this role/company?",
        "Preferred work environment",
        "Strengths & Weaknesses analysis",
        "Questions for us"
    ],
    mid: [
        "Career Progression & Growth",
        "Ideal Team Culture",
        "Handling Work-Life Balance/Pressure",
        "Professional Achievements",
        "Contributions to Company Culture"
    ],
    senior: [
        "Leadership Philosophy",
        "Strategic Alignment with Business",
        "Building High-Performing Teams",
        "Retention & Culture Stewardship",
        "Legacy & Impact aspirations"
    ]
};

module.exports = { ROLE_ROADMAPS, BEHAVIORAL_ROADMAPS, HR_ROADMAPS, INTERVIEW_TYPE_STRATEGIES };
