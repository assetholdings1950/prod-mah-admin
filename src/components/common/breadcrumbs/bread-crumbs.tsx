"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight, Home, Layers } from "lucide-react"

const BreadCrumbs = () => {
    const pathname = usePathname() || ""
    const segments = pathname
        .split("/")
        .filter((seg): seg is string => Boolean(seg))

    return (
        <div className="relative flex items-center h-8 w-full overflow-hidden">
            {/* Left border accent line mimicking the logo brand energy */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-primary to-secondary" />

            <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-2 pl-4 overflow-x-auto no-scrollbar scroll-smooth w-full select-none"
            >
                {/* --- ROOT HUB NODE (HOME) --- */}
                <Link
                    href="/dashboard"
                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-border/60 bg-muted/30 text-foreground/40 hover:text-navy hover:bg-muted hover:border-border transition-all duration-200 group shadow-sm flex-shrink-0"
                >
                    <Home className="h-3.5 w-3.5 transition-transform group-hover:scale-105" />
                </Link>

                {segments.length === 0 ? (
                    <>
                        <ChevronRight size={13} className="text-foreground/20 flex-shrink-0" />
                        <span className="text-xs font-bold text-foreground/80 bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40 tracking-wide">
                            Dashboard
                        </span>
                    </>
                ) : (
                    segments.map((crumb, idx) => {
                        const href = `/${segments.slice(0, idx + 1).join("/")}`
                        const isLast = idx === segments.length - 1
                        const formattedLabel = decodeURIComponent(crumb.replace(/-/g, " "))

                        return (
                            <React.Fragment key={idx}>
                                <ChevronRight size={13} className="text-foreground/20 flex-shrink-0" />

                                {isLast ? (
                                    /* --- ACTIVE CURRENT LEAF NODE --- */
                                    <motion.div
                                        initial={{ opacity: 0, x: -4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded-lg px-2.5 py-1 flex-shrink-0 shadow-sm shadow-primary/5"
                                    >
                                        {idx > 0 && <Layers className="h-3 w-3 text-navy/60" />}
                                        <span className="text-xs font-bold text-navy capitalize tracking-wide">
                                            {formattedLabel}
                                        </span>
                                    </motion.div>
                                ) : (
                                    /* --- ANCESTOR INTERMEDIATE LINKS --- */
                                    <Link
                                        href={href}
                                        className="text-xs font-semibold text-foreground/40 hover:text-foreground/80 capitalize transition-colors duration-150 py-1 px-1.5 rounded-md hover:bg-muted/50 tracking-wide flex-shrink-0"
                                    >
                                        {formattedLabel}
                                    </Link>
                                )}
                            </React.Fragment>
                        )
                    })
                )}
            </nav>

            {/* Gradient right edge fade mask protecting layouts on extremely deep routes */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
    )
}

export default BreadCrumbs