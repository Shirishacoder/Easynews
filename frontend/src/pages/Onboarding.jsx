import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const INTERESTS = [
  'Technology',
  'Business',
  'Finance',
  'Startups',
  'Economy',
  'Politics',
  'Sports',
  'Entertainment',
  'Health',
  'Science',
  'General'
];

const PROFESSIONS = [
  'Student',
  'Engineer',
  'Doctor',
  'Business',
  'Freelancer',
  'Developer',
  'Designer',
  'Other'
];

const Onboarding = () => {
  const [step, setStep] = useState(1);

  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [selectedProfession, setSelectedProfession] = useState('');

  useEffect(() => {
    if (onboardingComplete && user?.interests?.length > 0) {
      navigate('/home');
    }
  }, [onboardingComplete, user, navigate]);


  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => setStep(2);

  const handleSubmit = async () => {
    if (selectedInterests.length === 0) return;
    setIsSubmitting(true);
    try {
      const { data } = await axiosClient.post('/user/onboarding', {
      profession: selectedProfession,
        interests: selectedInterests,
      });
      console.log('Onboarding data:', data);
      setUser(data);
      setOnboardingComplete(true);
      // Delay navigate for state update
      setTimeout(() => {
        navigate('/home');
      }, 100);
    } catch (error) {
      console.error('Onboarding error:', error.response?.data || error.message);
      alert(`Setup failed: ${error.response?.data?.message || 'Unknown error. Check console.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black text-white px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900/20 rounded-full blur-[100px]" />
      
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-lg bg-zinc-900/60 p-8 rounded-3xl border border-white/10 backdrop-blur-xl"
      >
        <div className="mb-8">
          <div className="flex gap-2 mb-2">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/20'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/20'}`} />
          </div>
          <p className="text-gray-400 text-sm font-medium">Step {step} of 2</p>
        </div>

        {step === 1 ? (
          <div>
            <h2 className="text-3xl font-bold mb-2">Choose Profession</h2>
<p className="text-gray-400 mb-8">What best describes you?</p>

<div className="grid grid-cols-2 gap-4">
  {PROFESSIONS.map((prof) => (
    <button
      key={prof}
      onClick={() => setSelectedProfession(prof)}
      className={`py-4 rounded-xl border-2 font-medium transition-all ${
        selectedProfession === prof
          ? 'border-white bg-white text-black'
          : 'border-white/10 bg-white/5 text-white hover:border-white/30'
      }`}
    >
      {prof}
    </button>
  ))}
</div>
          
          <button
  onClick={handleNext}
  disabled={!selectedProfession}
  className={`mt-10 w-full py-4 font-semibold rounded-xl ${
    selectedProfession
      ? 'bg-white text-black hover:bg-gray-200'
      : 'bg-white/20 text-white/50 cursor-not-allowed'
  }`}
>
  Continue
</button>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-bold mb-2">Select Interests</h2>
            <p className="text-gray-400 mb-8">Pick 1 or more topics you care about.</p>
            
            <div className="flex flex-wrap gap-3">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-5 py-2.5 rounded-full border transition-all ${
                    selectedInterests.includes(interest)
                      ? 'border-white bg-white text-black font-semibold'
                      : 'border-white/20 bg-transparent text-gray-300 hover:border-white/50'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-4 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedInterests.length === 0 || isSubmitting}
                className={`w-2/3 py-4 font-semibold rounded-xl transition-colors ${
                  selectedInterests.length > 0
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-white/20 text-white/50 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Finish Setup'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Onboarding;
