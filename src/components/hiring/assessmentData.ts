export type AssessmentKind = "Assignment" | "Online exam";
export type AssessmentStatus =
    | "Draft"
    | "Published"
    | "In progress"
    | "Submitted"
    | "Under review"
    | "Passed"
    | "Revision requested"
    | "Not passed";

export interface AssessmentRubricItem {
    id: string;
    label: string;
    weight: number;
}

export type AssignmentQuestionType =
    | "mcq"
    | "explanation"
    | "case-study"
    | "practical";

export interface AssignmentQuestion {
    id: string;
    type: AssignmentQuestionType;
    title: string;
    prompt: string;
    marks: number;
    required: boolean;
    options?: string[];
    referenceAnswer?: string;
    wordLimit?: number;
    caseStudy?: string;
    acceptedFormats?: string[];
}

export interface AssignmentTemplate {
    id: string;
    title: string;
    role: string;
    summary: string;
    instructions: string;
    allowedResources: string;
    estimatedMinutes: number;
    questions: AssignmentQuestion[];
    resubmissionPolicy: string;
    candidateNotes?: string;
    attachmentNames: string[];
    status: "Draft" | "Published";
    updatedAt: string;
}

export interface CandidateAssessment {
    id: string;
    candidateId: string;
    candidateName: string;
    role: string;
    kind: AssessmentKind;
    title: string;
    status: AssessmentStatus;
    dueAt: string;
    submittedAt?: string;
    score?: number;
    maximumScore: number;
    reviewer: string;
    templateId?: string;
    instructions?: string;
    background?: string;
    deliverables?: string[];
    allowedResources?: string;
    estimatedMinutes?: number;
    submissionFormats?: string[];
    attachmentNames?: string[];
    rubric?: AssessmentRubricItem[];
    questions?: AssignmentQuestion[];
    resubmissionPolicy?: string;
    candidateNotes?: string;
}

