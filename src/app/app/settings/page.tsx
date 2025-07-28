"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Users, Shield, User, Building2, Loader2, Trash2 } from "lucide-react";
import { InviteMemberDialog } from "@/components/fundraisers/invite-member-dialog";
import { RemoveMemberDialog } from "@/components/ui/remove-member-dialog";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import { useApi } from "@/lib/api";

enum SettingsTab {
  ACCOUNT = "account",
  MEMBERS = "members",
  VERIFICATION = "verification",
}

export default function SettingsPage() {
  const { selectedAccount } = useAccount();
  const { user: currentUser } = useUser();
  const api = useApi();

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || SettingsTab.ACCOUNT;

  const [tab, setTab] = useState(currentTab);

  // File upload state for verification
  const [uploadedVerificationUrls, setUploadedVerificationUrls] = useState<
    string[]
  >([]);
  const [uploadedAdditionalUrls, setUploadedAdditionalUrls] = useState<
    string[]
  >([]);
  const queryClient = useQueryClient();

  // Get upload signature mutation
  const getUploadSignatureMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/uploads/signature", {
        folder: "verification-documents",
      });
      return response.data as {
        signature: string;
        timestamp: number;
        apiKey: string;
        cloudName: string;
      };
    },
  });

  // Submit verification documents mutation
  const submitVerificationMutation = useMutation({
    mutationFn: async () => {
      // Combine all uploaded URLs
      const allUrls = [...uploadedVerificationUrls, ...uploadedAdditionalUrls];

      if (allUrls.length === 0) {
        throw new Error("Please upload at least one document");
      }

      // PATCH to backend
      const response = await api.patch(`/groups/slug/${selectedAccount.slug}`, {
        documentsUrls: allUrls,
      });

      return response.data;
    },
    onSuccess: () => {
      toast.success("Documents uploaded and group updated!");

      // Don't clear URLs after successful submission - keep them visible
      // The URLs are now saved to the backend and will be loaded on next visit

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["group", selectedAccount.slug],
      });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      toast.error(errorMessage);
    },
  });

  // Upload files to Cloudinary
  const uploadFilesToCloudinary = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        // Get upload signature
        const signature = await getUploadSignatureMutation.mutateAsync();

        // Prepare form data
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signature.apiKey);
        formData.append("timestamp", signature.timestamp.toString());
        formData.append("signature", signature.signature);
        formData.append("folder", "verification-documents");

        // Upload to Cloudinary
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        uploadedUrls.push(response.data.secure_url);
      } catch (error) {
        console.error("Failed to upload file:", file.name, error);

        // Handle specific API error responses
        if (axios.isAxiosError(error) && error.response?.data) {
          const errorData = error.response.data;
          if (errorData.error?.message) {
            throw new Error(`${file.name}: ${errorData.error.message}`);
          }
        }

        // Handle ZIP file error specifically
        if (
          file.type === "application/zip" ||
          file.name.toLowerCase().endsWith(".zip")
        ) {
          throw new Error(
            `${file.name}: ZIP files are not supported. Please extract and upload individual files.`
          );
        }

        throw new Error(`Failed to upload ${file.name}`);
      }
    }

    return uploadedUrls;
  };

  // Handle verification documents upload
  const handleVerificationUpload = async (files: File[]): Promise<string[]> => {
    try {
      const urls = await uploadFilesToCloudinary(files);
      setUploadedVerificationUrls((prev) => [...prev, ...urls]);
      return urls;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      toast.error(errorMessage);
      throw error; // Re-throw to let FileUpload component handle it
    }
  };

  // Handle additional verification documents upload
  const handleAdditionalUpload = async (files: File[]): Promise<string[]> => {
    try {
      const urls = await uploadFilesToCloudinary(files);
      setUploadedAdditionalUrls((prev) => [...prev, ...urls]);
      return urls;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      toast.error(errorMessage);
      throw error; // Re-throw to let FileUpload component handle it
    }
  };

  // Remove uploaded URL
  const removeVerificationUrl = (index: number) => {
    setUploadedVerificationUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAdditionalUrl = (index: number) => {
    setUploadedAdditionalUrls((prev) => prev.filter((_, i) => i !== index));
  };

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

      // Load existing documents from groupDetails.documentsUrls
      if (groupDetails.documentsUrls && groupDetails.documentsUrls.length > 0) {
        const documents = groupDetails.documentsUrls;

        if (selectedAccount.type === "nonprofit" && documents.length > 1) {
          // For nonprofits, split documents between verification and additional
          const midPoint = Math.ceil(documents.length / 2);
          setUploadedVerificationUrls(documents.slice(0, midPoint));
          setUploadedAdditionalUrls(documents.slice(midPoint));
        } else {
          // For individuals and teams, all documents go to verification
          setUploadedVerificationUrls(documents);
          setUploadedAdditionalUrls([]);
        }
      } else {
        // Clear any existing documents if none exist
        setUploadedVerificationUrls([]);
        setUploadedAdditionalUrls([]);
      }
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
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-10 w-2/3 mb-1" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
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

      <Tabs
        defaultValue={tab}
        className="space-y-6"
        onValueChange={handleTabChange}
      >
        <TabsList
          className={`grid w-full ${
            shouldShowTeamMembersTab ? "grid-cols-3" : "grid-cols-2"
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
        </TabsList>

        <TabsContent value={SettingsTab.ACCOUNT} className="space-y-6">
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
          <TabsContent value={SettingsTab.MEMBERS} className="space-y-6">
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
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        currentUser &&
                        member.user &&
                        member.user.id === currentUser.id
                          ? "bg-muted/50 border-primary/20"
                          : ""
                      }`}
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {member.user
                                ? `${member.user.firstName} ${member.user.lastName}`
                                : member.invitedName || "Unknown User"}
                            </p>
                            {/* Show "You" badge for current user */}
                            {currentUser &&
                              member.user &&
                              member.user.id === currentUser.id && (
                                <Badge variant="secondary" className="text-xs">
                                  You
                                </Badge>
                              )}
                          </div>
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

                        {/* Role management - only for owners and admins, and only for active members who are not the current user */}
                        {(() => {
                          const currentUserRole = getCurrentUserRole();
                          const shouldShow =
                            member.status === "active" &&
                            member.user?.id !== currentUser?.id &&
                            member.role !== "owner" &&
                            (currentUserRole === "owner" ||
                              currentUserRole === "admin");

                          return shouldShow;
                        })() && (
                          <select
                            value={member.role}
                            onChange={(
                              e: React.ChangeEvent<HTMLSelectElement>
                            ) =>
                              handleUpdateMemberRole(member.id, e.target.value)
                            }
                            disabled={isUpdatingRole}
                            className="w-24 h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        )}

                        {/* Remove button - only for owners and admins, and only for active members who are not the current user */}
                        {(() => {
                          const currentUserRole = getCurrentUserRole();
                          const shouldShow =
                            member.status === "active" &&
                            member.user?.id !== currentUser?.id &&
                            member.role !== "owner" &&
                            (currentUserRole === "owner" ||
                              currentUserRole === "admin");

                          return shouldShow;
                        })() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRemoveMember(
                                member.id,
                                member.user
                                  ? `${member.user.firstName} ${member.user.lastName}`
                                  : member.invitedName || "Unknown User"
                              )
                            }
                            disabled={isRemovingMember}
                          >
                            <Trash2 className="h-4 w-4" />
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
                {/* Only show invite button for owners and admins */}
                {(selectedAccount.role === "owner" ||
                  selectedAccount.role === "admin") && (
                  <Button
                    className="w-full"
                    onClick={() => setIsInviteDialogOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Invite New Member
                  </Button>
                )}
              </CardContent>
            </Card>
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
                  <FileUpload
                    label="Verification Documents"
                    description="Drag and drop your verification documents here, or click to browse. PDF and image files only (JPG, PNG, GIF, WebP). Max 10MB per file."
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.heic,.heif"
                    multiple
                    onUpload={handleVerificationUpload}
                    uploadedUrls={uploadedVerificationUrls}
                    onRemoveUploadedUrl={removeVerificationUrl}
                    disabled={getUploadSignatureMutation.isPending}
                  />
                </div>

                {selectedAccount.type === "nonprofit" && (
                  <>
                    <div className="grid gap-2">
                      <FileUpload
                        label="Additional Verification Documents"
                        description="Upload additional verification documents (optional). PDF and image files only (JPG, PNG, GIF, WebP)."
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.heic,.heif"
                        multiple
                        onUpload={handleAdditionalUpload}
                        uploadedUrls={uploadedAdditionalUrls}
                        onRemoveUploadedUrl={removeAdditionalUrl}
                        disabled={getUploadSignatureMutation.isPending}
                      />
                    </div>
                  </>
                )}
              </div>

              <Button
                className="w-full"
                variant="secondary"
                onClick={() => submitVerificationMutation.mutate()}
                disabled={
                  submitVerificationMutation.isPending ||
                  (uploadedVerificationUrls.length === 0 &&
                    uploadedAdditionalUrls.length === 0)
                }
              >
                {submitVerificationMutation.isPending
                  ? "Uploading..."
                  : "Upload"}
              </Button>

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
