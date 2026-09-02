"use client";

import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import appClient from "@/lib/appClient";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IClients } from "@/interface/client";
import ClientTable from "@/components/Table/Table";
import Pagination from "@/components/pagination/pagination";
import ClientToolbar from "@/components/clients/ClientsToolbar";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";

const perPageOptions = [5, 10, 20, 50];

// ========================= MAIN PAGE =========================
const AllClientsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [clients, setClients] = useState<IClients[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filters — initialised from URL query params
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
    const [kycFilter, setKycFilter] = useState(searchParams.get("kycStatus") ?? "all");
    const [riskFilter, setRiskFilter] = useState(searchParams.get("riskProfile") ?? "all");
    const [countryFilter, setCountryFilter] = useState(searchParams.get("country") ?? "all");
    const [currencyFilter, setCurrencyFilter] = useState(searchParams.get("preferredCurrency") ?? "all");

    // Sync active filters → URL (omits "all" so the URL stays clean)
    useEffect(() => {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        if (kycFilter && kycFilter !== "all") params.set("kycStatus", kycFilter);
        if (riskFilter && riskFilter !== "all") params.set("riskProfile", riskFilter);
        if (countryFilter && countryFilter !== "all") params.set("country", countryFilter);
        if (currencyFilter && currencyFilter !== "all") params.set("preferredCurrency", currencyFilter);
        const qs = params.toString();
        router.replace(`/clients/all${qs ? `?${qs}` : ""}`, { scroll: false } as Parameters<typeof router.replace>[1]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, kycFilter, riskFilter, countryFilter, currencyFilter]);

    const handleGetClients = useCallback(async () => {
        setLoading(true);
        try {
            const response = await appClient.get("/api/clients/get", {
                params: {
                    page,
                    limit,
                    search,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    kycStatus: kycFilter !== "all" ? kycFilter : undefined,
                    riskProfile: riskFilter !== "all" ? riskFilter : undefined,
                    country: countryFilter !== "all" ? countryFilter : undefined,
                    preferredCurrency: currencyFilter !== "all" ? currencyFilter : undefined,
                },
            });
            if (response.data.status) {
                setClients(response.data.clients?.docs ?? response.data.clients ?? []);
                setTotalDocs(response.data.clients?.totalDocs ?? 0);
                setTotalPages(response.data.clients?.totalPages ?? 0);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, kycFilter, riskFilter, countryFilter, currencyFilter]);

    useEffect(() => {
        handleGetClients();
    }, [handleGetClients]);

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
        setRiskFilter("all");
        setCountryFilter("all");
        setCurrencyFilter("all");
        setSearchInput("");
        setPage(1);
    };

    const handleDelete = async (ids: string[]) => {
        try {
            console.log(ids)
            const res = await appClient.delete("/api/clients/delete", { data: { ids } });
            if (res.data?.status || res.status === 200) {
                toastSuccess(`${ids.length > 1 ? `${ids.length} clients` : "Client"} deleted successfully.`);
                handleGetClients();
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
        (riskFilter && riskFilter !== "all") ||
        (countryFilter && countryFilter !== "all") ||
        (currencyFilter && currencyFilter !== "all") ||
        searchInput;

    return (
        <div className="w-full h-full flex flex-col space-y-5 p-1 text-foreground">
            <WorksSpaceHeader
                isButtonVisible={false}
                subHeading="Manage All Clients At one place"
                heading="Client Management Console"
                buttonText=""
            />

            {/* Toolbar + Table + Pagination container */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                <ClientToolbar
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
                    riskFilter={riskFilter}
                    onRiskChange={(v) => {
                        setRiskFilter(v);
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
                    onRefresh={handleGetClients}
                    loading={loading}
                />

                <ClientTable
                    clients={clients}
                    loading={loading}
                    limit={limit}
                    search={search}
                    onEdit={(client) => {
                        router.push(`/clients/${client._id}/edit`);
                    }}
                    onDelete={handleDelete}
                    onMore={(client, action) => {
                        router.push(`/clients/${client._id}/edit?tab=${action}`);
                    }}
                    onAssignAccountManager={(client) => {
                        router.push(`/clients/${client._id}/edit?tab=account-manager`);
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
        </div>
    );
};

export default AllClientsPage;
