import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const categories = [
  "Technology",
  "Business",
  "Finance",
  "Startups",
  "Economy",
  "Politics",
  "Sports",
  "Entertainment",
  "Health",
  "Science",
  "General"
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [trendingNews, setTrendingNews] = useState([]);
  const [activities, setActivities] = useState([]);

  // 🔥 Fetch trending news
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/news/recent");
        const data = await res.json();
        setTrendingNews(data || []);
      } catch (err) {
        console.error("Trending error:", err);
      }
    };

    fetchTrending();
  }, []);

  // 🔥 Fetch activity preview
  useEffect(() => {
    if (!user) return;

    const fetchActivity = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/activity/${user._id}?limit=3`,
          { credentials: "include" }
        );
        const data = await res.json();
        setActivities(data || []);
      } catch (err) {
        console.error("Activity error:", err);
      }
    };

    fetchActivity();
  }, [user]);

  // 🔍 Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/news?search=${search}`);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 text-white">
       {/* TOP LEFT HEADER */}
<div className="fixed top-5 left-5 z-[999] flex items-center gap-3">


  {/* ✅ ALWAYS VISIBLE LOGO */}

</div>


      <div className="max-w-5xl mx-auto space-y-8">

        {/* 🔍 SEARCH */}
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="🔍 Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 outline-none"
          />
        </form>

        {/* 🔥 TRENDING CATEGORIES */}
        <div>
          <h2 className="text-xl font-semibold mb-3">🔥 Categories</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => navigate(`/trending?category=${cat}`)}
                className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-white hover:text-black transition whitespace-nowrap"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 📰 TRENDING NEWS */}
        <div>
          <h2 className="text-xl font-semibold mb-3">🔥 Trending Now</h2>

          <div className="space-y-4">
            {trendingNews.slice(0, 5).map(article => (
              <div
                key={article._id}
                className="bg-zinc-900 border border-white/10 p-4 rounded-xl flex justify-between gap-4 hover:bg-zinc-800 transition cursor-pointer"
                onClick={() => window.open(article.url, "_blank")}
              >
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-sm text-gray-400 mt-1">
                      {article.description}
                    </p>
                  )}
                </div>

                {article.image && (
                  <img
                    src={article.image}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 🕒 ACTIVITY PREVIEW */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">🕒 Your Activity</h2>
            <button
              onClick={() => navigate("/activity")}
              className="text-sm text-blue-400"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {activities.length === 0 && (
              <p className="text-gray-500">No activity yet</p>
            )}

            {activities.map(act => {
              const article = act.articleSnapshot || act.articleId;
              if (!article) return null;

              return (
                <div
                  key={act._id}
                  className="bg-zinc-900 p-3 rounded-lg flex justify-between"
                >
                  <div>
                    <p className="text-sm text-gray-400">
                      {act.actionType.toUpperCase()}
                    </p>
                    <p className="text-sm">
                      {article.title || "No Title"}
                    </p>
                  </div>

                  {article.image && (
                    <img
                      src={article.image}
                      className="w-16 h-16 rounded object-cover"
                      alt=""
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default Home;