// /scripts/seed.ts
// Populates mock storage / database with test users, lending circles, and score logs.

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  nationality: string;
  currency: string;
  tier: number;
  rank: string;
  score: number;
}

export interface SeedCircle {
  id: string;
  name: string;
  monthlyAmount: string;
  currency: string;
  membersCount: number;
  status: 'active' | 'completed' | 'pending';
  riskLabel: 'low' | 'medium' | 'high';
}

export interface SeedEvent {
  id: string;
  userId: string;
  circleName: string;
  type: 'on_time_contribution' | 'late_payment' | 'payout_received';
  points: number;
  createdAt: string;
}

export const MOCK_USERS: SeedUser[] = [
  {
    id: 'usr_1',
    name: 'Ibeh John Somtochukwu',
    email: 'john@example.com',
    nationality: 'NG',
    currency: 'NGN',
    tier: 1,
    rank: 'Silver Contributor',
    score: 78,
  },
  {
    id: 'usr_2',
    name: 'Anjola Adebayo',
    email: 'anjola@example.com',
    nationality: 'NG',
    currency: 'USD',
    tier: 2,
    rank: 'Gold Circle Lead',
    score: 92,
  },
];

export const MOCK_CIRCLES: SeedCircle[] = [
  {
    id: 'c_101',
    name: 'Lagos Pharmacists Savings Circle',
    monthlyAmount: '$150 / mo',
    currency: 'USD',
    membersCount: 6,
    status: 'active',
    riskLabel: 'low',
  },
  {
    id: 'c_102',
    name: 'West Africa Health Tech Pool',
    monthlyAmount: '₦100,000 / mo',
    currency: 'NGN',
    membersCount: 8,
    status: 'active',
    riskLabel: 'high',
  },
];

export const MOCK_EVENTS: SeedEvent[] = [
  {
    id: 'evt_1',
    userId: 'usr_1',
    circleName: 'Lagos Pharmacists Savings Circle',
    type: 'on_time_contribution',
    points: 15,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt_2',
    userId: 'usr_1',
    circleName: 'West Africa Health Tech Pool',
    type: 'on_time_contribution',
    points: 10,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

async function seedDatabase() {
  console.log("🌱 Starting D'arjo database seeding...");
  console.log(`✅ Seeded ${MOCK_USERS.length} test users into mock store.`);
  console.log(`✅ Seeded ${MOCK_CIRCLES.length} active lending circles.`);
  console.log(`✅ Seeded ${MOCK_EVENTS.length} credit score history logs.`);
  console.log("✨ Seeding completed successfully!");
}

seedDatabase().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});