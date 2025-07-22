"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

export interface PublicTimelineMilestone {
  id: string;
  title: string;
  purpose: string;
  achieved: boolean;
  achievedAt?: string;
  createdAt: string;
  stepNumber: number;
  amount: string;
}

interface PublicTimelineMilestoneListProps {
  milestones: PublicTimelineMilestone[];
}

function getDateParts(dateString: string) {
  const date = new Date(dateString);
  return {
    month: date.toLocaleString("en-US", { month: "short" }),
    day: date.getDate(),
    year: date.getFullYear(),
  };
}

function formatAchievedTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

export function PublicTimelineMilestoneList({
  milestones,
}: PublicTimelineMilestoneListProps) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="timeline-root text-center text-muted-foreground py-8">
        No milestones yet.
      </div>
    );
  }

  const renderMilestoneCard = (milestone: PublicTimelineMilestone) => (
    <div className="timeline-card w-full flex flex-row gap-4">
      <div className="flex mb-2">
        {/* Date block */}
        <div className="timeline-date-block">
          <div className="timeline-date-month">
            {getDateParts(milestone.achievedAt || milestone.createdAt).month}
          </div>
          <div className="timeline-date-day">
            {getDateParts(milestone.achievedAt || milestone.createdAt).day}
          </div>
          <div className="timeline-date-year">
            {getDateParts(milestone.achievedAt || milestone.createdAt).year}
          </div>
        </div>
      </div>
      <div className="flex-1">
        {/* Step number and achievement status */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-semibold text-blue-500">
            Step {milestone.stepNumber}
          </div>
          {milestone.achieved && (
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Achieved</span>
            </div>
          )}
        </div>
        <div className="timeline-card-title">{milestone.title}</div>
        <div className="timeline-card-subtext">{milestone.purpose}</div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-green-700 mb-1">
            ${milestone.amount}
          </div>
          {milestone.achieved && milestone.achievedAt && (
            <div className="text-xs text-muted-foreground">
              Achieved at {formatAchievedTime(milestone.achievedAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="timeline-root relative py-8">
      {/* Vertical line */}
      <div className="timeline-line" />
      <div className="timeline-list">
        {/* Mobile: single column, Card -> Dot (except last) -> Card ... */}
        <div className="block sm:hidden">
          {milestones.map((milestone, idx) => (
            <React.Fragment key={milestone.id}>
              <div className="w-full flex justify-center items-center">
                {renderMilestoneCard(milestone)}
              </div>
              {/* Dot between cards, except after last card */}
              {idx !== milestones.length - 1 && (
                <div className="flex justify-center my-4">
                  <div
                    className={`timeline-dot-outer ${
                      milestone.achieved
                        ? "bg-green-100 ring-2 ring-green-500"
                        : ""
                    }`}
                  >
                    <div
                      className={`timeline-dot-inner ${
                        milestone.achieved ? "bg-green-500" : ""
                      }`}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {/* Desktop: alternating left/right with dot always centered */}
        <div className="hidden sm:block">
          {milestones.map((milestone, idx) => {
            const isLeft = idx % 2 === 0;
            return (
              <div
                key={milestone.id}
                className="timeline-row flex flex-row w-full items-center justify-between gap-0 relative"
              >
                {/* Left card or empty */}
                <div
                  className={
                    isLeft
                      ? "w-1/2 min-w-0 p-5 flex justify-end items-center"
                      : "w-1/2 min-w-0 p-5"
                  }
                >
                  {isLeft && renderMilestoneCard(milestone)}
                </div>
                {/* Dot (always centered on the line) */}
                <div className="flex flex-col items-center z-10 w-auto">
                  <div className="flex items-center justify-center h-auto">
                    <div
                      className={`timeline-dot-outer ${
                        milestone.achieved
                          ? "bg-green-100 ring-2 ring-green-500"
                          : ""
                      }`}
                    >
                      <div
                        className={`timeline-dot-inner ${
                          milestone.achieved ? "bg-green-500" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>
                {/* Right card or empty */}
                <div
                  className={
                    !isLeft
                      ? "w-1/2 min-w-0 p-5 flex justify-start items-center"
                      : "w-1/2 min-w-0 p-5"
                  }
                >
                  {!isLeft && renderMilestoneCard(milestone)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
