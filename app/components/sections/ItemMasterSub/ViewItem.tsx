import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

import Image from "next/image";

import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Trash2, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ItemType } from "../type";
import { toast } from "sonner";

interface ViewItemProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemType | null;
  onDelete?: (id: string) => void;
  onEditRequest: (item: ItemType) => void; // ✅ new prop
}

export default function ViewItem({
  isOpen,
  onOpenChange,
  item,
  onDelete,
  onEditRequest,
}: ViewItemProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!item?._id) return toast.error("No item selected");

    // 🔒 Inline helper to extract publicId from Cloudinary URL
    function extractPublicId(url: string): string {
      const parts = url.split("/");
      const uploadIndex = parts.findIndex((p) => p === "upload");
      const publicIdParts = parts.slice(uploadIndex + 1); // everything after 'upload'
      const filename = publicIdParts.pop()?.split(".")[0]; // remove extension
      return [...publicIdParts, filename].join("/");
    }

    try {
      // ✅ Delete image from Cloudinary if publicId exists or extractable
      const publicId = item.imagePublicId || extractPublicId(item.imageUrl);

      if (publicId) {
        console.log("Deleting Cloudinary image:", publicId);
        await fetch("/api/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        });
      }

      // ✅ Delete item from your database
      const res = await fetch(`/api/items/${item._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      onDelete?.(item._id);
      toast.success("Item deleted successfully");
      onOpenChange(false);
      router.refresh();

      setTimeout(() => {
        router.push("/");
      }, 300);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error deleting item");
    }
  }
  function handleEdit() {
    if (!item?._id) {
      toast.error("No item selected");
      return;
    }

    onOpenChange(false); // close view dialog
    onEditRequest?.(item); // ✅ trigger edit dialog from parent
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight">Item Preview</h3>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image or Preview Block */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-64 bg-muted rounded-lg border border-dashed text-muted-foreground">
                {item ? (
                  item.imageUrl ? (
                    <div className="relative w-full h-64">
                      <Image
                        src={item.imageUrl}
                        alt={item.item_name ?? "Uploaded item"}
                        fill
                        className="rounded-md shadow object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-muted rounded-lg border border-dashed">
                      <p className="text-gray-500 italic">No image available</p>
                    </div>
                  )
                ) : (
                  <p className="text-muted-foreground italic">
                    No item selected.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <Card>
              <CardContent className="p-6 space-y-4">
                {item ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">
                        Code
                      </span>
                      <span className="text-right">
                        {item.item_code ?? "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">
                        Name
                      </span>
                      <span className="text-right">
                        {item.item_name ?? "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">
                        Category
                      </span>
                      <span className="text-right">
                        {item.item_category ?? "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground block mb-1">
                        Description
                      </span>
                      <p className="text-muted-foreground">
                        {item.item_description?.trim() || "N/A"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No item selected.</p>
                )}
              </CardContent>
            </Card>

            {/* Right Column */}
            <Card>
              <CardContent className="p-6 space-y-4">
                {item ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">
                        Status
                      </span>
                      <span>{item.item_status ?? "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">
                        Length
                      </span>
                      <span>{item.length ?? "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">
                        Width
                      </span>
                      <span>{item.width ?? "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">
                        Height
                      </span>
                      <span>{item.height ?? "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">
                        Weight
                      </span>
                      <span>{item.weight ?? "N/A"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No item selected.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
            {/* Left: Delete Button */}
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete File
            </Button>

            {/* Right: Edit Button */}
            <div className="flex justify-end w-full md:w-auto">
              <Button size="sm" className="gap-2" onClick={handleEdit}>
                <Edit3 className="h-4 w-4" />
                Edit Details
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
