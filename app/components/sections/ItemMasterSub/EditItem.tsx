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
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import ImageUploader from "./ImageUploader";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui/select";

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
  imageFile: null,
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
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...initialFormState, ...item });
    }
  }, [item]);

  const handleDialogToggle = (open: boolean) => {
    onOpenChange(open);

    if (!open) {
      // ✅ Reset errors and transient state
      setFormErrors({});
      setError(null); // if you're using a general error message
      setShowAlert(false); // if you're using alert visibility control

      // Optional: reset form fields
      setFormData({
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
        imageFile: null,
        imageUrl: "",
        _id: "",
        createdDT: new Date().toISOString(),
        imagePublicId: "",
      });
    }
  };

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

    // Check for duplicate Sales Person Code
    const duplicateCode = items.find(
      (item) =>
        item.salesPersonCode.toLowerCase() ===
          formData.salesPersonCode.toLowerCase() &&
        (!isEdit || item._id !== formData._id)
    );

    if (duplicateCode) {
      errors.salesPersonCode = "Sales Person Code already exists";
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
    setError(""); // Clear previous error
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
        imageFile: null,
        imagePublicId: "",
      });

      toast.success("Image deleted");
    } catch (err) {
      toast.error("Failed to delete image");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogToggle}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Item
          </DialogTitle>
        </DialogHeader>

        {Object.keys(formErrors).length > 0 && (
          <div
            className="flex items-start gap-2 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-sm mb-4"
            role="alert">
            <svg
              className="w-5 h-5 mt-0.5 text-red-500 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 0114.14 0M4.93 19.07a10 10 0 010-14.14"
              />
            </svg>
            <div className="text-sm leading-relaxed">
              <strong className="block font-medium mb-1">
                Fill out the required fields.
              </strong>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Preview */}
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="image-upload" className="cursor-pointer block">
              {formData.imageUrl ? (
                <div className="relative w-full h-64 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                  <Image
                    src={formData.imageUrl}
                    alt="Current item"
                    fill
                    className="object-cover w-full h-full"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/10 hover:bg-black/20 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-medium">
                      Click to change image
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-md border border-dashed">
                  <p className="text-gray-500 italic">Click to upload image</p>
                </div>
              )}
            </label>

            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const previewUrl = URL.createObjectURL(file);
                  setFormData({
                    ...formData,
                    imageFile: file,
                    imageUrl: previewUrl,
                  });
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
            {/* Item Code */}
            <div className="w-full space-y-1">
              <Label htmlFor="item-code">
                Item Code<span className="text-red-500">*</span>
              </Label>
              <Input
                id="item-code"
                value={formData.item_code}
                onChange={(e) =>
                  setFormData({ ...formData, item_code: e.target.value })
                }
                placeholder="Enter item code"
                className={`w-full border rounded px-3 py-2 text-sm ${
                  formErrors.item_code
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.item_code && (
                <p className="text-sm text-red-500 mt-1">
                  Item code is required.
                </p>
              )}
            </div>

            {/* Item Name */}
            <div className="w-full space-y-1">
              <Label htmlFor="item-name">
                Item Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="item-name"
                value={formData.item_name}
                onChange={(e) =>
                  setFormData({ ...formData, item_name: e.target.value })
                }
                placeholder="Enter item name"
                className={`w-full border rounded px-3 py-2 text-sm ${
                  formErrors.item_name
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.item_name && (
                <p className="text-sm text-red-500 mt-1">
                  Item name is required.
                </p>
              )}
            </div>

            {/* Purchase Price */}
            <div className="w-full space-y-1">
              <Label htmlFor="item-purchase-price">
                Purchase Price<span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center space-x-2">
                <span className="text-lg">₱</span>
                <Input
                  id="item-purchase-price"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      purchasePrice: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                  className={`w-full border rounded px-3 py-2 text-sm ${
                    formErrors.purchasePrice
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>
              {formErrors.purchasePrice && (
                <p className="text-sm text-red-500 mt-1">
                  Purchase price is required.
                </p>
              )}
            </div>

            {/* Sales Price */}
            <div className="w-full space-y-1">
              <Label htmlFor="item-sales-price">
                Sales Price<span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center space-x-2">
                <span className="text-lg">₱</span>
                <Input
                  id="item-sales-price"
                  type="number"
                  step="0.01"
                  value={formData.salesPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salesPrice: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                  className={`w-full border rounded px-3 py-2 text-sm ${
                    formErrors.salesPrice
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>
              {formErrors.salesPrice && (
                <p className="text-sm text-red-500 mt-1">
                  Selling price is required.
                </p>
              )}
            </div>
          </div>

          <div className="w-full md:col-span-2 space-y-1">
            <Label htmlFor="item-description">
              Item Description<span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="item-description"
              value={formData.item_description}
              onChange={(e) =>
                setFormData({ ...formData, item_description: e.target.value })
              }
              placeholder="Enter item description"
              className={`w-full border rounded px-3 py-2 text-sm resize-none ${
                formErrors.item_description
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300"
              }`}
              rows={4}
            />
            {formErrors.item_description && (
              <p className="text-sm text-red-500 mt-1">
                Description is required.
              </p>
            )}
          </div>

          <div className="w-full space-y-1">
            <Label htmlFor="item-category">
              Category<span className="text-red-500">*</span>
            </Label>

            <Select
              value={formData.item_category}
              onValueChange={(value) =>
                setFormData({ ...formData, item_category: value })
              }>
              <SelectTrigger
                id="item-category"
                className={`w-full border rounded px-3 py-2 text-sm text-left transition-colors ${
                  !formData.item_category.trim()
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                }`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>

              <SelectContent className="bg-white border border-gray-200 rounded shadow-md z-50">
                <SelectItem value="JELLY">Jelly</SelectItem>
                <SelectItem value="CHOCOLATE">Chocolate</SelectItem>
                <SelectItem value="IMPORTED CANDIES">
                  Imported Candies
                </SelectItem>
              </SelectContent>
            </Select>

            {!formData.item_category.trim() && (
              <p className="text-sm text-red-500 mt-1">Category is required.</p>
            )}
          </div>

          <div className="w-full space-y-1">
            <Label htmlFor="item-status">
              Status<span className="text-red-500">*</span>
            </Label>

            <Select
              value={formData.item_status}
              onValueChange={(value) =>
                setFormData({ ...formData, item_status: value })
              }>
              <SelectTrigger
                id="item-status"
                className={`w-full border rounded px-3 py-2 text-sm text-left transition-colors ${
                  formErrors.item_status
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                }`}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>

              <SelectContent className="bg-white border border-gray-200 rounded shadow-md z-50">
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

            {formErrors.item_status && (
              <p className="text-sm text-red-500 mt-1">Status is required.</p>
            )}
          </div>

          <div className="w-full space-y-1">
            <Label htmlFor="item-length">
              Length<span className="text-red-500">*</span>
            </Label>
            <Input
              id="item-length"
              type="number"
              step="0.01"
              value={formData.length}
              onChange={(e) =>
                setFormData({ ...formData, length: parseFloat(e.target.value) })
              }
              placeholder="Enter length"
              className={`w-full border rounded px-3 py-2 text-sm ${
                formErrors.length
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300"
              }`}
            />
            {formErrors.length && (
              <p className="text-sm text-red-500 mt-1">Length is required.</p>
            )}
          </div>

          <div className="w-full space-y-1">
            <Label htmlFor="item-width">
              Width<span className="text-red-500">*</span>
            </Label>
            <Input
              id="item-width"
              type="number"
              step="0.01"
              value={formData.width}
              onChange={(e) =>
                setFormData({ ...formData, width: parseFloat(e.target.value) })
              }
              placeholder="Enter width"
              className={`w-full border rounded px-3 py-2 text-sm ${
                formErrors.width
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300"
              }`}
            />
            {formErrors.width && (
              <p className="text-sm text-red-500 mt-1">Width is required.</p>
            )}
          </div>

          <div className="w-full space-y-1">
            <Label htmlFor="item-height">
              Height<span className="text-red-500">*</span>
            </Label>
            <Input
              id="item-height"
              type="number"
              step="0.01"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: parseFloat(e.target.value) })
              }
              placeholder="Enter height"
              className={`w-full border rounded px-3 py-2 text-sm ${
                formErrors.height
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300"
              }`}
            />
            {formErrors.height && (
              <p className="text-sm text-red-500 mt-1">Height is required.</p>
            )}
          </div>

          <div className="w-full space-y-1">
            <Label htmlFor="item-weight">
              Weight<span className="text-red-500">*</span>
            </Label>
            <Input
              id="item-weight"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) =>
                setFormData({ ...formData, weight: parseFloat(e.target.value) })
              }
              placeholder="Enter weight"
              className={`w-full border rounded px-3 py-2 text-sm ${
                formErrors.weight
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300"
              }`}
            />
            {formErrors.weight && (
              <p className="text-sm text-red-500 mt-1">Weight is required.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isSaving || uploading}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
