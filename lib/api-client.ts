// Screens call these functions and never fetch() directly. Only Anjola edits this file.
// With NEXT_PUBLIC_USE_MOCKS=true every function returns sample data from /mocks.
import type {
  ApiResult, User, CircleSummary, CircleDetail, Payment, Payout, ProfileData, AgentAction,
  SignupBody, LoginBody, CreateCircleBody, JoinBody, ChatBody,
} from '@/types/api';
import meMock from '@/mocks/me.json';
import circlesMock from '@/mocks/circles.json';
import circleDetailMock from '@/mocks/circle-detail.json';
import circleDetailNonMemberMock from '@/mocks/circle-detail-nonmember.json';
import circleDetailUnpaidMock from '@/mocks/circle-detail-unpaid.json';
import profileMock from '@/mocks/profile.json';
import chatMock from '@/mocks/chat.json';
import startPaymentMock from '@/mocks/start-payment.json';
import capturePaymentMock from '@/mocks/capture-payment.json';
import releasePayoutMock from '@/mocks/release-payout.json';

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

// Screens are Client Components; calling these during a server render means the
// component is missing "use client". Fail loudly instead of quietly throwing.
const MOCK_CIRCLES = circlesMock.circles as unknown as CircleSummary[];

// Demo circle variants so screens can show a non-member viewer (c3) or a
// member who has not paid this cycle (c4). Any other id keeps the default.
const MOCK_CIRCLE_DETAILS: Record<string, unknown> = {
  c3: circleDetailNonMemberMock,
  c4: circleDetailUnpaidMock,
};

async function http<T>(path: string, method = 'GET', body?: unknown): Promise<ApiResult<T>> {
  if (typeof window === 'undefined') {
    throw new Error(
      'lib/api-client is client-only. Add "use client" to the component that calls it.',
    );
  }
  try {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: { code: 'NETWORK', message: 'Could not reach the server' } };
  }
}

const mock = <T>(data: unknown): Promise<ApiResult<T>> =>
  Promise.resolve({ ok: true, data: data as T });

export const signup = (b: SignupBody) =>
  USE_MOCKS ? mock<{ user: User }>(meMock) : http<{ user: User }>('/api/auth/signup', 'POST', b);
export const login = (b: LoginBody) =>
  USE_MOCKS ? mock<{ user: User }>(meMock) : http<{ user: User }>('/api/auth/login', 'POST', b);
export const logout = () =>
  USE_MOCKS ? mock<Record<string, never>>({}) : http<Record<string, never>>('/api/auth/logout', 'POST');
export const getMe = () =>
  USE_MOCKS ? mock<{ user: User }>(meMock) : http<{ user: User }>('/api/me');

export const listCircles = (params?: { risk?: 'safe' | 'risky' }) =>
  USE_MOCKS
    ? mock<{ circles: CircleSummary[] }>({
        circles: MOCK_CIRCLES.filter((circle) => !params?.risk || circle.risk === params.risk),
      })
    : http<{ circles: CircleSummary[] }>(`/api/circles${params?.risk ? `?risk=${params.risk}` : ''}`);
export const createCircle = (b: CreateCircleBody) =>
  USE_MOCKS ? mock<{ circle: CircleDetail }>(circleDetailMock) : http<{ circle: CircleDetail }>('/api/circles', 'POST', b);
export const getCircle = (id: string) =>
  USE_MOCKS
    ? mock<{ circle: CircleDetail }>(MOCK_CIRCLE_DETAILS[id] ?? circleDetailMock)
    : http<{ circle: CircleDetail }>(`/api/circles/${id}`);
export const joinCircle = (b: JoinBody) =>
  USE_MOCKS ? mock<{ circle: CircleDetail }>(circleDetailMock) : http<{ circle: CircleDetail }>('/api/circles/join', 'POST', b);

export const startPayment = (circleId: string) =>
  USE_MOCKS
    ? mock<{ orderId: string; amountCents: number; currency: 'USD' }>(startPaymentMock)
    : http<{ orderId: string; amountCents: number; currency: 'USD' }>(`/api/circles/${circleId}/pay`, 'POST');
// Mock mode only covers the settled happy path (paid / released). The real API
// can return pending or prepared states while a PayPal webhook is still in flight.
export const capturePayment = (circleId: string, orderId: string) =>
  USE_MOCKS
    ? mock<{ payment: Payment }>(capturePaymentMock)
    : http<{ payment: Payment }>(`/api/circles/${circleId}/pay/capture`, 'POST', { orderId });
export const releasePayout = (circleId: string) =>
  USE_MOCKS
    ? mock<{ payout: Payout }>(releasePayoutMock)
    : http<{ payout: Payout }>(`/api/circles/${circleId}/payout/release`, 'POST');

export const getProfile = () =>
  USE_MOCKS ? mock<ProfileData>(profileMock) : http<ProfileData>('/api/me/profile');
export const chatWithAgent = (b: ChatBody) =>
  USE_MOCKS
    ? mock<{ reply: string; actions: AgentAction[] }>(chatMock)
    : http<{ reply: string; actions: AgentAction[] }>('/api/agent/chat', 'POST', b);
