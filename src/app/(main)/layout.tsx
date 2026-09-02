"use client";

import BreadCrumbs from "@/components/common/breadcrumbs/bread-crumbs";
import AdminSidebar from "@/components/common/sidebar";

// import BreadCrumbs from "@/components/common/breadcrumbs/bread-crumbs";


export default function SidebarLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (

        <div className="flex h-screen overflow-hidden">
            {/* Sidebar: fixed height, scrollable if needed */}
            <div className="h-full">
                <AdminSidebar />
            </div>

            {/* Main content: scrollable independently */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a]">
                {/* Sticky breadcrumbs with subtle bottom border */}
                {
                    <header className="sticky top-0 z-10 bg-background">
                        <div className="px-4 pt-2 pb-2">
                            <BreadCrumbs />
                        </div>
                    </header>
                }

                {/* Scrollable content area */}
                <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-background/95 p-3">
                    {children}
                </main>
            </div>
        </div>

    );
}
