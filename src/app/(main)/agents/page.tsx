"use client"

import { useRouter } from "next/navigation"

const Agents = () => {
    const router = useRouter();
    return (
        router.push("/agents/all")
    );
};

export default Agents;
