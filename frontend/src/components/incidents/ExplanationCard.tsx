import { Explanation } from "@/types";
import { Card } from "@/components/ui";

interface ExplanationCardProps {
  explanation: Explanation;
}

export function ExplanationCard({ explanation }: ExplanationCardProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <Card>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Analysis & Explanation
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Confidence:
            </span>
            <span
              className={`text-sm font-semibold ${getConfidenceColor(
                explanation.confidence
              )}`}
            >
              {getConfidenceLabel(explanation.confidence)} (
              {(explanation.confidence * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Explanation */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Explanation
            </h4>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {explanation.explanation}
          </p>
        </div>

        {/* Key Factors */}
        {explanation.keyFactors && explanation.keyFactors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Key Contributing Factors
              </h4>
            </div>
            <ul className="space-y-2">
              {explanation.keyFactors.map((factor, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                >
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold mt-0.5">
                    {index + 1}
                  </span>
                  <span className="flex-1">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {explanation.recommendations &&
          explanation.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Recommendations
                </h4>
              </div>
              <ul className="space-y-2">
                {explanation.recommendations.map((recommendation, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      {recommendation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* AI Attribution */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span>
              Generated by CivicPulse AI Analyst Agent using advanced reasoning
              and pattern analysis
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
