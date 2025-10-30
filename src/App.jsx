import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Home from './pages/Home';
import TripPlanner from './pages/TripPlanner';
import Safety from './pages/Safety';
import SOS from './pages/SOS';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Saheli from './pages/Saheli';
import RootLayout from './navigation/RootLayout';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route element={<RootLayout />}> 
            <Route path="/home" element={<Home />} />
            <Route path="/trip" element={<TripPlanner />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/sos" element={<SOS />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/saheli" element={<Saheli />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}