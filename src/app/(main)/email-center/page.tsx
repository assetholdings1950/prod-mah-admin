"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
    Archive,
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    CircleAlert,
    FileText,
    Inbox,
    Loader2,
    Mail,
    Maximize2,
    Minus,
    Paperclip,
    Plus,
    RefreshCw,
    Search,
    Send,
    Shrink,
    X,
} from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

type Attachment = {
    providerAttachmentId?: string;
    filename: string;
    contentType: string;
    size: number;
};

type EmailThread = {
    _id: string;
    subject: string;
    participants: string[];
    status: "open" | "closed";
    lastDirection: "outbound" | "inbound";
    lastSnippet: string;
    lastMessageAt: string;
    messageCount: number;
    lastSenderPrefix?: string;
};

type EmailMessage = {
    _id: string;
    direction: "outbound" | "inbound";
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    bodyText: string;
    bodyHtml?: string;
    attachments: Attachment[];
    status: string;
    lastError?: string;
    createdAt: string;
};

type Summary = {
    conversations: number;
    sent: number;
    delivered: number;
    failed: number;
    received: number;
};

type MailConfig = {
    sendingDomain: string;
    defaultPrefix: string;
    receivingEnabled: boolean;
};

const EMPTY_SUMMARY: Summary = { conversations: 0, sent: 0, delivered: 0, failed: 0, received: 0 };
const EMPTY_CONFIG: MailConfig = { sendingDomain: "send.merlionassetholdings.com", defaultPrefix: "onboarding", receivingEnabled: false };
const EmailHtmlBody = dynamic(() => import("./EmailHtmlBody"), { ssr: false });

type ComposeState = {
    fromName: string;
    fromPrefix: string;
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    bodyHtml: string;
};

const initialCompose = (prefix = "onboarding"): ComposeState => ({
    fromName: "Merlion Asset Holdings",
    fromPrefix: prefix,
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    bodyHtml: "",
});

/** Flatten editor HTML to a readable plain-text alternative for the email text part and thread snippets. */
function htmlToPlainText(html: string): string {
    if (!html) return "";
    if (typeof window === "undefined") return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("a").forEach((link) => {
        const href = link.getAttribute("href") || "";
        const text = link.textContent || "";
        if (href && href !== text) link.textContent = `${text} (${href})`;
    });
    doc.querySelectorAll("li").forEach((li) => li.prepend(doc.createTextNode("• ")));
    doc.querySelectorAll("p, div, h1, h2, h3, li, blockquote, br").forEach((el) => el.append(doc.createTextNode("\n")));
    return (doc.body.textContent || "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
}

function isHtmlBodyEmpty(html: string): boolean {
    if (!html) return true;
    if (typeof window === "undefined") return html.replace(/<[^>]+>/g, "").replace(/&nbsp;|\s|​/g, "").length === 0;
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/​/g, "").trim().length === 0;
}

function formatDate(value?: string) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-SG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function fileSize(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function latestReplyText(value = "") {
    const lines = value.replace(/\r\n/g, "\n").split("\n");
    const quoteStart = lines.findIndex((line) => {
        const trimmed = line.trim();
        return /^>/.test(trimmed)
            || /^-{2,}\s*original message\s*-{2,}$/i.test(trimmed)
            || /^on .+ wrote:\s*$/i.test(trimmed)
            || /^_{5,}$/.test(trimmed);
    });
    const latest = quoteStart >= 0 ? lines.slice(0, quoteStart) : lines;
    const automaticSignature = /^(sent with\s+(?:\[[^\]]+\]\([^)]*\)|\S+)(?:\s+secure email\.?)?|sent from my\s+(?:iphone|ipad|android)|get outlook for\s+(?:ios|android))$/i;
    while (latest.length && !latest[latest.length - 1].trim()) latest.pop();
    while (latest.length && automaticSignature.test(latest[latest.length - 1].trim())) {
        latest.pop();
        while (latest.length && !latest[latest.length - 1].trim()) latest.pop();
    }
    return latest.join("\n").trim() || value.trim();
}

