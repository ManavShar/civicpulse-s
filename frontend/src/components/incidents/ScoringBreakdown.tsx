import { ScoringFactors } from "@/types";

interface ScoringBreakdownProps {
  scoringBreakdown: ScoringFactors;
  totalScore: number;
}

export function ScoringBreakdown({
  scoringBreakdown,
  totalScore,
}: ScoringBreakdownProps) {
  const factors = [
    {
      name: "Severity",
      value: scoringBreakdown.severity,
      max: 30,
      color: "bg-red-500",
    },
    {
      name: "Urgency",
      value: scoringBreakdown.urgency,
      max: 25,
      color: "bg-orange-500",
    },
    {
      name: "Public Impact",
      value: scoringBreakdown.publicImpact,
      max: 20,
      color: "bg-yellow-500",
    },
    {
      name: "Environmental Cost",
      value: scoringBreakdown.environmentalCost,
      max: 15,
      color: "bg-green-500",
    },
    {
      name: "Safety Risk",
      value: scoringBreakdown.safetyRisk,
      max: 10,
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Priority Score Breakdown
      </h3>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Priority Score
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalScore}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(totalScore, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {factors.map((factor) => (
          <div key={factor.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {factor.name}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {factor.value} / {factor.max}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`${factor.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${(factor.value / factor.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Priority scores are calculated based on multiple factors to help
          prioritize incident response. Higher scores indicate more critical
          incidents requiring immediate attention.
        </p>
      </div>
    </div>
  );
}
