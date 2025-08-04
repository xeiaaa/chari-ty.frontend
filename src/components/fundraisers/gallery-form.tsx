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

interface ExistingGalleryItem {
  id: string;
  upload: CloudinaryAsset;
  caption?: string;
  order: number;
}

interface GalleryFormProps {
  fundraiserId: string;
  slug: string;
  existingGallery?: ExistingGalleryItem[]; // Gallery items from the fundraiser
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GalleryForm({
  fundraiserId,
  slug,
  existingGallery,
  onSuccess,
  onError,
}: GalleryFormProps) {
  // Transform existing gallery items to match the expected format
  const transformedItems = existingGallery?.map((item) => ({
    id: item.id,
    asset: item.upload,
    caption: item.caption,
    order: item.order,
  }));

  return (
    <GalleryUpload
      type={UploadType.FUNDRAISER_GALLERY}
      entityId={fundraiserId}
      entitySlug={slug}
      existingItems={transformedItems}
      uploadEndpoint={`/fundraisers/${fundraiserId}/gallery`}
      updateEndpoint={`/fundraisers/${fundraiserId}/gallery/{id}`}
      deleteEndpoint={`/fundraisers/${fundraiserId}/gallery/{id}`}
      reorderEndpoint={`/fundraisers/${fundraiserId}/gallery/reorder`}
      onSuccess={onSuccess}
      onError={onError}
      queryKeys={["fundraiser", slug]}
    />
  );
}
