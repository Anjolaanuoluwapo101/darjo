// Shared contract between backend (Anjola) and frontend (B, C). Only Anjola edits this file.
export type Tier = 1 | 2 | 3 | 4;
export type VolatilityLabel = 'low' | 'medium' | 'high';

export interface User {
  id: string; name: string; email: string;
  nationality: string; // ISO country code, e.g. 'US'
  currency: string;    // ISO currency, e.g. 'USD'
  tier: Tier;
  rank: string | null; // null at tiers 1-3; cosmetic name above 4
  score: number;       // 0 to 100
}

export interface CircleSummary {
  id: string; name: string;
  tier: Tier; // = creator's tier
  contributionCents: number;
  frequency: 'weekly' | 'monthly';
  memberLimit: number; memberCount: number;
  status: 'open' | 'active' | 'completed';
  creatorName: string;
  nationalitiesInCircle: string[];
  risk: 'safe' | 'risky'; // computed for the viewer
  riskReason: string;
  ownTier: boolean;
}

export interface Member {
  userId: string; name: string; nationality: string;
  currency: string;    // ISO currency of the member, e.g. 'JPY'
  tier: Tier; rank: string | null;
  turnPosition: number;
  currentCycleStatus: 'paid' | 'pending' | 'late' | 'failed';
}

export interface Payout {
  id: string; circleId: string; cycle: number; winnerId: string;
  grossCents: number; feeCents: number; netCents: number;
  status: 'prepared' | 'released' | 'paid' | 'failed';
  // Rough value of the payout in the winner's own currency. PayPal does the
  // real conversion, so this is a guide and not a promise.
  localCurrency?: string; localAmount?: number; localFormatted?: string;
}

export interface CircleDetail extends CircleSummary {
  inviteCode: string;
  includedNationalities: string[];
  excludedNationalities: string[];
  currentCycle: number; totalCycles: number;
  potCents: number; paidThisCycleCents: number;
  members: Member[];
  currentWinnerId: string | null;
  payout: Payout | null;
  viewerPaidThisCycle: boolean;
  viewerIsCurrentWinner: boolean;
}

export interface Payment {
  id: string; circleId: string; cycle: number; userId: string;
  amountCents: number;
  status: 'pending' | 'paid' | 'late' | 'failed';
  paidAt: string | null;
}

export interface ScoreEvent {
  id: string;
  type: 'on_time' | 'late' | 'failed' | 'recovered';
  circleName: string; points: number; createdAt: string;
}

export type NotificationType =
  | 'payment_due' | 'payment_overdue' | 'payment_paid' | 'payment_failed'
  | 'nudge'
  | 'payout_ready' | 'payout_sent' | 'payout_paid' | 'payout_failed'
  | 'tier_up' | 'circle_filled' | 'cycle_started' | 'circle_completed';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  pushStatus: 'pending' | 'sent' | 'skipped' | 'failed';
  createdAt: string;
}

export interface NotificationPage {
  items: AppNotification[];
  unreadCount: number;
  nextCursor: string | null;
}

export interface PushSubscriptionBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

export interface PayoutHubItem extends Payout {
  circleName: string;
  winnerName: string;
  viewerRole: 'winner' | 'member';
  canRelease: boolean;
  releaseBlockedReason?: string;
}

export interface PayoutHubData {
  ready: PayoutHubItem[];
  history: PayoutHubItem[];
  totals: { readyNetCents: number; paidNetCents: number };
}

export interface MatchCandidate {
  circle: CircleSummary;
  inviteCode: string;
  score: number;
  reasons: string[];
  seatsLeft: number;
  joinPath: string;
}

export interface MatchSuggestion {
  name: string;
  contributionCents: number;
  frequency: 'weekly' | 'monthly';
  memberLimit: number;
  reason: string;
}

export interface MatchData {
  candidates: MatchCandidate[];
  summary: string;
  createSuggestion: MatchSuggestion | null;
}

export type AgentAction =
  | { type: 'nudge_drafted'; toUserId: string; text: string; circleId?: string }
  | { type: 'nudge_sent'; toUserId: string; circleId: string; text: string }
  | { type: 'payout_prepared'; payoutId: string };

export interface ProfileData {
  user: User;
  nextTier: { tier: Tier; requirement: string };
  events: ScoreEvent[];
  circles: { id: string; name: string; status: CircleSummary['status'] }[];
}

// Request bodies
export interface SignupBody { name: string; email: string; password: string; nationality: string }
export interface LoginBody { email: string; password: string }
export interface CreateCircleBody {
  name: string; contributionCents: number; frequency: 'weekly' | 'monthly';
  memberLimit: number; includedNationalities: string[]; excludedNationalities: string[];
}
export type JoinBody = { inviteCode: string } | { circleId: string };
export interface ChatBody { circleId?: string; message: string }

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
