"use client";

import { useParams } from "next/navigation";
import { AssignmentFormPage } from "../../create/page";

export default function EditAssignmentPage() {
    const params = useParams<{ assignmentId: string }>();

    return <AssignmentFormPage assignmentId={params.assignmentId} />;
}
