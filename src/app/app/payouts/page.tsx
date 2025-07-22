"use client";

import { useAccount } from "@/contexts/account-context";
import { useGroupBySlug } from "@/lib/hooks/use-group-by-slug";
import { useApi, getErrorMessage } from "@/lib/api";
import { useSnackbar } from "@/components/ui/snackbar";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Link,
  Unlink,
  AlertCircle,
  CheckCircle,
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
  const { showSnackbar } = useSnackbar();

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
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const handleConnectStripe = () => {
    connectStripeMutation.mutate();
  };

  const handleDisconnectStripe = async () => {
    // TODO: Implement Stripe disconnect
    console.log("Disconnect from Stripe");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
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
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground">
            Manage your Stripe Connect account for receiving payments
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load group information. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConnected = !!group?.stripeId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="text-muted-foreground">
          Manage your Stripe Connect account for receiving payments
        </p>
      </div>

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
            Connect your Stripe account to receive payments from your
            fundraisers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>
                  Your Stripe account is connected and ready to receive payments
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Stripe Account ID: {group.stripeId}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleDisconnectStripe}
                className="flex items-center space-x-2"
              >
                <Unlink className="h-4 w-4" />
                <span>Disconnect Stripe</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span>
                  Connect your Stripe account to start receiving payments
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                You need to connect your Stripe account to receive payments from
                your fundraisers. This will allow you to receive funds directly
                to your bank account.
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

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              View your payment history and manage payouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Payment dashboard and payout management features will be available
              here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
