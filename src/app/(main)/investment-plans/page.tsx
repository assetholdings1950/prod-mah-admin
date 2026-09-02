"use client"

import { useRouter } from "next/navigation"


const InvestmentsPlans = () => {
    const router = useRouter()
    return (
        router.push("/investment-plans/all")
    )
}

export default InvestmentsPlans