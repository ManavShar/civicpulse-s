# Work Order Management UI Components

This directory contains the UI components for managing work orders in the CivicPulse AI platform.

## Components

### WorkOrderCard

A card component that displays work order information in a compact format.

**Features:**

- Status and priority badges with color coding
- Progress bar for in-progress work orders
- Assigned unit information
- Location coordinates
- Estimated completion time
- Duration display

**Props:**

- `workOrder: WorkOrder` - The work order data to display
- `onSelect?: (id: string) => void` - Callback when card is clicked
- `isSelected?: boolean` - Whether the card is currently selected

### WorkOrderList

A virtualized list component that displays all work orders with filtering and sorting.

**Features:**

- Virtual scrolling for performance with large datasets
- Real-time updates via WebSocket
- Status and priority filtering
- Automatic sorting by priority and estimated completion
- Empty state handling
- Loading skeletons

**Props:**

- `onWorkOrderSelect?: (id: string) => void` - Callback when a work order is selected

### WorkOrderFilters

A filter panel component for filtering work orders by status and priority.

**Features:**

- Status filter (Created, Assigned, In Progress, Completed, Cancelled)
- Priority filter (Low, Medium, High, Critical)
- Active filter count badge
- Clear all filters button
- Collapsible filter panel

**Props:**

- `onFilterChange: (filters: any) => void` - Callback when filters change
- `onClearFilters: () => void` - Callback to clear all filters

### WorkOrderDetail

A detailed view component showing complete work order information.

**Features:**

- Full work order description
- Assigned unit details
- Location information
- Timeline visualization of work order progression
- Linked incident information
- AI-generated explanation for work order creation
- Status-based color coding

**Props:**

- `workOrder: WorkOrder` - The work order to display
- `onClose?: () => void` - Callback to close the detail view

## Map Integration

Work orders are integrated into the map visualization with the following features:

### Work Order Markers

- Custom markers with status-based icons and colors
- Priority indicators for high/critical work orders
- Pulse animation for in-progress work orders
- Hover effects for better interactivity

### Work Order Popup

- Displays work order summary on marker click
- Shows status, priority, assigned unit, and estimated completion
- "View Details" button to open full detail view

### Route Visualization

Work order markers are positioned at the incident location, allowing operators to:

- See the spatial distribution of active work orders
- Identify work order clusters
- Track work order status changes in real-time

## Usage Example

```tsx
import { WorkOrderList, WorkOrderDetail } from "@/components/workorders";
import { useWorkOrderStore } from "@/stores/workOrderStore";

function WorkOrdersPage() {
  const { selectedWorkOrderId, getWorkOrderById } = useWorkOrderStore();
  const [showDetail, setShowDetail] = useState(false);

  const selectedWorkOrder = selectedWorkOrderId
    ? getWorkOrderById(selectedWorkOrderId)
    : null;

  return (
    <div>
      <WorkOrderList onWorkOrderSelect={() => setShowDetail(true)} />

      {showDetail && selectedWorkOrder && (
        <Modal isOpen={showDetail} onClose={() => setShowDetail(false)}>
          <WorkOrderDetail
            workOrder={selectedWorkOrder}
            onClose={() => setShowDetail(false)}
          />
        </Modal>
      )}
    </div>
  );
}
```

## Real-Time Updates

Work orders receive real-time updates through WebSocket events:

- `workorder:created` - New work order created
- `workorder:updated` - Work order status or details updated

The components automatically reflect these changes through the Zustand store.

## Styling

All components use Tailwind CSS with dark mode support. Status and priority colors follow the design system:

**Status Colors:**

- Created: Gray
- Assigned: Blue
- In Progress: Amber (with pulse animation)
- Completed: Green
- Cancelled: Red

**Priority Colors:**

- Low: Gray
- Medium: Blue
- High: Orange
- Critical: Red

## Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader friendly
- Color contrast compliance (WCAG 2.1 Level AA)
