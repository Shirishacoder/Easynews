import { Link, useLocation } from 'react-router-dom';
import { AiFillHome, AiOutlineHome, AiFillFire, AiOutlineFire } from 'react-icons/ai';
import { IoNewspaperOutline, IoNewspaper } from 'react-icons/io5';
import { BsPerson, BsPersonFill, BsClockHistory } from 'react-icons/bs';

const navItems = [
  { name: 'Home', path: '/home', icon: AiOutlineHome, activeIcon: AiFillHome },
  { name: 'News', path: '/news', icon: IoNewspaperOutline, activeIcon: IoNewspaper },
  { name: 'Activity', path: '/activity', icon: BsClockHistory, activeIcon: BsClockHistory },
  { name: 'Trending', path: '/trending', icon: AiOutlineFire, activeIcon: AiFillFire },
  { name: 'Profile', path: '/profile', icon: BsPerson, activeIcon: BsPersonFill },
];

export default function Sidebar({ showSidebar }) {
  const location = useLocation();

  return (
    <nav
      className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 
      flex flex-col transition-transform duration-300 z-50
      ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}
    >

      {/* ✅ ONLY NAV ITEMS (NO LOGO) */}
      <div className="flex-1 flex flex-col gap-2 p-4 mt-16">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>

    </nav>
  );
}