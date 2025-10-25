import { ArrowRightCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

export type Status = "PENDING" | "TO PREPARE" | "COMPLETED" | "CANCELLED";

interface StatusStepperButtonProps {
  soId: string;
  currentStatus: Status;
  handleUpdateStatus: (soId: string, status: Status) => Promise<void>;
}

const getNextStatus = (status: Status): Status => {
  switch (status) {
    case "PENDING":
      return "TO PREPARE";
    case "TO PREPARE":
      return "COMPLETED";
    default:
      return "COMPLETED";
  }
};

const getStatusColor = (status: Status): string => {
  switch (status) {
    case "PENDING":
      return "text-yellow-600";
    case "TO PREPARE":
      return "text-blue-600";
    case "COMPLETED":
      return "text-green-600";
    case "CANCELLED":
      return "text-red-600";
    default:
      return "text-gray-500";
  }
};

const StatusStepperButton = ({
  soId,
  currentStatus,
  handleUpdateStatus,
}: StatusStepperButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const nextStatus = getNextStatus(currentStatus);
  const isFinal =
    currentStatus === "COMPLETED" || currentStatus === "CANCELLED";
  const statusColor = getStatusColor(currentStatus);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await toast.promise(handleUpdateStatus(soId, nextStatus), {
        loading: `Updating status to ${nextStatus}…`,
        success: `Status updated to ${nextStatus}`,
        error: `Failed to update status to ${nextStatus}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [soId, nextStatus, handleUpdateStatus]);

  const icon = isFinal ? (
    <CheckCircle2 className="w-5 h-5 text-green-600" />
  ) : isLoading ? (
    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
  ) : currentStatus === "PENDING" ? (
    <ArrowRightCircle className="w-5 h-5 text-yellow-600" />
  ) : (
    <ArrowRightCircle className="w-5 h-5 text-blue-600" />
  );

  return isFinal ? (
    <button
      disabled
      className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed shadow-sm"
      title={
        currentStatus === "CANCELLED"
          ? "Sales Order is CANCELLED"
          : "Status is already COMPLETED"
      }>
      <span className={`capitalize tracking-wide ${statusColor}`}>
        {currentStatus}
      </span>
      <span className="flex items-center">{icon}</span>
    </button>
  ) : (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={isLoading}
          className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-sm font-medium text-blue-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors duration-200 shadow-sm"
          title={`Advance status to ${nextStatus}`}>
          <span className={`capitalize tracking-wide ${statusColor}`}>
            {currentStatus}
          </span>
          <span className="flex items-center">{icon}</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change status from{" "}
            <span className="font-semibold">{currentStatus}</span> to{" "}
            <span className="font-semibold">{nextStatus}</span>? This action
            will update the sales order immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default StatusStepperButton;
