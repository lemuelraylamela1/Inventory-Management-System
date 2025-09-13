import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Trash2, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SalesPersonType } from "../type";
import { toast } from "sonner";

interface ViewSalesPersonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  salesPerson: SalesPersonType | null;
  onDelete?: (id: string) => void;
  onEditRequest: (salesPerson: SalesPersonType) => void;
}

export default function ViewSalesPerson({
  isOpen,
  onOpenChange,
  salesPerson,
  onDelete,
  onEditRequest,
}: ViewSalesPersonProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!salesPerson?._id) return toast.error("No sales person selected");

    try {
      const res = await fetch(`/api/salesPersons/${salesPerson._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      onDelete?.(salesPerson._id);
      toast.success("Sales person deleted successfully");
      onOpenChange(false);
      router.refresh();

      setTimeout(() => {
        router.push("/");
      }, 300);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error deleting sales person");
    }
  }

  function handleEdit() {
    if (!salesPerson?._id) {
      toast.error("No sales person selected");
      return;
    }

    onOpenChange(false);
    onEditRequest?.(salesPerson);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight">
                Sales Person Preview
              </h3>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              {salesPerson ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">
                      Code
                    </span>
                    <span>{salesPerson.salesPersonCode ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">
                      Name
                    </span>
                    <span>
                      {salesPerson.firstName && salesPerson.lastName
                        ? `${salesPerson.firstName} ${salesPerson.lastName}`
                        : salesPerson.firstName ||
                          salesPerson.lastName ||
                          "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">
                      Contact Number
                    </span>
                    <span>{salesPerson.contactNumber ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">
                      Area
                    </span>
                    <span>{salesPerson.area ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">
                      Email
                    </span>
                    <span>{salesPerson.emailAddress ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">
                      Status
                    </span>
                    <span>{salesPerson.status ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">
                      Created Date
                    </span>
                    <span>
                      {salesPerson.createdDT
                        ? new Date(salesPerson.createdDT).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No sales person selected.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

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
