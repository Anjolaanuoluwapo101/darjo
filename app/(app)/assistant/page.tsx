
// /app/(app)/assistant/page.tsx
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

const MOCK_CIRCLES = [
  { id: 'c101', name: 'Lagos Pharmacists Circle' },
  { id: 'c102', name: 'West Africa Health Tech Pool' },
  { id: 'c103', name: 'Global RX Traders ROSCA' },
];

export default function AssistantPage() {
  const [selectedCircleId, setSelectedCircleId] = useState(MOCK_CIRCLES[0].id);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello! I'm your D'arjo assistant. Select a circle above and ask me to draft nudges, check non-payers, or prepare payouts.",
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

    // Simulated API response from chatWithAgent({ circleId, message })
    setTimeout(() => {
      setIsLoading(false);

      // Simulated error test for "error" query
      if (query.toLowerCase().includes('error')) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            text: 'Failed to process request. Please check your network connection.',
            isError: true,
          },
        ]);
        return;
      }

      let responseText = '';
      let responseActions: Action[] = [];

      const lower = query.toLowerCase();

      if (lower.includes('paid') || lower.includes('who has not')) {
        responseText = `Tunde has not paid yet for circle ${selectedCircleId} and is 3 days late. Want me to draft a nudge?`;
        responseActions = [
          {
            type: 'nudge_drafted',
            toUserId: 'u3',
            text: `Hi Tunde, your $100 contribution for circle ${selectedCircleId} is due. Please complete your payment to maintain your D'arjo score.`,
          },
        ];
      } else if (lower.includes('payout') || lower.includes('prepare')) {
        responseText = `Payout payout_p1 has been prepared for circle ${selectedCircleId}. The cycle winner can now release it on the circle detail page.`;
        responseActions = [
          {
            type: 'payout_prepared',
            payoutId: 'p1',
          },
        ];
      } else if (lower.includes('score')) {
        responseText = `Your D'arjo credit score is calculated based on on-time contributions across active circles. Maintaining zero late fees grants Tier 1 access.`;
      } else {
        responseText = `I've drafted a payment reminder for circle ${selectedCircleId}.`;
        responseActions = [
          {
            type: 'nudge_drafted',
            toUserId: 'u5',
            text: `Reminder: Contribution turn for circle ${selectedCircleId} is active. Please pay via PayPal checkout.`,
          },
        ];
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
    }, 1000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-md mx-auto bg-gray-50 border-x border-gray-200">
      {/* Header & Circle Selector */}
      <div className="p-3 bg-white border-b space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-gray-900 text-base">D'arjo AI Assistant</h1>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Online</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Active Circle:</label>
          <select
            value={selectedCircleId}
            onChange={(e) => setSelectedCircleId(e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-gray-800"
          >
            {MOCK_CIRCLES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Safety Notice Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-[11px] text-amber-900 flex items-center gap-1.5">
        <span className="font-bold">⚠️ Notice:</span>
        <span>The assistant can draft nudges and prepare payouts, but <strong>never moves money directly</strong>.</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

              {/* Error Try Again Button */}
              {msg.isError && (
                <button
                  onClick={() => handleSendMessage('Retry previous message')}
                  className="mt-2 block text-xs bg-red-600 text-white px-3 py-1 rounded font-medium hover:bg-red-700 transition"
                >
                  Try again
                </button>
              )}
            </div>

            {/* Action Cards */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="mt-2 w-full max-w-[85%] space-y-2">
                {msg.actions.map((act, i) => {
                  if (act.type === 'nudge_drafted' && act.text) {
                    const actionKey = `${msg.id}-${i}`;
                    return (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                        <span className="font-bold text-amber-900 block">Nudge Drafted (User ID: {act.toUserId})</span>
                        <p className="text-amber-800 italic">"{act.text}"</p>
                        <button
                          onClick={() => handleCopyText(act.text!, actionKey)}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition"
                        >
                          {copiedIndex === actionKey ? 'Copied to Clipboard! ✓' : 'Copy Nudge Text'}
                        </button>
                      </div>
                    );
                  }

                  if (act.type === 'payout_prepared') {
                    return (
                      <div key={i} className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs space-y-2">
                        <span className="font-bold text-blue-900 block font-semibold">Payout Prepared (ID: {act.payoutId})</span>
                        <p className="text-blue-800">
                          The payout has been prepared. The cycle winner can now release funds directly on the circle page.
                        </p>
                        <Link
                          href={`/circles/${selectedCircleId}`}
                          className="block text-center w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                        >
                          Open Circle Page (/circles/{selectedCircleId})
                        </Link>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 w-max">
            <span className="text-xs text-gray-500 font-medium">Assistant is thinking</span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {/* Quick Question Chips */}
      <div className="p-2 bg-white border-t flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="whitespace-nowrap px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-full transition border border-blue-200"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask assistant..."
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}