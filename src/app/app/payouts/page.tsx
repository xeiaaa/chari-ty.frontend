"use client";

import { useAccount } from "@/contexts/account-context";
import { useGroupBySlug } from "@/lib/hooks/use-group-by-slug";
import { useApi, getErrorMessage } from "@/lib/api";
import { useSnackbar, Snackbar } from "@/components/ui/snackbar";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  CreditCard,
  Link,
  Unlink,
  AlertCircle,
  CheckCircle,
  Receipt,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayoutsPage() {
  const { selectedAccount } = useAccount();
  const {
    data: group,
    isLoading,
    error,
  } = useGroupBySlug(selectedAccount.slug);
  const api = useApi();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "stripe";

  const [tab, setTab] = useState(currentTab);

  const handleTabChange = (value: string) => {
    setTab(value);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Sync local state if URL changes externally (optional)
  useEffect(() => {
    if (currentTab !== tab) {
      setTab(currentTab);
    }
  }, [currentTab, tab]);

  // Donation list state
  const [donationFilters, setDonationFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: "createdAt" as "createdAt" | "amount" | "status" | "name",
    sortOrder: "desc" as "asc" | "desc",
    status: "" as string,
    currency: "" as string,
    isAnonymous: "" as string,
    fundraiserId: "" as string,
    fundraiserLinkId: "" as string,
  });

  // View toggle state
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  const connectStripeMutation = useMutation({
    mutationFn: async () => {
      if (!group?.id) throw new Error("Group not loaded");
      const { data } = await api.post("/payments/stripe/connect", {
        groupId: group.id,
      });
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        showSnackbar("No onboarding URL returned from server.", "error");
      }
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes("not allowed")) {
        showSnackbar(
          "You don't have permission to connect this group to Stripe.",
          "error"
        );
      } else if (errorMessage.includes("not found")) {
        showSnackbar(
          "Group not found. Please refresh the page and try again.",
          "error"
        );
      } else {
        showSnackbar(errorMessage, "error");
      }
    },
  });

  const disconnectStripeMutation = useMutation({
    mutationFn: async () => {
      if (!group?.id) throw new Error("Group not loaded");
      const { data } = await api.post("/payments/stripe/disconnect", {
        groupId: group.id,
      });
      return data;
    },
    onSuccess: (data) => {
      showSnackbar(
        data.message || "Stripe account disconnected successfully",
        "success"
      );
      // Refetch the group data to update the UI
      window.location.reload();
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes("published fundraisers")) {
        showSnackbar(
          "Cannot disconnect while you have active fundraisers. Please unpublish all fundraisers first.",
          "error"
        );
      } else if (errorMessage.includes("not allowed")) {
        showSnackbar(
          "You don't have permission to disconnect this group from Stripe.",
          "error"
        );
      } else if (errorMessage.includes("not connected")) {
        showSnackbar("This group is not connected to Stripe.", "error");
      } else if (errorMessage.includes("not found")) {
        showSnackbar(
          "Group not found. Please refresh the page and try again.",
          "error"
        );
      } else {
        showSnackbar(errorMessage, "error");
      }
    },
  });

  const handleConnectStripe = () => {
    connectStripeMutation.mutate();
  };

  const handleDisconnectStripe = () => {
    disconnectStripeMutation.mutate();
  };

  // Donation list query
  const {
    data: donationsData,
    isLoading: isLoadingDonations,
    error: donationsError,
  } = useQuery({
    queryKey: ["group-donations", selectedAccount.slug, donationFilters],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add pagination params
      params.append("page", donationFilters.page.toString());
      params.append("limit", donationFilters.limit.toString());

      // Add sorting params
      params.append("sortBy", donationFilters.sortBy);
      params.append("sortOrder", donationFilters.sortOrder);

      // Add filter params (only if they have values)
      if (donationFilters.status)
        params.append("status", donationFilters.status);
      if (donationFilters.currency)
        params.append("currency", donationFilters.currency);
      if (donationFilters.isAnonymous)
        params.append("isAnonymous", donationFilters.isAnonymous);
      if (donationFilters.fundraiserId)
        params.append("fundraiserId", donationFilters.fundraiserId);
      if (donationFilters.fundraiserLinkId)
        params.append("fundraiserLinkId", donationFilters.fundraiserLinkId);

      const { data } = await api.get(
        `/groups/slug/${selectedAccount.slug}/donations?${params.toString()}`
      );
      return data;
    },
    enabled: !!selectedAccount.slug && !!group?.stripeId,
  });

  const handleFilterChange = (key: string, value: string) => {
    setDonationFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setDonationFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      case "refunded":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Donation Payouts</h1>
          <p className="text-muted-foreground">
            Connect your Stripe account to receive donations from your
            fundraisers
          </p>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>
                  {getErrorMessage(error).includes("not found")
                    ? "Group not found. Please check your account settings."
                    : "Failed to load group information. Please try again."}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isConnected = !!group?.stripeId;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Donation Payouts</h1>
        <p className="text-muted-foreground">
          Connect your Stripe account to receive donations from your fundraisers
        </p>
      </div>

      <Tabs
        defaultValue={tab}
        className="space-y-6"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stripe" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Stripe Connect</span>
          </TabsTrigger>
          <TabsTrigger
            value="donations"
            className="flex items-center space-x-2"
          >
            <Receipt className="h-4 w-4" />
            <span>Donations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stripe" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Stripe Connect</CardTitle>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
              <CardDescription>
                Connect your Stripe account to receive donations from your
                fundraisers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>
                      Your Stripe account is connected and ready to receive
                      donations
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Stripe Account ID: {group.stripeId}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDisconnectStripe}
                    disabled={disconnectStripeMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Unlink className="h-4 w-4" />
                    <span>
                      {disconnectStripeMutation.isPending
                        ? "Disconnecting..."
                        : "Disconnect Stripe"}
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>
                      Connect your Stripe account to start receiving donations
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You need to connect your Stripe account to receive donations
                    from your fundraisers. This will allow you to receive funds
                    directly to your bank account.
                  </p>
                  <Button
                    onClick={handleConnectStripe}
                    className="flex items-center space-x-2"
                  >
                    <Link className="h-4 w-4" />
                    <span>Connect Stripe</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <CardTitle>Donation History</CardTitle>
              </div>
              <CardDescription>
                View your donation history, transaction status, and payout
                information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary */}
              {donationsData?.meta && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Donations
                      </p>
                      <p className="text-2xl font-bold">
                        {donationsData.meta.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Amount
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          Number(donationsData.meta.totalAmount),
                          "USD"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">
                        {donationsData.items?.filter(
                          (d: { status: string }) => d.status === "completed"
                        ).length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isConnected ? (
                <div className="space-y-6">
                  {/* Filters and View Toggle */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="status-filter">Status</Label>
                        <select
                          id="status-filter"
                          value={donationFilters.status}
                          onChange={(e) =>
                            handleFilterChange("status", e.target.value)
                          }
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
                          value={donationFilters.isAnonymous}
                          onChange={(e) =>
                            handleFilterChange("isAnonymous", e.target.value)
                          }
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
                            value={donationFilters.sortBy}
                            onChange={(e) =>
                              handleFilterChange("sortBy", e.target.value)
                            }
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
                            handleFilterChange(
                              "sortOrder",
                              donationFilters.sortOrder === "asc"
                                ? "desc"
                                : "asc"
                            )
                          }
                          className="h-9 px-3"
                        >
                          {donationFilters.sortOrder === "asc" ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Results Info and Items Per Page and View Toggle */}
                    {donationsData?.meta && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing{" "}
                          {(donationFilters.page - 1) * donationFilters.limit +
                            1}{" "}
                          to{" "}
                          {Math.min(
                            donationFilters.page * donationFilters.limit,
                            donationsData.meta.total
                          )}{" "}
                          of {donationsData.meta.total} donations
                        </div>

                        <div className="flex flex-row gap-4">
                          <div className="flex items-center space-x-2">
                            <Label
                              htmlFor="per-page-filter"
                              className="text-sm"
                            >
                              Items per page:
                            </Label>
                            <select
                              id="per-page-filter"
                              value={donationFilters.limit}
                              onChange={(e) =>
                                handleFilterChange("limit", e.target.value)
                              }
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
                                  variant={
                                    viewMode === "card" ? "default" : "ghost"
                                  }
                                  size="sm"
                                  onClick={() => setViewMode("card")}
                                  className="rounded-r-none border-r"
                                >
                                  <Grid3X3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={
                                    viewMode === "table" ? "default" : "ghost"
                                  }
                                  size="sm"
                                  onClick={() => setViewMode("table")}
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

                  {/* Donations List */}
                  {isLoadingDonations ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-6 w-24 mb-2" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      ))}
                    </div>
                  ) : donationsError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-destructive">
                        Failed to load donations
                      </p>
                    </div>
                  ) : donationsData?.items?.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        No donations found
                      </p>
                    </div>
                  ) : viewMode === "card" ? (
                    <div className="space-y-4">
                      {donationsData?.items?.map(
                        (donation: {
                          id: string;
                          amount: string;
                          currency: string;
                          status: string;
                          isAnonymous: boolean;
                          name?: string;
                          message?: string;
                          createdAt: string;
                          fundraiser?: { title: string };
                          sourceLink?: { alias: string };
                        }) => (
                          <div
                            key={donation.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {donation.isAnonymous
                                    ? "Anonymous"
                                    : donation.name || "Unknown"}
                                </span>
                                <Badge
                                  variant={getStatusBadgeVariant(
                                    donation.status
                                  )}
                                >
                                  {donation.status}
                                </Badge>
                              </div>
                              <span className="font-semibold text-lg">
                                {formatCurrency(
                                  Number(donation.amount),
                                  donation.currency
                                )}
                              </span>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Fundraiser: {donation.fundraiser?.title}</p>
                              <p>Date: {formatDate(donation.createdAt)}</p>
                              {donation.message && (
                                <p className="italic">
                                  &ldquo;{donation.message}&rdquo;
                                </p>
                              )}
                              {donation.sourceLink && (
                                <p>Source: {donation.sourceLink.alias}</p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Donor</th>
                            <th className="text-left p-3 font-medium">
                              Amount
                            </th>
                            <th className="text-left p-3 font-medium">
                              Status
                            </th>
                            <th className="text-left p-3 font-medium">
                              Fundraiser
                            </th>
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {donationsData?.items?.map(
                            (donation: {
                              id: string;
                              amount: string;
                              currency: string;
                              status: string;
                              isAnonymous: boolean;
                              name?: string;
                              message?: string;
                              createdAt: string;
                              fundraiser?: { title: string };
                              sourceLink?: { alias: string };
                            }) => (
                              <tr key={donation.id} className="border-t">
                                <td className="p-3">
                                  <span className="font-medium">
                                    {donation.isAnonymous
                                      ? "Anonymous"
                                      : donation.name || "Unknown"}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold">
                                    {formatCurrency(
                                      Number(donation.amount),
                                      donation.currency
                                    )}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <Badge
                                    variant={getStatusBadgeVariant(
                                      donation.status
                                    )}
                                  >
                                    {donation.status}
                                  </Badge>
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {donation.fundraiser?.title}
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {formatDate(donation.createdAt)}
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {donation.sourceLink?.alias || "-"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {donationsData?.meta && donationsData.meta.totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              handlePageChange(donationFilters.page - 1)
                            }
                            className={
                              donationFilters.page <= 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: donationsData.meta.totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={page === donationFilters.page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              handlePageChange(donationFilters.page + 1)
                            }
                            className={
                              donationFilters.page >=
                              donationsData.meta.totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>Connect Stripe to view donation history</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You need to connect your Stripe account first to view
                    donation history and manage payouts.
                  </p>
                  <Button
                    onClick={() => {
                      // Switch to Stripe Connect tab
                      const stripeTab = document.querySelector(
                        '[data-value="stripe"]'
                      ) as HTMLElement;
                      if (stripeTab) stripeTab.click();
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Link className="h-4 w-4" />
                    <span>Connect Stripe</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        onClose={hideSnackbar}
        message={snackbar.message}
        type={snackbar.type}
      />
    </div>
  );
}