function statusStyle(status: string) {
    if (["delivered", "opened", "clicked", "received"].includes(status)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (["failed", "bounced", "complained", "suppressed"].includes(status)) return "bg-red-50 text-red-700 border-red-200";
    if (status === "delivery_delayed") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
}

function StatCard({ label, value, hint, tone = "navy" }: { label: string; value: number; hint: string; tone?: "navy" | "blue" | "green" | "red" }) {
    const tones = {
        navy: "bg-[#081b3a] text-white",
        blue: "bg-blue-50 text-blue-700 border border-blue-100",
        green: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        red: "bg-rose-50 text-rose-700 border border-rose-100",
    };
    return <div className={`rounded-2xl p-4 ${tones[tone]}`}><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-60">{label}</p><div className="mt-2 flex items-end justify-between gap-3"><p className="text-2xl font-black">{value}</p><p className="text-[10px] opacity-60">{hint}</p></div></div>;
}

function AttachmentPicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
        <label className="flex cursor-pointer items-center justify-center gap-2 text-xs font-bold text-navy">
            <Paperclip className="h-4 w-4" /> Attach files or photos
            <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={(event) => onChange([...files, ...Array.from(event.target.files || [])])}
            />
        </label>
        {files.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{files.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600"><FileText className="h-3 w-3" />{file.name}<button type="button" onClick={() => onChange(files.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${file.name}`}><X className="h-3 w-3" /></button></span>)}</div>}
        <p className="mt-2 text-center text-[9px] text-slate-400">PDF, Office documents, text and images · 20 MB total</p>
    </div>;
}

export default function EmailCenterPage() {
    const [threads, setThreads] = useState<EmailThread[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const selectedIdRef = useRef("");
    const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
    const [messages, setMessages] = useState<EmailMessage[]>([]);
    const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
    const [config, setConfig] = useState<MailConfig>(EMPTY_CONFIG);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [threadLoading, setThreadLoading] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeView, setComposeView] = useState<"minimized" | "normal" | "maximized">("normal");
    const [compose, setCompose] = useState<ComposeState>(() => initialCompose(""));
    const [composeFiles, setComposeFiles] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const [replyHtml, setReplyHtml] = useState("");
    const [replyFiles, setReplyFiles] = useState<File[]>([]);
    const [replying, setReplying] = useState(false);
    const replyEmpty = isHtmlBodyEmpty(replyHtml);

    const loadThread = useCallback(async (id: string) => {
        if (!id) return;
        setThreadLoading(true);
        try {
            const response = await appClient.get(`/api/email-center/threads/${id}`);
            setSelectedThread(response.data.data.thread);
            setMessages(response.data.data.messages || []);
            selectedIdRef.current = id;
            setSelectedId(id);
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Could not load conversation.");
        } finally {
            setThreadLoading(false);
        }
    }, []);

    const loadThreads = useCallback(async (preferredId?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (search.trim()) params.set("search", search.trim());
            if (status) params.set("status", status);
            const response = await appClient.get(`/api/email-center?${params.toString()}`);
            const nextThreads: EmailThread[] = response.data.threads || [];
            setThreads(nextThreads);
            setSummary(response.data.summary || EMPTY_SUMMARY);
            setConfig(response.data.config || EMPTY_CONFIG);
            setCompose((current) => ({ ...current, fromPrefix: current.fromPrefix || response.data.config?.defaultPrefix || "onboarding" }));
            const nextId = preferredId || selectedIdRef.current || nextThreads[0]?._id;
            if (nextId && nextThreads.some((thread) => thread._id === nextId)) await loadThread(nextId);
            else if (!nextThreads.length) { selectedIdRef.current = ""; setSelectedId(""); setSelectedThread(null); setMessages([]); }
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Could not load email conversations.");
        } finally {
            setLoading(false);
        }
    }, [loadThread, search, status]);

    useEffect(() => {
        const timer = window.setTimeout(() => { void loadThreads(); }, 250);
        return () => window.clearTimeout(timer);
    }, [loadThreads]);

    const externalRecipients = useMemo(() => selectedThread?.participants.join(", ") || "", [selectedThread]);

    const submitCompose = async () => {
        setSending(true);
        try {
            const formData = new FormData();
            const { bodyHtml, ...rest } = compose;
            Object.entries(rest).forEach(([key, value]) => formData.append(key, value));
            formData.append("bodyHtml", bodyHtml);
            formData.append("body", htmlToPlainText(bodyHtml));
            composeFiles.forEach((file) => formData.append("attachments", file));
            const response = await appClient.post("/api/email-center", formData);
            const threadId = response.data.data.thread._id;
            toastSuccess("Email sent successfully.");
            setCompose(initialCompose(config.defaultPrefix || "onboarding"));
            setComposeFiles([]);
            setComposeOpen(false);
            setComposeView("normal");
            await loadThreads(threadId);
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Could not send email.");
        } finally {
            setSending(false);
        }
    };

    const submitReply = async () => {
        if (!selectedThread || replyEmpty) return;
        setReplying(true);
        try {
            const formData = new FormData();
            formData.append("fromName", "Merlion Asset Holdings");
            formData.append("fromPrefix", selectedThread.lastSenderPrefix || config.defaultPrefix);
            formData.append("to", externalRecipients);
            formData.append("subject", selectedThread.subject.toLowerCase().startsWith("re:") ? selectedThread.subject : `Re: ${selectedThread.subject}`);
            formData.append("bodyHtml", replyHtml);
            formData.append("body", htmlToPlainText(replyHtml));
            replyFiles.forEach((file) => formData.append("attachments", file));
            await appClient.post(`/api/email-center/threads/${selectedThread._id}/reply`, formData);
            setReplyHtml("");
            setReplyFiles([]);
            toastSuccess("Reply sent successfully.");
            await loadThreads(selectedThread._id);
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Could not send reply.");
        } finally {
            setReplying(false);
        }
    };

    const toggleThreadStatus = async () => {
        if (!selectedThread) return;
        const nextStatus = selectedThread.status === "open" ? "closed" : "open";
        try {
            await appClient.patch(`/api/email-center/threads/${selectedThread._id}`, { status: nextStatus });
            toastSuccess(`Conversation marked ${nextStatus}.`);
            await loadThreads(selectedThread._id);
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Could not update conversation.");
        }
    };

    const openAttachment = async (messageId: string, attachment: Attachment) => {
        if (!attachment.providerAttachmentId) {
            toastError("This attachment is not yet available for download.");
            return;
        }
        try {
            const response = await appClient.get(`/api/email-center/messages/${messageId}/attachments/${attachment.providerAttachmentId}`);
            window.open(response.data.data.download_url, "_blank", "noopener,noreferrer");
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Could not open attachment.");
        }
    };

    return <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400"><Mail className="h-3.5 w-3.5 text-blue-600" />Communications</div><h1 className="mt-1 text-2xl font-black text-navy">Email Center</h1><p className="mt-1 text-xs text-slate-500">Send individual messages, track delivery, and manage replies in one place.</p></div>
            <div className="flex gap-2"><button onClick={() => void loadThreads()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-navy hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" />Refresh</button><button onClick={() => { setComposeOpen(true); setComposeView("normal"); }} className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-5 text-xs font-bold text-white shadow-lg shadow-navy/10 hover:bg-[#102b54]"><Plus className="h-4 w-4" />Compose</button></div>
        </header>

        {!config.receivingEnabled && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-bold">Reply capture is not configured yet.</p><p className="mt-0.5 text-amber-700">Outgoing mail works, but inbound replies appear here only after EMAIL_RECEIVING_DOMAIN and the Resend receiving webhook are configured.</p></div></div>}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><StatCard label="Conversations" value={summary.conversations} hint="matching view" /><StatCard label="Sent" value={summary.sent} hint="accepted" tone="blue" /><StatCard label="Delivered" value={summary.delivered} hint="confirmed" tone="green" /><StatCard label="Replies" value={summary.received} hint="received" tone="blue" /><StatCard label="Issues" value={summary.failed} hint="failed / bounced" tone="red" /></section>

        <section className="grid min-h-[650px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-slate-50/50 lg:border-b-0 lg:border-r">
                <div className="space-y-3 border-b border-slate-200 p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipient or subject" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-500" /></div><div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-[10px] font-bold">{[["", "All"], ["open", "Open"], ["closed", "Closed"]].map(([value, label]) => <button key={label} onClick={() => setStatus(value)} className={`rounded-lg px-2 py-2 ${status === value ? "bg-white text-navy shadow-sm" : "text-slate-500"}`}>{label}</button>)}</div></div>
                <div className="max-h-[540px] overflow-y-auto p-2">{loading ? <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div> : threads.length === 0 ? <div className="px-6 py-14 text-center"><Inbox className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-xs font-bold text-slate-600">No conversations yet</p><p className="mt-1 text-[10px] text-slate-400">Compose the first email to begin.</p></div> : threads.map((thread) => <button key={thread._id} onClick={() => void loadThread(thread._id)} className={`mb-1 w-full rounded-2xl border p-3 text-left transition ${selectedId === thread._id ? "border-blue-200 bg-blue-50/80 shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-white"}`}><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${thread.lastDirection === "inbound" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{thread.lastDirection === "inbound" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-extrabold text-navy">{thread.subject}</span><span className="shrink-0 text-[8px] text-slate-400">{formatDate(thread.lastMessageAt)}</span></span><span className="mt-1 block truncate text-[10px] font-medium text-slate-500">{thread.participants.join(", ")}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{thread.lastSnippet}</span></span></div></button>)}</div>
            </aside>

            <div className="flex min-w-0 flex-col">{threadLoading ? <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div> : !selectedThread ? <div className="flex flex-1 flex-col items-center justify-center px-6 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100"><Mail className="h-6 w-6 text-slate-400" /></div><h2 className="mt-4 text-sm font-black text-navy">Select a conversation</h2><p className="mt-1 max-w-sm text-xs text-slate-400">Review previous messages or compose a new email.</p></div> : <>
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-base font-black text-navy">{selectedThread.subject}</h2><span className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase ${selectedThread.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{selectedThread.status}</span></div><p className="mt-1 truncate text-[10px] text-slate-500">{selectedThread.participants.join(", ")} · {selectedThread.messageCount} message{selectedThread.messageCount === 1 ? "" : "s"}</p></div><button onClick={toggleThreadStatus} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50"><Archive className="h-3.5 w-3.5" />{selectedThread.status === "open" ? "Close" : "Reopen"}</button></div>
                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/30 p-5">{messages.map((message) => <article key={message._id} className={`max-w-[82%] rounded-2xl border p-4 shadow-sm ${message.direction === "outbound" ? "ml-auto border-blue-100 bg-blue-50/70" : "mr-auto border-slate-200 bg-white"}`}><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2">{message.direction === "outbound" ? <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />}<p className="text-[10px] font-extrabold text-navy">{message.from}</p></div><span className={`rounded-md border px-2 py-0.5 text-[8px] font-bold uppercase ${statusStyle(message.status)}`}>{message.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-[10px] text-slate-400">To: {message.to.join(", ")} · {formatDate(message.createdAt)}</p><EmailHtmlBody bodyHtml={message.bodyHtml} fallbackText={message.direction === "inbound" ? latestReplyText(message.bodyText) : message.bodyText} inbound={message.direction === "inbound"} />{message.attachments?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{message.attachments.map((attachment, index) => <button key={`${attachment.filename}-${index}`} onClick={() => void openAttachment(message._id, attachment)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-bold text-navy hover:border-blue-300"><Paperclip className="h-3 w-3" /><span>{attachment.filename}</span><span className="font-normal text-slate-400">{fileSize(attachment.size)}</span></button>)}</div>}{message.lastError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[10px] text-red-700">{message.lastError}</p>}</article>)}</div>
                <div className="border-t border-slate-200 bg-white p-4">{selectedThread.status === "closed" ? <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-100 text-xs text-slate-400">Reopen this conversation to reply</div> : <RichTextEditor value={replyHtml} onChange={setReplyHtml} placeholder={`Reply to ${externalRecipients}`} minHeight="120px" />}{replyFiles.length > 0 && <div className="mt-2"><AttachmentPicker files={replyFiles} onChange={setReplyFiles} /></div>}<div className="mt-2 flex items-center justify-between"><label className="inline-flex cursor-pointer items-center gap-2 text-[10px] font-bold text-slate-500"><Paperclip className="h-3.5 w-3.5" />Add attachment<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={(event) => setReplyFiles([...replyFiles, ...Array.from(event.target.files || [])])} /></label><button onClick={submitReply} disabled={replying || replyEmpty || selectedThread.status === "closed"} className="inline-flex h-9 items-center gap-2 rounded-xl bg-navy px-4 text-[10px] font-bold text-white disabled:opacity-40">{replying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Send reply</button></div></div>
            </>}</div>
        </section>

        {composeOpen && (
            <div className={`fixed z-[200] ${composeView === "maximized" ? "inset-0 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" : "bottom-0 right-0 sm:right-6"}`}>
                <div
                    className={`flex flex-col bg-white shadow-2xl transition-all duration-200 ${
                        composeView === "maximized"
                            ? "h-full max-h-[92vh] w-full max-w-4xl rounded-3xl"
                            : composeView === "minimized"
                            ? "w-[320px] rounded-t-2xl"
                            : "h-[600px] max-h-[calc(100vh-24px)] w-[95vw] rounded-t-2xl sm:w-[540px]"
                    }`}
                >
                    <div className="flex items-center justify-between border-b border-slate-200 bg-navy px-4 py-3 text-white rounded-t-2xl">
                        <button
                            type="button"
                            onClick={() => setComposeView(composeView === "minimized" ? "normal" : "minimized")}
                            className="min-w-0 flex-1 text-left"
                        >
                            <p className="truncate text-xs font-bold">{compose.subject.trim() || "New message"}</p>
                        </button>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setComposeView(composeView === "minimized" ? "normal" : "minimized")}
                                aria-label="Minimize"
                                className="grid h-7 w-7 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setComposeView(composeView === "maximized" ? "normal" : "maximized")}
                                aria-label={composeView === "maximized" ? "Exit full screen" : "Full screen"}
                                className="grid h-7 w-7 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
                            >
                                {composeView === "maximized" ? <Shrink className="h-4 w-4" /> : <Maximize2 className="h-3.5 w-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => { if (!sending) { setComposeOpen(false); setComposeView("normal"); } }}
                                disabled={sending}
                                aria-label="Close"
                                className="grid h-7 w-7 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    {composeView !== "minimized" && (
                        <div className="flex-1 space-y-4 overflow-y-auto p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Display name</span><input value={compose.fromName} onChange={(event) => setCompose({ ...compose, fromName: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" /></label><label className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">From address</span><span className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500"><input value={compose.fromPrefix} onChange={(event) => setCompose({ ...compose, fromPrefix: event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") })} className="min-w-0 flex-1 px-3 text-right text-xs outline-none" /><span className="flex items-center bg-slate-50 px-3 text-xs font-bold text-slate-500">@{config.sendingDomain}</span></span></label></div><label className="block space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">To</span><input value={compose.to} onChange={(event) => setCompose({ ...compose, to: event.target.value })} placeholder="recipient@example.com (separate multiple addresses with commas)" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">CC</span><input value={compose.cc} onChange={(event) => setCompose({ ...compose, cc: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" /></label><label className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">BCC</span><input value={compose.bcc} onChange={(event) => setCompose({ ...compose, bcc: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" /></label></div><label className="block space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Subject</span><input value={compose.subject} onChange={(event) => setCompose({ ...compose, subject: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" /></label><div className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Message</span><RichTextEditor value={compose.bodyHtml} onChange={(bodyHtml) => setCompose((current) => ({ ...current, bodyHtml }))} placeholder="Write your message…" minHeight="220px" /></div><AttachmentPicker files={composeFiles} onChange={setComposeFiles} /><div className="flex items-center justify-between border-t border-slate-100 pt-4"><p className="flex items-center gap-2 text-[10px] text-slate-400"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />The sending domain is locked for security.</p><button onClick={submitCompose} disabled={sending || !compose.to.trim() || !compose.subject.trim() || isHtmlBodyEmpty(compose.bodyHtml)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-6 text-xs font-bold text-white shadow-lg disabled:opacity-40">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send email</button></div></div>
                    )}
                </div>
            </div>
        )}
    </div>;
}
