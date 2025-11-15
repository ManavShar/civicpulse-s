# Agent Console Components

This directory contains all components related to the AI Agent Console feature, which provides real-time monitoring, visualization, and analysis of multi-agent AI system activity.

## Components

### Core Components

#### `AgentConsole`

Main container component for the agent console interface.

**Features:**

- Chat-like interface for agent messages
- Real-time message streaming
- Message filtering by agent type
- Auto-scroll to latest messages
- Empty state handling

**Props:**

```typescript
interface AgentConsoleProps {
  maxHeight?: string; // Maximum height of message container
  showFilters?: boolean; // Show/hide filter controls
  autoScroll?: boolean; // Enable auto-scroll to latest
}
```

**Usage:**

```tsx
import { AgentConsole } from "@/components/agents";

<AgentConsole maxHeight="600px" showFilters={true} autoScroll={true} />;
```

#### `AgentMessage`

Individual message component displaying agent activity.

**Features:**

- Agent-specific icons and colors
- Message type indicators
- Timestamp display
- Clickable for detailed view
- Metadata display (incident/work order links)

**Props:**

```typescript
interface AgentMessageProps {
  message: AgentMessageType;
  onClick?: () => void;
}
```

### Visualization Components

#### `ReasoningChain`

Displays the step-by-step reasoning process of an agent.

**Features:**

- Thought → Action → Result flow visualization
- Expandable/collapsible steps
- Syntax highlighting for structured data
- Timeline visualization
- JSON data display

**Props:**

```typescript
interface ReasoningChainProps {
  message: AgentMessage;
}
```

#### `AgentTimeline`

Shows chronological timeline of agent decisions.

**Features:**

- Vertical timeline layout
- Agent-specific color coding
- Incident filtering
- Time-based sorting
- Step labels

**Props:**

```typescript
interface AgentTimelineProps {
  messages: AgentMessage[];
  incidentId?: string;
}
```

#### `AgentMessageDetail`

Detailed view of a single agent message with full reasoning chain.

**Features:**

- Complete message information
- Embedded reasoning chain
- Related entity links (incidents, work orders)
- Raw data view for debugging
- Close/navigation controls

**Props:**

```typescript
interface AgentMessageDetailProps {
  message: AgentMessage;
  onClose?: () => void;
  onViewIncident?: (incidentId: string) => void;
  onViewWorkOrder?: (workOrderId: string) => void;
}
```

### Activity Indicators

#### `AgentStatusBadge`

Displays current status of an agent.

**Statuses:**

- `active` - Agent is active and ready
- `idle` - Agent is idle
- `processing` - Agent is currently processing (animated)

**Props:**

```typescript
interface AgentStatusBadgeProps {
  agentType: AgentType;
  status: AgentStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}
```

#### `AgentActivityDashboard`

Overview dashboard showing all agent statuses and activity.

**Features:**

- Real-time status for all agents
- Message count per agent
- Last activity timestamps
- Processing indicators
- Agent-specific icons and colors

**Usage:**

```tsx
import { AgentActivityDashboard } from "@/components/agents";

<AgentActivityDashboard />;
```

#### `AgentNotificationBadge`

Notification badge for new agent messages.

**Features:**

- Unread message count
- Animated notification indicator
- Click to mark as read
- Auto-updates with new messages

**Props:**

```typescript
interface AgentNotificationBadgeProps {
  className?: string;
  showIcon?: boolean;
}
```

#### `AgentPerformanceMetrics`

Performance metrics and statistics for agent system.

**Metrics:**

- Total messages processed
- Recent activity (last hour)
- Average response time
- Success rate
- Per-agent breakdown

**Usage:**

```tsx
import { AgentPerformanceMetrics } from "@/components/agents";

<AgentPerformanceMetrics />;
```

## Agent Types

The system supports three types of agents:

### PLANNER

