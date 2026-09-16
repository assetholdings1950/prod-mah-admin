"use client";

import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Search,
  Loader2,
  RefreshCw,
  ChevronLeft,
  Check,
  CheckCheck,
  User,
  ShieldCheck,
  Clock,
  UserCheck,
  Lock,
  Eye,
  ArrowRight,
  Headset,
} from "lucide-react";
import appClient from "@/lib/appClient";

type ClientInfo = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  clientId?: string;
  profileImage?: string;
};

type AgentInfo = {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  agentId?: string;
  agentLevel?: string;
  profileImage?: string;
};

type ClientAgentThread = {
  threadId: string;
  client: ClientInfo;
  agent: AgentInfo;
  lastMessage?: string;
  lastSender?: "client" | "agent";
  lastMessageAt?: string | null;
  totalMessages?: number;
  unreadForAgent?: number;
  unreadForClient?: number;
};

type ClientChatMessage = {
  _id: string;
  client: string;
  agent: string;
  sender: "client" | "agent";
  senderName?: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function AdminClientConversationsContent() {
  const searchParams = useSearchParams();
  const paramSearch = searchParams.get("search") || searchParams.get("agentId") || searchParams.get("clientId") || "";

  const [threads, setThreads] = useState<ClientAgentThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [searchQuery, setSearchQuery] = useState(paramSearch);
  const [selectedThread, setSelectedThread] = useState<ClientAgentThread | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const [messages, setMessages] = useState<ClientChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch all Client-Agent threads directory
  const loadThreads = useCallback(async () => {
    try {
      const res = await appClient.get("/api/chat/client/admin/threads");
      if (res && res.data && res.data.status && Array.isArray(res.data.data)) {
        const list: ClientAgentThread[] = res.data.data;
        setThreads(list);

        // Preselect initial thread matching paramSearch or maintain selection
        setSelectedThread((prev) => {
          if (paramSearch) {
            const q = paramSearch.toLowerCase();
            const matched = list.find((t) => {
              const cId = (t.client?.clientId || "").toLowerCase();
              const cEmail = (t.client?.email || "").toLowerCase();
              const aId = (t.agent?.agentId || "").toLowerCase();
              const aEmail = (t.agent?.email || "").toLowerCase();
              return cId.includes(q) || cEmail.includes(q) || aId.includes(q) || aEmail.includes(q);
            });
            if (matched) return matched;
          }

          if (!prev && list.length > 0) return list[0];
          if (prev) {
            const matched = list.find((t) => t.threadId === prev.threadId);
            return matched || prev;
          }
          return null;
        });
      }
    } catch (err) {
      console.error("Failed to load client-agent threads directory:", err);
    } finally {
      setLoadingThreads(false);
    }
  }, [paramSearch]);

  useEffect(() => {
    loadThreads();
    // Real-time polling directory every 5s
    const interval = setInterval(loadThreads, 5000);
    return () => clearInterval(interval);
  }, [loadThreads]);

  // Fetch messages for selected thread (read-only)
  const fetchMessages = useCallback(async (showLoading = false) => {
    if (!selectedThread?.client?._id || !selectedThread?.agent?._id) return;
    if (showLoading) setLoadingMessages(true);

    try {
      const res = await appClient.get(
        `/api/chat/client/messages?clientId=${selectedThread.client._id}&agentId=${selectedThread.agent._id}&reader=admin`
      );
      if (res && res.data && res.data.status && Array.isArray(res.data.data)) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch client-agent messages:", err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, [selectedThread?.client?._id, selectedThread?.agent?._id]);

  useEffect(() => {
    fetchMessages(true);
    // Real-time polling every 4s
    const interval = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const clientName = `${t.client?.firstName || ""} ${t.client?.lastName || ""}`.toLowerCase();
    const clientEmail = (t.client?.email || "").toLowerCase();
    const clientId = (t.client?.clientId || "").toLowerCase();

    const agentName = `${t.agent?.firstName || ""} ${t.agent?.lastName || ""} ${t.agent?.fullName || ""}`.toLowerCase();
    const agentEmail = (t.agent?.email || "").toLowerCase();
    const agentId = (t.agent?.agentId || "").toLowerCase();

    return (
      clientName.includes(q) ||
      clientEmail.includes(q) ||
      clientId.includes(q) ||
      agentName.includes(q) ||
      agentEmail.includes(q) ||
      agentId.includes(q)
    );
  });

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full flex-col font-sans space-y-3 overflow-hidden p-1 sm:p-2">
      {/* Top Bar Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 sm:px-5 sm:py-3.5 border border-border/80 rounded-2xl shadow-xs min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-navy text-white shrink-0 shadow-md">
            <MessageSquare className="h-5 w-5 text-blue-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-navy tracking-tight leading-tight truncate">
                Client-Agent Conversations
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                <Eye className="h-3 w-3 text-blue-600" />
                <span>Read-Only Monitor</span>
              </span>
            </div>
            <p className="hidden sm:block text-xs text-navy/60 font-medium truncate">
              Administrative overview of 1-on-1 communications between clients and financial agents.
            </p>
          </div>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Link
              href="/agents/conversations"
              className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-navy rounded-lg transition"
            >
              Agent Support
            </Link>
            <span className="px-3 py-1 text-xs font-extrabold bg-navy text-white rounded-lg shadow-xs">
              Client-Agent Chats
            </span>
          </div>

          <button
            onClick={() => {
              loadThreads();
              if (selectedThread) fetchMessages(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid / Split Container */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden">
        {/* Left Threads Directory Panel */}
        <div
          className={`flex-1 min-h-0 min-w-0 lg:col-span-4 bg-white border border-border/80 rounded-2xl shadow-xs flex flex-col overflow-hidden ${
            mobileView === "chat" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 shrink-0 min-w-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Search by client or agent name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/10 font-medium shadow-xs min-w-0"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Client-Agent Threads ({filteredThreads.length})</span>
              <span>Messages</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {loadingThreads ? (
              <div className="flex h-40 items-center justify-center text-slate-400 text-xs font-semibold">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-navy" /> Loading threads directory...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                No client-agent threads found matching search.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedThread?.threadId === thread.threadId;
                const clientName =
                  `${thread.client?.firstName || ""} ${thread.client?.lastName || ""}`.trim() ||
                  thread.client?.email ||
                  "Client";
                const agentName =
                  `${thread.agent?.firstName || ""} ${thread.agent?.lastName || ""}`.trim() ||
                  thread.agent?.fullName ||
                  thread.agent?.email ||
                  "Unassigned Agent";

                const formattedTime = thread.lastMessageAt
                  ? new Date(thread.lastMessageAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <button
                    key={thread.threadId}
                    onClick={() => {
                      setSelectedThread(thread);
                      setMobileView("chat");
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 text-left transition cursor-pointer min-w-0 ${
                      isSelected ? "bg-navy text-white shadow-xs" : "hover:bg-slate-50 text-navy"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs ${
                          isSelected
                            ? "bg-white/15 text-white border border-white/20"
                            : "bg-navy/5 text-navy border border-slate-200"
                        }`}
                      >
                        {thread.client?.firstName?.charAt(0) || "C"}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`truncate text-xs font-extrabold ${isSelected ? "text-white" : "text-navy"}`}>
                          {clientName}
                        </p>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                            isSelected ? "bg-white/20 text-white font-bold" : "bg-slate-100 text-slate-500 font-bold"
                          }`}
                        >
                          #{thread.client?.clientId || "CL"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5 text-[10px]">
                        <span className={`truncate font-semibold ${isSelected ? "text-blue-200" : "text-blue-600"}`}>
                          Agent: {agentName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={`truncate text-[11px] flex-1 ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                          {thread.lastMessage || "No messages yet"}
                        </p>
                        {formattedTime && (
                          <span
                            className={`text-[9px] shrink-0 font-medium ${
                              isSelected ? "text-white/60" : "text-slate-400"
                            }`}
                          >
                            {formattedTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Panel */}
        <div
          className={`flex-1 min-h-0 min-w-0 lg:col-span-8 bg-white border border-border/80 rounded-2xl shadow-xs flex flex-col overflow-hidden ${
            mobileView === "list" ? "hidden lg:flex" : "flex"
          }`}
        >
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0 min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => setMobileView("list")}
                    className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 transition cursor-pointer shrink-0"
                    title="Back to Directory"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                    {selectedThread.client?.firstName?.charAt(0) || "C"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-extrabold text-navy truncate">
                        {selectedThread.client?.firstName} {selectedThread.client?.lastName}
                      </h3>
                      <span className="text-[10px] font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded shrink-0">
                        Client #{selectedThread.client?.clientId || "—"}
                      </span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <span>Agent: {selectedThread.agent?.firstName} {selectedThread.agent?.lastName}</span>
                        {selectedThread.agent?.agentId && <span className="font-mono">(#{selectedThread.agent.agentId})</span>}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Client: {selectedThread.client?.email} • Agent: {selectedThread.agent?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/clients/all?search=${encodeURIComponent(selectedThread.client?.clientId || selectedThread.client?.email || "")}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy/5 hover:bg-navy/10 text-navy font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Client Profile</span>
                  </Link>
                </div>
              </div>

              {/* Chat Stream Banner */}
              <div className="px-4 py-2 border-b border-slate-100 bg-amber-50/60 flex items-center justify-between text-[11px] text-amber-900 font-medium shrink-0">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Eye className="h-3.5 w-3.5 text-amber-600" />
                  <span>Read-Only Admin Monitor — Observing Client & Agent Stream</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] text-amber-700/80">
                  <Clock className="h-3 w-3" />
                  <span>Polling: 4s</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-3.5 bg-slate-50/30 scrollbar-thin"
              >
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs font-semibold">
                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-navy" /> Loading message stream...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-navy/40">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-navy">No Chat Messages Yet</p>
                    <p className="text-[11px] text-slate-400 max-w-[300px]">
                      No recorded conversation messages between {selectedThread.client?.firstName || "client"} and {selectedThread.agent?.firstName || "agent"} yet.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isClient = msg.sender === "client";
                    const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isClient ? "items-start" : "items-end"} min-w-0`}
                      >
                        <span className="mb-1 text-[10px] text-slate-500 font-bold px-1 max-w-full truncate flex items-center gap-1">
                          {isClient ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                              <span>Client ({selectedThread.client?.firstName} {selectedThread.client?.lastName})</span>
                            </>
                          ) : (
                            <>
                              <span>Agent ({selectedThread.agent?.firstName} {selectedThread.agent?.lastName})</span>
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                            </>
                          )}
                        </span>
                        <div
                          className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs min-w-0 ${
                            isClient
                              ? "rounded-tl-none bg-white border border-slate-200 text-slate-800"
                              : "rounded-tr-none bg-navy text-white"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1.5 text-[9px] ${
                              isClient ? "text-slate-400" : "text-slate-300"
                            }`}
                          >
                            <span>{formattedTime}</span>
                            {msg.read ? (
                              <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                                <CheckCheck className="h-3 w-3 inline" />
                                <span>Seen</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 opacity-70">
                                <Check className="h-3 w-3 inline" />
                                <span>Delivered</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Read-Only Banner / Notice Box */}
              <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
                <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Admin Read-Only Display Mode — Direct communication between Client and Financial Agent</span>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <MessageSquare className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-bold text-navy">No Thread Selected</p>
              <p className="text-xs text-slate-400 max-w-[260px]">
                Select a client-agent thread from the left directory to view live conversation messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminClientConversationsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center text-slate-500 font-medium text-xs">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-navy" /> Loading conversations console...
      </div>
    }>
      <AdminClientConversationsContent />
    </Suspense>
  );
}
