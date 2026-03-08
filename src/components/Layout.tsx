import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Home, Package, ChefHat, ShoppingCart, BookOpen, Settings } from "lucide-react";
import tyanaLogo from '@/assets/tyana-logo-text.png';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import BottomNav from './BottomNav';
import InstallBanner from './InstallBanner';
import NotificationBell from './NotificationBell';
import { useTranslation } from '@/hooks/useTranslation';
import { useNotifications } from '@/hooks/useNotifications';

const Layout = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { alerts, unreadCount, markAllRead, deleteAlert, clearAll } = useNotifications();

  const navItems = [
    { path: "/dashboard", label: t.nav.home, icon: Home },
    { path: "/inventory", label: t.nav.inventory, icon: Package },
    { path: "/recipes", label: t.nav.recipes, icon: ChefHat },
    { path: "/shopping", label: t.nav.shopping, icon: ShoppingCart },
    { path: "/diary", label: t.nav.diary, icon: BookOpen },
    { path: "/profile", label: t.nav.settings, icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border flex-col z-50 hidden md:flex">
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-border">
          <span className="font-tyana text-base" style={{ color: '#7C3AED' }}>TYANA</span>
          <NotificationBell alerts={alerts} unreadCount={unreadCount} onMarkAllRead={markAllRead} />
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
        <div className="p-4 border-t border-border space-y-3">
          <LanguageSelector variant="compact" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t.common.theme}</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 overflow-x-hidden">
        {/* Mobile top bar with bell */}
        <div className="md:hidden flex items-center justify-end px-4 pt-3">
          <NotificationBell alerts={alerts} unreadCount={unreadCount} onMarkAllRead={markAllRead} />
        </div>
        <Outlet />
      </main>

      {/* Bottom nav - mobile only */}
      <BottomNav />

      {/* Install banner - mobile only */}
      <InstallBanner />
    </div>
  );
};

export default Layout;
