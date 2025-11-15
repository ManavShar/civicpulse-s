import { ReactNode } from "react";
import clsx from "clsx";
import { Breadcrumb } from "./Breadcrumb";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
  showBreadcrumb?: boolean;
}

/**
 * DashboardLayout provides a responsive container for dashboard content
 * with consistent padding and max-width constraints
 */
export function DashboardLayout({
  children,
  className,
  showBreadcrumb = true,
}: DashboardLayoutProps) {
  return (
    <div className={clsx("h-full overflow-auto scrollbar-thin", className)}>
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-[1920px] mx-auto">
        {showBreadcrumb && <Breadcrumb />}
        {children}
      </div>
    </div>
  );
}

interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * DashboardHeader provides consistent header styling for dashboard pages
 */
export function DashboardHeader({
  title,
  description,
  actions,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 lg:gap-4">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {title}
        </h2>
        {description && (
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface DashboardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * DashboardGrid provides responsive grid layouts with configurable columns
 */
export function DashboardGrid({
  children,
  columns = 2,
  className,
}: DashboardGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 xl:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <div
      className={clsx("grid gap-4 lg:gap-6", gridClasses[columns], className)}
    >
      {children}
    </div>
  );
}

interface DashboardSectionProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

/**
 * DashboardSection provides a consistent section container with optional title
 */
export function DashboardSection({
  children,
  title,
  className,
}: DashboardSectionProps) {
  return (
    <section className={clsx("space-y-4", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
