"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/lib/api";

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

interface CloudinaryAsset {
  cloudinaryAssetId: string;
  publicId: string;
  url: string;
  eagerUrl?: string;
  format: string;
  resourceType: string;
  size: number;
  originalFilename: string;
  uploadedAt: string;
}

interface MediaSectionProps {
  coverPublicId: string | null;
  onChange: (coverPublicId: string | null, removeCover?: boolean) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  coverImagePreview: string | null;
  setCoverImagePreview: (preview: string | null) => void;
}

export function MediaSection({
  onChange,
  isUploading,
  setIsUploading,
  coverImagePreview,
  setCoverImagePreview,
}: MediaSectionProps) {
  const api = useApi();
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Get upload signature mutation
  const getUploadSignatureMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/uploads/signature", {
        folder: "covers",
      });
      return response.data as UploadSignature;
    },
  });

  const uploadToCloudinary = async (file: File): Promise<CloudinaryAsset> => {
    const signature = await getUploadSignatureMutation.mutateAsync();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", signature.timestamp.toString());
    formData.append("signature", signature.signature);
    formData.append("folder", "covers");
    formData.append("eager", "q_auto,f_auto");
    formData.append("use_filename", "true");
    formData.append("unique_filename", "true");

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return {
      cloudinaryAssetId: response.data.public_id,
      publicId: response.data.public_id,
      url: response.data.secure_url,
      eagerUrl: response.data.eager?.[0]?.secure_url,
      format: response.data.format,
      resourceType: response.data.resource_type,
      size: response.data.bytes,
      originalFilename: response.data.original_filename,
      uploadedAt: new Date().toISOString(),
    };
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setLocalError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setLocalError("Image size must be less than 5MB");
        return;
      }

      setLocalError(null);
      setIsUploading(true);

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCoverImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        const asset = await uploadToCloudinary(file);
        setCoverImagePreview(asset.eagerUrl || asset.url);
        onChange(asset.publicId);
        toast.success("Cover image uploaded successfully!");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        setLocalError(message);
        setCoverImagePreview(null);
        onChange(null);
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Media</h2>
      <div className="space-y-2">
        <Label>Cover Image</Label>

        {coverImagePreview ? (
          <div className="relative">
            <img
              src={coverImagePreview}
              alt="Cover preview"
              className="w-full max-h-96 object-contain rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setCoverImagePreview(null);
                onChange(null, true);
              }}
              disabled={isUploading} // prevent delete while uploading
            >
              <X className="h-4 w-4" />
            </Button>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="flex flex-col items-center gap-2 text-white">
                  <svg
                    className="animate-spin h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Uploading...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card
            className={`border-2 border-dashed transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
          >
            <CardContent className="p-8">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-medium mb-2">Upload Cover Image</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop an image here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supported formats: JPG, PNG, GIF, WebP. Max 5MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("cover-upload")?.click()
                  }
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Browse Files
                    </>
                  )}
                </Button>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {localError && (
        <div className="text-destructive text-sm">{localError}</div>
      )}
    </div>
  );
}
