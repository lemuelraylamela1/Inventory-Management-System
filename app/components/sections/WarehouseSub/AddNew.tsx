"use client";

import React, { useState, useCallback } from "react";

import { useRouter } from "next/navigation";

import Image from "next/image";

import { Upload, X, FileText, Settings, Eye } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Input } from "../../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Card, CardContent } from "../../ui/card";
// import { Switch } from "../../ui/switch";

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

  const [warehouse_code, setWarehouseCode] = useState("");
  const [warehouse_name, setWarehouseName] = useState("");
  const [warehouse_location, setWarehouseLocation] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    const validateFields = (): Record<string, string> => {
      const errors: Record<string, string> = {};

      // 🧾 Item Code
      if (!warehouse_code.trim()) {
        errors.warehouse_code = "Item code is required.";
      }

      // 🧾 Item Name
      if (!warehouse_name.trim()) {
        errors.warehouse_name = "Item name is required.";
      }

      // 📍 Location (assuming item_description is used for location details)
      if (!warehouse_location.trim()) {
        errors.warehouse_location = "Location is required.";
      }

      return errors;
    };
    e.preventDefault();

    setIsSubmitting(true);

    const payload = {
      createdDT: new Date().toISOString(),
      warehouse_code,
      warehouse_name,
      warehouse_location,
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
        setWarehouseCode("");
        setWarehouseName("");
        setWarehouseLocation("");
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

        <form onSubmit={handleSubmit} className="mt-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse-code">Code</Label>
              <Input
                id="warehouse-code"
                value={warehouse_code}
                onChange={(e) => {
                  setFormErrors((prev) => ({ ...prev, warehouse_code: "" })); // Clear error on change
                  setWarehouseCode(e.target.value);
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
              <Label htmlFor="warehouse-name">Name</Label>
              <Input
                id="warehouse-name"
                value={warehouse_name}
                onChange={(e) => {
                  setFormErrors((prev) => ({ ...prev, warehouse_name: "" }));
                  setWarehouseName(e.target.value);
                }}
                placeholder="Enter warehouse name"
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
            <Label htmlFor="warehouse-location">Location</Label>
            <Input
              id="warehouse-location"
              value={warehouse_location}
              onChange={(e) => {
                setFormErrors((prev) => ({ ...prev, warehouse_location: "" }));
                setWarehouseLocation(e.target.value);
              }}
              placeholder="Enter warehouse location"
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
