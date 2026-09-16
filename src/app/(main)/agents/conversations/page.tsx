"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  Send,
  Loader2,
  RefreshCw,
  ChevronLeft,
  Check,
  CheckCheck,
  User,
  ShieldCheck,
  Clock,
  UserCheck,
} from "lucide-react";
import appClient from "@/lib/appClient";

type ChatAgent = {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  agentId?: string;
  agentLevel?: string;
  profileImage?: string;
  status?: string;
  kycStatus?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastSender?: "agent" | "admin";
  lastMessageAt?: string | null;
};

type AgentAdminMessage = {
  _id: string;
  agent: string;
  sender: "agent" | "admin";
  senderName?: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function AdminAgentConversationsPage() {
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<ChatAgent | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const [messages, setMessages] = useState<AgentAdminMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch agents list with conversation metadata
  const loadAgents = useCallback(async () => {
    try {
      const res = await appClient.get("/api/chat/agent-admin/agents");
      if (res && res.data && res.data.status && Array.isArray(res.data.data)) {
        const list: ChatAgent[] = res.data.data;
        setAgents(list);

        // Preselect initial agent if none selected or maintain current selection
        setSelectedAgent((prev) => {
          if (!prev && list.length > 0) return list[0];
          if (prev) {
            const matched = list.find((a) => a._id === prev._id);
            return matched || prev;
          }
          return null;
        });
      }
    } catch (err) {
      console.error("Failed to load agent conversations directory:", err);
    } finally {
      setLoadingAgents(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
    // Poll agent directory every 5 seconds
    const interval = setInterval(loadAgents, 5000);
    return () => clearInterval(interval);
  }, [loadAgents]);

  // Fetch messages for selected agent
  const fetchMessages = useCallback(async (showLoading = false) => {
    if (!selectedAgent?._id) return;
    if (showLoading) setLoadingMessages(true);

    try {
      const res = await appClient.get(
        `/api/chat/agent-admin/messages?agentId=${selectedAgent._id}&reader=admin`
      );
      if (res && res.data && res.data.status && Array.isArray(res.data.data)) {
        setMessages(res.data.data);

        // Clear local unread badge for selected agent
        setAgents((prev) =>
          prev.map((a) =>
            a._id === selectedAgent._id ? { ...a, unreadCount: 0 } : a
          )
        );
      }
    } catch (err) {
      console.error("Failed to fetch agent messages:", err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, [selectedAgent?._id]);

  useEffect(() => {
    fetchMessages(true);
    // Real-time polling every 4s (< 5s as requested)
    const interval = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message from Admin to Agent
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedAgent?._id || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await appClient.post("/api/chat/agent-admin/post", {
        agentId: selectedAgent._id,
        message: text,
        sender: "admin",
        senderName: "Admin Support",
      });

      if (res && res.data && res.data.status && res.data.data) {
        setMessages((prev) => [...prev, res.data.data as AgentAdminMessage]);
        loadAgents(); // update latest message snippet in list
      } else {
        fetchMessages(false);
      }
    } catch (err) {
      console.error("Failed to send message to agent:", err);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const filteredAgents = agents.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = `${a.firstName || ""} ${a.lastName || ""} ${a.fullName || ""}`.toLowerCase();
    const email = (a.email || "").toLowerCase();
    const id = (a.agentId || "").toLowerCase();
    return name.includes(q) || email.includes(q) || id.includes(q);
  });

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full flex-col font-sans space-y-3 overflow-hidden p-1 sm:p-2">
      {/* Top Bar Header */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-white px-4 py-3 sm:px-5 sm:py-3.5 border border-border/80 rounded-2xl shadow-xs min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-navy text-white shrink-0 shadow-md">
            <MessageSquare className="h-5 w-5 text-blue-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-navy tracking-tight leading-tight truncate">
                Agent Support Conversations
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Live </span>
              </span>
            </div>
            <p className="hidden sm:block text-xs text-navy/60 font-medium truncate">
              Manage 1-on-1 conversations with registered financial agents.
            </p>
          </div>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="px-3 py-1 text-xs font-extrabold bg-navy text-white rounded-lg shadow-xs">
              Agent Support
            </span>
            <Link
              href="/clients/conversations"
              className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-navy rounded-lg transition"
            >
              Client-Agent Chats
            </Link>
          </div>

          <button
            onClick={() => {
              loadAgents();
              if (selectedAgent) fetchMessages(true);
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
        {/* Left Agent Directory Panel */}
        <div
          className={`flex-1 min-h-0 min-w-0 lg:col-span-4 bg-white border border-border/80 rounded-2xl shadow-xs flex flex-col overflow-hidden ${mobileView === "chat" ? "hidden lg:flex" : "flex"
            }`}
        >
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 shrink-0 min-w-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Search by agent name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/10 font-medium shadow-xs min-w-0"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Agents ({filteredAgents.length})</span>
              <span>Status</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {loadingAgents ? (
              <div className="flex h-40 items-center justify-center text-slate-400 text-xs font-semibold">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-navy" /> Loading agent list...
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                No agents found matching search query.
              </div>
            ) : (
              filteredAgents.map((agent) => {
                const isSelected = selectedAgent?._id === agent._id;
                const agentName =
                  `${agent.firstName || ""} ${agent.lastName || ""}`.trim() ||
                  agent.fullName ||
                  agent.email;
                const unread = agent.unreadCount || 0;
                const formattedTime = agent.lastMessageAt
                  ? new Date(agent.lastMessageAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : "";

                return (
                  <button
                    key={agent._id}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setMobileView("chat");
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 text-left transition cursor-pointer min-w-0 ${isSelected
                      ? "bg-navy text-white shadow-xs"
                      : "hover:bg-slate-50 text-navy"
                      }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs ${isSelected
                          ? "bg-white/15 text-white border border-white/20"
                          : "bg-navy/5 text-navy border border-slate-200"
                          }`}
                      >
                        {agent.firstName?.charAt(0) || "A"}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white font-extrabold text-[9px] shadow-sm animate-pulse border border-white">
                          {unread}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`truncate text-xs font-extrabold ${isSelected ? "text-white" : "text-navy"
                            }`}
                        >
                          {agentName}
                        </p>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${isSelected
                            ? "bg-white/20 text-white font-bold"
                            : "bg-slate-100 text-slate-500 font-bold"
                            }`}
                        >
                          #{agent.agentId || "ID"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p
                          className={`truncate text-[11px] flex-1 ${isSelected ? "text-white/80" : "text-slate-500"
                            }`}
                        >
                          {agent.lastMessage || agent.email}
                        </p>
                        {formattedTime && (
                          <span
                            className={`text-[9px] shrink-0 font-medium ${isSelected ? "text-white/60" : "text-slate-400"
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
          className={`flex-1 min-h-0 min-w-0 lg:col-span-8 bg-white border border-border/80 rounded-2xl shadow-xs flex flex-col overflow-hidden ${mobileView === "list" ? "hidden lg:flex" : "flex"
            }`}
        >
          {selectedAgent ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0 min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => setMobileView("list")}
                    className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 transition cursor-pointer shrink-0"
                    title="Back to Agent List"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                    {selectedAgent.firstName?.charAt(0) || "A"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-navy truncate">
                        {selectedAgent.firstName} {selectedAgent.lastName}
                      </h3>
                      <span className="hidden sm:inline-block text-[10px] font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded shrink-0">
                        #{selectedAgent.agentId}
                      </span>
                      {selectedAgent.agentLevel && (
                        <span className="hidden sm:inline-block text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full uppercase shrink-0">
                          {selectedAgent.agentLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{selectedAgent.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/agents/all?search=${encodeURIComponent(selectedAgent.agentId || selectedAgent.email)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy/5 hover:bg-navy/10 text-navy font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">View Profile</span>
                  </Link>
                </div>
              </div>

              {/* Chat Stream Banner */}
              <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between text-[11px] text-slate-500 font-medium shrink-0">
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>Agent-to-Admin Direct Channel</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
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
                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-navy" /> Fetching agent messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-navy/40">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-navy">No Messages Yet</p>
                    <p className="text-[11px] text-slate-400 max-w-[280px]">
                      Send a message below to reach out to {selectedAgent.firstName || "this agent"}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender === "admin";
                    const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} min-w-0`}
                      >
                        <span className="mb-1 text-[10px] text-slate-400 font-semibold px-1 max-w-full truncate">
                          {isAdmin
                            ? "Admin Support (You)"
                            : msg.senderName || `${selectedAgent.firstName || ""} ${selectedAgent.lastName || ""}`.trim()}
                        </span>
                        <div
                          className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs min-w-0 ${isAdmin
                            ? "rounded-tr-none bg-navy text-white"
                            : "rounded-tl-none bg-white border border-slate-200/90 text-slate-800"
                            }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1.5 text-[9px] ${isAdmin ? "text-slate-300" : "text-slate-400"
                              }`}
                          >
                            <span>{formattedTime}</span>

                            {/* Read status for Outgoing Admin messages */}
                            {isAdmin && (
                              msg.read ? (
                                <span
                                  className="flex items-center gap-0.5 text-cyan-300 font-extrabold"
                                  title="Seen by Agent"
                                >
                                  <CheckCheck className="h-3 w-3 inline" />
                                  <span>Seen</span>
                                </span>
                              ) : (
                                <span
                                  className="flex items-center gap-0.5 text-slate-300/80 font-medium"
                                  title="Not Seen yet by Agent"
                                >
                                  <Check className="h-3 w-3 inline" />
                                  <span>Not Seen</span>
                                </span>
                              )
                            )}

                            {/* Read status for Incoming Agent messages */}
                            {!isAdmin && (
                              msg.read ? (
                                <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                                  <CheckCheck className="h-3 w-3 inline" />
                                  <span>Read</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-rose-500 font-bold">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                  <span>New</span>
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-3.5 border-t border-slate-100 bg-white flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Reply to ${selectedAgent.firstName || "agent"}...`}
                  className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3.5 sm:px-4 py-2.5 text-xs text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/10 font-medium shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="h-10 px-4 rounded-xl bg-navy text-white text-xs font-bold flex items-center gap-1.5 hover:bg-navy/90 disabled:opacity-40 transition cursor-pointer shadow-xs shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Send Reply</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <MessageSquare className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-bold text-navy">No Agent Selected</p>
              <p className="text-xs text-slate-400 max-w-[260px]">
                Choose an agent from the left directory to view support messages or send replies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
