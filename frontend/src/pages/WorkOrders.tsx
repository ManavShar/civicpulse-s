import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkOrderStore } from "@/stores/workOrderStore";
import { WorkOrderList, WorkOrderDetail } from "@/components/workorders";
import { apiClient } from "@/lib/api";
import { Modal } from "@/components/ui";

export function WorkOrders() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedWorkOrderId,
    setSelectedWorkOrder,
    setWorkOrders,
    setLoading,
    setError,
    getWorkOrderById,
  } = useWorkOrderStore();

  const [showDetail, setShowDetail] = useState(!!id);

  // Handle deep linking - if ID is in URL, select that work order
  useEffect(() => {
    if (id) {
      setSelectedWorkOrder(id);
      setShowDetail(true);
    }
  }, [id, setSelectedWorkOrder]);

  useEffect(() => {
    // Fetch work orders on mount
    const fetchWorkOrders = async () => {
      setLoading(true);
      try {
        const response = await apiClient.workOrders.getAll();
        // Backend returns { workOrders: [...], count: ... }
        setWorkOrders(response.data.workOrders || []);
      } catch (error) {
        console.error("Failed to fetch work orders:", error);
        setError("Failed to load work orders");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, [setWorkOrders, setLoading, setError]);

  const handleWorkOrderSelect = (workOrderId: string) => {
    setSelectedWorkOrder(workOrderId);
    setShowDetail(true);
    // Update URL for deep linking
    navigate(`/work-orders/${workOrderId}`, { replace: true });
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedWorkOrder(null);
    // Clear ID from URL
    navigate("/work-orders", { replace: true });
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
          onClose={handleCloseDetail}
          title="Work Order Details"
          size="lg"
        >
          <WorkOrderDetail
            workOrder={selectedWorkOrder}
            onClose={handleCloseDetail}
          />
        </Modal>
      )}
    </div>
  );
}
