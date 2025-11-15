import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useWorkOrderStore } from "@/stores/workOrderStore";
import { WorkOrderCard } from "./WorkOrderCard";
import { WorkOrderFilters } from "./WorkOrderFilters";
import { Skeleton } from "@/components/ui";

interface WorkOrderListProps {
  onWorkOrderSelect?: (id: string) => void;
}

export function WorkOrderList({ onWorkOrderSelect }: WorkOrderListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    selectedWorkOrderId,
    loading,
    error,
    setFilters,
    clearFilters,
    setSelectedWorkOrder,
    getSortedWorkOrders,
  } = useWorkOrderStore();

  const workOrders = getSortedWorkOrders();

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: workOrders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 5,
  });

  const handleWorkOrderSelect = (id: string) => {
    setSelectedWorkOrder(id);
    if (onWorkOrderSelect) {
      onWorkOrderSelect(id);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Error loading work orders: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Work Orders
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {workOrders.length} work order{workOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filters */}
        <WorkOrderFilters
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Work Order List with Virtual Scrolling */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto p-4"
        style={{ height: "calc(100vh - 300px)" }}
      >
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : workOrders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No work orders found
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Try adjusting your filters
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const workOrder = workOrders[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="pb-4">
                    <WorkOrderCard
                      workOrder={workOrder}
                      onSelect={handleWorkOrderSelect}
                      isSelected={workOrder.id === selectedWorkOrderId}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
