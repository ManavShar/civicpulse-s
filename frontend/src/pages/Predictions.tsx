import { useState, useEffect } from "react";
import { usePredictionStore } from "@/stores/predictionStore";
import { useSensorStore } from "@/stores/sensorStore";
import { apiClient } from "@/lib/api";
import {
  PredictionList,
  PredictionDetail,
  PredictionTimeline,
} from "@/components/predictions";
import { Modal } from "@/components/ui";

export function Predictions() {
  const {
    predictions,
    selectedPredictionId,
    setSelectedPrediction,
    setPredictions,
    setLoading,
    setError,
    getPredictionById,
  } = usePredictionStore();

  const { sensors, getSensorById } = useSensorStore();

  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch predictions on mount
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.predictions.getAll();
        setPredictions(response.data);
      } catch (error: any) {
        console.error("Error fetching predictions:", error);
        setError(error.message || "Failed to load predictions");
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [setPredictions, setLoading, setError]);

  const handlePredictionSelect = (id: string) => {
    setSelectedPrediction(id);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedPrediction(null);
  };

  const selectedPrediction = selectedPredictionId
    ? getPredictionById(selectedPredictionId)
    : null;

  const selectedSensor = selectedPrediction
    ? getSensorById(selectedPrediction.sensorId)
    : undefined;

  return (
    <div className="h-full flex">
      {/* Main Content - Prediction List */}
      <div className="flex-1 overflow-hidden">
        <PredictionList onPredictionSelect={handlePredictionSelect} />
      </div>

      {/* Sidebar - Timeline */}
      <div className="w-96 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <PredictionTimeline
          predictions={predictions}
          sensors={sensors}
          onPredictionClick={handlePredictionSelect}
        />
      </div>

      {/* Detail Modal */}
      {selectedPrediction && (
        <Modal
          isOpen={showDetailModal}
          onClose={handleCloseDetail}
          title="Prediction Details"
          size="xl"
        >
          <PredictionDetail
            prediction={selectedPrediction}
            sensor={selectedSensor}
            historicalReadings={[]}
            onClose={handleCloseDetail}
          />
        </Modal>
      )}
    </div>
  );
}
