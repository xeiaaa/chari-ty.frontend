"use client";

import { GalleryUpload, UploadType } from "@/components/ui/gallery-upload";

interface CloudinaryAsset {
  cloudinaryAssetId: string;
  publicId: string;
  url: string;
  eagerUrl?: string;
  format: string;
  resourceType: string;
  size: number;
  pages?: number;
  originalFilename: string;
  uploadedAt: string;
}

export interface GroupUploadItem {
  id: string;
  upload: CloudinaryAsset;
  caption?: string;
  order: number;
  type: "verification" | "gallery";
}

interface GroupGalleryFormProps {
  groupId: string;
  groupSlug: string;
  type: "verification" | "gallery";
  existingUploads?: GroupUploadItem[]; // Upload items from the group
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GroupGalleryForm({
  groupId,
  groupSlug,
  type,
  existingUploads,
  onSuccess,
  onError,
}: GroupGalleryFormProps) {
  // Transform existing upload items to match the expected format
  const transformedItems = existingUploads
    ?.filter((item) => item.type === type)
    .map((item) => ({
      id: item.id,
      asset: item.upload,
      caption: item.caption,
      order: item.order,
    }));

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8">
        <GalleryUpload
          type={
            type === "verification"
              ? UploadType.GROUP_VERIFICATION
              : UploadType.GROUP_GALLERY
          }
          entityId={groupId}
          entitySlug={groupSlug}
          existingItems={transformedItems}
          uploadEndpoint={`/groups/${groupId}/uploads`}
          updateEndpoint={`/groups/${groupId}/uploads/{id}`}
          deleteEndpoint={`/groups/${groupId}/uploads/{id}`}
          reorderEndpoint={`/groups/${groupId}/uploads/reorder`}
          onSuccess={onSuccess}
          onError={onError}
          queryKeys={["group", groupSlug]}
          acceptTypes={type === "verification" ? "image/*,.pdf" : "image/*"}
        />
      </div>
    </div>
  );
}
