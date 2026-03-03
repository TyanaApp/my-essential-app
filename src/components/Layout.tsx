import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Home, Package, ChefHat, ShoppingCart, BookOpen, Settings } from "lucide-react";
import tyanaLogo from '@/assets/tyana-logo.png';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Home", icon: Home },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/recipes", label: "Recipes", icon: ChefHat },
    { path: "/shopping", label: "Shopping", icon: ShoppingCart },
    { path: "/diary", label: "Diary", icon: BookOpen },
    { path: "/profile", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-primary-100 flex flex-col z-50">
        {/* Logo */}
        <div className="flex items-center gap-2 h-14 px-5 border-b border-primary-100">
          <img src={tyanaLogo} alt="TYANA Kitchen CFO" className="h-5" />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-primary-100 space-y-3">
          <LanguageSelector variant="compact" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
