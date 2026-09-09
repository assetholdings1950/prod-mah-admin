"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BondsPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/bonds/all"); }, [router]);
    return null;
}
