// components/ImageUploader.tsx
import { useState } from "react";
import { Label } from "../../ui/label";
import { Image as LucideImage, X } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  onSelect: (file: File | null) => void;
  defaultImageUrl?: string;
}

export default function ImageUploader({ onSelect }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !files[0]) return;

    const file = files[0];
    const isImage = file.type.startsWith("image/");
    const isValidSize = file.size <= 10 * 1024 * 1024;

    if (!isImage || !isValidSize) return;

    setPreviewFile(file);
    onSelect(file);
  };

  const removeFile = () => {
    setPreviewFile(null);
    onSelect(null);
  };

  return (
    <div>
      <Label>Images</Label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFileSelect(e.dataTransfer.files);
        }}>
        {!previewFile ? (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <LucideImage className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-primary">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="relative w-full h-48 overflow-hidden rounded-lg">
            <Image
              src={URL.createObjectURL(previewFile)}
              alt={previewFile.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100">
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
