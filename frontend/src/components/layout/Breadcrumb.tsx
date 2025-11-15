import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import clsx from "clsx";

interface BreadcrumbItem {
  label: string;
  path: string;
}

export function Breadcrumb() {
  const location = useLocation();
  const params = useParams();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Route name mapping
  const routeNames: Record<string, string> = {
    "": "Dashboard",
    map: "Map View",
    incidents: "Incidents",
    "work-orders": "Work Orders",
    predictions: "Predictions",
    agents: "Agent Console",
    replay: "Replay",
    scenarios: "Scenarios",
  };

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", path: "/" }];

  let currentPath = "";
  pathnames.forEach((segment) => {
    currentPath += `/${segment}`;

    // Check if this segment is a dynamic ID parameter
    const isId = Object.values(params).includes(segment);

    if (isId) {
      // For IDs, show a shortened version or "Details"
      const label =
        segment.length > 8 ? `${segment.substring(0, 8)}...` : segment;
      breadcrumbs.push({ label, path: currentPath });
    } else {
      const label = routeNames[segment] || segment.replace(/-/g, " ");
      breadcrumbs.push({ label, path: currentPath });
    }
  });

  // Don't show breadcrumbs on home page
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={crumb.path} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 mx-1" />
              )}
              {isLast ? (
                <span className="text-gray-900 dark:text-white font-medium">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className={clsx(
                    "hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1",
                    "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {isFirst && <Home className="w-4 h-4" />}
                  {!isFirst && crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
