import { useEffect, useState } from "react";
import { useAgentStore } from "@/stores/agentStore";
import { Badge } from "@/components/ui/Badge";
import { Bell } from "lucide-react";
import clsx from "clsx";

interface AgentNotificationBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function AgentNotificationBadge({
  className,
  showIcon = true,
}: AgentNotificationBadgeProps) {
  const { messages } = useAgentStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(
    Date.now()
  );

  useEffect(() => {
    // Count messages newer than last seen
    const newMessages = messages.filter(
      (msg) => new Date(msg.timestamp).getTime() > lastSeenTimestamp
    );
    setUnreadCount(newMessages.length);
  }, [messages, lastSeenTimestamp]);

  const markAsRead = () => {
    setLastSeenTimestamp(Date.now());
    setUnreadCount(0);
  };

  if (unreadCount === 0) {
    return null;
  }

  return (
    <button
      onClick={markAsRead}
      className={clsx(
        "relative inline-flex items-center gap-2",
        "hover:opacity-80 transition-opacity",
        className
      )}
    >
      {showIcon && (
        <div className="relative">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
      )}
      <Badge variant="danger" size="sm">
        {unreadCount} new
      </Badge>
    </button>
  );
}
