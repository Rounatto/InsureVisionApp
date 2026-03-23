"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderEmail: string;
  senderType: "USER" | "ADMIN";
  content: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  banned: boolean;
  createdAt: string;
}

interface ConversationPreview {
  id: string;
  user: User;
  lastMessage: Message | null;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = "list" | "thread";

export default function AdminMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationPreview | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unbanning, setUnbanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastConversationsRef = useRef<string>("");
  const lastMessagesRef = useRef<string>("");

  // Fetch conversations list - silent, no visible loading
  const fetchConversations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setInitialLoading(true);
      setError(null);

      const res = await fetch("/api/admin/messages?page=1");
      if (!res.ok) throw new Error("Failed to fetch conversations");

      const data = await res.json();
      const conversationsStr = JSON.stringify(data.conversations || []);

      // Only update if data changed
      if (conversationsStr !== lastConversationsRef.current) {
        setConversations(data.conversations || []);
        lastConversationsRef.current = conversationsStr;
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch conversations");
    } finally {
      if (showLoading) setInitialLoading(false);
    }
  }, []);

  // Fetch specific conversation thread - silent, no visible loading
  const fetchConversationThread = useCallback(async (conversationId: string, showLoading = false) => {
    try {
      if (showLoading) setInitialLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/messages/${conversationId}?page=1`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch conversation");
      }

      const messagesStr = JSON.stringify(data.conversation.messages || []);

      // Always update to ensure messages load properly
      setThreadMessages(data.conversation.messages || []);
      lastMessagesRef.current = messagesStr;
      setSelectedConversation(data.conversation);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch conversation");
    } finally {
      if (showLoading) setInitialLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations(true);
    }
  }, [status, fetchConversations]);

  // Silent polling for conversations
  useEffect(() => {
    if (status !== "authenticated" || viewMode !== "list") return;

    // Poll every 4 seconds silently
    const interval = setInterval(() => fetchConversations(false), 4000);
    return () => clearInterval(interval);
  }, [status, viewMode, fetchConversations]);

  // Ensure thread loads when selected
  useEffect(() => {
    if (!selectedConversationId || viewMode !== "thread") return;

    // Fetch immediately when conversation is selected
    fetchConversationThread(selectedConversationId, true);

    // Then poll every 2 seconds
    const interval = setInterval(() => {
      fetchConversationThread(selectedConversationId, false);
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedConversationId, viewMode, fetchConversationThread]);

  // View conversation thread
  const handleViewThread = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setViewMode("thread");
  };

  // Back to list
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedConversationId(null);
    setThreadMessages([]);
    setMessageInput("");
    setError(null);
    setSuccessMsg(null);
  };

  // Send reply with optimistic update
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversationId || sending) return;

    const messageText = messageInput;
    setMessageInput("");

    try {
      setSending(true);
      setError(null);

      // Optimistic update - show message immediately
      const tempMessage: Message = {
        id: "temp-" + Date.now(),
        conversationId: selectedConversationId,
        senderId: session?.user?.id || "",
        senderEmail: session?.user?.email || "",
        senderType: "ADMIN",
        content: messageText,
        createdAt: new Date().toISOString(),
      };
      setThreadMessages((prev) => [...prev, tempMessage]);

      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content: messageText,
        }),
      });

      if (!res.ok) {
        // Remove optimistic message on error
        setThreadMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
        const data = await res.json();
        setError(data.message || "Failed to send reply");
        setMessageInput(messageText);
        return;
      }

      const data = await res.json();

      // Replace temp message with real one
      setThreadMessages((prev) =>
        prev.map((m) => (m.id === tempMessage.id ? data.message : m))
      );

      // Silently refresh conversations list in background
      await fetchConversations(false);
    } catch (err) {
      console.error("Error sending reply:", err);
      setMessageInput(messageText);
      setError("Failed to send reply. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Unban user
  const handleUnbanUser = async () => {
    if (!selectedConversation?.user.id || unbanning) return;

    const confirmed = window.confirm(
      `Unban ${selectedConversation.user.name || selectedConversation.user.email}? All their messages will be deleted.`
    );
    if (!confirmed) return;

    try {
      setUnbanning(true);
      setError(null);

      const res = await fetch(
        `/api/admin/users?id=${selectedConversation.user.id}&action=unban`,
        { method: "PATCH" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to unban user");
      }

      // Show success message
      setSuccessMsg(
        `✓ User ${selectedConversation.user.name || selectedConversation.user.email} has been unbanned. All messages deleted.`
      );

      // Redirect after 2.5 seconds
      setTimeout(() => {
        handleBackToList();
        fetchConversations(true);
      }, 2500);
    } catch (err) {
      console.error("Error unbanning user:", err);
      setError(err instanceof Error ? err.message : "Failed to unban user");
    } finally {
      setUnbanning(false);
    }
  };

  // Loading state
  if (status === "loading" || (initialLoading && viewMode === "list")) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-center text-[color:var(--muted-foreground)]">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Redirect if not authenticated
  if (status !== "authenticated") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* List View */}
        {viewMode === "list" && (
          <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="p-6 border-b border-[color:var(--border)]">
              <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
                Banned User Messages
              </h1>
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                Communicate with banned users about their account status
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg m-4 animate-slideDown">
                {error}
              </div>
            )}

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[color:var(--muted-foreground)]">
                    No conversations yet. Banned users will appear here when they send a message.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[color:var(--border)]">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleViewThread(conv.id)}
                      className="p-4 hover:bg-[color:var(--muted)] cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[color:var(--foreground)]">
                            {conv.user.name || conv.user.email}
                          </p>
                          <p className="text-sm text-[color:var(--muted-foreground)] truncate">
                            {conv.user.email}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-sm text-[color:var(--muted-foreground)] mt-2 line-clamp-2">
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-[color:var(--muted-foreground)]">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Thread View */}
        {viewMode === "thread" && selectedConversation && (
          <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-6 mb-6">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--border)] bg-[color:var(--muted)]/30">
                <div>
                  <h3 className="text-base font-bold text-[color:var(--foreground)]">
                    {selectedConversation.user.name || selectedConversation.user.email}
                  </h3>
                  <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                    {selectedConversation.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-block px-3 py-1 bg-red-500/10 text-red-600 text-xs font-medium rounded-full border border-red-500/20">
                    Banned
                  </span>
                  <button
                    onClick={handleUnbanUser}
                    disabled={unbanning}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {unbanning ? (
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-white rounded-full animate-pulse"></span>
                        Processing...
                      </span>
                    ) : (
                      "Unban User"
                    )}
                  </button>
                  <button
                    onClick={handleBackToList}
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Success message */}
              {successMsg && (
                <div className="p-4 bg-green-500/10 border-b border-green-500/20 text-green-700 animate-slideDown flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-green-900">{successMsg}</p>
                    <p className="text-xs text-green-700 mt-1">Redirecting...</p>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-600 animate-slideDown">
                  {error}
                </div>
              )}

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto max-h-96 px-5 py-4 space-y-3 bg-[color:var(--background)]">
                {threadMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-sm text-[color:var(--muted-foreground)]">No messages yet</p>
                      <p className="text-xs text-[color:var(--muted-foreground)] mt-1">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  threadMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderType === "ADMIN" ? "justify-end" : "justify-start"} animate-fadeIn`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl text-sm break-words ${
                          msg.senderType === "ADMIN"
                            ? "bg-blue-600 text-white"
                            : "bg-[color:var(--muted)] text-[color:var(--foreground)] border border-[color:var(--border)]"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1.5 ${msg.senderType === "ADMIN" ? "text-blue-100" : "text-[color:var(--muted-foreground)]"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-[color:var(--border)] px-5 py-4 bg-[color:var(--muted)]/30">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 rounded-full border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-2.5 text-sm text-[color:var(--foreground)] placeholder-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
}
