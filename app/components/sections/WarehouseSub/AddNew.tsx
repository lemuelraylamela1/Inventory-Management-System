"use client";

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
                onChange={(e) => setWarehouseCode(e.target.value)}
                placeholder="Enter code"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="warehouse-name"
                value={warehouse_name}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder="Enter name"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse-description">Location</Label>
            <Textarea
              id="warehouse-location"
              value={warehouse_location}
              onChange={(e) => setWarehouseLocation(e.target.value)}
              placeholder="Enter location"
            />
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
