import React, { useState, useEffect } from "react";

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

const Trending = () => {
  const [activeCategory, setActiveCategory] = useState("Technology");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategoryNews = async (category) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/news/category/${category}`
      );
      const data = await res.json();
      setArticles(data || []);
    } catch (err) {
      console.error("Error fetching category news:", err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryNews(activeCategory);
  }, [activeCategory]);

  return (
    <div className="h-full w-full overflow-y-auto p-6 text-white">
      <div className="max-w-5xl mx-auto">

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6">Trending News</h1>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 scroll-smooth pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles */}
        <div className="space-y-4">
          {loading && <p className="text-gray-400">Loading...</p>}

          {!loading && articles.length === 0 && (
            <p className="text-gray-500">No articles found</p>
          )}

          {articles.map(article => (
            <div
              key={article._id}
              className="bg-zinc-900 border border-white/10 p-4 rounded-xl flex justify-between gap-4 hover:bg-zinc-800 transition cursor-pointer"
              onClick={() => window.open(article.url, "_blank")}
            >
              {/* LEFT */}
              <div className="flex-1">
                <h2 className="font-semibold text-lg">
                  {article.title}
                </h2>

                {article.description && (
                  <p className="text-sm text-gray-400 mt-1">
                    {article.description}
                  </p>
                )}
              </div>

              {/* RIGHT IMAGE */}
              {article.image && (
                <img
                  src={article.image}
                  alt="news"
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trending;