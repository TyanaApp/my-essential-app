import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, ChefHat, BookOpen, ShoppingCart, User } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import tyanaLogo from '@/assets/tyana-logo.png';

const Layout = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/recipes", label: "Recipes", icon: ChefHat },
    { path: "/diary", label: "Diary", icon: BookOpen },
    { path: "/shopping", label: "Shopping", icon: ShoppingCart },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-center h-12 px-4">
          <img 
            src={tyanaLogo} 
            alt="TYANA Kitchen CFO" 
            className="h-5"
          />
        </div>
      </header>

      <main className="flex-1 pt-12 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center px-2 py-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-1">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
