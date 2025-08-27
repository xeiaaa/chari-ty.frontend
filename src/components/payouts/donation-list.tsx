import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Receipt } from "lucide-react";

interface Donation {
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
}

interface DonationListProps {
  donations: Donation[];
  isLoading: boolean;
  error: unknown;
  viewMode: "card" | "table";
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
  getStatusBadgeVariant: (
    status: string
  ) => "default" | "destructive" | "outline" | "secondary";
}

const DonationList = ({
  donations,
  isLoading,
  error,
  viewMode,
  formatCurrency,
  formatDate,
  getStatusBadgeVariant,
}: DonationListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-3 sm:p-4">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-destructive">Failed to load donations</p>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No donations found</p>
      </div>
    );
  }

  if (viewMode === "card") {
    return (
      <div className="space-y-3 sm:space-y-4">
        {donations.map((donation) => (
          <div key={donation.id} className="border rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                <span className="font-medium text-sm sm:text-base">
                  {donation.isAnonymous
                    ? "Anonymous"
                    : donation.name || "Unknown"}
                </span>
                <Badge
                  variant={getStatusBadgeVariant(donation.status)}
                  className="w-fit"
                >
                  {donation.status}
                </Badge>
              </div>
              <span className="font-semibold text-base sm:text-lg">
                {formatCurrency(Number(donation.amount), donation.currency)}
              </span>
            </div>

            <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
              <p>Fundraiser: {donation.fundraiser?.title}</p>
              <p>Date: {formatDate(donation.createdAt)}</p>
              {donation.message && (
                <p className="italic">&ldquo;{donation.message}&rdquo;</p>
              )}
              {donation.sourceLink && (
                <p>Source: {donation.sourceLink.alias}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Mobile: Card view for table mode */}
      <div className="block sm:hidden space-y-3">
        {donations.map((donation) => (
          <div key={donation.id} className="border-b p-3 sm:p-4">
            <div className="space-y-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">
                  {donation.isAnonymous
                    ? "Anonymous"
                    : donation.name || "Unknown"}
                </span>
                <span className="font-semibold text-base">
                  {formatCurrency(Number(donation.amount), donation.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <Badge
                  variant={getStatusBadgeVariant(donation.status)}
                  className="text-xs"
                >
                  {donation.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(donation.createdAt)}
                </span>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Fundraiser: {donation.fundraiser?.title}</p>
                {donation.message && (
                  <p className="italic">&ldquo;{donation.message}&rdquo;</p>
                )}
                {donation.sourceLink && (
                  <p>Source: {donation.sourceLink.alias}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Traditional table view */}
      <div className="hidden sm:block">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Donor</th>
              <th className="text-left p-3 font-medium">Amount</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Fundraiser</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
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
                    {formatCurrency(Number(donation.amount), donation.currency)}
                  </span>
                </td>
                <td className="p-3">
                  <Badge variant={getStatusBadgeVariant(donation.status)}>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DonationList;
