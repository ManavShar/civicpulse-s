import { Activity, Bell, Settings, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            CivicPulse AI
          </h1>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:inline">
          Smart City Operations Platform
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <ThemeToggle />

        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <button
          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="User menu"
        >
          <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300 hidden md:inline">
            Operator
          </span>
        </button>
      </div>
    </header>
  );
}
