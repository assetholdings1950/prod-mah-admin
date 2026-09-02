import type { Metadata } from "next";
import InterestRequestsList from "@/components/hiring/InterestRequestsList";

export const metadata: Metadata = { title: "Interest Requests | Merlion Admin" };

export default function InterestRequestsPage() {
    return (
        <div className="mx-auto w-full space-y-5">
            <header className="border-b border-[#dce5f1] pb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">Hiring</p>
                <h1 className="mt-2 font-serif text-3xl text-[#0a2149]">Interest Requests</h1>
                <p className="mt-2 text-sm text-[#71829c]">Review people who have introduced themselves for current or future Merlion opportunities.</p>
            </header>
            <InterestRequestsList />
        </div>
    );
}
