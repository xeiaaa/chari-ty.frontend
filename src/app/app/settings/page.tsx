"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "@/contexts/account-context";
import { useGroupBySlug } from "@/lib/hooks/use-group-by-slug";
import { useUpdateGroup, UpdateGroupData } from "@/lib/hooks/use-update-group";
import { useUpdateMemberRole } from "@/lib/hooks/use-update-member-role";
import { useRemoveMember } from "@/lib/hooks/use-remove-member";
import { useUser } from "@/lib/hooks/use-user";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Users,
  Shield,
  User,
  Building2,
  Image as ImageIcon,
} from "lucide-react";
import { InviteMemberDialog } from "@/components/fundraisers/invite-member-dialog";
import { RemoveMemberDialog } from "@/components/ui/remove-member-dialog";
import { toast } from "sonner";
import { GroupGalleryForm } from "@/components/groups/group-gallery-form";
import SkeletonLoader from "@/components/common/skeleton-loader";
import PageHeader from "@/components/common/page-header";
import AccountForm from "@/components/settings/account-form";
import NotificationSettings from "@/components/settings/notification-settings";
import DangerZone from "@/components/settings/danger-zone";
import MemberList from "@/components/settings/member-list";

enum SettingsTab {
  ACCOUNT = "account",
  MEMBERS = "members",
  VERIFICATION = "verification",
  GALLERY = "gallery",
}

