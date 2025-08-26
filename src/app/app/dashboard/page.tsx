"use client";

import { useUser } from "@/lib/hooks/use-user";
import { useAccount } from "@/contexts/account-context";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import PageHeader from "@/components/common/page-header";
import SkeletonLoader from "@/components/common/skeleton-loader";
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  Target,
  UserPlus,
  Gift,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const { selectedAccount } = useAccount();

  console.log({ selectedAccount, user });

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
    return <SkeletonLoader variant="dashboard" />;
  }

  if (!user) {
    return null;
  }

  // Show message if no selected account
  if (!selectedAccount) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Dashboard"
          message="No account selected. Please select an account to view the dashboard."
        />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Dashboard"
          message={`Error loading ${selectedAccount.name}'s dashboard data. Please try again later.`}
        />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title={`Welcome, ${selectedAccount.name}!`}
          message={`Loading ${selectedAccount.name}'s dashboard data...`}
        />
      </div>
    );
  }

  const fullName = user.firstName + " " + user.lastName;
  const message =
    selectedAccount.type === "individual"
      ? "Here's an overview of your fundraising activity"
      : `Here's an overview of the ${selectedAccount.name} group's fundraising activity`;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title={`Welcome, ${fullName}!`} message={message} />

      {/* Fundraising Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Fundraising Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Active Fundraisers"
            value={dashboardData.fundraising.activeFundraisers}
            description="Published campaigns"
            icon={<Target className="w-5 h-5 text-blue-500" />}
          />

          <StatCard
            title="Total Raised"
            value={formatCurrency(dashboardData.fundraising.totalRaised)}
            description="Across all fundraisers"
            icon={<Gift className="w-5 h-5 text-green-500" />}
          />

          <StatCard
            title="Goal Completion Rate"
            value={`${dashboardData.fundraising.goalCompletionRate.completed} of ${dashboardData.fundraising.goalCompletionRate.total}`}
            description="Campaigns hit their goal"
            icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
          />

          <StatCard
            title="Avg Donation per Fundraiser"
            value={formatCurrency(
              dashboardData.fundraising.avgDonationPerFundraiser
            )}
            description="Average per campaign"
            icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
          />
        </div>
      </div>

      {/* Team Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Team Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Team Members"
            value={dashboardData.team.members}
            description="Current members"
            icon={<Users className="w-5 h-5 text-blue-500" />}
          />

          <StatCard
            title="Pending Invitations"
            value={dashboardData.team.pendingInvitations}
            description="Outstanding invites"
            icon={<UserPlus className="w-5 h-5 text-purple-500" />}
          />

          <StatCard
            title="Last Member Joined"
            value={`${dashboardData.team.lastMemberJoined.name} (${dashboardData.team.lastMemberJoined.date})`}
            description="Last member joined"
            icon={<Calendar className="w-5 h-5 text-gray-500" />}
          />
        </div>
      </div>

      {/* Fundraiser Link Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          Fundraiser Link Stats
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Traffic Sources"
            value={dashboardData?.linkStats?.totalTrafficSources || 0}
            description="Links created"
            icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
          />

          <StatCard
            title="Donations from Shared Links"
            value={`${formatCurrency(
              dashboardData?.linkStats?.donationsFromSharedLinks || 0
            )} (${
              dashboardData?.linkStats?.percentageFromSharedLinks || 0
            }% of total)`}
            description="Donations from shared links"
            icon={<Gift className="w-5 h-5 text-green-500" />}
          />

          <StatCard
            title="Avg. Donation per Link"
            value={formatCurrency(
              dashboardData?.linkStats?.avgDonationPerLink || 0
            )}
            description="Average per traffic source"
            icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
          />

          <StatCard
            title="Top Performing Link"
            value={`${
              dashboardData?.linkStats?.topPerformingLink?.alias || "No links"
            } (${
              dashboardData?.linkStats?.topPerformingLink?.fundraiser ||
              "No fundraisers"
            })`}
            description="Top performing link"
            icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
          />
        </div>
      </div>

      {/* Engagement Insights */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-500" />
          Engagement Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Most Shared Fundraiser"
            value={`${
              dashboardData?.engagementInsights?.mostSharedFundraiser?.name ||
              "No fundraisers"
            } (${
              dashboardData?.engagementInsights?.mostSharedFundraiser
                ?.shareCount || 0
            } shares)`}
            description="Most shared fundraiser"
            icon={<BarChart3 className="w-5 h-5 text-green-500" />}
          />

          <StatCard
            title="Member with Most Shared Links"
            value={`${
              dashboardData?.engagementInsights?.memberWithMostLinks?.name ||
              "No members"
            } (${
              dashboardData?.engagementInsights?.memberWithMostLinks
                ?.linkCount || 0
            } links)`}
            description="Member with most shared links"
            icon={<Users className="w-5 h-5 text-blue-500" />}
          />
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
