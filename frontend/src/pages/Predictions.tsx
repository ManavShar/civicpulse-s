import { useState, useEffect } from "react";
import { usePredictionStore } from "@/stores/predictionStore";
import { useSensorStore } from "@/stores/sensorStore";
import { apiClient } from "@/lib/api";
import { transformPredictions } from "@/lib/transformers";
import {
  PredictionList,
  PredictionDetail,
  PredictionTimeline,
} from "@/components/predictions";
import { Modal, Button } from "@/components/ui";

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

  const { sensors, getSensorById, setSensors } = useSensorStore();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch sensors and predictions on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch sensors first
        const sensorsResponse = await apiClient.sensors.getAll();
        setSensors(sensorsResponse.data.sensors || []);

        // Then fetch predictions
        const response = await apiClient.predictions.getAll();
        const transformedPredictions = transformPredictions(
          response.data.predictions || []
        );
        setPredictions(transformedPredictions);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setPredictions, setLoading, setError, setSensors]);

  const handleGeneratePredictions = async () => {
    try {
      setIsGenerating(true);
      console.log("Generating predictions for all sensors...");

      await apiClient.predictions.generateBatch();

      console.log("Prediction generation started! Refresh in a few moments.");
      alert(
        "Prediction generation started! The page will refresh in 5 seconds."
      );

      // Refresh predictions after a delay
      setTimeout(async () => {
        const response = await apiClient.predictions.getAll();
        const transformedPredictions = transformPredictions(
          response.data.predictions || []
        );
        setPredictions(transformedPredictions);
      }, 5000);
    } catch (error: any) {
      console.error("Error generating predictions:", error);
      alert(
        `Failed to generate predictions: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

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
    <div className="h-full flex flex-col">
      {/* Header with Generate Button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Predictions
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered forecasts for sensor readings
            </p>
          </div>
          <Button
            onClick={handleGeneratePredictions}
            disabled={isGenerating}
            variant="primary"
          >
            {isGenerating ? "Generating..." : "Generate Predictions"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Prediction List */}
        <div className="flex-1 overflow-hidden">
          <PredictionList onPredictionSelect={handlePredictionSelect} />
        </div>

        {/* Sidebar - Timeline */}
        <div className="w-96 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <PredictionTimeline
            predictions={predictions}
            sensors={Array.isArray(sensors) ? sensors : []}
            onPredictionClick={handlePredictionSelect}
          />
        </div>
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
