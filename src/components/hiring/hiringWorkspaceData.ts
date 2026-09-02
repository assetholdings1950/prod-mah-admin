export interface HiringVacancySummary {
    id: string;
    title: string;
    applications: number;
    inReview: number;
    interviews: number;
    decisions: number;
    owner: string;
    closingDate: string;
    status: "Open" | "Closing soon";
}

export interface HiringInterview {
    id: string;
    candidateName: string;
    candidateId: string;
    role: string;
    date: string;
    day: string;
    dayNumber: number;
    time: string;
    endTime: string;
    duration: string;
    type: string;
    mode: "Video call" | "In person";
    interviewers: string[];
}

export const hiringVacancies: HiringVacancySummary[] = [
    {
        id: "job-senior-financial-analyst",
        title: "Senior Financial Analyst",
        applications: 18,
        inReview: 7,
        interviews: 5,
        decisions: 1,
        owner: "Hiring Admin",
        closingDate: "15 Aug 2026",
        status: "Open",
    },
    {
        id: "job-relationship-manager",
        title: "Relationship Manager",
        applications: 12,
        inReview: 5,
        interviews: 3,
        decisions: 0,
        owner: "Hiring Admin",
        closingDate: "31 Aug 2026",
        status: "Open",
    },
    {
        id: "job-compliance-associate",
        title: "Compliance Associate",
        applications: 9,
        inReview: 3,
        interviews: 2,
        decisions: 0,
        owner: "Hiring Admin",
        closingDate: "20 Aug 2026",
        status: "Closing soon",
    },
    {
        id: "job-investment-operations-analyst",
        title: "Investment Operations Analyst",
        applications: 7,
        inReview: 2,
        interviews: 1,
        decisions: 0,
        owner: "Hiring Admin",
        closingDate: "10 Aug 2026",
        status: "Closing soon",
    },
];

export const hiringInterviews: HiringInterview[] = [
    {
        id: "interview-aisha",
        candidateName: "Aisha Rahman",
        candidateId: "MAH-HR-2026-018",
        role: "Senior Financial Analyst",
        date: "30 July 2026",
        day: "Thu",
        dayNumber: 30,
        time: "10:00 AM",
        endTime: "11:00 AM",
        duration: "1 hour",
        type: "Portfolio Interview",
        mode: "Video call",
        interviewers: ["Hiring Admin", "Mei Lin Chen"],
    },
    {
        id: "interview-daniel",
        candidateName: "Daniel Tan",
        candidateId: "MAH-HR-2026-017",
        role: "Senior Financial Analyst",
        date: "28 July 2026",
        day: "Tue",
        dayNumber: 28,
        time: "9:00 AM",
        endTime: "10:00 AM",
        duration: "1 hour",
        type: "Initial Interview",
        mode: "Video call",
        interviewers: ["Hiring Admin"],
    },
    {
        id: "interview-priya",
        candidateName: "Priya Nair",
        candidateId: "MAH-HR-2026-016",
        role: "Relationship Manager",
        date: "28 July 2026",
        day: "Tue",
        dayNumber: 28,
        time: "1:00 PM",
        endTime: "2:00 PM",
        duration: "1 hour",
        type: "Final Interview",
        mode: "In person",
        interviewers: ["Hiring Admin", "Mei Lin Chen"],
    },
    {
        id: "interview-benjamin",
        candidateName: "Benjamin Lee",
        candidateId: "MAH-HR-2026-015",
        role: "Investment Operations Analyst",
        date: "29 July 2026",
        day: "Wed",
        dayNumber: 29,
        time: "2:00 PM",
        endTime: "3:00 PM",
        duration: "1 hour",
        type: "Technical Interview",
        mode: "Video call",
        interviewers: ["Mei Lin Chen"],
    },
    {
        id: "interview-marcus",
        candidateName: "Marcus Ong",
        candidateId: "MAH-HR-2026-014",
        role: "Compliance Associate",
        date: "30 July 2026",
        day: "Thu",
        dayNumber: 30,
        time: "3:00 PM",
        endTime: "4:00 PM",
        duration: "1 hour",
        type: "HR Interview",
        mode: "Video call",
        interviewers: ["Hiring Admin"],
    },
    {
        id: "interview-sarah",
        candidateName: "Sarah Lim",
        candidateId: "MAH-HR-2026-013",
        role: "Relationship Manager",
        date: "31 July 2026",
        day: "Fri",
        dayNumber: 31,
        time: "11:00 AM",
        endTime: "12:00 PM",
        duration: "1 hour",
        type: "Initial Interview",
        mode: "Video call",
        interviewers: ["Hiring Admin"],
    },
];
