'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderEmail: string;
  senderType: 'USER' | 'ADMIN';
  content: string;
  createdAt: string;
}

interface ConversationData {
  id: string;
  bannedUserId: string;
  createdAt: string;
  updatedAt: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [canPollConversation, setCanPollConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/messages/conversation?page=1');
      if (!res.ok) {
        if (res.status === 403) {
          setIsBanned(false);
          setCanPollConversation(false);
          setError('You must be banned to access this page');
          setTimeout(() => router.push('/dashboard'), 2000);
          return;
        }
        throw new Error('Failed to fetch messages');
      }

      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages || []);
      setIsBanned(true);
      setCanPollConversation(true);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch messages on mount and set up polling
  useEffect(() => {
    if (status !== 'authenticated') return;

    fetchMessages();
  }, [status, fetchMessages]);

  useEffect(() => {
    if (status !== 'authenticated' || !canPollConversation) return;

    // Poll for new messages every 3 seconds only for banned users.
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [status, canPollConversation, fetchMessages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || sending) return;

    try {
      setSending(true);
      setError(null);

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send message');
      }

      const data = await res.json();

      // Add new message to list
      setMessages((prev) => [...prev, data.message]);
      setMessageInput('');

      // Fetch updated conversation
      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-center text-[color:var(--muted-foreground)]">
            Loading messages...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Redirect if not authenticated
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-[color:var(--border)]">
          <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
            Contact Admin
          </h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Send messages to the admin team to discuss your account status
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg m-4">
            {error}
          </div>
        )}

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-[color:var(--muted-foreground)]">
                No messages yet. Send a message to start communicating with the
                admin team.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.senderType === 'ADMIN' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.senderType === 'ADMIN'
                      ? 'bg-[color:var(--muted)] text-[color:var(--foreground)]'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  <p className="text-xs font-medium opacity-75 mb-1">
                    {msg.senderType === 'ADMIN' ? 'Admin' : 'You'}
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
          onSubmit={handleSendMessage}
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
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
