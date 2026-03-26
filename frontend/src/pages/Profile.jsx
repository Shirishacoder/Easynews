import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar p-6">
      <div className="max-w-4xl mx-auto mt-10">
        <h1 className="text-4xl font-bold mb-4">Welcome back, {user?.name}</h1>
        
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Your Profile & Preferences</h2>
          <div className="space-y-3 text-gray-400">
            <p><strong className="text-white">Email:</strong> {user?.email}</p>
            <p><strong className="text-white">Language:</strong> {user?.languagePreference}</p>
            <div>
              <strong className="text-white">Interests:</strong>
              <div className="flex gap-2 mt-2 flex-wrap">
                {user?.interests?.map((interest, idx) => (
                  <span key={idx} className="bg-white/10 px-3 py-1 rounded-full text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={logout}
          className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          Logout
        </button>

        
      </div>
    </div>
  );
};

export default Profile;