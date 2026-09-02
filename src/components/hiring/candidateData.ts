export const HIRING_STAGES = [
    "Applied",
    "Initial review",
    "Screening",
    "Assessment",
    "Role interview",
    "Standards interview",
    "Decision",
    "Hired",
] as const;

export type HiringStage = (typeof HIRING_STAGES)[number] | "Rejected";

export interface CandidateDocument {
    id: string;
    name: string;
    type: "PDF" | "MP4";
    size: string;
    uploadedAt: string;
}

export interface CandidateActivity {
    id: string;
    action: string;
    detail: string;
    at: string;
}

export interface CandidateApplication {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    phone: string;
    country: string;
    countryCode: string;
    city: string;
    receivedAt: string;
    stage: HiringStage;
    highestQualification: string;
    yearsExperience: number;
    currentRole: string;
    currentCompany: string;
    whyMerlion: string;
    professionalSummary: string;
    strengths: string[];
    documents: CandidateDocument[];
    activities: CandidateActivity[];
}

export const candidateApplications: CandidateApplication[] = [
    {
        id: "MAH-HR-2026-018",
        firstName: "Aisha",
        lastName: "Rahman",
        role: "Senior Financial Analyst",
        email: "aisha.rahman@email.com",
        phone: "412 345 678",
        country: "Australia",
        countryCode: "+61",
        city: "Sydney",
        receivedAt: "30 July 2026",
        stage: "Initial review",
        highestQualification: "Bachelor of Finance",
        yearsExperience: 5,
        currentRole: "Financial Analyst",
        currentCompany: "DBS Bank",
        professionalSummary:
            "Financial analyst with five years of experience in corporate finance, budgeting, financial modelling, and stakeholder reporting.",
        whyMerlion:
            "Merlion Asset Holdings has a strong reputation for disciplined investing and long-term value creation, which aligns with my own approach to finance. I am excited by the opportunity to contribute to a team that combines deep expertise with a global perspective and to grow within an organisation that values integrity, performance, and continuous learning.",
        strengths: [
            "Financial modelling and variance analysis",
            "Board and stakeholder reporting",
            "Budget ownership and forecasting",
            "Clear communication across finance teams",
        ],
        documents: [
            {
                id: "resume",
                name: "Aisha_Rahman_Resume.pdf",
                type: "PDF",
                size: "1.8 MB",
                uploadedAt: "30 July 2026, 09:41 AM",
            },
            {
                id: "video",
                name: "Aisha_Rahman_Introduction.mp4",
                type: "MP4",
                size: "18.4 MB",
                uploadedAt: "30 July 2026, 09:43 AM",
            },
        ],
        activities: [
            {
                id: "activity-1",
                action: "Application submitted",
                detail: "Candidate completed the public application form.",
                at: "30 July 2026, 09:34 AM",
            },
            {
                id: "activity-2",
                action: "Resume opened",
                detail: "Reviewed by Hiring Admin.",
                at: "30 July 2026, 09:41 AM",
            },
            {
                id: "activity-3",
                action: "Review started",
                detail: "Initial review checklist opened by Hiring Admin.",
                at: "30 July 2026, 10:15 AM",
            },
        ],
    },
    {
        id: "MAH-HR-2026-017",
        firstName: "Daniel",
        lastName: "Tan",
        role: "Senior Financial Analyst",
        email: "daniel.tan@email.com",
        phone: "9123 4567",
        country: "Singapore",
        countryCode: "+65",
        city: "Singapore",
        receivedAt: "29 July 2026",
        stage: "Screening",
        highestQualification: "Master of Applied Finance",
        yearsExperience: 6,
        currentRole: "Finance Manager",
        currentCompany: "OCBC",
        professionalSummary:
            "Finance manager with experience in planning, controls, and regional reporting.",
        whyMerlion:
            "I want to bring disciplined analysis and dependable financial partnership to Merlion's investment teams.",
        strengths: ["Financial planning", "Controls", "Regional reporting"],
        documents: [],
        activities: [],
    },
    {
        id: "MAH-HR-2026-016",
        firstName: "Priya",
        lastName: "Nair",
        role: "Senior Financial Analyst",
        email: "priya.nair@email.com",
        phone: "9876 1212",
        country: "Singapore",
        countryCode: "+65",
        city: "Singapore",
        receivedAt: "28 July 2026",
        stage: "Applied",
        highestQualification: "Bachelor of Commerce",
        yearsExperience: 4,
        currentRole: "Senior Associate",
        currentCompany: "KPMG",
        professionalSummary:
            "Audit and advisory professional moving into investment-focused finance.",
        whyMerlion:
            "Merlion's disciplined approach and international perspective are a strong fit for my next career step.",
        strengths: ["Audit", "Advisory", "Financial reporting"],
        documents: [],
        activities: [],
    },
];

export function getCandidateApplication(id: string) {
    return (
        candidateApplications.find(candidate => candidate.id === id) ??
        candidateApplications[0]
    );
}
