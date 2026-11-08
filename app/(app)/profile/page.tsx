// /app/(app)/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfile } from '@/lib/api-client';
import { ScoreRing } from '@/components/profile/ScoreRing';

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const res = await getProfile();
      if (res.ok) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to load profile');
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading profile...</div>;
  if (error) return <div className="p-4 text-red-600 text-center">{error}</div>;

  const { user, nextTier, events, circles } = data;

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      {/* User Info Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
        <p className="text-sm text-gray-500">{user.email} • {user.nationality} ({user.currency})</p>
        <p className="text-xs font-semibold text-blue-600">Tier {user.tier} {user.rank ? `• ${user.rank}` : ''}</p>
      </div>

      {/* D'arjo Score Ring */}
      <div className="flex justify-center py-2">
        <ScoreRing score={user.score} />
      </div>

      {/* Next Tier Requirement */}
      {nextTier && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-blue-900">Next Target: Tier {nextTier.tier}</p>
          <p className="text-blue-700">{nextTier.requirement}</p>
        </div>
      )}

      {/* Trigger to Assistant */}
      <Link 
        href="/assistant" 
        className="block w-full text-center py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
      >
        Ask the assistant to explain my score
      </Link>

      {/* User Circles */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">My Circles</h2>
        {circles.length === 0 ? (
          <p className="text-sm text-gray-500">Not in any circle yet.</p>
        ) : (
          <div className="space-y-2">
            {circles.map((c: any) => (
              <Link key={c.id} href={`/circles/${c.id}`} className="block p-3 border rounded-lg hover:border-blue-500">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase">{c.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Score History */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Score History</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">Every on-time payment builds your D'arjo score.</p>
        ) : (
          <div className="space-y-2">
            {events.map((evt: any) => (
              <div key={evt.id} className="flex justify-between items-center p-3 border rounded-lg text-sm">
                <div>
                  <p className="font-medium capitalize text-gray-800">{evt.type.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{evt.circleName} • {new Date(evt.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`font-bold ${evt.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {evt.points >= 0 ? `+${evt.points}` : evt.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


