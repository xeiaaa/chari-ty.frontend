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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CreditCard, Link, AlertCircle, Receipt } from "lucide-react";
import SkeletonLoader from "@/components/common/skeleton-loader";
import PageHeader from "@/components/common/page-header";
import StripeConnectCard from "@/components/payouts/stripe-connect-card";
import DonationFilters from "@/components/payouts/donation-filters";
import DonationList from "@/components/payouts/donation-list";
import DonationSummary from "@/components/payouts/donation-summary";

enum PayoutTab {
  STRIPE = "stripe",
  DONATIONS = "donations",
}

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
  const currentTab = searchParams.get("tab") || PayoutTab.STRIPE;

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
    return <SkeletonLoader variant="card" />;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Donation Payouts"
          message="Connect your Stripe account to receive donations from your fundraisers"
        />
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
      <PageHeader
        title="Donation Payouts"
        message="Connect your Stripe account to receive donations from your fundraisers"
      />

      <Tabs
        defaultValue={tab}
        className="space-y-6"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value={PayoutTab.STRIPE}
            className="flex items-center space-x-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>Stripe Connect</span>
          </TabsTrigger>
          <TabsTrigger
            value={PayoutTab.DONATIONS}
            className="flex items-center space-x-2"
          >
            <Receipt className="h-4 w-4" />
            <span>Donations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={PayoutTab.STRIPE} className="space-y-6">
          <StripeConnectCard
            isConnected={isConnected}
            stripeId={group?.stripeId || undefined}
            onConnect={handleConnectStripe}
            onDisconnect={handleDisconnectStripe}
            isConnecting={connectStripeMutation.isPending}
            isDisconnecting={disconnectStripeMutation.isPending}
          />
        </TabsContent>

        <TabsContent value={PayoutTab.DONATIONS} className="space-y-6">
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
                <DonationSummary
                  meta={donationsData.meta}
                  completedCount={
                    donationsData.items?.filter(
                      (d: { status: string }) => d.status === "completed"
                    ).length || 0
                  }
                  formatCurrency={formatCurrency}
                />
              )}

              {isConnected ? (
                <div className="space-y-6">
                  {/* Filters and View Toggle */}
                  <DonationFilters
                    filters={donationFilters}
                    onFilterChange={handleFilterChange}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    meta={donationsData?.meta}
                  />

                  {/* Donations List */}
                  <DonationList
                    donations={donationsData?.items || []}
                    isLoading={isLoadingDonations}
                    error={donationsError}
                    viewMode={viewMode}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    getStatusBadgeVariant={getStatusBadgeVariant}
                  />

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
