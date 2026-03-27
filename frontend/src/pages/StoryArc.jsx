import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function StoryArc() {
  const { topic } = useParams();

  const [data, setData] = useState(null);

  // 🔥 TRANSLATION STATES
  const [translated, setTranslated] = useState(null);
  const [selectedLang, setSelectedLang] = useState("English");
  const [loadingTranslate, setLoadingTranslate] = useState(false);

  // 🔹 Fetch story data
  useEffect(() => {
    fetch(`http://localhost:5000/api/story-arc/${topic}`)
      .then(res => res.json())
      .then(setData);
  }, [topic]);

  // 🔥 TRANSLATE FUNCTION (TIMELINE + ENTITIES)
  const handleTranslateStory = async () => {
    if (!data) return;

    setLoadingTranslate(true);

    try {
      // 🔹 Translate Timeline
      const translatedTimeline = await Promise.all(
        data.timeline.map(async (item) => {
          const res = await fetch("http://localhost:5000/api/ai/translate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: `${item.title}. ${item.summary}`,
              targetLang: selectedLang,
            }),
          });

          const result = await res.json();

          return {
            ...item,
            title: result.translated || item.title,
            summary: result.translated || item.summary,
          };
        })
      );

      // 🔹 Translate Entities (Key Players)
      const translatedEntities = await Promise.all(
        data.entities.map(async (e) => {
          const res = await fetch("http://localhost:5000/api/ai/translate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: e,
              targetLang: selectedLang,
            }),
          });

          const result = await res.json();
          return result.translated || e;
        })
      );

      // 🔥 Set translated data
      setTranslated({
        ...data,
        timeline: translatedTimeline,
        entities: translatedEntities,
      });

    } catch (err) {
      console.error("Translate error:", err);
    }

    setLoadingTranslate(false);
  };

  // 🔥 AUTO TRANSLATE ON LANGUAGE CHANGE
  useEffect(() => {
    if (selectedLang === "English") {
      setTranslated(null);
    } else {
      handleTranslateStory();
    }
  }, [selectedLang]);

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        Loading story...
      </div>
    );
  }

  // 🔥 USE TRANSLATED OR ORIGINAL
  const timeline = translated?.timeline || data.timeline;
  const entities = translated?.entities || data.entities;
  const sentiment = data.sentiment;

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-3xl px-4 py-8">

        {/* HEADER */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex justify-between items-center">

            <h1 className="text-2xl font-bold">📖 Story: {topic}</h1>

            {/* 🌐 TRANSLATOR */}
            <div className="flex gap-2 items-center">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-black/50 text-white text-sm px-2 py-1 rounded"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
                <option value="Tamil">Tamil</option>
                <option value="Kannada">Kannada</option>
              </select>

              <button
                onClick={handleTranslateStory}
                className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-500"
              >
                {loadingTranslate ? "..." : "🌐 Translate"}
              </button>
            </div>

          </div>
        </div>

        {/* TIMELINE */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">📅 Timeline</h2>

          <div className="space-y-4">
            {timeline.map((item, i) => (
              <div
                key={i}
                className="bg-black/40 p-4 rounded-xl border border-white/10 hover:scale-[1.02] transition"
              >
                <p className="text-xs text-gray-400">
                  {new Date(item.date).toDateString()}
                </p>

                <p className="font-semibold text-white">{item.title}</p>

                <p className="text-gray-300 text-sm mt-1">
                  {item.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* KEY PLAYERS */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-3">👥 Key Players</h2>

          <div className="flex flex-wrap gap-2">
            {entities.map((e, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-sm"
              >
                {e}
              </span>
            ))}
          </div>
        </div>

        {/* SENTIMENT */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 shadow-lg">
          <h2 className="text-xl font-semibold mb-3">📊 Sentiment</h2>

          <div className="space-y-2">
            {sentiment.map((s, i) => (
              <div
                key={i}
                className="flex justify-between bg-black/40 p-3 rounded-lg"
              >
                <span>{new Date(s.date).toDateString()}</span>

                <span
                  className={
                    s.sentiment === "positive"
                      ? "text-green-400"
                      : s.sentiment === "negative"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }
                >
                  {s.sentiment}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}