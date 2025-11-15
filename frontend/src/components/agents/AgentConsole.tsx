import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/stores/agentStore";
import { AgentType } from "@/types";
import { AgentMessage } from "./AgentMessage";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Filter, X } from "lucide-react";
import clsx from "clsx";

interface AgentConsoleProps {
  maxHeight?: string;
  showFilters?: boolean;
  autoScroll?: boolean;
}

export function AgentConsole({
  maxHeight = "600px",
  showFilters = true,
  autoScroll = true,
}: AgentConsoleProps) {
  const {
    getFilteredMessages,
    filterByAgent,
    setFilterByAgent,
    setSelectedMessage,
    loading,
    error,
  } = useAgentStore();

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const messages = getFilteredMessages();

  // Auto-scroll to latest messages
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleMessageClick = (messageId: string) => {
    setSelectedMessage(messageId);
  };

  const handleFilterChange = (agentType: AgentType | null) => {
    setFilterByAgent(agentType);
    setShowFilterMenu(false);
  };

  const agentFilters: Array<{ type: AgentType | null; label: string }> = [
    { type: null, label: "All Agents" },
    { type: "PLANNER", label: "Planner" },
    { type: "DISPATCHER", label: "Dispatcher" },
    { type: "ANALYST", label: "Analyst" },
  ];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agent Activity
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
            {filterByAgent && ` from ${filterByAgent}`}
          </p>
        </div>

        {showFilters && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {filterByAgent && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-xs">
                  1
                </span>
              )}
            </Button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="py-1">
                  {agentFilters.map((filter) => (
                    <button
                      key={filter.label}
                      onClick={() => handleFilterChange(filter.type)}
                      className={clsx(
                        "w-full text-left px-4 py-2 text-sm transition-colors",
                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                        filterByAgent === filter.type
                          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                          : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardBody className="flex-1 overflow-hidden p-0">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading agent messages...
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No agent messages yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Agent activity will appear here when incidents are processed
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {messages.map((message) => (
                <AgentMessage
                  key={message.id}
                  message={message}
                  onClick={() => handleMessageClick(message.id)}
                />
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardBody>

      {filterByAgent && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setFilterByAgent(null)}
            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <X className="w-4 h-4" />
            Clear filter
          </button>
        </div>
      )}
    </Card>
  );
}
