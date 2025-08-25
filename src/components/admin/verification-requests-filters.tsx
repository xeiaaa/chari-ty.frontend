"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerificationRequestsFiltersProps {
  status?: "pending" | "approved" | "rejected";
  groupName?: string;
  onFiltersChange: (filters: {
    status?: "pending" | "approved" | "rejected";
    groupName?: string;
  }) => void;
  onClearFilters: () => void;
}

export function VerificationRequestsFilters({
  status,
  groupName,
  onFiltersChange,
  onClearFilters,
}: VerificationRequestsFiltersProps) {
  const [localStatus, setLocalStatus] = useState<
    "" | "pending" | "approved" | "rejected"
  >(status || "");
  const [localGroupName, setLocalGroupName] = useState(groupName || "");

  // Update local state when props change
  useEffect(() => {
    setLocalStatus(status || "");
    setLocalGroupName(groupName || "");
  }, [status, groupName]);

  const handleApplyFilters = () => {
    onFiltersChange({
      status: localStatus || undefined,
      groupName: localGroupName || undefined,
    });
  };

  const handleClearFilters = () => {
    setLocalStatus("");
    setLocalGroupName("");
    onClearFilters();
  };

  const hasActiveFilters = status || groupName;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            value={localStatus}
            onChange={(e) =>
              setLocalStatus(
                e.target.value as "" | "pending" | "approved" | "rejected"
              )
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Group Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by group name..."
              value={localGroupName}
              onChange={(e) => setLocalGroupName(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-end">
          <Button onClick={handleApplyFilters} className="w-full">
            Apply Filters
          </Button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {status.charAt(0).toUpperCase() + status.slice(1)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onFiltersChange({ ...{ status: undefined, groupName } })
                }
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {groupName && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Group: {groupName}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onFiltersChange({ ...{ status, groupName: undefined } })
                }
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