- **Icon:** Brain (🧠)
- **Color:** Blue
- **Role:** Analyzes incidents and generates action plans
- **Output:** Situation summaries, risk assessments, recommended actions

### DISPATCHER

- **Icon:** Send (📤)
- **Color:** Green
- **Role:** Assigns tasks to field units and creates work orders
- **Output:** Unit assignments, work order specifications

### ANALYST

- **Icon:** BarChart (📊)
- **Color:** Purple
- **Role:** Provides explanations and insights about decisions
- **Output:** Human-readable explanations, key factors, recommendations

## Data Flow

```
WebSocket Event (agent:message)
    ↓
AgentStore (Zustand)
    ↓
AgentConsole Component
    ↓
AgentMessage Components
    ↓
User Interaction (click)
    ↓
AgentMessageDetail Modal
    ↓
ReasoningChain Visualization
```

## State Management

All agent data is managed through the `useAgentStore` Zustand store:

```typescript
import { useAgentStore } from "@/stores/agentStore";

const {
  messages, // All agent messages
  getFilteredMessages, // Get filtered messages
  getMessagesByAgent, // Get messages by agent type
  getMessagesByIncident, // Get messages by incident
  addMessage, // Add new message
  setFilterByAgent, // Set filter
  selectedMessageId, // Currently selected message
  setSelectedMessage, // Set selected message
} = useAgentStore();
```

## WebSocket Integration

Agent messages are received via WebSocket events:

```typescript
// Listen for agent messages
socket.on("agent:message", (data: AgentMessage) => {
  useAgentStore.getState().addMessage(data);
});

// Listen for specific agent events
socket.on("agent:plan_created", (data) => {
  /* ... */
});
socket.on("agent:dispatched", (data) => {
  /* ... */
});
socket.on("agent:explained", (data) => {
  /* ... */
});
```

## Styling

All components use:

- Tailwind CSS for styling
- Dark mode support via `dark:` variants
- Consistent color scheme per agent type
- Framer Motion for animations (where applicable)
- Lucide React for icons

## Example: Complete Agent Console Page

```tsx
import {
  AgentConsole,
  AgentActivityDashboard,
  AgentPerformanceMetrics,
  AgentMessageDetail,
} from "@/components/agents";
import { useAgentStore } from "@/stores/agentStore";
import { Modal } from "@/components/ui/Modal";

export function AgentConsolePage() {
  const { selectedMessageId, getMessageById } = useAgentStore();
  const selectedMessage = selectedMessageId
    ? getMessageById(selectedMessageId)
    : null;

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Main console */}
        <div className="col-span-2">
          <AgentConsole maxHeight="calc(100vh - 250px)" />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AgentActivityDashboard />
          <AgentPerformanceMetrics />
        </div>
      </div>

      {/* Detail modal */}
      {selectedMessage && (
        <Modal isOpen={!!selectedMessage} onClose={() => {}}>
          <AgentMessageDetail message={selectedMessage} />
        </Modal>
      )}
    </div>
  );
}
```

## Testing

Components can be tested with mock data:

```typescript
import { render, screen } from "@testing-library/react";
import { AgentMessage } from "@/components/agents";

const mockMessage: AgentMessage = {
  id: "msg-1",
  agentType: "PLANNER",
  step: "PLANNING",
  timestamp: new Date(),
  data: {
    plan: {
      situation_summary: "Test situation",
      recommended_actions: ["Action 1", "Action 2"],
    },
  },
};

test("renders agent message", () => {
  render(<AgentMessage message={mockMessage} />);
  expect(screen.getByText("PLANNER")).toBeInTheDocument();
});
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **6.1, 6.2, 6.3, 6.4**: Multi-agent AI orchestration display
- **7.1, 7.2, 7.3**: Agent transparency and explainability
- All components support real-time updates
- Chat-like interface for agent messages
- Message filtering by agent type
- Auto-scroll functionality
- Reasoning chain visualization
- Agent status indicators
- Performance metrics display
