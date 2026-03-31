import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import QuizHub from './pages/QuizHub';
import QuizPage from './pages/QuizPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboard from './pages/AdminDashboard';
import { supabase } from './supabase';
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactElement; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const stored = localStorage.getItem('ivc_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        const { data } = await supabase.auth.getUser();
        if (data.user) setUser(data.user);
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080c14' }}>
        <p className="font-display text-cyan-glow text-sm tracking-[0.5em] animate-pulse">INITIATING SYSTEM...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" />;
  if (adminOnly && user.role !== 'admin' && user.email !== 'admin@ivc.club') return <Navigate to="/quiz-hub" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/quiz-hub" element={<ProtectedRoute><QuizHub /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
