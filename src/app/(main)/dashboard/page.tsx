"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import {
    DollarSign,
    Gift,
    Clock,
    Calendar,
    Sparkles,
    Wallet,
    Users,
    CreditCard,
    UserCog,
    Activity,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    AlertCircle
} from "lucide-react"
import appClient from "@/lib/appClient"

// Interfaces for response data
interface SummaryMetric {
    total: number
    active: number
    loggedIn: number
}

interface FinancialSummary {
    totalCount: number
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    approvedVolume: number
    approvedVolumeByCurrency?: Record<string, number>
}

interface TransactionSummary {
    totalCount: number
    completedCount: number
    pendingCount: number
    failedCount: number
    agentCount: number
    clientCount: number
    agentVolume: number
    clientVolume: number
}

interface TrendPoint {
    label: string
    date?: string
    month?: string
    year?: string
    deposit: number
    withdrawal: number
    investment: number
    earning: number
}

interface DashboardData {
    agentsSummary: SummaryMetric
    clientsSummary: SummaryMetric
    investmentPlansSummary: {
        total: number
        active: number
        draft: number
        inactive: number
    }
    depositsSummary: FinancialSummary
    withdrawalsSummary: FinancialSummary
    transactionsSummary: TransactionSummary
    recentTransactions: any[]
    trends: {
        weekly: TrendPoint[]
        monthly: TrendPoint[]
        yearly: TrendPoint[]
    }
}

// Format helpers
const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(val)
}

