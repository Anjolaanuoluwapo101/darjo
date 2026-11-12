"use client";

import { useRef, useState } from "react";
import { friendlyError } from "@/components/forms/errorMessages";
import { inputClass, inputNormalClass } from "@/components/forms/fieldStyles";
import Button from "@/components/ui/Button";
import Notice from "@/components/ui/Notice";
import { cn } from "@/components/ui/cn";
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
        className="flex min-h-40 flex-col gap-3 overflow-y-auto rounded-2xl border border-line bg-surface-2 p-4"
        aria-live="polite"
        aria-label="Conversation with the D'arjo assistant"
      >
        {messages.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted">
            {circleName
              ? `Ask me anything about ${circleName}.`
              : "Ask me about your circles, payments or payouts."}
          </p>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col gap-1",
              message.role === "user" ? "items-end" : "items-start",
            )}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-soft">
              {message.role === "user" ? "You" : "Assistant"}
            </span>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-primary text-surface"
                  : "border border-line bg-surface text-ink",
              )}
            >
              {message.text}
            </div>
          </div>
        ))}

        {sending ? (
          <p role="status" className="text-sm text-muted">
            Thinking...
          </p>
        ) : null}
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggested.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => send(question)}
              className="min-h-10 rounded-full border border-line-strong bg-surface px-3.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
              className="rounded-xl border border-risky-line bg-risky-soft px-3.5 py-2.5 text-sm text-risky-ink"
            >
              {action.type === "nudge_drafted" ? (
                <div className="flex flex-col gap-2">
                  <span>Draft nudge ready: &ldquo;{action.text}&rdquo;</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyNudge(action.text)}
                    className="w-fit"
                  >
                    {copiedNudge === action.text ? "Copied" : "Copy nudge"}
                  </Button>
                </div>
              ) : (
                "A payout was prepared for this cycle."
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <Notice variant="error">{error}</Notice> : null}

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
          className={cn(inputClass, inputNormalClass, "min-h-11 flex-1 resize-none py-2.5")}
        />
        <Button
          type="submit"
          disabled={sending || draft.trim().length === 0}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
