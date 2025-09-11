"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import type { ItemType } from "../type";
import Image from "next/image";
import { Edit } from "lucide-react";

const initialFormState: ItemType = {
  item_code: "",
  item_name: "",
  item_description: "",
  item_status: "",
  item_category: "",
  purchasePrice: 0,
  salesPrice: 0,
  length: 0,
  width: 0,
  height: 0,
  weight: 0,
  imageUrl: "",
  imageFile: undefined,
  imagePublicId: "",
  _id: "",
  createdDT: new Date().toISOString(),
};

type EditItemProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemType | null;
  onUpdate?: (updated: ItemType) => void;
};

export default function EditItem({
  isOpen,
  onOpenChange,
  item,
  onUpdate,
}: EditItemProps) {
  const [formData, setFormData] = useState<ItemType>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...initialFormState, ...item });
    }
  }, [item]);

  async function handleImageUpload(file: File): Promise<string | null> {
    setUploading(true);
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!preset || !cloudName) {
      toast.error("Cloudinary config missing");
      setUploading(false);
      return null;
    }

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", preset);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      return result.secure_url;
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Image upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    const errors: Record<string, string> = {};

    // ✅ Guard against missing or invalid _id
    if (!formData._id || typeof formData._id !== "string") {
      toast.error("Missing or invalid item ID.");
      return;
    }

    // ✅ Validate required string fields
    const requiredFields: (keyof ItemType)[] = [
      "item_code",
      "item_name",
      "item_description",
      "item_status",
      "item_category",
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (typeof value !== "string" || value.trim() === "") {
        errors[field] = `${field
          .replace("item_", "")
          .replace(/([A-Z])/g, " $1")} is required.`;
      }
    });

    // ✅ Validate numeric fields
    const numericFields: (keyof ItemType)[] = [
      "purchasePrice",
      "salesPrice",
      "length",
      "width",
      "height",
      "weight",
    ];

    numericFields.forEach((field) => {
      const value = formData[field];
      if (typeof value !== "number" || isNaN(value) || value <= 0) {
        errors[field] = `${field} must be greater than 0.`;
      }
    });

    // ✅ Block submission if errors exist
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix the validation errors.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = { ...formData };

      // ✅ Upload image if needed
      if (formData.imageFile instanceof File) {
        const imageUrl = await handleImageUpload(formData.imageFile);
        if (imageUrl) {
          payload.imageUrl = imageUrl;
        }
      }

      // ✅ Sanitize payload before sending
      const sanitizedData = Object.fromEntries(
        Object.entries(payload).filter(
          ([_, value]) => value !== null && value !== undefined && value !== ""
        )
      );

      const res = await fetch(`/api/items/${formData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      if (!res.ok) {
        console.warn("Update failed with status:", res.status);
        if (res.status === 401) {
          toast.error("Session expired. Please log in again.");
          return;
        }
        throw new Error("Failed to update item");
      }

      const updatedItem = await res.json();
      onUpdate?.(updatedItem);
      toast.success("Item updated successfully");
      onOpenChange(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Error saving changes");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteImage() {
    if (!formData.imagePublicId) return;

    try {
      await fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: formData.imagePublicId }),
      });

      setFormData({
        ...formData,
        imageUrl: "",
        imageFile: undefined,
        imagePublicId: "",
      });

      toast.success("Image deleted");
    } catch (err) {
      toast.error("Failed to delete image");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="fixed z-50 bg-white max-w-2xl rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Item
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              "item_code",
              "item_name",
              "item_description",
              "item_status",
              "item_category",
            ] as (keyof ItemType)[]
          ).map((field) => (
            <div
              key={field}
              className={field === "item_description" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {field.replace("item_", "").replace(/([A-Z])/g, " $1")}
              </label>
              <input
                className="w-full border px-3 py-2 rounded"
                value={formData[field] as string}
                onChange={(e) =>
                  setFormData({ ...formData, [field]: e.target.value })
                }
              />
              {formErrors[field] && (
                <p className="text-red-500 text-sm">{formErrors[field]}</p>
              )}
            </div>
          ))}

          {(
            [
              "purchasePrice",
              "salesPrice",
              "length",
              "width",
              "height",
              "weight",
            ] as (keyof ItemType)[]
          ).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1">{field}</label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded"
                value={formData[field] as number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [field]: parseFloat(e.target.value) || 0,
                  })
                }
              />
              {formErrors[field] && (
                <p className="text-red-500 text-sm">{formErrors[field]}</p>
              )}
            </div>
          ))}

          <div className="md:col-span-2 space-y-2">
            {formData.imageUrl && (
              <div className="relative">
                <Image
                  src={formData.imageUrl}
                  alt="Preview"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded object-cover"
                  priority // optional: improves loading for above-the-fold images
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-sm rounded"
                  onClick={handleDeleteImage}>
                  Delete Image
                </button>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  imageFile: e.target.files?.[0] || undefined,
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving || uploading}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
