"use client";

import { useUser } from "@/lib/hooks/use-user";
import { useAccount } from "@/contexts/account-context";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  Target,
  UserPlus,
  Gift,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const { selectedAccount } = useAccount();

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useDashboard(selectedAccount.slug);

  // Show loading state if any data is loading
  const isLoading = userLoading || dashboardLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "fundraiser_created":
        return <Target className="w-4 h-4 text-blue-500" />;
      case "donation_received":
        return <Gift className="w-4 h-4 text-green-500" />;
      case "member_joined":
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-10 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show message if no selected account
  if (!selectedAccount) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            No account selected. Please select an account to view the dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-muted-foreground text-red-500">
            Error loading {selectedAccount.name}&apos;s dashboard data. Please
            try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Loading {selectedAccount.name}&apos;s dashboard data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Welcome, {user.firstName}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of {selectedAccount.name}&apos;s fundraising
          activity
        </p>
      </div>

      {/* Fundraising Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Fundraising Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Fundraisers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.fundraising.activeFundraisers}
              </div>
              <p className="text-xs text-muted-foreground">
                Published campaigns
              </p>
            </CardContent>
          </Card>

          <Card className="justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Raised
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.fundraising.totalRaised)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all fundraisers
              </p>
            </CardContent>
          </Card>

          <Card className="justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Goal Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.fundraising.goalCompletionRate.completed} of{" "}
                {dashboardData.fundraising.goalCompletionRate.total}
              </div>
              <p className="text-xs text-muted-foreground">
                Campaigns hit their goal
              </p>
            </CardContent>
          </Card>

          <Card className="justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Donation per Fundraiser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  dashboardData.fundraising.avgDonationPerFundraiser
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Average per campaign
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Team Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.team.members}
              </div>
              <p className="text-xs text-muted-foreground">Current members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.team.pendingInvitations}
              </div>
              <p className="text-xs text-muted-foreground">
                Outstanding invites
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Member Joined
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {dashboardData.team.lastMemberJoined.name}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.team.lastMemberJoined.date}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Group Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Recent Group Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {activity.type === "fundraiser_created" && (
                          <span>
                            <span className="font-medium">{activity.user}</span>{" "}
                            {activity.action}{" "}
                            <span className="font-medium">
                              &ldquo;{activity.target}&rdquo;
                            </span>
                          </span>
                        )}
                        {activity.type === "donation_received" && (
                          <span>
                            <span className="font-medium">{activity.user}</span>{" "}
                            {activity.action}{" "}
                            <span className="font-medium">
                              {activity.amount}
                            </span>{" "}
                            for{" "}
                            <span className="font-medium">
                              &ldquo;{activity.target}&rdquo;
                            </span>
                          </span>
                        )}
                        {activity.type === "member_joined" && (
                          <span>
                            Member{" "}
                            <span className="font-medium">
                              &ldquo;{activity.user}&rdquo;
                            </span>{" "}
                            {activity.action}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fundraiser Highlights */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Fundraiser Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Top Performing Campaign */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🥇</span>
                  <h3 className="font-semibold text-sm">Top Performing</h3>
                </div>
                <p className="font-medium text-sm mb-1">
                  {dashboardData.highlights.topPerforming.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    dashboardData.highlights.topPerforming.raised || 0
                  )}{" "}
                  raised
                </p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((dashboardData.highlights.topPerforming.raised ||
                            0) /
                            (dashboardData.highlights.topPerforming.goal ||
                              1)) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(
                      ((dashboardData.highlights.topPerforming.raised || 0) /
                        (dashboardData.highlights.topPerforming.goal || 1)) *
                        100
                    )}
                    % of goal
                  </p>
                </div>
              </div>

              {/* Most Recent Campaign */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🕒</span>
                  <h3 className="font-semibold text-sm">Most Recent</h3>
                </div>
                <p className="font-medium text-sm mb-1">
                  {dashboardData.highlights.mostRecent.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {dashboardData.highlights.mostRecent.created}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    dashboardData.highlights.mostRecent.raised || 0
                  )}{" "}
                  raised
                </p>
              </div>

              {/* Most Donated Today */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔥</span>
                  <h3 className="font-semibold text-sm">Most Donated Today</h3>
                </div>
                <p className="font-medium text-sm mb-1">
                  {dashboardData.highlights.mostDonatedToday.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.highlights.mostDonatedToday.donations || 0}{" "}
                  donations
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    dashboardData.highlights.mostDonatedToday.amount || 0
                  )}{" "}
                  total
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
