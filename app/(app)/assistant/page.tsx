// /app/(app)/assistant/page.tsx
'use client';

import { useState } from 'react';
import { CircleDrawer } from '@/components/agent/CircleDrawer';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  type?: 'text' | 'nudge' | 'payout';
  data?: any;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello! I'm your D'arjo assistant. Ask me about your credit score, circle payout schedules, or draft a payment reminder nudge.",
    },
  ]);
  const [input, setInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);

  const QUICK_QUESTIONS = [
    'How do I raise my D\'arjo score?',
    'Show active circle details',
    'Draft a friendly payment nudge',
  ];

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');

    // Simulated AI response routing based on intent
    setTimeout(() => {
      let botResponse: Message;
      const lower = textToSend.toLowerCase();

      if (lower.includes('score')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: "Your D'arjo score increases by making on-time circle contributions. Tier 1 requires maintaining a score of 60+ over two payout cycles.",
        };
      } else if (lower.includes('circle') || lower.includes('details')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: "Here is your active circle profile card:",
          type: 'payout',
          data: {
            id: 'c-101',
            name: 'Lagos Pharmacists Savings Circle',
            amount: '$150 / mo',
            membersCount: 6,
            riskScore: 'Low Volatility (USD)',
            disclaimer: 'Payments processed directly via PayPal checkout.',
          },
        };
      } else if (lower.includes('nudge') || lower.includes('reminder')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: "I've drafted a gentle nudge for your upcoming circle turn:",
          type: 'nudge',
          data: {
            recipient: 'Circle Members',
            draft: "Hey team! Just a reminder that our contribution due date is coming up in 2 days. Let's keep our D'arjo scores strong!",
          },
        };
      } else {
        botResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: "I understand you're asking about: '" + textToSend + "'. Your payments are safe and tracked on your profile.",
        };
      }

      setMessages((prev) => [...prev, botResponse]);
    }, 600);
  };

  const openCircleDetails = (circleData: any) => {
    setSelectedCircle(circleData);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-md mx-auto bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <h1 className="font-bold text-lg text-gray-900">D'arjo AI Assistant</h1>
        <span className="text-xs bg-green-100 text-green-800 font-semibold px-2.5 py-0.5 rounded-full">Online</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>

            {/* Render Nudge Draft Card */}
            {msg.type === 'nudge' && msg.data && (
              <div className="mt-2 w-full max-w-[85%] bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                <span className="font-bold text-amber-900 block">Draft Nudge Card</span>
                <p className="text-amber-800 italic">"{msg.data.draft}"</p>
                <button
                  onClick={() => alert('Nudge sent to circle chat!')}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-xs transition"
                >
                  Send Nudge
                </button>
              </div>
            )}

            {/* Render Payout / Circle Card */}
            {msg.type === 'payout' && msg.data && (
              <div className="mt-2 w-full max-w-[85%] bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-sm">{msg.data.name}</span>
                  <span className="text-xs font-semibold text-blue-600">{msg.data.amount}</span>
                </div>
                <button
                  onClick={() => openCircleDetails(msg.data)}
                  className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium text-xs transition"
                >
                  Inspect Circle Drawer
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Question Chips */}
      <div className="p-2 bg-white border-t flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_QUESTIONS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="whitespace-nowrap px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-full transition border border-blue-200"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleSend()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Send
        </button>
      </div>

      {/* Slide-Up Circle Drawer */}
      <CircleDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        circleData={selectedCircle}
      />
    </div>
  );
}
