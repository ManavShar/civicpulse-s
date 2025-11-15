import { useEffect, useState } from "react";
import { useWorkOrderStore } from "@/stores/workOrderStore";
import { WorkOrderList, WorkOrderDetail } from "@/components/workorders";
import { apiClient } from "@/lib/api";
import { Modal } from "@/components/ui";

export function WorkOrders() {
  const {
    selectedWorkOrderId,
    setWorkOrders,
    setLoading,
    setError,
    getWorkOrderById,
  } = useWorkOrderStore();

  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    // Fetch work orders on mount
    const fetchWorkOrders = async () => {
      setLoading(true);
      try {
        const response = await apiClient.workOrders.getAll();
        setWorkOrders(response.data);
      } catch (error) {
        console.error("Failed to fetch work orders:", error);
        setError("Failed to load work orders");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, [setWorkOrders, setLoading, setError]);

  const handleWorkOrderSelect = () => {
    setShowDetail(true);
  };

  const selectedWorkOrder = selectedWorkOrderId
    ? getWorkOrderById(selectedWorkOrderId)
    : null;

  return (
    <div className="h-full">
      <WorkOrderList onWorkOrderSelect={handleWorkOrderSelect} />

      {/* Work Order Detail Modal */}
      {showDetail && selectedWorkOrder && (
        <Modal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title="Work Order Details"
          size="lg"
        >
          <WorkOrderDetail
            workOrder={selectedWorkOrder}
            onClose={() => setShowDetail(false)}
          />
        </Modal>
      )}
    </div>
  );
}