export const candidateAssessments: CandidateAssessment[] = [
    {
        id: "assessment-001",
        candidateId: "MAH-HR-2026-017",
        candidateName: "Daniel Tan",
        role: "Senior Financial Analyst",
        kind: "Assignment",
        title: "Financial model and investment memorandum",
        status: "Submitted",
        dueAt: "31 July 2026, 5:00 PM",
        submittedAt: "30 July 2026, 8:42 PM",
        maximumScore: 100,
        reviewer: "Hiring Admin",
        instructions:
            "Review the fictional company information, build a five-year forecast, and prepare a concise investment recommendation.",
        background:
            "Merlion is considering a minority investment in Northstar Payments, a fictional regional payments business. Assess the opportunity using only the supplied case data.",
        deliverables: [
            "Completed financial model in XLSX format",
            "Two-page investment memorandum in PDF format",
            "Five-slide executive presentation",
        ],
        allowedResources:
            "Spreadsheet software, calculator, and publicly available reference material. Do not use confidential employer or client information.",
        estimatedMinutes: 120,
        submissionFormats: ["XLSX", "PDF", "PPTX"],
        attachmentNames: ["Northstar_Payments_Case_Pack.pdf"],
        rubric: [
            { id: "technical", label: "Technical correctness", weight: 30 },
            { id: "analysis", label: "Analysis and problem-solving", weight: 25 },
            { id: "risk", label: "Accuracy and risk awareness", weight: 20 },
            { id: "communication", label: "Communication and presentation", weight: 15 },
            { id: "instructions", label: "Following instructions", weight: 10 },
        ],
        questions: [
            {
                id: "question-1",
                type: "mcq",
                title: "Investment risk indicator",
                prompt:
                    "Which metric most directly measures the sensitivity of an equity investment to overall market movements?",
                marks: 10,
                required: true,
                options: [
                    "Beta",
                    "Current ratio",
                    "Inventory turnover",
                    "Gross margin",
                ],
                referenceAnswer: "Beta",
            },
            {
                id: "question-2",
                type: "explanation",
                title: "Forecast assumptions",
                prompt:
                    "Explain the three assumptions that have the greatest effect on your forecast and how you validated them.",
                marks: 20,
                required: true,
                wordLimit: 500,
                referenceAnswer:
                    "Look for evidence-based assumptions, sensitivity awareness, and a clear validation method.",
            },
            {
                id: "question-3",
                type: "case-study",
                title: "Northstar investment decision",
                caseStudy:
                    "Northstar Payments is growing revenue rapidly but has declining operating cash flow, increasing customer concentration, and a planned regional expansion.",
                prompt:
                    "Prepare an investment recommendation identifying the principal value drivers, material risks, and conditions that should be satisfied before investment.",
                marks: 40,
                required: true,
                wordLimit: 900,
                referenceAnswer:
                    "The response should balance growth potential against liquidity, concentration, execution, and governance risk.",
            },
            {
                id: "question-4",
                type: "practical",
                title: "Financial model submission",
                prompt:
                    "Build a five-year forecast with an assumptions sheet, integrated statements, valuation range, and sensitivity analysis.",
                marks: 30,
                required: true,
                acceptedFormats: ["XLSX", "PDF"],
                referenceAnswer:
                    "Review model integrity, transparent assumptions, formula consistency, valuation logic, and downside scenarios.",
            },
        ],
        resubmissionPolicy:
            "One resubmission may be approved manually when a documented technical issue affected the original submission.",
        candidateNotes:
            "Use fictional data only. Clearly state every assumption and keep the work within the recommended two-hour limit.",
    },
    {
        id: "assessment-002",
        candidateId: "MAH-HR-2026-017",
        candidateName: "Daniel Tan",
        role: "Senior Financial Analyst",
        kind: "Online exam",
        title: "Finance, risk and professional judgement",
        status: "Under review",
        dueAt: "1 August 2026, 12:00 PM",
        submittedAt: "30 July 2026, 11:18 AM",
        maximumScore: 60,
        reviewer: "Hiring Admin",
    },
    {
        id: "assessment-003",
        candidateId: "MAH-HR-2026-018",
        candidateName: "Aisha Rahman",
        role: "Senior Financial Analyst",
        kind: "Assignment",
        title: "Financial model and investment memorandum",
        status: "Published",
        dueAt: "4 August 2026, 5:00 PM",
        maximumScore: 100,
        reviewer: "Hiring Admin",
        instructions:
            "Prepare a forecast model and written recommendation using the attached fictional case information.",
        background:
            "The case evaluates financial judgement, modelling discipline, risk awareness, and executive communication.",
        deliverables: [
            "Forecast model",
            "Investment memorandum",
            "Executive presentation",
        ],
        allowedResources:
            "Spreadsheet software, calculator, and public reference material.",
        estimatedMinutes: 120,
        submissionFormats: ["XLSX", "PDF", "PPTX"],
        attachmentNames: ["Financial_Assignment_Case_Pack.pdf"],
        rubric: [
            { id: "technical", label: "Technical correctness", weight: 30 },
            { id: "analysis", label: "Analysis and problem-solving", weight: 25 },
            { id: "risk", label: "Accuracy and risk awareness", weight: 20 },
            { id: "communication", label: "Communication and presentation", weight: 15 },
            { id: "instructions", label: "Following instructions", weight: 10 },
        ],
        questions: [
            {
                id: "aisha-question-1",
                type: "case-study",
                title: "Investment recommendation",
                caseStudy:
                    "Review the fictional company case pack and assess its financial quality and investment risks.",
                prompt:
                    "Provide a supported investment recommendation and state the conditions required before proceeding.",
                marks: 60,
                required: true,
                wordLimit: 1000,
            },
            {
                id: "aisha-question-2",
                type: "practical",
                title: "Forecast model",
                prompt:
                    "Submit a five-year financial forecast and valuation sensitivity.",
                marks: 40,
                required: true,
                acceptedFormats: ["XLSX", "PDF"],
            },
        ],
        resubmissionPolicy:
            "Resubmission requires a reason recorded and approved by the Hiring Admin.",
        candidateNotes:
            "Do not include confidential information from any current or former employer.",
    },
    {
        id: "assessment-004",
        candidateId: "MAH-HR-2026-016",
        candidateName: "Priya Nair",
        role: "Relationship Manager",
        kind: "Online exam",
        title: "Client suitability and conduct scenarios",
        status: "Draft",
        dueAt: "6 August 2026, 12:00 PM",
        maximumScore: 50,
        reviewer: "Hiring Admin",
    },
    {
        id: "assessment-005",
        candidateId: "MAH-HR-2026-015",
        candidateName: "Benjamin Lee",
        role: "Investment Operations Analyst",
        kind: "Assignment",
        title: "Trade reconciliation investigation",
        status: "Passed",
        dueAt: "29 July 2026, 5:00 PM",
        submittedAt: "29 July 2026, 2:10 PM",
        score: 84,
        maximumScore: 100,
        reviewer: "Hiring Admin",
    },
];

const baseTemplateQuestions =
    candidateAssessments.find(
        assessment => assessment.id === "assessment-001",
    )?.questions ?? [];

