import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import { Trash2 } from "lucide-react";
import { WarehouseType } from "../type";

interface ConfirmDeleteButtonProps {
  warehouse: WarehouseType;
  fetchWarehouse: () => void;
}

export function ConfirmDeleteButton({
  warehouse,
  fetchWarehouse,
}: ConfirmDeleteButtonProps) {
  const handleDelete = async () => {
    try {
      await fetch(`api/warehouses/${warehouse._id}`, {
        method: "DELETE",
      });
      fetchWarehouse();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong>{warehouse.warehouse_name}</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
