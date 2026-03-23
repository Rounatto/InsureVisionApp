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

  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [threadMessages]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/messages?page=1");
      if (!res.ok) throw new Error("Failed to fetch conversations");

      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch specific conversation thread
  const fetchConversationThread = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/messages/${conversationId}?page=1`);
      if (!res.ok) throw new Error("Failed to fetch conversation");

      const data = await res.json();
      setThreadMessages(data.conversation.messages || []);
      setSelectedConversation(data.conversation);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch conversation");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();

      // Poll for new conversations every 5 seconds
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [status, fetchConversations]);

  // Auto-fetch thread when selected
  useEffect(() => {
    if (selectedConversationId && viewMode === "thread") {
      fetchConversationThread(selectedConversationId);

      // Poll for new messages every 3 seconds
      const interval = setInterval(
        () => fetchConversationThread(selectedConversationId),
        3000
      );
      return () => clearInterval(interval);
    }
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
  };

  // Send reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversationId || sending) return;

    try {
      setSending(true);
      setError(null);

      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content: messageInput,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send reply");
      }

      const data = await res.json();

      // Add new message to thread
      setThreadMessages((prev) => [...prev, data.message]);
      setMessageInput("");

      // Refresh conversations list
      await fetchConversations();
    } catch (err) {
      console.error("Error sending reply:", err);
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-center text-[color:var(--muted-foreground)]">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Redirect if not authenticated or not admin
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
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg m-4">
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
                      className="p-4 hover:bg-[color:var(--muted)] cursor-pointer transition-colors"
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
          <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="p-6 border-b border-[color:var(--border)] flex items-center justify-between">
              <div>
                <button
                  onClick={handleBackToList}
                  className="text-blue-500 hover:text-blue-600 font-medium text-sm mb-2"
                >
                  ← Back to conversations
                </button>
                <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
                  {selectedConversation.user.name || selectedConversation.user.email}
                </h1>
                <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                  {selectedConversation.user.email}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-red-500/10 text-red-600 text-xs font-medium rounded-full">
                  Banned
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg m-4">
                {error}
              </div>
            )}

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {threadMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-[color:var(--muted-foreground)]">
                    No messages in this conversation yet
                  </p>
                </div>
              ) : (
                threadMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.senderType === "ADMIN" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderType === "ADMIN"
                          ? "bg-blue-500 text-white"
                          : "bg-[color:var(--muted)] text-[color:var(--foreground)]"
                      }`}
                    >
                      <p className="text-xs font-medium opacity-75 mb-1">
                        {msg.senderType === "ADMIN" ? "You" : "User"}
                      </p>
                      <p className="text-sm break-words">{msg.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form
              onSubmit={handleSendReply}
              className="border-t border-[color:var(--border)] p-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="rounded-lg bg-blue-500 text-white px-6 py-2 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