export const assignmentTemplates: AssignmentTemplate[] = [
    {
        id: "template-financial-analysis",
        title: "Financial analysis and investment judgement",
        role: "Senior Financial Analyst",
        summary:
            "A reusable assignment paper covering financial knowledge, written reasoning, investment judgement, and practical modelling.",
        instructions:
            "Answer every required question and state all assumptions. Use only fictional case data and public reference material.",
        allowedResources:
            "Spreadsheet software, calculator, and public reference material.",
        estimatedMinutes: 150,
        questions: baseTemplateQuestions,
        resubmissionPolicy:
            "One resubmission with Hiring Admin approval",
        candidateNotes:
            "Do not include confidential information from a current or former employer.",
        attachmentNames: ["Northstar_Payments_Case_Pack.pdf"],
        status: "Published",
        updatedAt: "30 July 2026",
    },
    {
        id: "template-client-suitability",
        title: "Client suitability and relationship judgement",
        role: "Relationship Manager",
        summary:
            "Client discovery, suitability, communication, and conduct scenarios for relationship-management candidates.",
        instructions:
            "Review the fictional client profile and answer each scenario from the perspective of a responsible Merlion representative.",
        allowedResources:
            "Calculator and public regulatory reference material.",
        estimatedMinutes: 90,
        questions: [
            {
                id: "rm-question-1",
                type: "case-study",
                title: "Client suitability recommendation",
                caseStudy:
                    "A fictional client seeks high returns but has a short investment horizon, limited liquidity, and low tolerance for loss.",
                prompt:
                    "Explain the suitability concerns, the questions you would ask, and the recommendation you would make.",
                marks: 60,
                required: true,
                wordLimit: 800,
                referenceAnswer:
                    "Look for discovery discipline, suitability awareness, clear risk communication, and willingness to decline an unsuitable request.",
            },
            {
                id: "rm-question-2",
                type: "explanation",
                title: "Difficult client communication",
                prompt:
                    "Draft a response to a client who is dissatisfied with short-term portfolio performance.",
                marks: 40,
                required: true,
                wordLimit: 500,
                referenceAnswer:
                    "The response should be empathetic, factual, non-defensive, and avoid unsupported promises.",
            },
        ],
        resubmissionPolicy: "No resubmission allowed",
        attachmentNames: ["Fictional_Client_Profile.pdf"],
        status: "Published",
        updatedAt: "29 July 2026",
    },
    {
        id: "template-compliance-review",
        title: "KYC, conduct and escalation assessment",
        role: "Compliance Associate",
        summary:
            "A scenario-led paper covering KYC review, suspicious activity, conflicts, documentation, and escalation.",
        instructions:
            "Identify every material issue and document the action, evidence, and escalation required.",
        allowedResources:
            "Public regulatory guidance and a calculator.",
        estimatedMinutes: 120,
        questions: [
            {
                id: "compliance-question-1",
                type: "mcq",
                title: "Incomplete beneficial-owner information",
                prompt:
                    "What is the most appropriate first action when beneficial ownership cannot be verified?",
                marks: 20,
                required: true,
                options: [
                    "Proceed and review later",
                    "Pause onboarding and request evidence",
                    "Ignore the discrepancy",
                    "Approve with a verbal confirmation",
                ],
                referenceAnswer:
                    "Pause onboarding and request evidence",
            },
            {
                id: "compliance-question-2",
                type: "case-study",
                title: "Suspicious transaction review",
                caseStudy:
                    "A fictional account receives several third-party transfers followed by rapid outbound payments inconsistent with the stated profile.",
                prompt:
                    "Document the red flags, investigation steps, evidence required, and escalation recommendation.",
                marks: 80,
                required: true,
                wordLimit: 1000,
                referenceAnswer:
                    "Look for structured red-flag analysis, evidence preservation, appropriate internal escalation, and avoidance of tipping off.",
            },
        ],
        resubmissionPolicy:
            "Resubmission only for documented technical issues",
        attachmentNames: ["KYC_Case_Documents.zip"],
        status: "Draft",
        updatedAt: "28 July 2026",
    },
];

const customAssignmentTemplates: AssignmentTemplate[] = [];

export function getAssignmentTemplates() {
    return [...customAssignmentTemplates, ...assignmentTemplates];
}

export function addAssignmentTemplate(template: AssignmentTemplate) {
    customAssignmentTemplates.unshift(template);
}

export function getCandidateAssessments(candidateId: string) {
    return candidateAssessments.filter(
        assessment => assessment.candidateId === candidateId,
    );
}
