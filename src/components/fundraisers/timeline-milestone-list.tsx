"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Skeleton } from "../ui/skeleton";

interface TimelineMilestone {
  id: string;
  title: string;
  purpose: string;
  achieved: boolean;
  achievedAt?: string;
  createdAt: string;
  stepNumber: number;
  amount: string;
}

interface TimelineMilestoneListProps {
  fundraiserId: string;
}

function getDateParts(dateString: string) {
  const date = new Date(dateString);
  return {
    month: date.toLocaleString("en-US", { month: "short" }),
    day: date.getDate(),
    year: date.getFullYear(),
  };
}

export function TimelineMilestoneList({
  fundraiserId,
}: TimelineMilestoneListProps) {
  const api = useApi();
  const { data: milestones, isLoading } = useQuery<TimelineMilestone[]>({
    queryKey: ["milestones", fundraiserId],
    queryFn: async () => {
      const response = await api.get(`/fundraisers/${fundraiserId}/milestones`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="timeline-root flex flex-col gap-8 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-8">
            <Skeleton className="h-24 w-2/3 rounded-lg" />
            <div className="h-8 w-8 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className="timeline-root text-center text-muted-foreground py-8">
        No milestones yet.
      </div>
    );
  }

  return (
    <div className="timeline-root relative py-8">
      {/* Vertical line */}
      <div className="timeline-line" />
      <div className="timeline-list">
        {milestones.map((milestone, idx) => {
          const isLeft = idx % 2 === 0;
          const dateParts = getDateParts(
            milestone.achievedAt || milestone.createdAt
          );
          return (
            <div key={milestone.id} className="timeline-row">
              {/* Left card or spacer */}
              {isLeft ? (
                <div className="flex justify-start w-1/2 min-w-0 p-5">
                  <div className="timeline-card w-full flex flex-row gap-4">
                    <div className="flex mb-2">
                      {/* Date block */}
                      <div className="timeline-date-block">
                        <div className="timeline-date-month">
                          {dateParts.month}
                        </div>
                        <div className="timeline-date-day">{dateParts.day}</div>
                        <div className="timeline-date-year">
                          {dateParts.year}
                        </div>
                      </div>
                    </div>
                    <div>
                      {/* Step number */}
                      <div className="text-xs font-semibold text-blue-500 mb-1">
                        Step {milestone.stepNumber}
                      </div>
                      <div className="timeline-card-title">
                        {milestone.title}
                      </div>
                      <div className="timeline-card-subtext">
                        {milestone.purpose}
                      </div>
                      <div className="text-sm font-medium text-green-700 mb-1">
                        ${milestone.amount}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-1/2" />
              )}
              {/* Dot */}
              <div className="flex flex-col items-center z-10">
                <div className="flex items-center justify-center">
                  <div className="timeline-dot-outer">
                    <div className="timeline-dot-inner" />
                  </div>
                </div>
              </div>
              {/* Right card or spacer */}
              {!isLeft ? (
                <div className="flex justify-start w-1/2 min-w-0 p-5">
                  <div className="timeline-card w-full flex flex-row gap-4">
                    <div className="flex mb-2">
                      {/* Date block */}
                      <div className="timeline-date-block">
                        <div className="timeline-date-month">
                          {dateParts.month}
                        </div>
                        <div className="timeline-date-day">{dateParts.day}</div>
                        <div className="timeline-date-year">
                          {dateParts.year}
                        </div>
                      </div>
                    </div>
                    <div>
                      {/* Step number */}
                      <div className="text-xs font-semibold text-blue-500 mb-1">
                        Step {milestone.stepNumber}
                      </div>
                      <div className="timeline-card-title">
                        {milestone.title}
                      </div>
                      <div className="timeline-card-subtext">
                        {milestone.purpose}
                      </div>
                      <div className="text-sm font-medium text-green-700 mb-1">
                        ${milestone.amount}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-1/2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
