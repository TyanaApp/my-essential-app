import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Calendar, Map, Users, History, User } from "lucide-react";
import tyanaLogo from '@/assets/tyana-logo.png';
import VideoBackground from './VideoBackground';

const navItems = [
  { path: "/today", label: "Today", icon: Calendar },
  { path: "/map", label: "Map", icon: Map },
  { path: "/twin", label: "Twin", icon: Users },
  { path: "/history", label: "History", icon: History },
  { path: "/profile", label: "Profile", icon: User },
];

const Layout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Video Background */}
      <VideoBackground />
      {/* Top header with logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-center h-12 px-4">
          <img 
            src={tyanaLogo} 
            alt="TYANA" 
            className="h-5 dark:invert dark:brightness-200"
          />
        </div>
      </header>

      <main className="flex-1 pt-12 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center px-3 py-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1 font-exo">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
