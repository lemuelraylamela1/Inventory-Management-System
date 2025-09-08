"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
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
  const [warehouse_code, setWarehouseCode] = useState("");
  const [warehouse_name, setWarehouseName] = useState("");
  const [warehouse_location, setWarehouseLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (warehouse) {
      setWarehouseCode(warehouse.warehouse_code || "");
      setWarehouseName(warehouse.warehouse_name || "");
      setWarehouseLocation(warehouse.warehouse_location || "");
    }
  }, [warehouse]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse?._id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/warehouses/${warehouse._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_code,
          warehouse_name,
          warehouse_location,
        }),
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed z-50 bg-white max-w-2xl rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Item
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Item Code & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={warehouse_code}
                onChange={(e) => setWarehouseCode(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={warehouse_name}
                onChange={(e) => setWarehouseName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={warehouse_location}
                onChange={(e) => setWarehouseLocation(e.target.value)}
              />
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
