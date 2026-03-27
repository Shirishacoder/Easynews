import React from "react";

export default function Header({ showSidebar, setShowSidebar }) {
  return (
    <div className="fixed top-5 left-5 z-[9999] flex items-center">

      {/* 🔥 CLICKABLE LOGO */}
      <div
        onClick={() => setShowSidebar(prev => !prev)}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold group-hover:scale-110 transition">
          E
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent opacity-80 group-hover:opacity-100 transition">
    EasyNews
  </span>

        {/* 👇 Optional: show text only when sidebar open */}
        
        
      </div>

    </div>
  );
}