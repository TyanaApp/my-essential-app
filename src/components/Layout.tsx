import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Calendar, Map, Users, History, User } from "lucide-react";

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
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
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
