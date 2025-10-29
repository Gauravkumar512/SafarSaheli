import { Link } from 'react-router-dom';

export default function Home() {
  const cards = [
    { to: '/trip', title: 'Trip Planner', color: 'from-blue-500 to-cyan-500' },
    { to: '/safety', title: 'Safety & Hygiene', color: 'from-emerald-500 to-lime-500' },
    { to: '/sos', title: 'SOS', color: 'from-rose-500 to-pink-500' },
    { to: '/leaderboard', title: 'Leaderboard', color: 'from-violet-500 to-purple-500' },
    { to: '/profile', title: 'Profile', color: 'from-amber-500 to-orange-500' },
  ];
  return (
    <div className="p-4 pb-24 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Welcome back</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className={`rounded-2xl p-4 text-white bg-gradient-to-br ${c.color} shadow hover:shadow-lg transition`}> 
            <div className="text-lg font-medium">{c.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
