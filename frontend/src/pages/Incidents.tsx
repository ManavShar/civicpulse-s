import { useState, useEffect } from "react";
import { useIncidentStore } from "@/stores/incidentStore";
import { IncidentList, IncidentDetail } from "@/components/incidents";
import { apiClient } from "@/lib/api";
import { Modal } from "@/components/ui";

export function Incidents() {
  const [showDetail, setShowDetail] = useState(false);
  const {
    selectedIncidentId,
    setSelectedIncident,
    getIncidentById,
    updateIncident,
    setIncidents,
    setLoading,
    setError,
  } = useIncidentStore();

  const selectedIncident = selectedIncidentId
    ? getIncidentById(selectedIncidentId)
    : null;

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const response = await apiClient.incidents.getAll();
        setIncidents(response.data);
      } catch (error: any) {
        setError(error.message || "Failed to load incidents");
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [setIncidents, setLoading, setError]);

  const handleIncidentSelect = (id: string) => {
    setSelectedIncident(id);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedIncident(null);
  };

  const handleDismiss = async (id: string) => {
    try {
      await apiClient.incidents.update(id, { status: "DISMISSED" });
      updateIncident(id, { status: "DISMISSED" });
      handleCloseDetail();
    } catch (error) {
      console.error("Failed to dismiss incident:", error);
    }
  };

  const handleCreateWorkOrder = async (id: string) => {
    try {
      const incident = getIncidentById(id);
      if (!incident) return;

      await apiClient.workOrders.create({
        incidentId: id,
        title: `Resolve ${incident.type.replace(/_/g, " ")}`,
        description: incident.description,
        priority: incident.severity,
        location: incident.location,
        zoneId: incident.zoneId,
        estimatedDuration: 60,
      });

      // Refresh incident to get updated work orders
      const response = await apiClient.incidents.getById(id);
      updateIncident(id, response.data);
    } catch (error) {
      console.error("Failed to create work order:", error);
    }
  };

  const handleViewOnMap = (id: string) => {
    // This would navigate to the map view and focus on the incident
    // For now, we'll just log it
    console.log("View incident on map:", id);
    // In a real implementation, you might use:
    // navigate('/map', { state: { focusIncidentId: id } });
  };

  return (
    <div className="h-full">
      <IncidentList onIncidentSelect={handleIncidentSelect} />

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <Modal
          isOpen={showDetail}
          onClose={handleCloseDetail}
          title="Incident Details"
          size="xl"
        >
          <IncidentDetail
            incident={selectedIncident}
            onDismiss={handleDismiss}
            onCreateWorkOrder={handleCreateWorkOrder}
            onViewOnMap={handleViewOnMap}
          />
        </Modal>
      )}
    </div>
  );
}
