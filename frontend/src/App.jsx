import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import News from './pages/News';
import SplashScreen from './pages/SplashScreen';
import AuthPage from './pages/AuthPage';
import Onboarding from './pages/Onboarding';
import ActivityPage from './pages/Activity';
import ArticlePage from "./pages/ArticlePage";
import Trending from './pages/Trending';
import Profile from './pages/Profile';
import { useState } from "react";

import StoryArc from "./pages/StoryArc";
import Header from "./components/Header";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a simple spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Main layout for dashboard pages
const DashboardLayout = ({ children, showSidebar }) => {
  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      <Sidebar showSidebar={showSidebar} /> 

      <main className="flex-1 h-full relative">
        {children}
      </main>
    </div>
  );
};
function App() {
   const [showSidebar, setShowSidebar] = useState(false);
  return (
    
    <AuthProvider>
      <Router>
        <Header
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<AuthPage />} />
          
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />

          <Route path="/home" element={
  <ProtectedRoute>
    <DashboardLayout showSidebar={showSidebar}>
      <Home />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/news" element={
  <ProtectedRoute>
    <DashboardLayout showSidebar={showSidebar}>
      <News />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/activity" element={
  <ProtectedRoute>
    <DashboardLayout showSidebar={showSidebar}>
      <ActivityPage />
    </DashboardLayout>
  </ProtectedRoute>
} />

<Route path="/trending" element={
  <ProtectedRoute>
    <DashboardLayout showSidebar={showSidebar}>
      <Trending />
    </DashboardLayout>
  </ProtectedRoute>
} />
<Route path="/story/:topic" element={<StoryArc />} />
<Route path="/profile" element={
  <ProtectedRoute>
    <DashboardLayout showSidebar={showSidebar}>
      <Profile />
    </DashboardLayout>
  </ProtectedRoute>
} />
    <Route path="/article/:id" element={<ArticlePage />} />
  


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;