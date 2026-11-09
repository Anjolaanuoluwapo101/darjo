// /components/agent/AssistantDrawer.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Action {
  type: 'nudge_drafted' | 'payout_prepared';
  toUserId?: string;
  text?: string;
  payoutId?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actions?: Action[];
  isError?: boolean;
}

interface AssistantDrawerProps {
  circleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  circleId,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hi! I'm your assistant for Circle ${circleId}. Ask me to check unpaid balances, draft reminders, or prepare payouts.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const QUICK_CHIPS = [
    'Who has not paid?',
    'Explain my score',
    'Draft a reminder',
    'Prepare the payout',
  ];

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (query.toLowerCase().includes('error')) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            text: 'Connection failed. Please retry.',
            isError: true,
          },
        ]);
        return;
      }

      let responseText = '';
      let responseActions: Action[] = [];
      const lower = query.toLowerCase();

      if (lower.includes('paid') || lower.includes('who has not')) {
        responseText = `Tunde is 3 days late on Circle ${circleId}.`;
        responseActions = [
          {
            type: 'nudge_drafted',
            toUserId: 'u3',
            text: `Hi Tunde, your payment for Circle ${circleId} is due.`,
          },
        ];
      } else if (lower.includes('payout') || lower.includes('prepare')) {
        responseText = `Payout p1 is prepared for Circle ${circleId}.`;
        responseActions = [
          {
            type: 'payout_prepared',
            payoutId: 'p1',
          },
        ];
      } else {
        responseText = `Your score is protected while payments are on schedule in Circle ${circleId}.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: responseText,
          actions: responseActions,
        },
      ]);
    }, 800);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md h-[80vh] bg-white rounded-t-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Circle AI Assistant</h3>
            <p className="text-xs text-gray-500">Circle ID: {circleId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Safety Disclaimer */}
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[11px] text-amber-900 font-medium">
          ⚠️ Assistant can draft/prepare actions but <strong>never moves money</strong>.
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.isError
                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-none'
                    : msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.text}
                {msg.isError && (
                  <button
                    onClick={() => handleSendMessage('Retry')}
                    className="mt-2 block text-xs bg-red-600 text-white px-2.5 py-1 rounded font-medium"
                  >
                    Try again
                  </button>
                )}
              </div>

              {msg.actions &&
                msg.actions.map((act, i) => {
                  const actionKey = `${msg.id}-${i}`;
                  if (act.type === 'nudge_drafted' && act.text) {
                    return (
                      <div key={i} className="mt-2 w-full max-w-[85%] bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                        <span className="font-bold text-amber-900 block">Nudge Drafted</span>
                        <p className="text-amber-800 italic">"{act.text}"</p>
                        <button
                          onClick={() => handleCopyText(act.text!, actionKey)}
                          className="w-full py-1 bg-amber-600 text-white rounded font-medium"
                        >
                          {copiedIndex === actionKey ? 'Copied! ✓' : 'Copy Nudge'}
                        </button>
                      </div>
                    );
                  }
                  if (act.type === 'payout_prepared') {
                    return (
                      <div key={i} className="mt-2 w-full max-w-[85%] bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs space-y-2">
                        <span className="font-bold text-blue-900 block">Payout Prepared</span>
                        <Link
                          href={`/circles/${circleId}`}
                          className="block text-center w-full py-1 bg-blue-600 text-white rounded font-medium"
                        >
                          Open /circles/{circleId}
                        </Link>
                      </div>
                    );
                  }
                  return null;
                })}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-1 bg-white border rounded-2xl px-3 py-2 text-xs text-gray-500 w-max">
              Thinking...
            </div>
          )}
        </div>

        {/* Quick Chips */}
        <div className="p-2 bg-white border-t flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="whitespace-nowrap px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask assistant..."
            className="flex-1 border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSendMessage()}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-xl"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};