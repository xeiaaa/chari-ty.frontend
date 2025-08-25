"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import PageHeader from "@/components/common/page-header";
import { VerificationRequestItem } from "@/components/admin/verification-request-item";
import { VerificationRequestsFilters } from "@/components/admin/verification-requests-filters";
import { VerificationRequestsPagination } from "@/components/admin/verification-requests-pagination";
import { useVerificationRequests } from "@/lib/hooks/use-verification-requests";

export default function AdminVerificationRequests() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    status?: "pending" | "approved" | "rejected";
    groupName?: string;
  }>({});

  const { data, isLoading, error, refetch } = useVerificationRequests({
    page: currentPage.toString(),
    limit: "10",
    ...filters,
  });

  const handleFiltersChange = (newFilters: {
    status?: "pending" | "approved" | "rejected";
    groupName?: string;
  }) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusCounts = () => {
    if (!data?.data) return { pending: 0, approved: 0, rejected: 0 };

    return data.data.reduce(
      (acc, request) => {
        acc[request.status]++;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  };

  const statusCounts = getStatusCounts();

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Verification Requests"
          message="Review and approve verification requests from groups and organizations."
        />
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-destructive font-medium">
                Failed to load verification requests. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Verification Requests"
        message="Review and approve verification requests from groups and organizations."
      />

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold">{statusCounts.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Approved
                </p>
                <p className="text-2xl font-bold">{statusCounts.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Rejected
                </p>
                <p className="text-2xl font-bold">{statusCounts.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <VerificationRequestsFilters
            status={filters.status}
            groupName={filters.groupName}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-6">
          {data.data.map((request) => (
            <VerificationRequestItem key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              No verification requests found
            </h3>
            <p className="text-muted-foreground">
              {filters.status || filters.groupName
                ? "Try adjusting your filters to see more results."
                : "All verification requests have been processed."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <VerificationRequestsPagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              hasNext={data.pagination.hasNext}
              hasPrev={data.pagination.hasPrev}
              onPageChange={handlePageChange}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
