"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  User,
  Calendar,
  Mail,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
} from "lucide-react";
import {
  VerificationRequest,
  useUpdateVerificationRequest,
} from "@/lib/hooks/use-verification-requests";

interface VerificationRequestItemProps {
  request: VerificationRequest;
}

interface GroupUpload {
  id: string;
  type: string;
  caption?: string;
  upload: {
    originalFilename: string;
    resourceType: string;
    url: string;
    eagerUrl?: string;
  };
}

export function VerificationRequestItem({
  request,
}: VerificationRequestItemProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    "pending" | "approved" | "rejected"
  >(request.status);
  const [reason, setReason] = useState(request.reason || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateVerificationRequest = useUpdateVerificationRequest();

  const handleStatusUpdate = async () => {
    setIsSubmitting(true);

    try {
      await updateVerificationRequest.mutateAsync({
        groupId: request.groupId,
        data: {
          status: selectedStatus,
          reason: reason.trim() || undefined,
        },
      });

      setIsStatusDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case "team":
        return <Users className="h-4 w-4" />;
      case "nonprofit":
        return <Building2 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const verificationUploads = request.group.groupUploads.filter(
    (upload) => upload.type === "verification"
  );

  const getFileType = (upload: GroupUpload) => {
    const filename = upload.upload.originalFilename.toLowerCase();
    const resourceType = upload.upload.resourceType;

    if (resourceType === "image") return "image";
    if (filename.endsWith(".pdf")) return "pdf";
    if (filename.endsWith(".doc") || filename.endsWith(".docx"))
      return "document";
    if (filename.endsWith(".xls") || filename.endsWith(".xlsx"))
      return "spreadsheet";

    return "document";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getAccountTypeIcon(request.group.type)}
              <CardTitle className="text-lg">{request.group.name}</CardTitle>
              <Badge variant="outline" className="capitalize">
                {request.group.type}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Submitted {new Date(request.createdAt).toLocaleDateString()}
              </div>
              {request.reviewedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Reviewed {new Date(request.reviewedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={getStatusBadgeVariant(request.status)}
              className="flex items-center gap-1"
            >
              {getStatusIcon(request.status)}
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
            <Dialog
              open={isStatusDialogOpen}
              onOpenChange={setIsStatusDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Update Verification Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) =>
                        setSelectedStatus(
                          e.target.value as "pending" | "approved" | "rejected"
                        )
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Reason (Optional)
                    </label>
                    <Textarea
                      placeholder="Add a reason for approval or rejection..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsStatusDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Group Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Group Details</h4>
            <div className="space-y-2 text-sm">
              {request.group.description && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{request.group.description}</span>
                </div>
              )}
              {request.group.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={request.group.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {request.group.website}
                  </a>
                </div>
              )}
              {request.group.ein && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>EIN: {request.group.ein}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Submitter Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  {request.submitter.firstName} {request.submitter.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{request.submitter.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>@{request.submitter.username}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Documents */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Verification Documents</h4>
            <Badge variant="outline">
              {verificationUploads.length} documents
            </Badge>
          </div>

          {verificationUploads.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {verificationUploads.map((upload) => (
                <div key={upload.id} className="relative group">
                  <div className="aspect-square rounded-lg border overflow-hidden bg-gray-50">
                    {getFileType(upload) === "image" ? (
                      <>
                        <img
                          src={upload.upload.eagerUrl || upload.upload.url}
                          alt={upload.caption || upload.upload.originalFilename}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {upload.caption && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {upload.caption}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {upload.upload.originalFilename}
                  </p>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    {getFileType(upload) === "image" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(upload.upload.url, "_blank")}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = upload.upload.url;
                          link.download = upload.upload.originalFilename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No verification documents uploaded</p>
            </div>
          )}
        </div>

        {/* Review Information */}
        {request.reviewer && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Review Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  Reviewed by {request.reviewer.firstName}{" "}
                  {request.reviewer.lastName}
                </span>
              </div>
              {request.reason && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span className="italic">&quot;{request.reason}&quot;</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
