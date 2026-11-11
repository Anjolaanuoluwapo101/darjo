// Deterministic circle matching. The AI never invents candidates: it may only
// order and explain the rows this module has already validated and scored.
export interface MatchPreferences {
  contributionCents?: number;
  frequency?: 'weekly' | 'monthly';
  risk?: 'safe' | 'risky';
}

export interface ScorableCircle {
  tier: number;
  contributionCents: number;
  frequency: 'weekly' | 'monthly';
  memberLimit: number;
  memberCount: number;
  risk: 'safe' | 'risky';
  ownTier: boolean;
}

export interface ScoredCircle {
  score: number;
  reasons: string[];
}

const usd = (cents: number) => `$${(cents / 100).toFixed(0)}`;

export function scoreCircle(circle: ScorableCircle, prefs: MatchPreferences): ScoredCircle {
  let score = 15;
  const reasons: string[] = [];

  if (circle.ownTier) {
    score += 20;
    reasons.push('Same tier as you');
  } else {
    score += 10;
    reasons.push(`Tier ${circle.tier} circle`);
  }

  const seatsLeft = Math.max(circle.memberLimit - circle.memberCount, 0);
  if (seatsLeft === 1) {
    score += 5;
    reasons.push('1 seat left');
  } else if (seatsLeft >= 2) {
    score += 10;
    reasons.push(`${seatsLeft} seats left`);
  }

  if (typeof prefs.contributionCents === 'number') {
    const diff = Math.abs(circle.contributionCents - prefs.contributionCents);
    const points = Math.max(0, 25 - Math.floor(diff / 1000) * 3);
    score += points;
    if (diff === 0) reasons.push(`Matches your ${usd(circle.contributionCents)} contribution`);
    else if (points >= 15) reasons.push(`${usd(circle.contributionCents)} is close to your budget`);
    else reasons.push(`${usd(circle.contributionCents)} is outside your budget`);
  } else {
    score += 10;
  }

  if (prefs.frequency) {
    if (circle.frequency === prefs.frequency) {
      score += 15;
      reasons.push(`${circle.frequency} contributions`);
    } else {
      score += 5;
      reasons.push(`Pays ${circle.frequency}, not ${prefs.frequency}`);
    }
  } else {
    score += 8;
    reasons.push(`${circle.frequency} contributions`);
  }

  if (prefs.risk) {
    if (circle.risk === prefs.risk) {
      score += 15;
      reasons.push(circle.risk === 'safe' ? 'Low currency risk' : 'Higher risk as requested');
    } else {
      score += 5;
      reasons.push(circle.risk === 'safe' ? 'Low currency risk' : 'Higher currency risk');
    }
  } else {
    score += 8;
    reasons.push(circle.risk === 'safe' ? 'Low currency risk' : 'Higher currency risk');
  }

  return { score: Math.min(100, score), reasons };
}
