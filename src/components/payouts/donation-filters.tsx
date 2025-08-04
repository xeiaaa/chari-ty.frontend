import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SortAsc, SortDesc, Grid3X3, List } from "lucide-react";

interface DonationFiltersProps {
  filters: {
    status: string;
    isAnonymous: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    limit: number;
  };
  onFilterChange: (key: string, value: string) => void;
  viewMode: "card" | "table";
  onViewModeChange: (mode: "card" | "table") => void;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

const DonationFilters = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  meta,
}: DonationFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="status-filter">Status</Label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="anonymous-filter">Anonymous</Label>
          <select
            id="anonymous-filter"
            value={filters.isAnonymous}
            onChange={(e) => onFilterChange("isAnonymous", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All donations</option>
            <option value="true">Anonymous only</option>
            <option value="false">Named only</option>
          </select>
        </div>

        <div className="flex items-end space-x-2">
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="sort-by">Sort by</Label>
            <select
              id="sort-by"
              value={filters.sortBy}
              onChange={(e) => onFilterChange("sortBy", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="createdAt">Date</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
              <option value="name">Name</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onFilterChange(
                "sortOrder",
                filters.sortOrder === "asc" ? "desc" : "asc"
              )
            }
            className="h-9 px-3"
          >
            {filters.sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Results Info and Items Per Page and View Toggle */}
      {meta && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            donations
          </div>

          <div className="flex flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="per-page-filter" className="text-sm">
                Items per page:
              </Label>
              <select
                id="per-page-filter"
                value={filters.limit}
                onChange={(e) => onFilterChange("limit", e.target.value)}
                className="flex h-8 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <Label htmlFor="view-toggle" className="text-sm">
                  View:
                </Label>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "card" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange("card")}
                    className="rounded-r-none border-r"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange("table")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationFilters;
