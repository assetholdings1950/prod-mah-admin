"use client"

import { useRouter } from "next/navigation"


const Clients = () => {
    const router = useRouter()
    return (
        router.push("/investment-plans/all")
    )
}

export default Clients