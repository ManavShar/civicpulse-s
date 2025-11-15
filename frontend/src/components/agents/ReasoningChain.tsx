import React, { useState } from "react";
import { AgentMessage } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import clsx from "clsx";

interface ReasoningChainProps {
  message: AgentMessage;
}

interface ReasoningStep {
  type: "thought" | "action" | "result";
  label: string;
  content: any;
  timestamp?: Date;
}

export function ReasoningChain({ message }: ReasoningChainProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  // Parse reasoning steps from message data
  const parseReasoningSteps = (): ReasoningStep[] => {
    const steps: ReasoningStep[] = [];

    // Input step
    if (message.step === "INPUT" || message.data.incident) {
      steps.push({
        type: "thought",
        label: "Input Analysis",
        content: message.data.incident || message.data,
      });
    }

    // Planning step
    if (message.data.plan) {
      steps.push({
        type: "thought",
        label: "Situation Assessment",
        content: {
          summary: message.data.plan.situation_summary,
          risk: message.data.plan.risk_assessment,
        },
      });

      steps.push({
        type: "action",
        label: "Action Plan",
        content: {
          actions: message.data.plan.recommended_actions,
          resources: message.data.plan.resource_requirements,
          timeline: message.data.plan.timeline,
        },
      });
    }

    // Dispatching step
    if (message.data.assignments) {
      steps.push({
        type: "action",
        label: "Unit Assignment",
        content: {
          assignments: message.data.assignments,
          workOrders: message.data.work_orders,
        },
      });
    }

    // Explanation step
    if (message.data.explanation) {
      steps.push({
        type: "result",
        label: "Analysis & Explanation",
        content: {
          explanation: message.data.explanation.explanation,
          keyFactors: message.data.explanation.key_factors,
          recommendations: message.data.explanation.recommendations,
          confidence: message.data.explanation.confidence,
        },
      });
    }

    // Output step
    if (message.step === "OUTPUT" && steps.length === 0) {
      steps.push({
        type: "result",
        label: "Output",
        content: message.data,
      });
    }

    return steps;
  };

  const steps = parseReasoningSteps();

  const getStepIcon = (type: ReasoningStep["type"]) => {
    const icons = {
      thought: "🧠",
      action: "⚡",
      result: "✓",
    };
    return icons[type];
  };

  const getStepColor = (type: ReasoningStep["type"]) => {
    const colors = {
      thought:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      action:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      result:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    };
    return colors[type];
  };

  const renderContent = (content: any): React.ReactElement => {
    if (typeof content === "string") {
      return (
        <p className="text-sm text-gray-700 dark:text-gray-300">{content}</p>
      );
    }

    if (Array.isArray(content)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {content.map((item, idx) => (
            <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof content === "object" && content !== null) {
      return (
        <div className="space-y-2">
          {Object.entries(content).map(([key, value]) => (
            <div key={key}>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                {key.replace(/_/g, " ")}:
              </span>
              <div className="mt-1">
                {typeof value === "object" ? (
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    <code>{JSON.stringify(value, null, 2)}</code>
                  </pre>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {String(value)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
        <code>{JSON.stringify(content, null, 2)}</code>
      </pre>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reasoning Chain
          </h4>
          <Badge variant="info" size="sm">
            {steps.length} step{steps.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step header */}
                <button
                  onClick={() => toggleStep(index)}
                  className={clsx(
                    "w-full flex items-start gap-4 p-4 text-left transition-colors",
                    "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={clsx(
                      "relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm",
                      getStepColor(step.type)
                    )}
                  >
                    {getStepIcon(step.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {step.label}
                      </span>
                      <Badge variant="default" size="sm">
                        {step.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Expand icon */}
                  <div className="flex-shrink-0 pt-1">
                    {expandedSteps.has(index) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {expandedSteps.has(index) && (
                  <div className="pl-16 pr-4 pb-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      {renderContent(step.content)}
                    </div>
                  </div>
                )}

                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
