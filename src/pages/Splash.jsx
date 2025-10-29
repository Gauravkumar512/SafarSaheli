import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => navigate('/login', { replace: true }), 1200);
    return () => clearTimeout(timer);
  }, [navigate]);
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-500 to-purple-600">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold">SafarSaheli</h1>
        <p className="opacity-90 mt-2">Travel safe. Explore freely.</p>
      </div>
    </div>
  );
}
