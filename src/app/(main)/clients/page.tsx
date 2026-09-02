"use client"

import { useRouter } from "next/navigation"


const Clients = () => {
    const router = useRouter()
    return (
        router.push("/clients/all")
    )
}

export default Clients