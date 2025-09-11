"use client";

import React, { useState } from "react";

import { useRouter } from "next/navigation";

import { Input } from "../../ui/input";

import { Button } from "../../ui/button";

import { Label } from "../../ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

export default function AddNew({
  isOpen,
  onOpenChange,
  onSuccess,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    warehouse_code: "",
    warehouse_name: "",
    warehouse_location: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);

    const payload = {
      createdDT: new Date().toISOString(),
      warehouse_code: formData.warehouse_code,
      warehouse_name: formData.warehouse_name,
      warehouse_location: formData.warehouse_location,
    };

    try {
      const res = await fetch("http://localhost:3000/api/warehouses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (typeof onSuccess === "function") {
          onSuccess();
        }

        setTimeout(() => {
          router.push("/");
        }, 300); // ✅ Give time for dialog to close

        // ✅ Reset form fields
        setFormData({
          warehouse_code: "",
          warehouse_name: "",
          warehouse_location: "",
        });
        setFormErrors({});
      } else {
        throw new Error("Failed to create warehouse");
      }
    } catch (error) {
      console.error("Error submitting item:", error);
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Warehouse
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

        <form onSubmit={handleSubmit} className="mt-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.warehouse_code}
                onChange={(e) => {
                  setFormErrors((prev) => ({ ...prev, warehouse_code: "" }));
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
                  setFormErrors((prev) => ({ ...prev, warehouse_name: "" }));
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.warehouse_location}
              onChange={(e) => {
                setFormErrors((prev) => ({ ...prev, warehouse_location: "" }));
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]">
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
