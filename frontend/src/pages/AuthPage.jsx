import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const AuthPage = () => {
  const { loginWithGoogle, setUser } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin ? { email, password } : { name, email, password };
      
      const { data } = await axiosClient.post(endpoint, payload);
      setUser(data);
      if (!isLogin || (data.interests && data.interests.length === 0)) {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black text-white relative overflow-hidden px-4">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-900/30 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 bg-zinc-900/60 p-8 sm:p-10 rounded-[2rem] border border-white/10 backdrop-blur-2xl w-full max-w-md flex flex-col items-center shadow-2xl"
      >
        <div className="w-16 h-16 bg-white text-black flex items-center justify-center rounded-2xl text-3xl font-bold mb-6 shadow-lg">
          E
        </div>
        
        <h2 className="text-3xl font-bold mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <p className="text-gray-400 text-center mb-8 text-sm px-4">
          Sign in to access your personalized news feed and preferences.
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3.5 px-6 rounded-xl hover:bg-gray-200 transition-colors mt-2 shadow-lg disabled:opacity-70"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="flex items-center w-full my-8 opacity-60">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-xs font-medium tracking-wider text-gray-400 uppercase">
            Or
          </span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        <button
          onClick={loginWithGoogle}
          type="button"
          className="flex items-center justify-center gap-3 w-full bg-white text-black font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-200 transition-colors shadow-lg"
        >
          <FcGoogle className="w-6 h-6" />
          Continue with Google
        </button>

        <div className="mt-8 text-sm text-gray-400 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="hover:text-white transition-colors underline underline-offset-4 decoration-white/30"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
