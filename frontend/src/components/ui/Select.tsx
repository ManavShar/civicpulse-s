import { SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            "w-full px-3 py-2 rounded-lg border transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 dark:border-gray-600",
            "bg-white dark:bg-gray-800",
            "text-gray-900 dark:text-gray-100",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
