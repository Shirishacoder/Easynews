import React, { useEffect, useState, useRef, useCallback } from 'react';
import NewsCard from '../components/NewsCard';
import { useAuth } from '../context/AuthContext';

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  const observer = useRef();

  // 🔥 Infinite Scroll
  const lastArticleElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // 🔥 RESET when user changes (ONLY HERE)
  useEffect(() => {
    if (user?._id) {
      setArticles([]);
      setPage(1);
      setHasMore(true);
    } else {
      fetchRecentArticles();
    }
  }, [user?._id]);

  // 🔹 Guest mode
  const fetchRecentArticles = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/news/recent?t=${Date.now()}`
      );

      const data = await res.json();

      const formatted = data.map((item, index) => ({
        id: `recent-${index}`,
        articleId: item._id,
        title: item.title,
        summary: item.description,
        image: item.image || '/vite.svg',
        category: item.category,
        url: item.url
      }));

      setArticles(formatted);
      setHasMore(false);

    } catch (err) {
      setError('No articles available.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 MAIN ML FETCH (FIXED)
  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:5000/api/recommend/${user._id}?page=${page}&limit=5&t=${Date.now()}`
        );

        if (!res.ok) throw new Error("Fetch failed");

        const data = await res.json();

        if (data.length === 0) {
          setHasMore(false);
          return;
        }

        const formatted = data.map((item, index) => ({
          id: `${page}-${index}-${item._id}`,
          articleId: item._id,
          title: item.title,
          summary: item.description,
          image: item.image,
          category: item.category,
          url: item.url
        }));

        // 🔥 CRITICAL FIX
        setArticles(prev => {
          if (page === 1) {
            return [...formatted]; // replace completely
          }
          return [...prev, ...formatted];
        });

      } catch (err) {
        console.error(err);
        if (page === 1) setError('Error fetching personalized news.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, [user?._id, page]);

  // 🔥 FORCE REFRESH BUTTON (TEST / OPTIONAL)
  

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-xl">
        Loading news...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center mt-20 p-8 bg-red-500/10 rounded">
        {error}
      </div>
    );
  }

  if (articles.length === 0 && !loading) {
    return (
      <div className="text-gray-400 text-center mt-20">
        No news.{" "}
        <a href="http://localhost:5000/api/news/fetch-news" className="underline">
          Populate DB
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar relative">

      {/* 🔥 Optional Refresh Button */}
     

      {articles.map((news, index) => {
        if (articles.length === index + 1) {
          return (
            <div
              ref={lastArticleElementRef}
              key={news.id}
              className="snap-start w-full h-full shrink-0 relative"
            >
              <NewsCard news={news} userId={user?._id} />
              {loading && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                  Loading more...
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div key={news.id} className="snap-start w-full h-full shrink-0">
              <NewsCard news={news} userId={user?._id} />
            </div>
          );
        }
      })}

      {!hasMore && articles.length > 0 && (
        <div className="w-full py-12 flex justify-center items-center bg-black snap-start shrink-0">
          <span className="text-gray-500">You've reached the end of the feed.</span>
        </div>
      )}
    </div>
  );
}