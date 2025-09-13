import { useState } from "react";
import { Label } from "../../ui/label";
import { uploadImage } from "../../../../libs/uploadImage";
import { Image as LucideImage, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useDragActive } from "../../../hooks/useDragActive";

interface Props {
  onUploadComplete: (
    data: { file: File; url: string; publicId: string } | null
  ) => void;
}

export default function AddItemImageUploader({ onUploadComplete }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { dragActive, bind } = useDragActive();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) return;

    setIsUploading(true);
    try {
      const data = await uploadImage(file);
      const trimmedUrl = data?.secure_url?.trim();
      setPreviewUrl(trimmedUrl || null);
      onUploadComplete({
        file,
        url: trimmedUrl || "",
        publicId: data.public_id,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setPreviewUrl(null);
      onUploadComplete(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const files = bind.onDrop(e);
    handleFileSelect(files);
  };

  const removeImage = () => {
    setPreviewUrl(null);
    onUploadComplete(null);
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ease-in-out cursor-pointer group ${
          dragActive
            ? "border-primary ring-2 ring-primary/30 bg-primary/5 animate-pulse"
            : "border-border hover:border-primary/50"
        }`}
        {...bind}
        onDrop={handleDrop}
        onClick={() => document.getElementById("image-upload")?.click()}>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Uploading image...</span>
          </div>
        ) : previewUrl ? (
          <div className="relative w-full h-64 rounded-lg overflow-hidden border shadow-sm animate-fade-in-scale">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              priority
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100 transition"
              title="Remove image">
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm gap-2">
            <LucideImage className="w-8 h-8 opacity-40" />
            <span className="text-sm font-medium">
              Drag & drop an image here, or click to upload
            </span>
            <span className="text-xs text-gray-400">(Max size: 10MB)</span>
          </div>
        )}
      </div>
    </div>
  );
}
