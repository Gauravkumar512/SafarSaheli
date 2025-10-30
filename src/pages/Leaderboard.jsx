import { demoLeaderboard } from '../../demoData';
import { FiAward } from 'react-icons/fi';

export default function Leaderboard() {
  const sorted = [...demoLeaderboard].sort((a,b)=>b.points-a.points);
  
  const getRankColor = (index) => {
    if (index === 0) return 'from-yellow-400 to-orange-500';
    if (index === 1) return 'from-gray-300 to-gray-400';
    if (index === 2) return 'from-amber-600 to-yellow-600';
    return 'from-gray-200 to-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
      <div className="p-6 pb-24 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
              <FiAward />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-gray-600">Top contributor in the community</p>
            </div>
          </div>
        </div>

        {/* Top Contributor Card */}
        <div className="bg-white rounded-3xl shadow-md border border-pink-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Top Contributor</h2>
            <p className="text-gray-600">Recognizing the highest points earner</p>
          </div>
          {sorted[0] ? (
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-pink-500">
                    <FiAward />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{sorted[0].name}</div>
                    <div className="text-sm text-gray-600">ID: {sorted[0].id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-pink-600">{sorted[0].points}</div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-gray-600">No contributors yet.</div>
          )}
        </div>

        {/* Compact Top 10 List */}
        <div className="bg-white rounded-3xl shadow-md border border-pink-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Top 10</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {sorted.slice(0, 10).map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-pink-500 bg-pink-50 border border-pink-200">{index + 1}</div>
                  <div className="font-semibold text-gray-900">{user.name}</div>
                </div>
                <div className="text-pink-600 font-bold">{user.points}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}