const formatCompactCurrency = (val: number) => {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`
    return formatCurrency(val)
}

const currenciesList = ["USD", "USDT", "BTC", "ETH", "SOL", "TRX"] as const;
type KnownCurrency = typeof currenciesList[number];

const localCurrencyConfig: Record<KnownCurrency, { symbol: string; decimals: number }> = {
    USD: { symbol: "$", decimals: 2 },
    USDT: { symbol: "₮", decimals: 2 },
    BTC: { symbol: "₿", decimals: 6 },
    ETH: { symbol: "Ξ", decimals: 6 },
    SOL: { symbol: "◎", decimals: 2 },
    TRX: { symbol: "TRX ", decimals: 2 }
};

const formatCurrencyValue = (val: number | undefined, currency: KnownCurrency) => {
    const config = localCurrencyConfig[currency];
    const formattedVal = (val ?? 0).toLocaleString("en-US", {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals
    });
    return `${config.symbol}${formattedVal}`;
};

// Container staggered animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } },
}

const Dashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [trendType, setTrendType] = useState<"weekly" | "monthly" | "yearly">("monthly")
    const [activeTxTab, setActiveTxTab] = useState<"all" | "Client" | "Agent">("all")
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [visibleLines, setVisibleLines] = useState({
        deposit: true,
        withdrawal: true,
        investment: true,
        earning: false
    })

    // Fetch dashboard data from proxy route
    const fetchDashboardData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await appClient.get("/api/dashboard/summary")
            if (res.data && res.data.status) {
                setData(res.data.data)
            } else {
                setError(res.data.message || "Failed to load dashboard statistics.")
            }
        } catch (err: any) {
            console.error("Dashboard fetch error: ", err)
            setError(err.message || "An error occurred while loading dashboard statistics.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const currentHour = new Date().getHours()
    const greetingText = currentHour < 12 ? "Good Morning!" : currentHour < 18 ? "Good Afternoon!" : "Good Evening!"

    if (loading) {
        return (
            <div className="w-full space-y-8 p-1">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/50 pb-6">
                    <div className="space-y-2">
                        <div className="h-4 w-40 bg-muted/60 rounded animate-pulse" />
                        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-96 bg-muted/40 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-32 bg-muted/60 rounded-xl animate-pulse" />
                </div>

                {/* Cards Skeleton Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                    {[1, 2, 3, 4, 5].map((idx) => (
                        <div key={idx} className="h-32 bg-card border border-border/60 rounded-2xl p-5 space-y-4 animate-pulse">
                            <div className="flex justify-between items-center">
                                <div className="h-3 w-20 bg-muted rounded" />
                                <div className="h-8 w-8 bg-muted rounded-lg" />
                            </div>
                            <div className="h-6 w-28 bg-muted rounded" />
                            <div className="h-3 w-full bg-muted/50 rounded" />
                        </div>
                    ))}
                </div>

                {/* Main Graph & Sidebar Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[380px] bg-card border border-border/60 rounded-2xl p-6 space-y-4 animate-pulse">
                        <div className="flex justify-between">
                            <div className="h-5 w-40 bg-muted rounded" />
                            <div className="h-8 w-32 bg-muted rounded" />
                        </div>
                        <div className="h-full w-full bg-muted/30 rounded-xl" />
                    </div>
                    <div className="h-[380px] bg-card border border-border/60 rounded-2xl p-6 space-y-4 animate-pulse">
                        <div className="h-5 w-48 bg-muted rounded" />
                        <div className="space-y-3 pt-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex justify-between">
                                    <div className="h-4 w-24 bg-muted rounded" />
                                    <div className="h-4 w-12 bg-muted rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[400px] border border-dashed border-border/80 rounded-3xl bg-card/30 p-10 space-y-4">
                <AlertCircle className="h-12 w-12 text-rose-500" />
                <h3 className="text-lg font-bold text-foreground">Dashboard Loading Failed</h3>
                <p className="text-sm text-foreground/60 text-center max-w-md">
                    {error || "Could not load statistics from the backend server. Please make sure the backend is running."}
                </p>
                <button
                    onClick={fetchDashboardData}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 shadow-sm transition-all"
                >
                    <RefreshCw className="h-4 w-4" />
                    Retry Loading
                </button>
            </div>
        )
    }

    const {
        agentsSummary,
        clientsSummary,
        investmentPlansSummary,
        depositsSummary,
        withdrawalsSummary,
        transactionsSummary,
        recentTransactions,
        trends
    } = data

    // Dynamic metrics configurations based on backend aggregates
    const metricsConfig = [
        {
            title: "Agent Network",
            value: `${agentsSummary.total}`,
            detail: `${agentsSummary.active} active`,
            icon: UserCog,
            colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100/60 dark:bg-indigo-500/10 dark:border-indigo-500/20",
        },
        {
            title: "Client Network",
            value: `${clientsSummary.total}`,
            detail: `${clientsSummary.active} active`,
            icon: Users,
            colorClass: "text-blue-600 bg-blue-50 border-blue-100/60 dark:bg-blue-500/10 dark:border-blue-500/20",
        },
        {
            title: "Investment Plans",
            value: `${investmentPlansSummary.active}`,
            detail: `${investmentPlansSummary.draft} draft • ${investmentPlansSummary.inactive} inactive`,
            icon: Gift,
            colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100/60 dark:bg-emerald-500/10 dark:border-emerald-500/20",
        },
        {
            title: "Deposits summary",
            value: formatCompactCurrency(depositsSummary.approvedVolume),
            detail: `${depositsSummary.pendingCount} pending approvals`,
            icon: DollarSign,
            colorClass: "text-violet-600 bg-violet-50 border-violet-100/60 dark:bg-violet-500/10 dark:border-violet-500/20",
            highlightDetail: depositsSummary.pendingCount > 0,
        },
        {
            title: "Withdrawals summary",
            value: formatCompactCurrency(withdrawalsSummary.approvedVolume),
            detail: `${withdrawalsSummary.pendingCount} pending requests`,
            icon: CreditCard,
            colorClass: "text-amber-600 bg-amber-50 border-amber-100/60 dark:bg-amber-500/10 dark:border-amber-500/20",
            highlightDetail: withdrawalsSummary.pendingCount > 0,
        },
    ]

    // Fetch the trend details active tab
    const trendData = trends[trendType] || []

    // Map dimensions for Custom SVG chart
    const svgWidth = 800
    const svgHeight = 280
    const padLeft = 60
    const padRight = 20
    const padTop = 20
    const padBottom = 40

    const chartWidth = svgWidth - padLeft - padRight
    const chartHeight = svgHeight - padTop - padBottom

    // Find local max value across selected active line arrays
    const allValues: number[] = []
    trendData.forEach(p => {
        if (visibleLines.deposit) allValues.push(p.deposit)
        if (visibleLines.withdrawal) allValues.push(p.withdrawal)
        if (visibleLines.investment) allValues.push(p.investment)
        if (visibleLines.earning) allValues.push(p.earning)
    })
    const maxVal = Math.max(...allValues, 100)

    // SVG coordinates calculators
    const getX = (idx: number) => {
        if (trendData.length <= 1) return padLeft + chartWidth / 2
        return padLeft + (idx / (trendData.length - 1)) * chartWidth
    }

    const getY = (val: number) => {
        return padTop + chartHeight - (val / maxVal) * chartHeight
    }

    // Build SVG Path generator
    const getPathData = (key: "deposit" | "withdrawal" | "investment" | "earning") => {
        if (trendData.length === 0) return ""
        let d = `M ${getX(0)} ${getY(trendData[0][key])}`
        for (let i = 1; i < trendData.length; i++) {
            d += ` L ${getX(i)} ${getY(trendData[i][key])}`
        }
        return d
    }

    // Generate Area fill SVG path
    const getAreaPathData = (key: "deposit" | "withdrawal" | "investment" | "earning") => {
        if (trendData.length === 0) return ""
        const path = getPathData(key)
        const firstX = getX(0)
        const lastX = getX(trendData.length - 1)
        const zeroY = getY(0)
        return `${path} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`
    }

    // Mouse movement inside SVG triggers tooltips
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const xPct = (x - padLeft) / chartWidth
        const index = Math.round(xPct * (trendData.length - 1))
        if (index >= 0 && index < trendData.length) {
            setHoveredIndex(index)
        } else {
            setHoveredIndex(null)
        }
    }

    // Filter recent transactions
    const filteredRecentTransactions = recentTransactions.filter(tx => {
        if (activeTxTab === "all") return true
        return tx.userModel === activeTxTab
    })

    return (
        <div className="w-full space-y-8 p-1">
            {/* ─── PREMIUM HEADER SECTION ─── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/50 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-5 w-5 rounded-md bg-primary/10 text-primary">
                            <Sparkles className="h-3 w-3 fill-primary" />
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-foreground/40">
                            Merlion Operations Control Center
                        </span>
                    </div>
                    <h1 className="text-primary text-2xl md:text-3xl font-extrabold tracking-tight leading-none mt-1.5">
                        {greetingText}{" "}
                        <span className="text-foreground/90 font-medium">
                            Merlion Asset Holdings
                        </span>
                    </h1>
                    <p className="text-xs text-foreground/50 mt-1 font-medium">
                        Live updates of system operations, networks, client portfolios, and investment liquidities.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                    <button
                        onClick={fetchDashboardData}
                        className="flex h-9 w-9 items-center justify-center bg-card border border-border/80 rounded-xl hover:border-primary/20 shadow-sm text-foreground/60 hover:text-foreground transition-all duration-200"
                        title="Reload statistics"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2 bg-card border border-border/80 rounded-xl px-3.5 py-2 shadow-sm">
                        <Calendar className="h-3.5 w-3.5 text-foreground/45" />
                        <span className="text-xs font-semibold text-foreground/70">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-1.5" />
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Live</span>
                    </div>
                </div>
            </div>

            {/* ─── DYNAMIC STATISTICS GRID ─── */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5"
            >
                {metricsConfig.map((metric, idx) => {
                    const IconComponent = metric.icon
                    return (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            whileHover={{ y: -3, transition: { duration: 0.15 } }}
                            className="relative overflow-hidden bg-card border border-border/70 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(11,46,132,0.02)] hover:shadow-[0_8px_24px_-6px_rgba(11,46,132,0.06)] hover:border-primary/20 transition-all duration-200 group"
                        >
                            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold text-foreground/40 tracking-wider uppercase">
                                        {metric.title}
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                                        {metric.value}
                                    </h3>
                                </div>
                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${metric.colorClass} shadow-sm transition-transform group-hover:scale-105`}>
                                    <IconComponent className="h-4.5 w-4.5" />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-3">
                                <span className={`text-[10px] font-medium ${metric.highlightDetail
                                    ? "text-amber-600 dark:text-amber-500 font-bold"
                                    : "text-foreground/45"
                                    }`}>
                                    {metric.detail}
                                </span>
                            </div>
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* ─── PRIMARY CHARTS & PERFORMANCE TRENDS ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card border border-border/70 rounded-2xl p-6 shadow-[0_4px_16px_-4px_rgba(11,46,132,0.02)] flex flex-col justify-between space-y-4">
                    {/* Chart Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                                <Activity className="h-4.5 w-4.5 text-primary" />
                                Transaction Performance
                            </h3>
                            <p className="text-[11px] text-foreground/50">
                                Monitor deposit inflows, withdrawal outflows, and investment allocations.
                            </p>
                        </div>

                        {/* Chart Type Selector */}
                        <div className="flex bg-muted/65 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
                            {(["weekly", "monthly", "yearly"] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => { setTrendType(type); setHoveredIndex(null); }}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${trendType === type
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-foreground/50 hover:text-foreground/80"
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart Series Toggles */}
                    <div className="flex flex-wrap gap-3 py-1 border-b border-border/30">
                        {Object.keys(visibleLines).map((lineKey) => {
                            const isVisible = visibleLines[lineKey as keyof typeof visibleLines]
                            const colorMap = {
                                deposit: "border-indigo-400 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
                                withdrawal: "border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                                investment: "border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                                earning: "border-pink-400 bg-pink-500/10 text-pink-700 dark:text-pink-400"
                            }
                            return (
                                <button
                                    key={lineKey}
                                    onClick={() => setVisibleLines(prev => ({
                                        ...prev,
                                        [lineKey]: !isVisible
                                    }))}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold border rounded-lg transition-all ${isVisible
                                        ? colorMap[lineKey as keyof typeof colorMap]
                                        : "border-border/60 text-foreground/35 hover:text-foreground/60 bg-transparent"
                                        }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${lineKey === "deposit" ? "bg-indigo-500" :
                                        lineKey === "withdrawal" ? "bg-amber-500" :
                                            lineKey === "investment" ? "bg-emerald-500" : "bg-pink-500"
                                        }`} />
                                    <span className="capitalize">{lineKey}s</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Custom SVG Drawing Area */}
                    <div className="relative flex-1 min-h-[280px]">
                        <svg
                            className="w-full h-full"
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <defs>
                                <linearGradient id="grad-deposit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="grad-withdrawal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="grad-investment" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="grad-earning" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>

                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                                const y = padTop + chartHeight * r
                                const valLabel = maxVal * (1 - r)
                                return (
                                    <g key={i}>
                                        <line
                                            x1={padLeft}
                                            y1={y}
                                            x2={svgWidth - padRight}
                                            y2={y}
                                            stroke="hsl(var(--border) / 0.4)"
                                            strokeDasharray="4"
                                        />
                                        <text
                                            x={padLeft - 10}
                                            y={y + 4}
                                            textAnchor="end"
                                            className="text-[10px] fill-foreground/35 font-bold"
                                        >
                                            {formatCompactCurrency(valLabel)}
                                        </text>
                                    </g>
                                )
                            })}

                            {/* X Axis Labels */}
                            {trendData.map((pt, idx) => {
                                const x = getX(idx)
                                return (
                                    <text
                                        key={idx}
                                        x={x}
                                        y={svgHeight - 15}
                                        textAnchor="middle"
                                        className="text-[9px] fill-foreground/45 font-semibold"
                                    >
                                        {pt.label}
                                    </text>
                                )
                            })}

                            {/* Lines and area fills */}
                            {visibleLines.deposit && (
                                <>
                                    <path d={getAreaPathData("deposit")} fill="url(#grad-deposit)" />
                                    <path d={getPathData("deposit")} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
                                </>
                            )}
                            {visibleLines.withdrawal && (
                                <>
                                    <path d={getAreaPathData("withdrawal")} fill="url(#grad-withdrawal)" />
                                    <path d={getPathData("withdrawal")} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                                </>
                            )}
                            {visibleLines.investment && (
                                <>
                                    <path d={getAreaPathData("investment")} fill="url(#grad-investment)" />
                                    <path d={getPathData("investment")} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                                </>
                            )}
                            {visibleLines.earning && (
                                <>
                                    <path d={getAreaPathData("earning")} fill="url(#grad-earning)" />
                                    <path d={getPathData("earning")} fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
                                </>
                            )}

                            {/* Hover Vertical Guide */}
                            {hoveredIndex !== null && (
                                <line
                                    x1={getX(hoveredIndex)}
                                    y1={padTop}
                                    x2={getX(hoveredIndex)}
                                    y2={padTop + chartHeight}
                                    stroke="currentColor"
                                    className="text-foreground/15 dark:text-foreground/10"
                                    strokeWidth="1.5"
                                />
                            )}

                            {/* Hover Dots */}
                            {hoveredIndex !== null && (
                                <>
                                    {visibleLines.deposit && (
                                        <circle cx={getX(hoveredIndex)} cy={getY(trendData[hoveredIndex].deposit)} r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                                    )}
                                    {visibleLines.withdrawal && (
                                        <circle cx={getX(hoveredIndex)} cy={getY(trendData[hoveredIndex].withdrawal)} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                                    )}
                                    {visibleLines.investment && (
                                        <circle cx={getX(hoveredIndex)} cy={getY(trendData[hoveredIndex].investment)} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                                    )}
                                    {visibleLines.earning && (
                                        <circle cx={getX(hoveredIndex)} cy={getY(trendData[hoveredIndex].earning)} r="4.5" fill="#ec4899" stroke="#ffffff" strokeWidth="1.5" />
                                    )}
                                </>
                            )}
                        </svg>

                        {/* Chart Glass Tooltip */}
                        <AnimatePresence>
                            {hoveredIndex !== null && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute top-2 left-[70px] bg-card/90 backdrop-blur border border-border/80 rounded-xl p-3 shadow-lg text-[10px] space-y-1.5 min-w-[140px] pointer-events-none"
                                >
                                    <p className="font-extrabold text-foreground/80 border-b border-border/30 pb-1 flex justify-between">
                                        <span>Time Period:</span>
                                        <span className="text-primary">{trendData[hoveredIndex].label}</span>
                                    </p>
                                    <div className="space-y-1 pt-0.5 font-medium">
                                        {visibleLines.deposit && (
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-foreground/50 flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                    Deposits:
                                                </span>
                                                <span className="font-bold text-foreground">{formatCurrency(trendData[hoveredIndex].deposit)}</span>
                                            </div>
                                        )}
                                        {visibleLines.withdrawal && (
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-foreground/50 flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    Withdrawals:
                                                </span>
                                                <span className="font-bold text-foreground">{formatCurrency(trendData[hoveredIndex].withdrawal)}</span>
                                            </div>
                                        )}
                                        {visibleLines.investment && (
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-foreground/50 flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Investments:
                                                </span>
                                                <span className="font-bold text-foreground">{formatCurrency(trendData[hoveredIndex].investment)}</span>
                                            </div>
                                        )}
                                        {visibleLines.earning && (
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-foreground/50 flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                                                    Earnings:
                                                </span>
                                                <span className="font-bold text-foreground">{formatCurrency(trendData[hoveredIndex].earning)}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ─── SIDE PANEL: LIQUIDITY DISTRIBUTION ─── */}
                <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-[0_4px_16px_-4px_rgba(11,46,132,0.02)] flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                            <Wallet className="h-4.5 w-4.5 text-primary" />
                            Merlion Holdings Liquidity
                        </h3>
                        <p className="text-[11px] text-foreground/50">
                            Asset distributions and ledger weights between Clients & Agents.
                        </p>
                    </div>

                    <div className="space-y-5 py-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-foreground/70">Client Portfolio volume</span>
                                <span className="text-foreground">{formatCurrency(transactionsSummary.clientVolume)}</span>
                            </div>
                            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full rounded-full transition-all"
                                    style={{
                                        width: `${(transactionsSummary.clientVolume /
                                            Math.max(transactionsSummary.clientVolume + transactionsSummary.agentVolume, 1)) * 100
                                            }%`
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-foreground/45 flex justify-between">
                                <span>{transactionsSummary.clientCount} completed client transactions</span>
                                <span>
                                    {Math.round(
                                        (transactionsSummary.clientVolume /
                                            Math.max(transactionsSummary.clientVolume + transactionsSummary.agentVolume, 1)) * 100
                                    )}% weight
                                </span>
                            </p>
                        </div>

                        {/* Agents Asset weight */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-foreground/70">Agent Portfolio volume</span>
                                <span className="text-foreground">{formatCurrency(transactionsSummary.agentVolume)}</span>
                            </div>
                            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-amber-500 h-full rounded-full transition-all"
                                    style={{
                                        width: `${(transactionsSummary.agentVolume /
                                            Math.max(transactionsSummary.clientVolume + transactionsSummary.agentVolume, 1)) * 100
                                            }%`
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-foreground/45 flex justify-between">
                                <span>{transactionsSummary.agentCount} completed agent transactions</span>
                                <span>
                                    {Math.round(
                                        (transactionsSummary.agentVolume /
                                            Math.max(transactionsSummary.clientVolume + transactionsSummary.agentVolume, 1)) * 100
                                    )}% weight
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-muted/40 border border-border/40 rounded-xl p-4 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Holdings Summary</p>
                        <div className="grid grid-cols-2 gap-3 text-xs border-b border-border/20 pb-2.5">
                            <div>
                                <p className="text-[10px] text-foreground/45">Total Deposits</p>
                                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(depositsSummary.approvedVolume)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-foreground/45">Total Withdrawals</p>
                                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(withdrawalsSummary.approvedVolume)}</p>
                            </div>
                        </div>

                        {/* Currency-wise Breakdown */}
                        <div className="space-y-2 pt-0.5">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/45">Currency Breakdown</p>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                {currenciesList.map((curr) => {
                                    const depVal = depositsSummary.approvedVolumeByCurrency?.[curr] ?? 0;
                                    const withVal = withdrawalsSummary.approvedVolumeByCurrency?.[curr] ?? 0;
                                    return (
                                        <div key={curr} className="flex justify-between items-center text-[10px] font-medium border-b border-border/10 pb-1 last:border-0 last:pb-0">
                                            <span className="font-bold text-foreground/70 w-12">{curr}</span>
                                            <div className="flex flex-1 justify-between gap-2 pl-4">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                                    +{formatCurrencyValue(depVal, curr)}
                                                </span>
                                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                    -{formatCurrencyValue(withVal, curr)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── RECENT TRANSACTION ACTIVITY TABLE ─── */}
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-[0_4px_16px_-4px_rgba(11,46,132,0.02)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                            <Clock className="h-4.5 w-4.5 text-primary" />
                            Recent Transaction Activity
                        </h3>
                        <p className="text-[11px] text-foreground/50">
                            Review the latest financial logs submitted across the system.
                        </p>
                    </div>

                    {/* Network Filter tabs */}
                    <div className="flex bg-muted/65 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
                        {([
                            { id: "all", name: "All Networks" },
                            { id: "Client", name: "Clients" },
                            { id: "Agent", name: "Agents" }
                        ] as const).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTxTab(tab.id)}
                                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTxTab === tab.id
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-foreground/50 hover:text-foreground/80"
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto w-full border border-border/50 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border/60 text-foreground/45 uppercase tracking-wider text-[9px] font-bold">
                                <th className="p-3.5 pl-4">Timestamp</th>
                                <th className="p-3.5">User Details</th>
                                <th className="p-3.5">Network</th>
                                <th className="p-3.5">Type</th>
                                <th className="p-3.5">Amount</th>
                                <th className="p-3.5 pr-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30 font-medium">
                            {filteredRecentTransactions.length > 0 ? (
                                filteredRecentTransactions.map((tx) => {
                                    const typeColors = {
                                        deposit: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200/50",
                                        withdrawal: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50",
                                        investment: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50",
                                        earning: "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400 border-pink-200/50"
                                    }
                                    const statusColors = {
                                        completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                                        pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 animate-pulse",
                                        failed: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                    }
                                    return (
                                        <tr key={tx._id} className="hover:bg-muted/10 transition-colors">
                                            <td className="p-3.5 pl-4 text-foreground/50">
                                                {new Date(tx.createdAt).toLocaleString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </td>
                                            <td className="p-3.5 text-foreground/80">
                                                <div>
                                                    {tx.userId?.fullName ? (
                                                        <>
                                                            <p className="font-bold text-foreground">{tx.userId.fullName}</p>
                                                            <p className="text-[10px] text-foreground/40">{tx.userId.email || ""}</p>
                                                        </>
                                                    ) : (
                                                        <p className="font-bold text-foreground">{tx.userId?.email || "Unknown User"}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`text-[10px] font-bold ${tx.userModel === "Agent" ? "text-amber-600" : "text-indigo-600"
                                                    }`}>
                                                    {tx.userModel}
                                                </span>
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border ${typeColors[tx.type as keyof typeof typeColors] || "border-border"
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-bold text-foreground">
                                                <span className="flex items-center gap-1">
                                                    {tx.type === "deposit" || tx.type === "earning" ? (
                                                        <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                                                    ) : (
                                                        <ArrowDown className="h-3.5 w-3.5 text-amber-500" />
                                                    )}
                                                    {formatCurrency(tx.amount)}
                                                </span>
                                            </td>
                                            <td className="p-3.5 pr-4">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${statusColors[tx.status as keyof typeof statusColors] || "bg-muted"
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-foreground/40 font-semibold">
                                        No recent transactions found matching the selected network.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
