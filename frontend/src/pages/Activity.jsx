import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const ActivityPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('like');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const tabs = ['like', 'save', 'comment', 'view'];

  // 🔥 Fetch activities
  const fetchActivities = useCallback(async (tab, pageNum = 1) => {
    if (!user) return [];

    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: tab,
        page: pageNum,
        limit: 10
      });

      const res = await fetch(
        `http://localhost:5000/api/activity/${user._id}?${params}`,
        { credentials: 'include' }
      );

      const data = await res.json();
      console.log("Activities:", data);
      return data;
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 🔄 Load first page
  useEffect(() => {
    fetchActivities(activeTab, 1).then(data => {
      setActivities(data || []);
      setPage(1);
      setHasMore(true);
    });
  }, [activeTab, fetchActivities]);

  // ➕ Load more
  const loadMore = async () => {
    const nextPage = page + 1;
    const newData = await fetchActivities(activeTab, nextPage);

    if (newData.length > 0) {
      setActivities(prev => [...prev, ...newData]);
      setPage(nextPage);
      if (newData.length < 10) setHasMore(false);
    } else {
      setHasMore(false);
    }
  };

  // 🕒 Relative time
  const RelativeTime = ({ timestamp }) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return <span>Just now</span>;
    if (mins < 60) return <span>{mins}m ago</span>;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return <span>{hours}h ago</span>;

    return <span>{Math.floor(hours / 24)}d ago</span>;
  };

  // ❌ Delete activity
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/activity/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      setActivities(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // 🔐 Safety
  if (!user) return null;

  return (
    <div className="h-full w-full overflow-y-auto p-6 text-white">
      <div className="max-w-4xl mx-auto mt-10">

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6">Your Activity</h1>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Activities */}
        <div className="space-y-4">
          {activities
            .filter(a => a.articleId || a.articleSnapshot)
            .map(activity => {
              const article = activity.articleSnapshot || activity.articleId;
              if (!article) return null;

              return (
                <div key={activity._id} className="bg-zinc-900 p-4 rounded-xl border border-white/10">

                  {/* Top */}
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 text-sm">
                      {activity.actionType.toUpperCase()} • <RelativeTime timestamp={activity.timestamp} />
                    </span>

                    <button
                      onClick={() => handleDelete(activity._id)}
                      className="text-red-400 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Comment */}
                  {activity.commentText && (
                    <p className="text-gray-400 italic mb-2">
                      "{activity.commentText}"
                    </p>
                  )}

                  {/* News */}
                  <div className="flex justify-between items-center gap-4 bg-zinc-800 p-3 rounded-lg">

                    <div className="flex-1">
                      <h2 className="font-semibold">
                        {article.title || "No Title"}
                      </h2>

                      {article.description && (
                        <p className="text-sm text-gray-400 mt-1">
                          {article.description}
                        </p>
                      )}
                    </div>

                    {article.image && (
                      <img
                        src={article.image}
                        alt="news"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Loading */}
        {loading && <p className="text-center text-gray-500 mt-4">Loading...</p>}

        {/* Load More */}
        {hasMore && !loading && (
          <button
            onClick={loadMore}
            className="block mx-auto mt-6 bg-white/10 px-6 py-2 rounded-lg"
          >
            Load More
          </button>
        )}

        {!hasMore && activities.length > 0 && (
          <p className="text-center text-gray-500 mt-6">No more activities</p>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;