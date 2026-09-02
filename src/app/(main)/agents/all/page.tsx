"use client";

import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import appClient from "@/lib/appClient";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IAgents } from "@/interface/agent";
import AgentsTable from "@/components/agents/AgentsTable";
import Pagination from "@/components/pagination/pagination";
import AgentsToolbar from "@/components/agents/AgentsToolbar";
import CreateAgentModal from "@/components/agents/CreateAgentModal";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";

const perPageOptions = [5, 10, 20, 50];

// ========================= MAIN PAGE =========================
const AllAgentsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [agents, setAgents] = useState<IAgents[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [createAgentOpen, setCreateAgentOpen] = useState(false);

    // Filters — initialised from URL query params
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
    const [kycFilter, setKycFilter] = useState(searchParams.get("kycStatus") ?? "all");
    const [levelFilter, setLevelFilter] = useState(searchParams.get("agentLevel") ?? "all");
    const [countryFilter, setCountryFilter] = useState(searchParams.get("country") ?? "all");
    const [currencyFilter, setCurrencyFilter] = useState(searchParams.get("preferredCurrency") ?? "all");

    // Sync active filters → URL (omits "all" so the URL stays clean)
    useEffect(() => {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        if (kycFilter && kycFilter !== "all") params.set("kycStatus", kycFilter);
        if (levelFilter && levelFilter !== "all") params.set("agentLevel", levelFilter);
        if (countryFilter && countryFilter !== "all") params.set("country", countryFilter);
        if (currencyFilter && currencyFilter !== "all") params.set("preferredCurrency", currencyFilter);
        const qs = params.toString();
        router.replace(`/agents/all${qs ? `?${qs}` : ""}`, { scroll: false } as Parameters<typeof router.replace>[1]);
    }, [statusFilter, kycFilter, levelFilter, countryFilter, currencyFilter, router]);

    const handleGetAgents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await appClient.get("/api/agents/get", {
                params: {
                    page,
                    limit,
                    search,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    kycStatus: kycFilter !== "all" ? kycFilter : undefined,
                    agentLevel: levelFilter !== "all" ? levelFilter : undefined,
                    country: countryFilter !== "all" ? countryFilter : undefined,
                    preferredCurrency: currencyFilter !== "all" ? currencyFilter : undefined,
                },
            });
            if (response.data.status) {
                setAgents(response.data.agents?.docs ?? response.data.agents ?? []);
                setTotalDocs(response.data.agents?.totalDocs ?? 0);
                setTotalPages(response.data.agents?.totalPages ?? 0);
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
            toastError("Failed to fetch agents list.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, kycFilter, levelFilter, countryFilter, currencyFilter]);

    useEffect(() => {
        handleGetAgents();
    }, [handleGetAgents]);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const clearFilters = () => {
        setStatusFilter("all");
        setKycFilter("all");
        setLevelFilter("all");
        setCountryFilter("all");
        setCurrencyFilter("all");
        setSearchInput("");
        setPage(1);
    };

    const handleDelete = async (ids: string[]) => {
        try {
            const res = await appClient.delete("/api/agents/delete", { data: { ids } });
            if (res.data?.status || res.status === 200) {
                toastSuccess(`${ids.length > 1 ? `${ids.length} agents` : "Agent"} deleted successfully.`);
                handleGetAgents();
            } else {
                toastError(res.data?.message ?? "Delete failed.");
            }
        } catch {
            toastError("Something went wrong while deleting.");
        }
    };

    const hasFilters =
        (statusFilter && statusFilter !== "all") ||
        (kycFilter && kycFilter !== "all") ||
        (levelFilter && levelFilter !== "all") ||
        (countryFilter && countryFilter !== "all") ||
        (currencyFilter && currencyFilter !== "all") ||
        searchInput;

    return (
        <div className="w-full h-full flex flex-col space-y-5 p-1 text-foreground">
            <WorksSpaceHeader
                isButtonVisible
                handleOpenCreate={() => setCreateAgentOpen(true)}
                subHeading="Manage All Registered Partners At One Place"
                heading="Agent Management Console"
                buttonText="Create Agent"
            />

            {/* Toolbar + Table + Pagination container */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                <AgentsToolbar
                    searchInput={searchInput}
                    onSearchChange={setSearchInput}
                    statusFilter={statusFilter}
                    onStatusChange={(v) => {
                        setStatusFilter(v);
                        setPage(1);
                    }}
                    kycFilter={kycFilter}
                    onKycChange={(v) => {
                        setKycFilter(v);
                        setPage(1);
                    }}
                    levelFilter={levelFilter}
                    onLevelChange={(v) => {
                        setLevelFilter(v);
                        setPage(1);
                    }}
                    countryFilter={countryFilter}
                    onCountryChange={(v) => {
                        setCountryFilter(v);
                        setPage(1);
                    }}
                    currencyFilter={currencyFilter}
                    onCurrencyChange={(v) => {
                        setCurrencyFilter(v);
                        setPage(1);
                    }}
                    hasFilters={!!hasFilters}
                    onClearFilters={clearFilters}
                    onRefresh={handleGetAgents}
                    loading={loading}
                />

                <AgentsTable
                    agents={agents}
                    loading={loading}
                    limit={limit}
                    search={search}
                    onEdit={(agent) => {
                        router.push(`/agents/${agent._id}/edit`);
                    }}
                    onDelete={handleDelete}
                    onReviewKyc={(agent) => {
                        router.push(`/agents/${agent._id}/edit?tab=kyc`);
                    }}
                />

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    limit={limit}
                    totalDocs={totalDocs}
                    perPageOptions={perPageOptions}
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => {
                        setLimit(newLimit);
                        setPage(1);
                    }}
                />
            </div>

            {createAgentOpen && (
                <CreateAgentModal
                    onClose={() => setCreateAgentOpen(false)}
                    onCreated={() => {
                        setPage(1);
                        handleGetAgents();
                    }}
                />
            )}
        </div>
    );
};

export default AllAgentsPage;
