import { Incident } from "@/types";
import { SeverityBadge, StatusBadge } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";

interface IncidentCardProps {
  incident: Incident;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function IncidentCard({
  incident,
  onSelect,
  isSelected = false,
}: IncidentCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(incident.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-4 border rounded-lg cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">
          Priority: {incident.priorityScore}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {incident.type.replace(/_/g, " ")}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
        {incident.description}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <span>
          {formatDistanceToNow(new Date(incident.detectedAt), {
            addSuffix: true,
          })}
        </span>
        {incident.confidence && (
          <span>Confidence: {(incident.confidence * 100).toFixed(0)}%</span>
        )}
      </div>
    </div>
  );
}