export default function SettingsPage() {
  const { selectedAccount } = useAccount();
  const { user: currentUser } = useUser();

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || SettingsTab.ACCOUNT;

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

  // Get current user's role from group details
  const getCurrentUserRole = () => {
    if (!groupDetails || !currentUser) return null;
    const currentUserMember = groupDetails.members.find(
      (member) => member.user?.id === currentUser.id
    );
    return currentUserMember?.role || null;
  };
  const [formData, setFormData] = useState({
    name: "",
    mission: "",
    website: "",
    ein: "",
  });
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [removeMemberDialog, setRemoveMemberDialog] = useState<{
    open: boolean;
    memberId: string;
    memberName: string;
  }>({
    open: false,
    memberId: "",
    memberName: "",
  });

  // Fetch group details
  const {
    data: groupDetails,
    isLoading: isLoadingGroup,
    error: groupError,
  } = useGroupBySlug(selectedAccount.slug);

  // Update group mutation
  const {
    mutate: updateGroup,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateGroup();

  // Update member role mutation
  const { mutate: updateMemberRole, isPending: isUpdatingRole } =
    useUpdateMemberRole();

  // Remove member mutation
  const { mutate: removeMember, isPending: isRemovingMember } =
    useRemoveMember();

  // Update form data when group details are loaded
  useEffect(() => {
    if (groupDetails) {
      setFormData({
        name: groupDetails.name || "",
        mission: groupDetails.description || "", // Use description as mission for now
        website: groupDetails.website || "",
        ein: groupDetails.ein || "",
      });
    }
  }, [groupDetails, selectedAccount.type]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = () => {
    const updateData: UpdateGroupData = {};

    // Include all fields, even if empty
    if (
      selectedAccount.type === "team" ||
      selectedAccount.type === "nonprofit"
    ) {
      updateData.name = formData.name;
    }
    if (selectedAccount.type === "nonprofit") {
      updateData.ein = formData.ein;
    }
    updateData.description = formData.mission; // Use mission as description
    updateData.website = formData.website;

    updateGroup({
      slug: selectedAccount.slug,
      data: updateData,
    });
  };

  const handleUpdateMemberRole = (memberId: string, newRole: string) => {
    if (!groupDetails) return;

    updateMemberRole(
      {
        groupId: groupDetails.id,
        memberId,
        role: newRole,
      },
      {
        onSuccess: () => {
          toast.success("Member role updated successfully");
        },
        onError: (error) => {
          toast.error("Failed to update member role");
          console.error("Error updating member role:", error);
        },
      }
    );
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setRemoveMemberDialog({
      open: true,
      memberId,
      memberName,
    });
  };

  const confirmRemoveMember = () => {
    if (!groupDetails) return;

    removeMember(
      {
        groupId: groupDetails.id,
        memberId: removeMemberDialog.memberId,
      },
      {
        onSuccess: () => {
          toast.success("Member removed successfully");
          setRemoveMemberDialog({ open: false, memberId: "", memberName: "" });
        },
        onError: (error) => {
          toast.error("Failed to remove member");
          console.error("Error removing member:", error);
        },
      }
    );
  };

  const getAccountTypeLabel = () => {
    switch (selectedAccount.type) {
      case "individual":
        return "Account Settings";
      case "team":
        return "Team Settings";
      case "nonprofit":
        return "Organization Settings";
      default:
        return "Settings";
    }
  };

  const getAccountTypeIcon = () => {
    switch (selectedAccount.type) {
      case "individual":
        return <User className="h-4 w-4" />;
      case "team":
        return <Users className="h-4 w-4" />;
      case "nonprofit":
        return <Building2 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const shouldShowTeamMembersTab =
    selectedAccount.type === "team" || selectedAccount.type === "nonprofit";

  if (isLoadingGroup) {
    return <SkeletonLoader variant="card" />;
  }

  if (groupError) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load group details</p>
          <p className="text-sm text-muted-foreground mt-2">
            {groupError instanceof Error
              ? groupError.message
              : "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Settings"
        message={`Manage your ${
          selectedAccount.type === "individual"
            ? "account"
            : selectedAccount.type === "team"
            ? "team"
            : "organization"
        } settings and preferences`}
      />

      <Tabs
        defaultValue={tab}
        className="space-y-6"
        onValueChange={handleTabChange}
      >
        <TabsList
          className={`grid w-full ${
            shouldShowTeamMembersTab ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          <TabsTrigger
            value={SettingsTab.ACCOUNT}
            className="flex items-center gap-2"
          >
            {getAccountTypeIcon()}
            {getAccountTypeLabel()}
          </TabsTrigger>
          {shouldShowTeamMembersTab && (
            <TabsTrigger
              value={SettingsTab.MEMBERS}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Team Members
            </TabsTrigger>
          )}
          <TabsTrigger
            value={SettingsTab.VERIFICATION}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Verification
          </TabsTrigger>
          <TabsTrigger
            value={SettingsTab.GALLERY}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value={SettingsTab.ACCOUNT} className="space-y-6">
          <AccountForm
            accountType={selectedAccount.type}
            formData={formData}
            onInputChange={handleInputChange}
            onSave={handleSaveChanges}
            isUpdating={isUpdating}
            error={updateError}
          />

          <NotificationSettings />
          <DangerZone accountType={selectedAccount.type} />
        </TabsContent>

        {shouldShowTeamMembersTab && (
          <TabsContent value={SettingsTab.MEMBERS} className="space-y-6">
            {Array.isArray(groupDetails?.members) && (
              <MemberList
                members={groupDetails.members}
                currentUserId={currentUser?.id}
                currentUserRole={getCurrentUserRole() || undefined}
                accountType={selectedAccount.type as "team" | "nonprofit"}
                canInvite={
                  selectedAccount.role === "owner" ||
                  selectedAccount.role === "admin"
                }
                onUpdateRole={handleUpdateMemberRole}
                onRemoveMember={handleRemoveMember}
                onInviteMember={() => setIsInviteDialogOpen(true)}
                isUpdatingRole={isUpdatingRole}
                isRemovingMember={isRemovingMember}
              />
            )}
          </TabsContent>
        )}

        <TabsContent value={SettingsTab.VERIFICATION} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
              <CardDescription>
                Upload documents to verify your{" "}
                {selectedAccount.type === "individual"
                  ? "identity"
                  : selectedAccount.type === "team"
                  ? "team"
                  : "organization"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Pending</Badge>
                <span className="text-sm text-muted-foreground">
                  Verification request submitted on{" "}
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  {groupDetails && (
                    <GroupGalleryForm
                      groupId={groupDetails.id}
                      groupSlug={groupDetails.slug}
                      type="verification"
                      existingUploads={groupDetails.groupUploads}
                      onSuccess={() => console.log("Gallery images uploaded!")}
                    />
                  )}
                </div>
              </div>

              <Button className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Submit Verification Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={SettingsTab.GALLERY} className="space-y-6">
          <Card>
            <CardContent className="space-y-6">
              {groupDetails && (
                <GroupGalleryForm
                  groupId={groupDetails.id}
                  groupSlug={groupDetails.slug}
                  type="gallery"
                  existingUploads={groupDetails.groupUploads}
                  onSuccess={() => console.log("Gallery images uploaded!")}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />

      <RemoveMemberDialog
        open={removeMemberDialog.open}
        onOpenChange={(open) =>
          setRemoveMemberDialog((prev) => ({ ...prev, open }))
        }
        memberName={removeMemberDialog.memberName}
        onConfirm={confirmRemoveMember}
        isRemoving={isRemovingMember}
      />
    </div>
  );
}
