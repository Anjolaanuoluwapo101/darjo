// Screens call these functions and never fetch() directly. Only Anjola edits this file.
// With NEXT_PUBLIC_USE_MOCKS=true every function returns sample data from /mocks.
import type {
  ApiResult, User, CircleSummary, CircleDetail, Payment, Payout, ProfileData, AgentAction,
  SignupBody, LoginBody, CreateCircleBody, JoinBody, ChatBody,
  NotificationPage, PushSubscriptionBody, PayoutHubData, MatchData,
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
import notificationsMock from '@/mocks/notifications.json';
import payoutsMock from '@/mocks/payouts.json';
import matchMock from '@/mocks/match.json';

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

// Builds "?a=b&c=d" (or "" when there is nothing to send).
function query(params: Record<string, string>): string {
  const search = new URLSearchParams(params).toString();
  return search ? `?${search}` : '';
}

export const signup = (b: SignupBody) =>
  USE_MOCKS ? mock<{ user: User }>(meMock) : http<{ user: User }>('/api/auth/signup', 'POST', b);
export const login = (b: LoginBody) =>
  USE_MOCKS ? mock<{ user: User }>(meMock) : http<{ user: User }>('/api/auth/login', 'POST', b);
export const logout = () =>
  USE_MOCKS ? mock<Record<string, never>>({}) : http<Record<string, never>>('/api/auth/logout', 'POST');
export const getMe = () =>
  USE_MOCKS ? mock<{ user: User }>(meMock) : http<{ user: User }>('/api/me');

export const listCircles = (params?: { risk?: 'safe' | 'risky'; mine?: boolean }) =>
  USE_MOCKS
    ? mock<{ circles: CircleSummary[] }>({
        circles: MOCK_CIRCLES.filter((circle) => !params?.risk || circle.risk === params.risk),
      })
    : http<{ circles: CircleSummary[] }>(
        `/api/circles${query({
          ...(params?.risk ? { risk: params.risk } : {}),
          ...(params?.mine ? { mine: '1' } : {}),
        })}`,
      );
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

export interface VolatilityReading {
  currency: string;
  score: number;
  label: 'low' | 'medium' | 'high';
  asOf: string;
  source: 'live' | 'fallback';
}

export const getVolatility = (currency?: string) =>
  USE_MOCKS
    ? mock<VolatilityReading>({
        currency: currency ?? 'USD',
        score: 0,
        label: 'low',
        asOf: new Date().toISOString(),
        source: 'fallback',
      })
    : http<VolatilityReading>(
        `/api/fx/volatility${currency ? `?currency=${encodeURIComponent(currency)}` : ''}`,
      );
export const chatWithAgent = (b: ChatBody) =>
  USE_MOCKS
    ? mock<{ reply: string; actions: AgentAction[] }>(chatMock)
    : http<{ reply: string; actions: AgentAction[] }>('/api/agent/chat', 'POST', b);

export const getNotifications = (params?: {
  cursor?: string | null;
  limit?: number;
  unread?: boolean;
}) =>
  USE_MOCKS
    ? mock<NotificationPage>(notificationsMock)
    : http<NotificationPage>(
        `/api/notifications${query({
          ...(params?.cursor ? { cursor: params.cursor } : {}),
          ...(params?.limit ? { limit: String(params.limit) } : {}),
          ...(params?.unread ? { unread: '1' } : {}),
        })}`,
      );
export const markNotificationsRead = (body: { ids?: string[]; all?: boolean }) =>
  USE_MOCKS
    ? mock<{ updated: number }>({ updated: body.all ? 2 : body.ids?.length ?? 0 })
    : http<{ updated: number }>('/api/notifications/read', 'POST', body);
export const subscribePush = (body: PushSubscriptionBody) =>
  USE_MOCKS
    ? mock<{ subscribed: boolean }>({ subscribed: true })
    : http<{ subscribed: boolean }>('/api/push/subscribe', 'POST', body);
export const unsubscribePush = (endpoint: string) =>
  USE_MOCKS
    ? mock<{ subscribed: boolean }>({ subscribed: false })
    : http<{ subscribed: boolean }>('/api/push/subscribe', 'DELETE', { endpoint });
export const getPayouts = () =>
  USE_MOCKS
    ? mock<PayoutHubData>(payoutsMock)
    : http<PayoutHubData>('/api/payouts');
export const releasePayoutById = (payoutId: string) =>
  USE_MOCKS
    ? mock<{ payout: Payout }>(releasePayoutMock)
    : http<{ payout: Payout }>(`/api/payouts/${payoutId}/release`, 'POST');
export const getMatches = (body: {
  contributionCents?: number;
  frequency?: 'weekly' | 'monthly';
  risk?: 'safe' | 'risky';
} = {}) =>
  USE_MOCKS ? mock<MatchData>(matchMock) : http<MatchData>('/api/match', 'POST', body);
