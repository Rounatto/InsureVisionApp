"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageIcon } from "@/lib/icons";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderEmail: string;
  senderType: "USER" | "ADMIN";
  content: string;
  createdAt: string;
}

export default function BannedNotification() {
  const { data: session } = useSession();
  const [isBanned, setIsBanned] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<string>("");

  // Auto-scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user is banned on mount
  useEffect(() => {
    const checkBannedStatus = async () => {
      try {
        const res = await fetch("/api/messages/conversation");
        if (res.status === 403) {
          setIsBanned(false);
        } else if (res.ok) {
          setIsBanned(true);
          const data = await res.json();
          setMessages(data.messages || []);
          lastFetchRef.current = JSON.stringify(data.messages);
        }
      } catch (err) {
        console.error("Error checking ban status:", err);
      }
    };

    if (session?.user?.id) {
      checkBannedStatus();
    }
  }, [session?.user?.id]);

  // Silently poll for new admin messages in background (no visible refresh)
  useEffect(() => {
    if (!showChat || !isBanned) return;

    const fetchNewMessages = async () => {
      try {
        const res = await fetch("/api/messages/conversation");
        if (res.ok) {
          const data = await res.json();
          const newMessagesStr = JSON.stringify(data.messages);

          // Only update if there are new messages
          if (newMessagesStr !== lastFetchRef.current) {
            setMessages(data.messages || []);
            lastFetchRef.current = newMessagesStr;
          }
        }
      } catch (err) {
        // Silently fail - don't show errors for background polling
      }
    };

    // Fetch immediately when chat opens
    fetchNewMessages();

    // Poll every 2 seconds for new messages
    const interval = setInterval(fetchNewMessages, 2000);
    return () => clearInterval(interval);
  }, [showChat, isBanned]);

  // Send message with optimistic update
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending) return;

    const userMessage = messageInput.trim();
    setMessageInput("");

    try {
      setSending(true);

      // Optimistic update - show message immediately
      const tempMessage: Message = {
        id: "temp-" + Date.now(),
        conversationId: "",
        senderId: session?.user?.id || "",
        senderEmail: session?.user?.email || "",
        senderType: "USER",
        content: userMessage,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!res.ok) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
        const data = await res.json();
        alert(data.message || "Failed to send message");
        setMessageInput(userMessage);
        return;
      }

      // Replace temp message with real one from server
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMessage.id ? data.message : m))
      );
      lastFetchRef.current = JSON.stringify(
        messages.map((m) => (m.id === tempMessage.id ? data.message : m))
      );
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== ("temp-" + Date.now())));
      alert("Failed to send message. Please try again.");
      setMessageInput(userMessage);
    } finally {
      setSending(false);
    }
  };

  if (!isBanned) return null;

  return (
    <div className="mb-6 mx-auto max-w-4xl px-6">
      {!showChat ? (
        // Collapsed banned notification - Professional banner
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-4 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 pt-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376C1.83 18.754 2.745 21.6 5.68 23.81m14.4-14.254c2.985 2.207 3.9 5.053 3.9 8.817M3.34 20.223A10.332 10.332 0 1021.66 3.34M3.34 20.223L5.91 18.12m-2.57 2.103L21.66 3.34"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[color:var(--foreground)]">
                Account Restricted
              </h3>
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1.5">
                Your account has been temporarily restricted. You can still message the admin to discuss and resolve this issue.
              </p>
              <button
                onClick={() => setShowChat(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
              >
                <MessageIcon className="h-4 w-4" />
                Open Chat
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Expanded chat - Professional messenger-style interface
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--border)] bg-[color:var(--muted)]/30">
            <div>
              <h3 className="text-base font-bold text-[color:var(--foreground)]">
                Admin Support Chat
              </h3>
              <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                Chat with kmrzed59@gmail.com
              </p>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto max-h-96 px-5 py-4 space-y-3 bg-[color:var(--background)]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full py-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[color:var(--muted)] mb-3">
                    <MessageIcon className="h-6 w-6 text-[color:var(--muted-foreground)]" />
                  </div>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    No messages yet
                  </p>
                  <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                    Send a message to start
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderType === "ADMIN" ? "justify-start" : "justify-end"
                  } animate-fadeIn`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl text-sm font-normal break-words ${
                      msg.senderType === "ADMIN"
                        ? "bg-[color:var(--muted)] text-[color:var(--foreground)] border border-[color:var(--border)]"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-xs mt-1.5 ${
                        msg.senderType === "ADMIN"
                          ? "text-[color:var(--muted-foreground)]"
                          : "text-blue-100"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[color:var(--border)] px-5 py-4 bg-[color:var(--muted)]/30">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 rounded-full border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-2.5 text-sm text-[color:var(--foreground)] placeholder-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || sending}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {sending ? (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-white rounded-full animate-pulse"></span>
                  </span>
                ) : (
                  "Send"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

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
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
