import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaHeart, FaRegHeart,
  FaThumbsDown, FaRegThumbsDown,
  FaComment,
  FaRobot, FaGlobe, FaShare,
  FaBookmark, FaRegBookmark
} from 'react-icons/fa';

export default function NewsCard({ news, userId }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(news?.likeCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [input, setInput] = useState("");
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedSummary, setTranslatedSummary] = useState(null);
  const [isTranslatingCard, setIsTranslatingCard] = useState(false);
  const [showOuterLangSelect, setShowOuterLangSelect] = useState(false);

  const chatContainerRef = React.useRef(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [aiMessages, showAI]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLang, setSelectedLang] = useState("Hindi");
  const [chatLang, setChatLang] = useState("English");




  const handleSmartAI = async (mode) => {
    setAiMessages(prev => [
      ...prev,
      { type: "bot", text: "Thinking..." }
    ]);

    try {
      const res = await fetch("http://localhost:5000/api/ai/smart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode,
          article: `${news.title}. ${news.summary}`,
          language: chatLang
        })
      });

      const data = await res.json();

      setAiMessages(prev => [
        ...prev.filter(m => m.text !== "Thinking..."),
        { type: "bot", text: data.result || "No response" }
      ]);

    } catch (err) {
      setAiMessages(prev => [
        ...prev.filter(m => m.text !== "Thinking..."),
        { type: "bot", text: "Error fetching AI response" }
      ]);
    }
  };




  // const userId = "69be294c60564a42b2e1a733"; // ✅ your user id
  const handleTranslate = async () => {
    setChatLang(selectedLang);
    setAiMessages(prev => [
      ...prev,
      { type: "bot", text: "Translating..." }
    ]);

    try {
      const res = await fetch("http://localhost:5000/api/ai/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: `${news.title}. ${news.summary}`,
          targetLang: selectedLang
        })
      });

      const data = await res.json();

      setAiMessages(prev => [
        ...prev.filter(m => m.text !== "Translating..."),
        { type: "bot", text: data.translated || "Failed to translate" }
      ]);

    } catch (err) {
      setAiMessages(prev => [
        ...prev.filter(m => m.text !== "Translating..."),
        { type: "bot", text: "Error translating" }
      ]);
    }
  };

  const handleTranslateCard = async (targetLangOverride = null) => {
    if (isTranslatingCard) return;
    const langToUse = targetLangOverride || selectedLang;
    setIsTranslatingCard(true);

    try {
      const [titleRes, summaryRes] = await Promise.all([
        fetch("http://localhost:5000/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: news.title, targetLang: langToUse })
        }),
        fetch("http://localhost:5000/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: news.summary, targetLang: langToUse })
        })
      ]);

      const titleData = await titleRes.json();
      const summaryData = await summaryRes.json();

      setTranslatedTitle(titleData.translated);
      setTranslatedSummary(summaryData.translated);

    } catch (err) {
      console.error("Error translating card", err);
    } finally {
      setIsTranslatingCard(false);
    }
  };

  const handleSpeak = () => {
    let fallbackText = `${translatedTitle || news.title}. ${translatedSummary || news.summary}`;
    let sourceText = aiMessages[aiMessages.length - 1]?.text || fallbackText;
    if (!sourceText || sourceText === "Thinking...") return;

    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    handleStop(); // Stop any currently playing audio

    const isHindi = /[\u0900-\u097F]/.test(sourceText);
    const isTelugu = /[\u0C00-\u0C7F]/.test(sourceText);
    const isTamil = /[\u0B80-\u0BFF]/.test(sourceText);
    const isKannada = /[\u0C80-\u0CFF]/.test(sourceText);

    const textChunks = sourceText.match(/[^.!?।,\n]+[.!?।,\n]+/g) || [sourceText];

    let currentIndex = 0;
    setIsSpeaking(true);

    const speakChunk = () => {
      if (currentIndex >= textChunks.length) {
        setIsSpeaking(false);
        return;
      }

      const chunkText = textChunks[currentIndex].trim();
      if (!chunkText) {
        currentIndex++;
        return speakChunk();
      }

      let langCode = "en";
      let speechLang = "en-US";
      
      if (isHindi) { langCode = "hi"; speechLang = "hi-IN"; }
      else if (isTelugu) { langCode = "te"; speechLang = "te-IN"; }
      else if (isTamil) { langCode = "ta"; speechLang = "ta-IN"; }
      else if (isKannada) { langCode = "kn"; speechLang = "kn-IN"; }

      const voices = window.speechSynthesis.getVoices();
      const nativeVoice = voices.find(v => v.lang.toLowerCase().startsWith(langCode));

      // Google TTS Fallback for missing OS regional voices!
      if (langCode !== "en" && !nativeVoice) {
         const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=${langCode}&client=tw-ob`;
         const audio = new Audio(url);
         
         window.currentAudioTTS = audio;
         
         audio.onended = () => { currentIndex++; speakChunk(); };
         audio.onerror = () => { currentIndex++; speakChunk(); };
         
         audio.play().catch(() => {
             currentIndex++;
             speakChunk();
         });
         return;
      }

      const speech = new SpeechSynthesisUtterance(chunkText);
      speech.lang = speechLang;
      speech.rate = 0.95;
      speech.pitch = 1.1;

      if (nativeVoice) {
         speech.voice = nativeVoice;
      } else if (langCode === "en") {
        const femaleVoice = voices.find(v =>
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("samantha")
        );
        if (femaleVoice) speech.voice = femaleVoice;
      }

      speech.onend = () => {
        currentIndex++;
        speakChunk(); 
      };

      speech.onerror = (e) => {
        console.error("TTS Error:", e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(speech);
    };

    speakChunk();
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    if (window.currentAudioTTS) {
       window.currentAudioTTS.pause();
       window.currentAudioTTS = null;
    }
    setIsSpeaking(false);
  };

  const handleSummarize = async () => {
    if (loadingAI) return;
    setLoadingAI(true);

    setAiMessages(prev => [
      ...prev.filter(m => m.text !== "Summarizing..."),
      { type: "bot", text: "Summarizing..." }
    ]);

    try {
      const res = await fetch("http://localhost:5000/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: news.title,
          description: news.summary,
          content: news.summary,
          url: news.url,
          language: chatLang
        })
      });

      const data = await res.json();

      setAiMessages(prev => [
        ...prev.filter(m => m.text !== "Summarizing..."),
        { type: "bot", text: data.summary || "Failed to summarize" }
      ]);

    } catch (err) {
      setAiMessages(prev => [
        ...prev.filter(m => m.text !== "Summarizing..."),
        { type: "bot", text: "Error summarizing" }
      ]);
    }

    setLoadingAI(false);
  };


  const handleAskAI = async () => {
    if (!input.trim()) return;

    const userQuestion = input;
    setInput(""); // Clear input immediately

    // Prepare history, omitting temporary loading states safely
    const historyPayload = aiMessages.filter(
      m => m && m.text && !m.text.includes("Thinking...") && !m.text.includes("Summarizing...") && !m.text.includes("Translating...")
    );

    setAiMessages(prev => [
      ...prev,
      { type: "user", text: userQuestion },
      { type: "bot", text: "Thinking..." }
    ]);

    try {
      const res = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          history: historyPayload,
          article: `${news.title} ${news.summary}`,
          language: chatLang
        })
      });

      const data = await res.json();

      setAiMessages(prev => [
        ...prev.filter(m => m.text !== "Thinking..."),
        { type: "bot", text: data.answer || "Sorry, I couldn't find an answer." }
      ]);
    } catch (err) {
      setAiMessages(prev => [
        ...prev.filter(m => m.text !== "Thinking..."),
        { type: "bot", text: "Network error fetching response." }
      ]);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      await fetch("http://localhost:5000/api/activity/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          articleId: news.articleId,
          commentText: commentText,
          title: news.title,
          description: news.summary,
          image: news.image,
          url: news.url
        }),
      });

      setCommentText(""); // clear input
      setCommentCount(prev => prev + 1); // 🔥 instant update

    } catch (err) {
      console.error("Comment error:", err);
    }
  };


  const handleShare = async (e) => {
    e.stopPropagation();

    const appUrl = `http://localhost:3000/article/${news.articleId}`;

    const shareData = {
      title: news.title,
      text: news.summary,
      url: appUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(appUrl);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // 🔥 TRACK READ
  const handleRead = () => {
    if (!userId) return;

    fetch("http://localhost:5000/api/activity/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        articleId: news.articleId,
        userId: userId,
        title: news.title,
        description: news.summary,
        image: news.image,
        url: news.url
      }),
    });

    window.open(news.url, "_blank");
  };

  // Initialize like state and count
  useEffect(() => {
    const initLikes = async () => {
      if (!userId || !news.articleId) return;

      try {
        const [statusRes, countRes] = await Promise.all([
          fetch(`http://localhost:5000/api/activity/like/${news.articleId}/status`, {
            credentials: 'include'
          }),
          fetch(`http://localhost:5000/api/activity/like/${news.articleId}/count`, { credentials: 'include' })]);

        if (statusRes.ok) {
          const { liked } = await statusRes.json();
          setLiked(liked);
        }

        if (countRes.ok) {
          const { count } = await countRes.json();
          setLikeCount(count);
        }
      } catch (error) {
        console.error('Failed to init like state:', error);
      }
    };

    initLikes();
  }, [userId, news?.articleId]);

  useEffect(() => {
    setLikeCount(news?.likeCount || 0);
  }, [news]);

  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!news.articleId) return;

      try {
        const res = await fetch(
          `http://localhost:5000/api/activity/comment/${news.articleId}/count`
        );

        const data = await res.json();

        setCommentCount(prev => prev + 1);

      } catch (err) {
        console.error("Comment count error:", err);
      }
    };

    fetchCommentCount();
  }, [news.articleId]);



  // 🔥 TRACK LIKE
 const handleLike = async (e) => {
  e.stopPropagation();
  if (!userId || isLoading) return;

  setIsLoading(true);

  const newLiked = !liked;
  const delta = newLiked ? 1 : -1;

  // ✅ Remove dislike if liking
  if (newLiked && disliked) {
    setDisliked(false);
  }

  // Optimistic UI
  setLiked(newLiked);
  setLikeCount(prev => Math.max(0, prev + delta));

  try {
    const response = await fetch("http://localhost:5000/api/activity/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        articleId: news.articleId,
        userId: userId,
        title: news.title,
        description: news.summary,
        image: news.image,
        url: news.url
      })
    });

    if (!response.ok) throw new Error("Toggle failed");

    const countRes = await fetch(
      `http://localhost:5000/api/activity/like/${news.articleId}/count`,
      { credentials: "include" }
    );

    const data = await countRes.json();
    setLikeCount(data.count);

  } catch (error) {
    setLiked(!newLiked);
    setLikeCount(prev => Math.max(0, prev - delta));
  } finally {
    setIsLoading(false);
  }
};

  // 🔥 TRACK DISLIKE
  const handleDislike = (e) => {
  e.stopPropagation();

  const newDisliked = !disliked;

  setDisliked(newDisliked);

  // ✅ Remove like if dislike is clicked
  if (newDisliked && liked) {
    setLiked(false);
    setLikeCount(prev => Math.max(0, prev - 1));
  }

  fetch("http://localhost:5000/api/activity/dislike", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      articleId: news.articleId
    }),
  });
};
  // 🔥 TRACK SAVE
  const handleSave = (e) => {
    e.stopPropagation();

    setSaved(!saved);

    fetch("http://localhost:5000/api/activity/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        articleId: news.articleId,
        title: news.title,
        description: news.summary,
        image: news.image,
        url: news.url
      }),
    });
  };

  return (
    <>
      <div
        oonClick={(e) => {
          // only trigger if NOT clicking AI/chat
          if (e.target.closest(".no-redirect")) return;
          handleRead();
        }}
        className="w-full h-full snap-start relative bg-black shrink-0 flex justify-center items-center overflow-hidden cursor-pointer"
      >

        {/* Background Image */}
        <img
          src={news.image || "https://via.placeholder.com/500"}
          alt={news.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.8 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex flex-col justify-end p-4 md:p-8 pb-8 md:pb-12"
        >

          {/* Right Panel */}
          <div className="absolute inset-y-0 right-4 flex flex-col justify-center items-center gap-5 z-50 no-redirect pointer-events-none [&>*]:pointer-events-auto">

            {/* LIKE */}
            <button
              onClick={handleLike}
              disabled={isLoading}
              className="flex flex-col items-center group disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center group-hover:scale-110">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : liked ? (
                  <FaHeart className="text-red-500 text-2xl" />
                ) : (
                  <FaRegHeart className="text-white text-2xl" />
                )}
              </div>
              <span className="text-white text-xs mt-1">
                {likeCount.toLocaleString()}
              </span>
            </button>

            {/* DISLIKE */}
            <button
              onClick={handleDislike}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center group-hover:scale-110">
                {disliked
                  ? <FaThumbsDown className="text-blue-500 text-2xl" />
                  : <FaRegThumbsDown className="text-white text-2xl" />}
              </div>
              <span className="text-white text-xs mt-1">Dislike</span>
            </button>

            {/* COMMENT */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(true);
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center group-hover:scale-110">
                <FaComment className="text-white text-2xl" />
              </div>
              <span className="text-white text-xs mt-1">
                {commentCount.toLocaleString()}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!showAI) {
                  setShowAI(true);
                  handleSummarize(); // 🔥 AUTO SUMMARIZE
                } else {
                  setShowAI(false); // toggle off if already open
                }
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-purple-600/50 rounded-full flex items-center justify-center group-hover:scale-110">
                <FaRobot className="text-purple-200 text-2xl" />
              </div>

              <span className="text-purple-200 text-xs mt-1">AI</span>
            </button>
            {showAI && (
              <>
                {/* Click-away overlay */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowAI(false); 
                  }} 
                />
                
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="no-redirect fixed bottom-6 left-4 right-20 md:left-auto md:right-24 md:w-[400px] max-w-sm md:max-w-md bg-black/80 border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.15)] rounded-2xl z-50 flex flex-col backdrop-blur-2xl transition-all duration-300"
                >

                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b border-white/10">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    🤖 AI Assistant
                  </span>
                  <button
                    onClick={() => setShowAI(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✖
                  </button>
                </div>


                <div className="flex justify-around p-2 border-b border-white/10 text-xs">

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSmartAI("explain");
                    }}
                    className="text-purple-300 hover:underline"
                  >
                    🧠 Explain
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSmartAI("future");
                    }}
                    className="text-green-300 hover:underline"
                  >
                    🔮 What Next
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSmartAI("keypoints");
                    }}
                    className="text-yellow-300 hover:underline"
                  >
                    ⚡ Key Points
                  </button>

                </div>


                <div className="flex gap-2 p-2 border-b border-white/10">
                  <select
                    value={selectedLang}
                    onChange={(e) => {
                      setSelectedLang(e.target.value);
                      setChatLang(e.target.value);
                    }}
                    className="bg-zinc-800 text-white text-xs px-2 py-1 rounded"
                  >
                    <option>Hindi</option>
                    <option>Telugu</option>
                    <option>Tamil</option>
                    <option>Kannada</option>
                    <option>English</option>
                  </select>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTranslate();
                    }}
                    className="text-blue-400 text-xs"
                  >
                    Translate
                  </button>
                </div>


                {/* Messages */}
                <div ref={chatContainerRef} className="p-4 h-80 md:h-96 overflow-y-auto text-sm space-y-3 relative scroll-smooth pointer-events-auto">
                  {aiMessages.length === 0 && (
                    <p className="text-gray-400 text-center text-xs">
                      Ask anything about this news...
                    </p>
                  )}

                  {aiMessages.map((msg, i) => (
                    <div key={i} className={msg.type === "user" ? "text-right" : "text-left"}>

                      <div
                        className={`inline-block px-3 py-2 rounded-lg whitespace-pre-line ${msg.type === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-zinc-800 text-gray-300"
                          }`}
                      >

                        {/* ✅ FIXED BULLET RENDER */}
                        {msg.type === "bot" ? (
                          <ul className="list-disc pl-4 space-y-2 text-sm leading-relaxed">
                            {msg.text
                              .split("\n")
                              .filter(line => line.trim() !== "")
                              .map((line, index) => (
                                <li key={index}>
                                  {line.replace(/^[-•]\s*/, "")}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          msg.text
                        )}

                      </div>

                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="flex border-t border-white/10">
                  <input
                    value={input}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        // Call the explicit handle wrapper or original handleAskAI
                        handleAskAI();
                      }
                    }}
                    placeholder="Ask something..."
                    className="flex-1 p-3 bg-transparent text-sm outline-none text-white placeholder-gray-400"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAskAI();
                    }}
                    className="px-3 text-purple-400 hover:text-purple-300"
                  >
                    ➤
                  </button>
                </div>

                {/* Actions */}
                <div className="flex justify-between text-xs p-2 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSummarize();
                    }}
                    className="text-purple-400 hover:underline"
                  >
                    ✨ Summarize
                  </button>

                  <button
                    className="text-gray-400 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAiMessages([]);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </>
          )}
            {/* AI Output */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                isSpeaking ? handleStop() : handleSpeak();
              }}
              className="flex flex-col items-center group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isSpeaking
                ? "bg-red-500/70"
                : "bg-green-600/50"
                }`}>
                {isSpeaking ? "⏹" : "🔊"}
              </div>

              <span className="text-xs mt-1 text-white">
                {isSpeaking ? "Stop" : "Listen"}
              </span>
            </button>


            <div className="relative flex flex-col items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOuterLangSelect(prev => !prev);
                }}
                className="flex flex-col items-center group"
              >
                <div className="w-12 h-12 bg-blue-600/50 rounded-full flex items-center justify-center group-hover:scale-110">
                  <FaGlobe className="text-blue-200 text-2xl" />
                </div>
                <span className="text-blue-200 text-xs mt-1">Translate</span>
              </button>

              {showOuterLangSelect && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-[120%] top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-black/90 backdrop-blur-xl border border-white/20 p-2 rounded-xl z-50"
                >
                  {["Hindi", "Telugu", "Tamil", "Kannada", "English"].map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSelectedLang(lang);
                        setChatLang(lang);
                        setShowOuterLangSelect(false);
                        handleTranslateCard(lang);
                      }}
                      className="text-left text-white text-xs px-4 py-2 hover:bg-white/20 rounded-lg whitespace-nowrap transition"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SHARE */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center group-hover:scale-110">
                <FaShare className="text-white text-2xl" />
              </div>
              <span className="text-white text-xs mt-1">
                {copied ? "Copied!" : "Share"}
              </span>
            </button>
          </div>

          {/* Bottom Content */}
          <div className="w-[85%] md:w-[75%] pr-4 relative z-10">

            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-xs mb-3">
              {news.category || "General"}
            </div>

            <h2 className="text-white text-2xl md:text-4xl font-bold mb-3">
              {isTranslatingCard ? "Translating..." : (translatedTitle || news.title)}
            </h2>

            <p className="text-zinc-200 text-sm md:text-base">
              {isTranslatingCard ? "Translating summary..." : (translatedSummary || news.summary || "No description available")}
            </p>

            <a
              href={news.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-3 inline-block text-blue-400 underline text-sm"
            >
              Read Full Article
            </a>

            <div className="mt-4 flex items-center">
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${saved
                  ? 'bg-white text-black'
                  : 'bg-black/50 text-white'
                  }`}
              >
                {saved ? <FaBookmark /> : <FaRegBookmark />}
                <span className="text-sm">
                  {saved ? 'Saved' : 'Save'}
                </span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>

      {/* COMMENT MODAL */}
      {showComments && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowComments(false)}
        >
          <div
            className="w-[90%] max-w-md bg-zinc-900 rounded-2xl p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <h3 className="text-white text-lg font-semibold mb-3 text-center">
              Comments
            </h3>

            {/* Input Section */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-black/50 text-white px-3 py-2 rounded-lg outline-none text-sm"
              />

              <button
                onClick={handleCommentSubmit}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white text-sm"
              >
                Send
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}