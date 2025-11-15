import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  MessageSquare,
  History,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/map", icon: MapPin, label: "Map View" },
  { to: "/incidents", icon: AlertTriangle, label: "Incidents" },
  { to: "/work-orders", icon: ClipboardList, label: "Work Orders" },
  { to: "/predictions", icon: TrendingUp, label: "Predictions" },
  { to: "/agents", icon: MessageSquare, label: "Agent Console" },
  { to: "/replay", icon: History, label: "Replay" },
  { to: "/scenarios", icon: Zap, label: "Scenarios" },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-4 border-t border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </aside>
  );
}
