'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { NETWORK_ERROR_MESSAGE } from '@/lib/constants';

const cardClass =
  'min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6';

export default function SupportPage() {
  const [startingChat, setStartingChat] = useState(false);
  const [chatStatus, setChatStatus] = useState('');
  const [chatError, setChatError] = useState('');

  const handleStartChat = async () => {
    if (startingChat) return;

    setStartingChat(true);
    setChatStatus('');
    setChatError('');

    try {
      const banStatusRes = await fetch('/api/messages/ban-status', {
        method: 'GET',
      });

      if (!banStatusRes.ok) {
        setChatError('Unable to verify chat availability right now.');
        setStartingChat(false);
        return;
      }

      const banStatusData = await banStatusRes.json();
      if (!banStatusData.isBanned) {
        setChatStatus(
          'Live chat is currently reserved for active account review cases. Please use email support.'
        );
        setStartingChat(false);
        return;
      }

      // Warm the current conversation endpoint so backend returns existing thread if present.
      await fetch('/api/messages/conversation', { method: 'GET' });

      const sendRes = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:
            'Hello support, I need help with my account review. Please contact me when available.',
        }),
      });

      if (!sendRes.ok) {
        const data = await sendRes.json().catch(() => ({}));
        setChatError(data.message || 'Failed to start live chat.');
        setStartingChat(false);
        return;
      }

      setChatStatus(
        'Chat request sent. Our team will reply in this support thread.'
      );
    } catch {
      setChatError(NETWORK_ERROR_MESSAGE);
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-3">
          Support
        </h1>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Need help with an estimate, account, or payment? Reach our team and we
          will respond quickly.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className={cardClass}>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--muted)] text-[color:var(--foreground)]">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            Email Support
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            For technical issues and account requests.
          </p>
          <a
            href="mailto:support@insurevision.app"
            className="mt-4 inline-flex w-full max-w-full items-center justify-center rounded-2xl border border-[color:var(--border)] px-4 py-2 text-center text-xs font-medium leading-tight break-words [overflow-wrap:anywhere] hover:bg-[color:var(--muted)] transition-colors sm:text-sm"
          >
            support@insurevision.app
          </a>
        </div>

        <div className={cardClass}>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--muted)] text-[color:var(--foreground)]">
            <Phone className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            Priority Hotline
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            For urgent claims and insurance validation support.
          </p>
          <p className="mt-4 text-sm font-medium text-[color:var(--foreground)]">
            +1 (800) 555-0148
          </p>
        </div>

        <div className={cardClass}>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--muted)] text-[color:var(--foreground)]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            Live Chat
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            Available Monday to Saturday, 8:00 to 20:00.
          </p>
          <button
            onClick={handleStartChat}
            disabled={startingChat}
            className="mt-4 rounded-full bg-[color:var(--foreground)] px-4 py-2 text-sm font-semibold text-[color:var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {startingChat ? 'Starting...' : 'Start Chat'}
          </button>
          {chatStatus && (
            <p className="mt-3 text-xs text-green-600">{chatStatus}</p>
          )}
          {chatError && (
            <p className="mt-3 text-xs text-red-500">{chatError}</p>
          )}
        </div>

        <div className={cardClass}>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--muted)] text-[color:var(--foreground)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            Satisfaction Policy
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            If repair invoices differ significantly from our estimate, contact
            us for a reanalysis or compensation review.
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)] mb-4">
          Frequently Asked Support Questions
        </h2>

        <div className="space-y-3">
          <details className="rounded-xl border border-[color:var(--border)] p-4 hover:border-[color:var(--foreground)]/20 transition-colors">
            <summary className="cursor-pointer text-sm font-medium text-[color:var(--foreground)]">
              How long does a support response take?
            </summary>
            <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
              Most requests are answered within 2 to 8 business hours.
            </p>
          </details>

          <details className="rounded-xl border border-[color:var(--border)] p-4 hover:border-[color:var(--foreground)]/20 transition-colors">
            <summary className="cursor-pointer text-sm font-medium text-[color:var(--foreground)]">
              Can I challenge an estimate result?
            </summary>
            <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
              Yes. Share your invoice and extra photos, and our team will run a
              manual review.
            </p>
          </details>
        </div>
      </section>
    </main>
  );
}
