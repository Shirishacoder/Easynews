import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const seenSplash = localStorage.getItem('seenSplash') === 'true';
      
      if (seenSplash) {
        // Skip animation, instant redirect
        if (user) {
          if (user.interests?.length === 0) {
            navigate('/onboarding');
          } else {
            navigate('/home');
          }
        } else {
          navigate('/login');
        }
        return;
      }

      // First time: show splash for 2.5s
      const timer = setTimeout(() => {
        localStorage.setItem('seenSplash', 'true');
        if (user) {
          if (user.interests?.length === 0) {
            navigate('/onboarding');
          } else {
            navigate('/home');
          }
        } else {
          navigate('/login');
        }
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [loading, user, navigate]);

  return (
    <div className="flex items-center justify-center h-screen w-full bg-black text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-white text-black flex items-center justify-center rounded-2xl text-4xl font-bold mb-4">
          E
        </div>
        <h1 className="text-4xl font-bold tracking-tight">EasyNews</h1>
        <p className="text-gray-400 mt-2">Your AI-powered news digest</p>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
