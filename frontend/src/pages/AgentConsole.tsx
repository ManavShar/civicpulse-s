import { useState } from "react";
import {
  AgentConsole as AgentConsoleComponent,
  AgentActivityDashboard,
  AgentPerformanceMetrics,
  AgentMessageDetail,
} from "@/components/agents";
import { useAgentStore } from "@/stores/agentStore";
import { Modal } from "@/components/ui/Modal";

export function AgentConsole() {
  const { selectedMessageId, getMessageById, setSelectedMessage } =
    useAgentStore();
  const [showDetailModal, setShowDetailModal] = useState(false);

  const selectedMessage = selectedMessageId
    ? getMessageById(selectedMessageId)
    : null;

  const handleCloseDetail = () => {
    setSelectedMessage(null);
    setShowDetailModal(false);
  };

  // Open modal when a message is selected
  useState(() => {
    if (selectedMessageId && selectedMessage) {
      setShowDetailModal(true);
    }
  });

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Agent Console
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor AI agent activity, reasoning, and decision-making in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main console - takes 2 columns */}
        <div className="lg:col-span-2">
          <AgentConsoleComponent maxHeight="calc(100vh - 250px)" />
        </div>

        {/* Sidebar - takes 1 column */}
        <div className="space-y-6">
          <AgentActivityDashboard />
          <AgentPerformanceMetrics />
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Modal
          isOpen={showDetailModal}
          onClose={handleCloseDetail}
          title="Agent Message Details"
          size="lg"
        >
          <AgentMessageDetail
            message={selectedMessage}
            onClose={handleCloseDetail}
          />
        </Modal>
      )}
    </div>
  );
}
