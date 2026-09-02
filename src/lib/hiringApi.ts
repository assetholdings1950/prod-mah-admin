import appClient from "@/lib/appClient";

export const HIRING_STAGES = [
    "Applied",
    "Initial review",
    "Screening",
    "Assessment",
    "Role interview",
    "Standards interview",
    "Decision",
    "Hired",
    "Rejected",
] as const;

export type HiringStage = (typeof HIRING_STAGES)[number];

export interface HiringApplication {
    _id: string;
    reference: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
    country: string;
    city: string;
    jobSnapshot: { title: string; location?: string; type?: string };
    highestQualification: string;
    yearsOfExperience: number;
    currentRole?: string;
    currentCompany?: string;
    professionalSummary?: string;
    motivation: string;
    strengths?: string[];
    stage: HiringStage;
    submittedAt: string;
    resume?: HiringAsset;
    introductionVideo?: HiringAsset | null;
    review?: Record<string, boolean | string | null>;
    notes?: Array<{ _id: string; body: string; createdByLabel?: string; createdAt: string }>;
    activities?: Array<{ _id: string; action: string; detail: string; actorLabel?: string; at: string }>;
}

export type HiringCandidateOption = Pick<
    HiringApplication,
    "_id" | "reference" | "firstName" | "lastName" | "email" | "jobSnapshot" | "stage" | "submittedAt"
>;

export interface HiringAsset {
    _id?: string;
    secureUrl: string;
    originalFilename: string;
    bytes?: number;
    format?: string;
}

export interface HiringInterest {
    _id: string;
    reference: string;
    firstName: string;
    lastName: string;
    email: string;
    coverLetter: string;
    resume: HiringAsset;
    submittedAt: string;
}

export interface HiringInterestPage {
    items: HiringInterest[];
    pagination: { page: number; limit: number; totalDocs: number; totalPages: number };
}

export interface ApplicationDossier {
    application: HiringApplication;
    assignments: CandidateAssignment[];
    interviews: HiringInterview[];
    evaluation: CandidateEvaluation | null;
}

export interface CandidateAssignment {
    _id: string;
    applicationReference: string;
    candidateName: string;
    role: string;
    title: string;
    kind: "Assignment" | "Online exam";
    status: string;
    dueAt: string;
    maximumScore: number;
    score?: number | null;
    feedback?: string;
    candidateInstructions?: string;
    templateSnapshot?: AssignmentTemplate;
    answers?: AssignmentAnswer[];
    questionReviews?: AssignmentQuestionReview[];
    submissionNotes?: string;
    submittedAt?: string;
}

export interface AssignmentAnswer {
    questionId: string;
    selectedOption?: string;
    textAnswer?: string;
    attachments?: Array<{
        secureUrl: string;
        originalFilename: string;
        format?: string;
        bytes?: number;
    }>;
}

export interface AssignmentQuestionReview {
    questionId: string;
    awardedMarks: number;
    maximumMarks: number;
    autoScored: boolean;
    feedback?: string;
}

export interface AssignmentQuestion {
    _id?: string;
    type: "mcq" | "explanation" | "case-study" | "practical";
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
    _id: string;
    title: string;
    role: string;
    summary: string;
    instructions: string;
    allowedResources: string;
    estimatedMinutes: number;
    questions: AssignmentQuestion[];
    totalMarks: number;
    resubmissionPolicy: string;
    candidateNotes?: string;
    attachmentNames?: string[];
    status: "Draft" | "Published";
    createdAt: string;
    updatedAt: string;
}

export interface HiringInterview {
    _id: string;
    applicationReference: string;
    candidateName: string;
    role: string;
    startAt: string;
    endAt: string;
    type: string;
    mode: "Video call" | "In person";
    locationOrLink?: string;
    interviewers?: string[];
    status: string;
    notes?: string;
    outcome?: string;
    recommendation?: string;
}

export interface InterviewAvailability {
    _id: string;
    startAt: string;
    endAt: string;
    status: "Available" | "Unavailable";
    label?: string;
    timezone: string;
}

export interface InterviewCalendar {
    from: string;
    to: string;
    timezone: string;
    interviews: HiringInterview[];
    availability: InterviewAvailability[];
    summary: { booked: number; available: number; unavailable: number };
}

export interface CandidateEvaluation {
    _id?: string;
    criteria?: Array<{ id: string; label: string; weight: number; score: number }>;
    weightedScore?: number;
    evidence?: string;
    strengths?: string;
    concerns?: string;
    recommendation?: string;
}

export interface HiringDashboard {
    metrics: {
        activeVacancies: number;
        candidatesInReview: number;
        interviewsThisWeek: number;
        assessmentsToReview: number;
        decisionsDue: number;
    };
    vacancies: Array<{
        _id: string;
        title: string;
        applications: number;
        inReview: number;
        interviews: number;
        decisions: number;
        hired: number;
        status: string;
        closingDate?: string | null;
    }>;
    decisionsDue: Array<{
        reference: string;
        candidateName: string;
        role: string;
        stage: string;
        dueAt: string;
    }>;
    upcomingInterviews: HiringInterview[];
}

