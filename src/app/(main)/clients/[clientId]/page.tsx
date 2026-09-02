import { redirect } from "next/navigation"

export default function ClientRedirect() {
    redirect("/clients/all")
}
