"use client";

import React, { useRef } from "react";
import { Button } from "./button";
import { Upload, X } from "lucide-react";

export interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  buttonText?: string;
  value?: File[];
  onFilesSelected?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  disabled?: boolean;
  // New props for upload
  onUpload?: (files: File[]) => Promise<string[]>;
  uploadedUrls?: string[];
  onRemoveUploadedUrl?: (index: number) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  accept = "*",
  multiple = false,
  buttonText = "Choose File(s)",
  value = [],
  onFilesSelected,
  onRemoveFile,
  disabled = false,
  onUpload,
  uploadedUrls = [],
  onRemoveUploadedUrl,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [localFiles, setLocalFiles] = React.useState<File[]>([]);

  // Handle file selection (either upload or just pass files)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (onUpload) {
        setIsUploading(true);
        try {
          await onUpload(files);
        } finally {
          setIsUploading(false);
        }
      } else if (onFilesSelected) {
        onFilesSelected(files);
        setLocalFiles(files);
      } else {
        setLocalFiles(files);
      }
    }
  };

  // Drag and drop support
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      if (onUpload) {
        setIsUploading(true);
        try {
          await onUpload(files);
        } finally {
          setIsUploading(false);
        }
      } else if (onFilesSelected) {
        onFilesSelected(files);
        setLocalFiles(files);
      } else {
        setLocalFiles(files);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // Show uploadedUrls if provided, else show value/localFiles
  const showFiles = onUpload && uploadedUrls && uploadedUrls.length > 0;
  const showLocalFiles = !onUpload && (value?.length || localFiles.length);
  const filesToShow = value && value.length > 0 ? value : localFiles;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div
        ref={dragRef}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? "border-blue-400 bg-blue-50" : "border-border"
        } ${disabled || isUploading ? "opacity-60 pointer-events-none" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragLeave}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop file{multiple ? "s" : ""} here, or click to browse
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mb-4">{description}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? "Uploading..." : buttonText}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>
      {/* Uploaded Files List (URLs) */}
      {showFiles && (
        <div className="space-y-2 mt-2">
          <h4 className="text-sm font-medium">
            Uploaded File{uploadedUrls.length > 1 ? "s" : ""}:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {uploadedUrls.map((url, idx) => (
              <div
                key={url + idx}
                className="relative border rounded-lg p-2 bg-muted/50 flex items-center gap-2"
              >
                {/* Preview for images */}
                {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={url}
                    alt={url}
                    className="w-12 h-12 object-cover rounded mr-2"
                  />
                ) : (
                  <span className="w-12 h-12 flex items-center justify-center bg-muted rounded mr-2 text-xs">
                    {url.split(".").pop()?.toUpperCase() || "FILE"}
                  </span>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-xs underline"
                >
                  {url.split("/").pop()}
                </a>
                {onRemoveUploadedUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveUploadedUrl(idx)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Local Files List (if not using upload) */}
      {showLocalFiles && (
        <div className="space-y-2 mt-2">
          <h4 className="text-sm font-medium">
            Selected File{filesToShow.length > 1 ? "s" : ""}:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {filesToShow.map((file, idx) => (
              <div
                key={file.name + idx}
                className="relative border rounded-lg p-2 bg-muted/50 flex items-center gap-2"
              >
                {/* Preview for images */}
                {file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded mr-2"
                  />
                ) : (
                  <span className="w-12 h-12 flex items-center justify-center bg-muted rounded mr-2 text-xs">
                    {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                  </span>
                )}
                <span className="flex-1 truncate text-xs">{file.name}</span>
                {onRemoveFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(idx)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
