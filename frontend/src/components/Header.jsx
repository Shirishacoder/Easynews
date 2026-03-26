import React from "react";

export default function Header({ showSidebar, setShowSidebar }) {
  return (
    <div className="fixed top-5 left-5 z-[9999] flex items-center gap-3">

      {/* ☰ BUTTON */}
      <button
        onClick={() => setShowSidebar(prev => !prev)}
        className="bg-zinc-800 p-2 rounded-lg"
      >
        ☰
      </button>

      {/* LOGO */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
          E
        </div>
        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          EasyNews
        </span>
      </div>

    </div>
  );
}