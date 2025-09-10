"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Edit3 } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { useState } from "react";
import type { ItemType } from "../type";
import { toast } from "sonner";
import { Label } from "../../ui/label";

interface EditItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemType | null;
  onUpdate?: (updatedItem: ItemType) => void;
}

export default function EditItem({
  isOpen,
  onOpenChange,
  item,
  onUpdate,
}: EditItemDialogProps) {
  const [formData, setFormData] = useState<ItemType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  async function handleImageUpload(file: File): Promise<string | null> {
    setUploading(true);

    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!uploadPreset || !cloudName) {
      toast.error("Cloudinary config missing");
      setUploading(false);
      return null;
    }

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);

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
      console.error("Cloudinary upload error:", err);
      toast.error("Image upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!formData?._id) return;

    setIsSaving(true);

    try {
      // ✅ Upload image if a new file is selected
      if (formData?.imageFile instanceof File) {
        const imageUrl = await handleImageUpload(formData.imageFile);
        if (imageUrl) {
          formData.imageUrl = imageUrl;
        }
      }

      const res = await fetch(`/api/items/${formData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update item");

      const updatedItem = await res.json();
      onUpdate?.(updatedItem);

      toast.success("Item updated successfully");
      onOpenChange(false);
    } catch (err) {
      toast.error("Error saving changes");
    } finally {
      setIsSaving(false);
    }
  }

  const handleDeleteImage = async () => {
    if (!formData?.imagePublicId) return;

    try {
      await fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: formData.imagePublicId }),
      });

      // ✅ Clear image fields from form state
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Item
            </div>
          </DialogTitle>
        </DialogHeader>

        {formData && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              {/* Preview Block */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Image
                </label>

                {/* Clickable Image Preview */}
                <label
                  htmlFor="imageUpload"
                  className="relative w-full h-48 border-2 border-dashed rounded-md overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setFormData({ ...formData, imageFile: file });
                    }
                  }}>
                  <div className="relative w-full h-48 rounded-md overflow-hidden border">
                    {formData.imageFile ? (
                      <>
                        <Image
                          src={URL.createObjectURL(formData.imageFile)}
                          alt="Preview"
                          fill
                          className="object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100">
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      </>
                    ) : formData.imageUrl ? (
                      <>
                        <Image
                          src={formData.imageUrl}
                          alt="Current image"
                          fill
                          className="object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100">
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic flex items-center justify-center h-full">
                        Click or drag an image here
                      </p>
                    )}
                  </div>
                </label>

                {/* Hidden File Input */}
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, imageFile: file });
                    }
                  }}
                  className="hidden"
                />

                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>

            {/* Item Code & Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-code">Item Code</Label>
                <input
                  type="text"
                  value={formData.item_code ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, item_code: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter item code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <input
                  type="text"
                  value={formData.item_name ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, item_name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter item name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-price">Purchase Price</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">₱</span>
                  <input
                    type="number"
                    value={formData.purchasePrice ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchasePrice: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase-price">Sales Price</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">₱</span>
                  <input
                    type="number"
                    value={formData.salesPrice ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salesPrice: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="item-description">Item Description</Label>
              <textarea
                value={formData.item_description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, item_description: e.target.value })
                }
                className="w-full border rounded px-3 py-2 min-h-[100px]"
                placeholder="Enter item description"
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Select
                  value={formData.item_category ?? ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, item_category: value })
                  }>
                  <SelectTrigger className="w-full border rounded px-3 py-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JELLY">Jelly</SelectItem>
                    <SelectItem value="CHOCOLATE">Chocolate</SelectItem>
                    <SelectItem value="IMPORTED CANDIES">
                      Imported Candies
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-status">Status</Label>
                <Select
                  value={formData.item_status ?? ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, item_status: value })
                  }>
                  <SelectTrigger className="w-full border rounded px-3 py-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="ACTIVE"
                      className="flex items-center gap-2 text-green-700">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Active
                    </SelectItem>
                    <SelectItem
                      value="INACTIVE"
                      className="flex items-center gap-2 text-red-700">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Length
                </label>
                <input
                  type="number"
                  value={formData.length ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      length: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter length"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Width
                </label>
                <input
                  type="number"
                  value={formData.width ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      width: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter width"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Height
                </label>
                <input
                  type="number"
                  value={formData.height ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      height: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter height"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Weight
                </label>
                <input
                  type="number"
                  value={formData.weight ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weight: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter weight"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
