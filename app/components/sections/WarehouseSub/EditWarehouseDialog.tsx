"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { Edit } from "lucide-react";

type Warehouse = {
  _id: string;
  warehouse_code?: string;
  warehouse_name?: string;
  warehouse_location?: string;
};

type EditWarehouseDialogProps = {
  warehouse: Warehouse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function EditWarehouseDialog({
  warehouse,
  isOpen,
  onClose,
  onSuccess,
}: EditWarehouseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const initialFormState = {
    warehouse_code: "",
    warehouse_name: "",
    warehouse_location: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (warehouse && isOpen) {
      setFormData({
        warehouse_code: warehouse.warehouse_code || "",
        warehouse_name: warehouse.warehouse_name || "",
        warehouse_location: warehouse.warehouse_location || "",
      });
      setFormErrors({});
    }
  }, [warehouse, isOpen]);

  const handleDialogToggle = (isOpen: boolean) => {
    if (!isOpen) {
      setFormErrors({});
      setFormData(initialFormState);
      onClose(); // ✅ Call the provided close handler
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Partial<Record<keyof typeof formData, string>> = {};

    if (!formData.warehouse_code.trim()) {
      errors.warehouse_code = "Code is required.";
    }

    if (!formData.warehouse_name.trim()) {
      errors.warehouse_name = "Name is required.";
    }

    if (!formData.warehouse_location.trim()) {
      errors.warehouse_location = "Location is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!warehouse?._id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/warehouses/${warehouse._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // ✅ Use formData directly
      });

      if (!res.ok) throw new Error("Update failed");

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update warehouse.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogToggle}>
      <DialogContent className="fixed z-50 bg-white max-w-2xl rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Item
            </div>
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

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Item Code & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.warehouse_code}
                onChange={(e) => {
                  setFormErrors({});
                  setFormData((prev) => ({
                    ...prev,
                    warehouse_code: e.target.value,
                  }));
                }}
                placeholder="Enter code"
                className={`w-full ${
                  formErrors.warehouse_code ? "border-red-500 ring-red-500" : ""
                }`}
              />
              {formErrors.warehouse_code && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.warehouse_code}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.warehouse_name}
                onChange={(e) => {
                  setFormErrors({});
                  setFormData((prev) => ({
                    ...prev,
                    warehouse_name: e.target.value,
                  }));
                }}
                placeholder="Enter name"
                className={`w-full ${
                  formErrors.warehouse_name ? "border-red-500 ring-red-500" : ""
                }`}
              />
              {formErrors.warehouse_name && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.warehouse_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.warehouse_location}
                onChange={(e) => {
                  setFormErrors({});
                  setFormData((prev) => ({
                    ...prev,
                    warehouse_location: e.target.value,
                  }));
                }}
                placeholder="Enter location"
                className={`w-full ${
                  formErrors.warehouse_location
                    ? "border-red-500 ring-red-500"
                    : ""
                }`}
              />
              {formErrors.warehouse_location && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.warehouse_location}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