const unwrap = <T>(response: { data: { data: T } }) => response.data.data;

export const hiringApi = {
    dashboard: async () => unwrap<HiringDashboard>(await appClient.get("/api/hiring/dashboard")),
    applications: async (params?: Record<string, string | number>) =>
        unwrap<HiringApplication[]>(await appClient.get("/api/hiring/applications", { params })),
    interests: async (params?: Record<string, string | number>): Promise<HiringInterestPage> => {
        const response = await appClient.get("/api/hiring/interests", { params });
        return { items: response.data.data, pagination: response.data.pagination };
    },
    candidateOptions: async (params?: { search?: string; limit?: number }) =>
        unwrap<HiringCandidateOption[]>(await appClient.get("/api/hiring/application-options", { params })),
    application: async (id: string) =>
        unwrap<ApplicationDossier>(await appClient.get(`/api/hiring/applications/${encodeURIComponent(id)}`)),
    stage: async (id: string, stage: HiringStage) =>
        unwrap<HiringApplication>(await appClient.patch(`/api/hiring/applications/${encodeURIComponent(id)}/stage`, { stage })),
    review: async (id: string, review: Record<string, boolean | string | null>) =>
        unwrap<Record<string, boolean | string | null>>(await appClient.put(`/api/hiring/applications/${encodeURIComponent(id)}/review`, review)),
    note: async (id: string, body: string) =>
        unwrap(await appClient.post(`/api/hiring/applications/${encodeURIComponent(id)}/notes`, { body })),
    saveEvaluation: async (id: string, evaluation: CandidateEvaluation) =>
        unwrap<CandidateEvaluation>(await appClient.put(`/api/hiring/applications/${encodeURIComponent(id)}/evaluation`, evaluation)),
    templates: async () => unwrap<AssignmentTemplate[]>(await appClient.get("/api/hiring/assignment-templates")),
    template: async (id: string) =>
        unwrap<AssignmentTemplate>(await appClient.get(`/api/hiring/assignment-templates/${encodeURIComponent(id)}`)),
    createTemplate: async (payload: Record<string, unknown>) =>
        unwrap<AssignmentTemplate>(await appClient.post("/api/hiring/assignment-templates", payload)),
    updateTemplate: async (id: string, payload: Record<string, unknown>) =>
        unwrap<AssignmentTemplate>(await appClient.put(`/api/hiring/assignment-templates/${encodeURIComponent(id)}`, payload)),
    deleteTemplate: async (id: string) =>
        appClient.delete(`/api/hiring/assignment-templates/${encodeURIComponent(id)}`),
    assignments: async (params?: Record<string, string | number>) =>
        unwrap<CandidateAssignment[]>(await appClient.get("/api/hiring/candidate-assignments", { params })),
    createAssignment: async (payload: Record<string, unknown>) =>
        unwrap<CandidateAssignment>(await appClient.post("/api/hiring/candidate-assignments", payload)),
    updateAssignment: async (id: string, payload: Record<string, unknown>) =>
        unwrap<CandidateAssignment>(await appClient.put(`/api/hiring/candidate-assignments/${id}`, payload)),
    deleteAssignment: async (id: string) =>
        appClient.delete(`/api/hiring/candidate-assignments/${encodeURIComponent(id)}`),
    bulkDeleteAssignments: async (ids: string[]) =>
        appClient.post("/api/hiring/candidate-assignments/bulk-delete", { ids }),
    resetAssignment: async (id: string, payload: Record<string, unknown> = {}) =>
        unwrap<CandidateAssignment>(await appClient.put(`/api/hiring/candidate-assignments/${encodeURIComponent(id)}/reset`, payload)),
    reviewAssignment: async (id: string, payload: Record<string, unknown>) =>
        unwrap<CandidateAssignment>(await appClient.put(`/api/hiring/candidate-assignments/${id}/review`, payload)),
    interviews: async (params?: Record<string, string>) =>
        unwrap<HiringInterview[]>(await appClient.get("/api/hiring/interviews", { params })),
    interviewCalendar: async (params: { from: string; to: string; timezone?: string }) =>
        unwrap<InterviewCalendar>(await appClient.get("/api/hiring/interviews-calendar", { params })),
    createInterviewAvailability: async (payload: Record<string, unknown>) =>
        unwrap<InterviewAvailability>(await appClient.post("/api/hiring/interview-availability", payload)),
    deleteInterviewAvailability: async (id: string) =>
        appClient.delete(`/api/hiring/interview-availability/${encodeURIComponent(id)}`),
    createInterview: async (payload: Record<string, unknown>) =>
        unwrap<HiringInterview>(await appClient.post("/api/hiring/interviews", payload)),
    updateInterview: async (id: string, payload: Record<string, unknown>) =>
        unwrap<HiringInterview>(await appClient.put(`/api/hiring/interviews/${id}`, payload)),
    deleteInterview: async (id: string) => appClient.delete(`/api/hiring/interviews/${id}`),
};
