import { BookOpen, BarChart3, User, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

type NavItem = "home" | "insights" | "you";

interface BottomNavProps {
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
}

const leftNavItems: { id: NavItem; label: string; icon: typeof BookOpen }[] = [
  { id: "home", label: "Journal", icon: BookOpen },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

const rightNavItems: { id: NavItem; label: string; icon: typeof BookOpen }[] = [
  { id: "you", label: "You", icon: User },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navigate = useNavigate();

  const handleNewCheckIn = () => {
    navigate("/mood?new=true");
  };

  const handleTabClick = (tab: NavItem) => {
    onTabChange(tab);
    // Navigate to the appropriate route
    switch (tab) {
      case "home":
        navigate("/home");
        break;
      case "insights":
        navigate("/insights");
        break;
      case "you":
        navigate("/you");
        break;
      // Add more routes as they're created
    }
  };

  const renderNavItem = (item: { id: NavItem; label: string; icon: typeof BookOpen }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleTabClick(item.id)}
        className={`flex flex-col items-center gap-1 px-4 py-1 transition-all duration-200 ${
          isActive 
            ? "text-foreground" 
            : "text-muted-foreground hover:text-soft"
        }`}
      >
        <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
        <span className="text-xs">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/20 px-6 py-3">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {leftNavItems.map(renderNavItem)}
        
        <button
          onClick={handleNewCheckIn}
          className="flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-6 h-6" strokeWidth={2} />
        </button>
        
        {rightNavItems.map(renderNavItem)}
      </div>
    </nav>
  );
};

export default BottomNav;
