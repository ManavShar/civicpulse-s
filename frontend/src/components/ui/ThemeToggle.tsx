import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleClick = () => {
    console.log("Theme toggle clicked, current theme:", theme);
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
      aria-label="Toggle theme"
      type="button"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {theme === "light" ? (
          <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        )}
      </motion.div>
    </button>
  );
}
