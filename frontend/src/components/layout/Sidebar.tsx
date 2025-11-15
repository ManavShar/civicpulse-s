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
  X,
} from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";

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

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobileOpen) {
      onMobileClose();
    }
  }, [window.location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col z-50",
          // Desktop styles
          "hidden lg:flex",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          // Mobile styles
          "lg:relative fixed inset-y-0 left-0",
          isMobileOpen ? "flex" : "hidden lg:flex",
          "w-64"
        )}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Navigation
          </span>
          <button
            onClick={onMobileClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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
              {(!isCollapsed || isMobileOpen) && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop collapse button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-4 border-t border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors items-center justify-center"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </aside>
    </>
  );
}
