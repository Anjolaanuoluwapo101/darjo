// Talks to Gemini and runs the tool loop. A model failure must never break the screen,
// so every failure ends with a friendly fallback reply.
import { GoogleGenAI } from '@google/genai';
import type { Content } from '@google/genai';
import { AGENT_SYSTEM_PROMPT } from './prompt';
import { agentTools } from './tools';
import type { AgentAction } from '@/types/api';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 15000);
const MAX_ROUNDS = 5;

export const FALLBACK_REPLY =
  'I could not reach the assistant just now. Your circles, payments and payouts are still working normally.';

export interface AgentResult {
  reply: string;
  actions: AgentAction[];
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('The assistant took too long to answer.')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function runAgent(input: {
  userId: string;
  message: string;
  circleId?: string;
}): Promise<AgentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { reply: FALLBACK_REPLY, actions: [] };

  const ai = new GoogleGenAI({ apiKey });
  const deadline = Date.now() + TIMEOUT_MS;
  const actions: AgentAction[] = [];
  const contents: Content[] = [
    {
      role: 'user',
      parts: [
        {
          text: `Person asking: user id ${input.userId}.${input.circleId ? ` Circle in focus: ${input.circleId}.` : ''}\nMessage: ${input.message}`,
        },
      ],
    },
  ];

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const left = deadline - Date.now();
      if (left <= 0) return { reply: FALLBACK_REPLY, actions };
      const response = await withTimeout(
        ai.models.generateContent({
          model: MODEL,
          contents,
          config: {
            systemInstruction: AGENT_SYSTEM_PROMPT,
            temperature: 0.4,
            tools: [{ functionDeclarations: agentTools.map((t) => t.declaration) }],
          },
        }),
        left,
      );

      const calls = response.functionCalls ?? [];
      if (calls.length === 0) {
        const reply = (response.text ?? '').trim();
        return { reply: reply || FALLBACK_REPLY, actions };
      }

      const parts: Content['parts'] = [];
      for (const call of calls) {
        const name = call.name ?? '';
        const tool = agentTools.find((t) => t.declaration.name === name);
        let payload: Record<string, unknown>;
        if (!tool) {
          payload = { error: 'That tool is not available.' };
        } else {
          const result = await tool.run((call.args ?? {}) as Record<string, unknown>, {
            userId: input.userId,
            circleId: input.circleId,
          });
          payload = result.data;
          if (result.action) actions.push(result.action);
        }
        parts.push({
          functionResponse: {
            id: call.id ?? name,
            name,
            response: payload,
          },
        });
      }
      contents.push({ role: 'user', parts });
    }
    return { reply: 'That was a lot to check at once. Ask me about one circle at a time.', actions };
  } catch (e) {
    const status = (e as { status?: number })?.status;
    const message = e instanceof Error ? e.message : '';
    console.error('Agent error', e);
    if (status === 429)
      return { reply: 'The assistant is busy right now. Please try again in a moment.', actions };
    if (message.includes('took too long'))
      return { reply: 'That took too long to answer. Please try again with one question.', actions };
    return { reply: FALLBACK_REPLY, actions };
  }
}
