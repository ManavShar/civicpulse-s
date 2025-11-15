/**
 * Incident Scoring Service
 * Calculates priority scores for incidents based on multiple factors
 */

import {
  Incident,
  ScoringFactors,
  Zone,
  IncidentCategory,
} from "../types/entities";
import ZoneRepository from "../repositories/ZoneRepository";
import SensorReadingRepository from "../repositories/SensorReadingRepository";
import logger from "../utils/logger";

interface ScoringWeights {
  severity: number; // max 30 points
  urgency: number; // max 25 points
  publicImpact: number; // max 20 points
  environmentalCost: number; // max 15 points
  safetyRisk: number; // max 10 points
}

/**
 * ScoringService class for calculating incident priority scores
 */
export class ScoringService {
  private readonly weights: ScoringWeights = {
    severity: 30,
    urgency: 25,
    publicImpact: 20,
    environmentalCost: 15,
    safetyRisk: 10,
  };

  /**
   * Calculate priority score for an incident
   */
  async calculatePriority(incident: Incident): Promise<number> {
    try {
      // Get zone information for context
      const zone = await ZoneRepository.findById(incident.zoneId);

      // Calculate individual factors
      const factors: ScoringFactors = {
        severity: await this.calculateSeverity(incident),
        urgency: await this.calculateUrgency(incident),
        publicImpact: this.calculatePublicImpact(incident, zone),
        environmentalCost: this.calculateEnvironmentalCost(incident, zone),
        safetyRisk: this.calculateSafetyRisk(incident),
      };

      // Calculate total score
      const totalScore = Object.values(factors).reduce(
        (sum, val) => sum + val,
        0
      );

      // Cap at 100
      const finalScore = Math.min(100, Math.round(totalScore));

      logger.debug("Calculated incident priority score", {
        incidentId: incident.id,
        score: finalScore,
        factors,
      });

      return finalScore;
    } catch (error) {
      logger.error("Error calculating priority score", {
        incidentId: incident.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Return default medium priority on error
      return 50;
    }
  }

  /**
   * Calculate priority score and update incident with breakdown
   */
  async scoreIncident(incident: Incident): Promise<Incident> {
    try {
      const zone = await ZoneRepository.findById(incident.zoneId);

      const factors: ScoringFactors = {
        severity: await this.calculateSeverity(incident),
        urgency: await this.calculateUrgency(incident),
        publicImpact: this.calculatePublicImpact(incident, zone),
        environmentalCost: this.calculateEnvironmentalCost(incident, zone),
        safetyRisk: this.calculateSafetyRisk(incident),
      };

      const totalScore = Object.values(factors).reduce(
        (sum, val) => sum + val,
        0
      );
      const finalScore = Math.min(100, Math.round(totalScore));

      // Update incident with score and breakdown
      incident.priorityScore = finalScore;
      incident.scoringBreakdown = factors;

      return incident;
    } catch (error) {
      logger.error("Error scoring incident", {
        incidentId: incident.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      incident.priorityScore = 50;
      return incident;
    }
  }

  /**
   * Calculate severity score (0-30 points)
   * Based on sensor deviation from normal values
   */
  private async calculateSeverity(incident: Incident): Promise<number> {
    try {
      // Use severity level as base
      const severityMap = {
        LOW: 0.25,
        MEDIUM: 0.5,
        HIGH: 0.75,
        CRITICAL: 1.0,
      };

      const baseScore = severityMap[incident.severity] * this.weights.severity;

      // If we have sensor data, adjust based on deviation
      if (incident.sensorId && incident.metadata?.sensorValue !== undefined) {
        const sensorValue = incident.metadata.sensorValue as number;

        // Get recent readings to calculate normal value
        const recentReadings = await SensorReadingRepository.findBySensor(
          incident.sensorId,
          100
        );

        if (recentReadings.length > 0) {
          const values = recentReadings.map((r) => r.value);
          const normalValue =
            values.reduce((sum, val) => sum + val, 0) / values.length;

          // Calculate deviation percentage
          const deviation = Math.abs(sensorValue - normalValue);
          const deviationPercent =
            normalValue !== 0 ? deviation / Math.abs(normalValue) : 0;

          // Adjust score based on deviation (up to 50% increase)
          const deviationBonus = Math.min(
            deviationPercent * this.weights.severity * 0.5,
            this.weights.severity * 0.5
          );

          return Math.min(baseScore + deviationBonus, this.weights.severity);
        }
      }

      return baseScore;
    } catch (error) {
      logger.error("Error calculating severity score", {
        incidentId: incident.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return this.weights.severity * 0.5; // Default to medium
    }
  }

  /**
   * Calculate urgency score (0-25 points)
   * Based on rate of change and time to critical
   */
  private async calculateUrgency(incident: Incident): Promise<number> {
    try {
      let urgencyScore = 0;

      // Base urgency on severity
      const severityUrgency = {
        LOW: 0.2,
        MEDIUM: 0.4,
        HIGH: 0.7,
        CRITICAL: 1.0,
      };

      urgencyScore = severityUrgency[incident.severity] * this.weights.urgency;

      // Calculate rate of change if we have sensor data
      if (incident.sensorId) {
        const recentReadings = await SensorReadingRepository.findBySensor(
          incident.sensorId,
          10
        );

        if (recentReadings.length >= 2) {
          // Calculate rate of change from last few readings
          const values = recentReadings.map((r) => r.value);

          // Simple linear regression for rate of change
          const rateOfChange = this.calculateRateOfChange(values);

          // If rapidly increasing/decreasing, increase urgency
          if (Math.abs(rateOfChange) > 0.1) {
            const rateBonus = Math.min(
              Math.abs(rateOfChange) * 10,
              this.weights.urgency * 0.3
            );
            urgencyScore += rateBonus;
          }
        }
      }

      // Time-based urgency - newer incidents are more urgent
      const incidentAge = Date.now() - incident.detectedAt.getTime();
      const ageMinutes = incidentAge / (1000 * 60);

      // Reduce urgency slightly for older incidents (up to 20% reduction)
      if (ageMinutes > 30) {
        const ageReduction = Math.min(ageMinutes / 300, 0.2); // Max 20% reduction
        urgencyScore *= 1 - ageReduction;
      }

      return Math.min(urgencyScore, this.weights.urgency);
    } catch (error) {
      logger.error("Error calculating urgency score", {
        incidentId: incident.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return this.weights.urgency * 0.5;
    }
  }

  /**
   * Calculate public impact score (0-20 points)
   * Based on affected population and area type
   */
  private calculatePublicImpact(incident: Incident, zone: Zone | null): number {
    let impactScore = 0;

    if (!zone) {
      return this.weights.publicImpact * 0.5; // Default medium impact
    }

    // Population impact
    const population = zone.population || 0;
    if (population > 10000) {
      impactScore += this.weights.publicImpact * 0.5;
    } else if (population > 5000) {
      impactScore += this.weights.publicImpact * 0.35;
    } else if (population > 1000) {
      impactScore += this.weights.publicImpact * 0.25;
    } else {
      impactScore += this.weights.publicImpact * 0.15;
    }

    // Area type impact
    const areaTypeScores = {
      COMMERCIAL: 0.5, // High impact in commercial areas
      RESIDENTIAL: 0.35, // Medium-high in residential
      INDUSTRIAL: 0.15, // Lower in industrial
      PARK: 0.25, // Medium in parks
    };

    impactScore += this.weights.publicImpact * areaTypeScores[zone.type];

    // Incident category modifiers
    const categoryModifiers: Record<IncidentCategory, number> = {
      WASTE_OVERFLOW: 1.0,
      LIGHTING_FAILURE: 0.8,
      WATER_ANOMALY: 1.2,
      TRAFFIC_CONGESTION: 1.1,
      ENVIRONMENTAL_HAZARD: 1.3,
      NOISE_COMPLAINT: 0.7,
    };

    impactScore *= categoryModifiers[incident.category] || 1.0;

    return Math.min(impactScore, this.weights.publicImpact);
  }

  /**
   * Calculate environmental cost score (0-15 points)
   * Based on potential environmental damage
   */
  private calculateEnvironmentalCost(
    incident: Incident,
    zone: Zone | null
  ): number {
    // Environmental impact by category
    const categoryImpact: Record<IncidentCategory, number> = {
      WASTE_OVERFLOW: 0.9, // High environmental impact
      LIGHTING_FAILURE: 0.2, // Low environmental impact
      WATER_ANOMALY: 0.8, // High - water waste/contamination
      TRAFFIC_CONGESTION: 0.6, // Medium - emissions
      ENVIRONMENTAL_HAZARD: 1.0, // Highest impact
      NOISE_COMPLAINT: 0.3, // Low environmental impact
    };

    let envScore =
      this.weights.environmentalCost * categoryImpact[incident.category];

    // Increase for park zones (more environmentally sensitive)
    if (zone?.type === "PARK") {
      envScore *= 1.3;
    }

    // Increase for critical severity
    if (incident.severity === "CRITICAL") {
      envScore *= 1.2;
    }

    return Math.min(envScore, this.weights.environmentalCost);
  }

  /**
   * Calculate safety risk score (0-10 points)
   * Based on potential danger to public safety
   */
  private calculateSafetyRisk(incident: Incident): number {
    // Safety risk by category
    const categorySafety: Record<IncidentCategory, number> = {
      WASTE_OVERFLOW: 0.5, // Medium - health hazard
      LIGHTING_FAILURE: 0.7, // High - accident risk
      WATER_ANOMALY: 0.6, // Medium-high - contamination risk
      TRAFFIC_CONGESTION: 0.8, // High - accident risk
      ENVIRONMENTAL_HAZARD: 1.0, // Highest - direct danger
      NOISE_COMPLAINT: 0.3, // Low - mainly nuisance
    };

    let safetyScore =
      this.weights.safetyRisk * categorySafety[incident.category];

    // Increase for critical severity
    if (incident.severity === "CRITICAL") {
      safetyScore *= 1.5;
    } else if (incident.severity === "HIGH") {
      safetyScore *= 1.2;
    }

    return Math.min(safetyScore, this.weights.safetyRisk);
  }

  /**
   * Calculate rate of change from time series data
   */
  private calculateRateOfChange(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear regression
    const n = values.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      const x = i; // Use index as x
      const y = values[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Normalize by average value
    const avgValue = sumY / n;
    return avgValue !== 0 ? slope / avgValue : 0;
  }

  /**
   * Get priority level from score
   */
  getPriorityLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  /**
   * Get scoring breakdown explanation
   */
  getScoreExplanation(factors: ScoringFactors): string {
    const explanations: string[] = [];

    if (factors.severity > 20) {
      explanations.push("High severity incident");
    }
    if (factors.urgency > 18) {
      explanations.push("Urgent response required");
    }
    if (factors.publicImpact > 15) {
      explanations.push("Significant public impact");
    }
    if (factors.environmentalCost > 10) {
      explanations.push("Environmental concerns");
    }
    if (factors.safetyRisk > 7) {
      explanations.push("Safety risk present");
    }

    return explanations.join(", ") || "Standard priority incident";
  }
}

// Create singleton instance
const scoringService = new ScoringService();

export default scoringService;
