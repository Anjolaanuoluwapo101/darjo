"use client";

import { useRef, useState } from "react";
import { friendlyError } from "@/components/forms/errorMessages";
import { chatWithAgent } from "@/lib/api-client";
import type { AgentAction } from "@/types/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: AgentAction[];
};

type ChatPanelProps = {
  circleId?: string;
  circleName?: string;
  suggested?: string[];
};

const DEFAULT_SUGGESTIONS = [
  "Who has not paid this cycle?",
  "How much is in the pot?",
  "Who is the next winner?",
];

// The conversation itself. The assistant page and the drawer both use it.
export default function ChatPanel({
  circleId,
  circleName,
  suggested = DEFAULT_SUGGESTIONS,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastActions, setLastActions] = useState<AgentAction[]>([]);
  const [copiedNudge, setCopiedNudge] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  function nextId() {
    idRef.current += 1;
    return `m${idRef.current}`;
  }

  async function copyNudge(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNudge(text);
      setTimeout(() => setCopiedNudge(null), 2000);
    } catch {
      setCopiedNudge(null);
    }
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    const mine: ChatMessage = { id: nextId(), role: "user", text: message };
    setMessages((current) => [...current, mine]);
    setDraft("");
    setError(null);
    setSending(true);

    const result = await chatWithAgent({ circleId, message });
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });

    if (!result.ok) {
      setError(friendlyError(result.error.code, result.error.message));
      setSending(false);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: nextId(),
        role: "assistant",
        text: result.data.reply,
        actions: result.data.actions,
      },
    ]);
    setLastActions(result.data.actions);
    setSending(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        ref={listRef}
        className="flex min-h-40 flex-col gap-3 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-4"
        aria-live="polite"
        aria-label="Conversation with the D'arjo assistant"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-gray-600">
            {circleName
              ? `Ask me anything about ${circleName}.`
              : "Ask me about your circles, payments or payouts."}
          </p>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col gap-1 ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {message.role === "user" ? "You" : "Assistant"}
            </span>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-[#003087] text-white"
                  : "border border-gray-200 bg-white text-gray-800"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {sending ? (
          <p className="text-sm text-gray-500">Thinking...</p>
        ) : null}
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggested.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => send(question)}
              className="min-h-10 rounded-full border border-gray-300 px-3.5 text-sm text-gray-700 transition hover:border-[#0070e0] hover:text-[#0070e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}

      {lastActions.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {lastActions.map((action, index) => (
            <li
              key={`${action.type}-${index}`}
              className="rounded-xl border border-[#ffd140] bg-[#fff9e6] px-3.5 py-2.5 text-sm text-[#4a3a00]"
            >
              {action.type === "nudge_drafted" ? (
                <div className="flex flex-col gap-2">
                  <span>Draft nudge ready: &ldquo;{action.text}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => copyNudge(action.text)}
                    className="w-fit min-h-10 rounded-lg border border-[#003087] px-3 text-xs font-semibold text-[#003087] transition hover:bg-[#003087] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
                  >
                    {copiedNudge === action.text ? "Copied" : "Copy nudge"}
                  </button>
                </div>
              ) : (
                "A payout was prepared for this cycle."
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <label htmlFor="assistant-message" className="sr-only">
          Message the assistant
        </label>
        <textarea
          id="assistant-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder="Ask about a circle, a payment or a payout"
          className="min-h-11 flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus-visible:border-[#0070e0] focus-visible:ring-2 focus-visible:ring-[#0070e0]"
        />
        <button
          type="submit"
          disabled={sending || draft.trim().length === 0}
          className="min-h-11 rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#001c64] disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
        >
          Send
        </button>
      </form>
    </div>
  );
}
