"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInvitations, Invitation } from "@/lib/hooks/use-invitations";
import { useAcceptInvitation } from "@/lib/hooks/use-accept-invitation";
import { useAccount } from "@/contexts/account-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, User, Check } from "lucide-react";
import { toast } from "sonner";
import SkeletonLoader from "@/components/common/skeleton-loader";
import PageHeader from "@/components/common/page-header";

export default function InvitationsPage() {
  const router = useRouter();
  const { setSelectedAccount } = useAccount();
  const { data: invitations, isLoading, error } = useInvitations();
  const acceptInvitation = useAcceptInvitation();

  const handleAcceptInvitation = async (invitation: Invitation) => {
    try {
      await acceptInvitation.mutateAsync({
        groupId: invitation.id,
      });
      toast.success("Invitation accepted successfully!");

      // Set the newly joined group as the selected account
      setSelectedAccount({
        id: invitation.id,
        type: invitation.type as "team" | "nonprofit" | "individual",
        name: invitation.name,
        slug: invitation.name.toLowerCase().replace(/\s+/g, "-"), // Generate slug from name
        role: invitation.role,
        dateActive: invitation.dateActive,
      });

      // Redirect to settings page
      router.push("/app/settings");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation. Please try again.");
    }
  };

  if (isLoading) {
    return <SkeletonLoader variant="card" />;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Invitations"
          message="Manage your pending invitations"
        />
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Failed to load invitations. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Invitations"
        message="Manage your pending invitations"
      />

      <div className="space-y-4">
        {invitations && invitations.length > 0 ? (
          invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {invitation.type === "individual" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                    <Link
                      href={`/groups/${invitation.name
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                      className="hover:underline text-primary"
                    >
                      {invitation.name}
                    </Link>
                  </CardTitle>
                  <Badge variant="secondary">{invitation.role}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Invited on{" "}
                      {new Date(invitation.dateActive).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleAcceptInvitation(invitation)}
                    disabled={acceptInvitation.isPending}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {acceptInvitation.isPending ? "Accepting..." : "Accept"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="min-h-[400px] flex items-center justify-center">
            <CardContent className="text-center">
              <p className="text-muted-foreground text-lg">
                You don&apos;t have any pending invitations.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
