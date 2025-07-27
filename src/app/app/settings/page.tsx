"use client";

import { useState, useEffect } from "react";
import { useAccount } from "@/contexts/account-context";
import { useGroupBySlug } from "@/lib/hooks/use-group-by-slug";
import { useUpdateGroup, UpdateGroupData } from "@/lib/hooks/use-update-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { Upload, Users, Shield, User, Building2, Loader2 } from "lucide-react";
import { InviteMemberDialog } from "@/components/fundraisers/invite-member-dialog";

export default function SettingsPage() {
  const { selectedAccount } = useAccount();
  const [formData, setFormData] = useState({
    name: "",
    mission: "",
    website: "",
    ein: "",
  });
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

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
  }, [groupDetails]);

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
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (groupError) {
    return (
      <div className="max-w-4xl mx-auto">
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Manage your{" "}
          {selectedAccount.type === "individual"
            ? "account"
            : selectedAccount.type === "team"
            ? "team"
            : "organization"}{" "}
          settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="account" className="flex items-center gap-2">
            {getAccountTypeIcon()}
            {getAccountTypeLabel()}
          </TabsTrigger>
          {shouldShowTeamMembersTab && (
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </TabsTrigger>
          )}
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your{" "}
                {selectedAccount.type === "individual"
                  ? "personal"
                  : selectedAccount.type === "team"
                  ? "team"
                  : "organization"}{" "}
                information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {updateError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">
                    {updateError instanceof Error
                      ? updateError.message
                      : "Failed to update settings"}
                  </p>
                </div>
              )}

              {/* Name field - required for team and nonprofit */}
              {(selectedAccount.type === "team" ||
                selectedAccount.type === "nonprofit") && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    {selectedAccount.type === "team"
                      ? "Team Name"
                      : "Organization Name"}
                  </label>
                  <Input
                    type="text"
                    placeholder={
                      selectedAccount.type === "team"
                        ? "Enter your team name"
                        : "Enter your organization name"
                    }
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
              )}

              {/* EIN field - required for nonprofit */}
              {selectedAccount.type === "nonprofit" && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    EIN (Employer Identification Number)
                  </label>
                  <Input
                    type="text"
                    placeholder="XX-XXXXXXX"
                    value={formData.ein}
                    onChange={(e) => handleInputChange("ein", e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Mission field */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Mission</label>
                <Textarea
                  placeholder="What's your mission or purpose?"
                  className="min-h-[100px]"
                  value={formData.mission}
                  onChange={(e) => handleInputChange("mission", e.target.value)}
                />
              </div>

              {/* Website field */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Website</label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                />
              </div>
              <Button
                onClick={handleSaveChanges}
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                {isUpdating && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account
                  </p>
                </div>
                <div className="h-6 w-11 bg-muted rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features and updates
                  </p>
                </div>
                <div className="h-6 w-11 bg-muted rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">
                Delete{" "}
                {selectedAccount.type === "individual"
                  ? "Account"
                  : selectedAccount.type === "team"
                  ? "Team"
                  : "Organization"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {shouldShowTeamMembersTab && (
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage members of your{" "}
                  {selectedAccount.type === "team" ? "team" : "organization"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupDetails?.members && groupDetails.members.length > 0 ? (
                  groupDetails.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                          {member.user?.avatarUrl ? (
                            <img
                              src={member.user.avatarUrl}
                              alt={`${member.user.firstName} ${member.user.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user
                              ? `${member.user.firstName} ${member.user.lastName}`
                              : member.invitedName || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user?.email ||
                              member.invitedEmail ||
                              "No email provided"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined:{" "}
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            member.role === "owner"
                              ? "default"
                              : member.role === "admin"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1)}
                        </Badge>
                        <Badge
                          variant={
                            member.status === "active"
                              ? "default"
                              : member.status === "invited"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {member.status.charAt(0).toUpperCase() +
                            member.status.slice(1)}
                        </Badge>
                        {member.role !== "owner" && (
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">
                      No members found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Start by inviting team members to collaborate
                    </p>
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={() => setIsInviteDialogOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Invite New Member
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="verification" className="space-y-6">
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
                  <label className="text-sm font-medium">Government ID</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your government ID here, or click to browse
                    </p>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>
                </div>

                {selectedAccount.type === "nonprofit" && (
                  <>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        501(c)(3) Determination Letter
                      </label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload your 501(c)(3) determination letter
                        </p>
                        <Button variant="outline" size="sm">
                          Choose File
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        Organization Documents
                      </label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload additional organization documents
                        </p>
                        <Button variant="outline" size="sm">
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Submit Verification Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </div>
  );
}
