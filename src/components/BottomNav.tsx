import { NavLink, useLocation } from "react-router-dom";
import { Home, Package, ChefHat, ShoppingCart, User } from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/recipes", label: "Recipes", icon: ChefHat },
  { path: "/shopping", label: "Shopping", icon: ShoppingCart },
  { path: "/profile", label: "Profile", icon: User },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-card border-t border-border md:hidden"
      style={{
        height: 64,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] rounded-xl px-2 py-1 transition-colors"
            style={{
              backgroundColor: isActive ? "hsl(var(--primary))" : "transparent",
              color: isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
            }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
