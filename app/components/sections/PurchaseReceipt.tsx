"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Eye,
  MoreVertical,
  FileText,
  Filter,
  Loader2,
  CalendarDays,
  Download,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

import { Plus, Search, Edit, Trash2, CheckCircle, Check } from "lucide-react";
import { Combobox } from "@headlessui/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  PurchaseReceiptType,
  PurchaseReceiptResponse,
  PurchaseOrderType,
  SupplierType,
  ReceiptItem,
  ItemType,
} from "@/app/components/sections/type";

import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { cn } from "../ui/utils";

type Props = {
  onSuccess?: () => void;
};

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY?: number;
    };
  }
}

export default function PurchaseReceipt({ onSuccess }: Props) {
  const [purchaseReceipts, setPurchaseReceipts] = useState<
    PurchaseReceiptResponse[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const isFirstFetch = useRef(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPR, setViewingPR] = useState<PurchaseReceiptType | null>(null);
  const [editingReceipt, setEditingReceipt] =
    useState<PurchaseReceiptType | null>(null);
  const [viewingReceipt, setViewingReceipt] =
    useState<PurchaseReceiptType | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredReceipts, setFilteredReceipts] = useState<
    PurchaseReceiptType[]
  >([]);

  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderType[]>([]);
  const [items, setItems] = useState<ItemType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [editableItems, setEditableItems] = useState<Record<number, number>>(
    {}
  );
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>(
    {}
  );
  const isAnyItemSelected = Object.values(selectedItems).some(Boolean);
  const [postingReceipt, setPostingReceipt] = useState<string | null>(null);

  // Optional: for previewing merged items from linked POs
  const [itemsData, setItemsData] = useState([
    {
      itemCode: "",
      itemName: "",
      unitType: "",
      purchasePrice: 0,
      quantity: 1,
    },
  ]);

  type POItem = {
    itemCode?: string;
    itemName?: string;
    quantity: number;
    unitType?: string;
    purchasePrice: number;
  };

  useEffect(() => {
    console.log("Fetching suppliers...");

    fetch("/api/suppliers")
      .then((res) => res.json())
      .then((response) => {
        console.log("Raw response:", response);

        const data = Array.isArray(response?.items) ? response.items : [];

        console.log("Parsed suppliers:", data);
        setSuppliers(data); // ✅ Should match SupplierType[]
      })
      .catch((err) => console.error("Failed to fetch suppliers", err));
  }, []);

  useEffect(() => {
    console.log("Starting purchase order polling every 1 second...");

    const fetchPurchaseOrders = () => {
      fetch("/api/purchase-orders")
        .then((res) => res.json())
        .then((response) => {
          console.log("Raw response:", response);
          const data = Array.isArray(response)
            ? response
            : response.items || [];
          console.log("Parsed purchase orders:", data);
          setPurchaseOrders(data); // ✅ Should match PurchaseOrderType[]
        })
        .catch((err) => console.error("Failed to fetch purchase orders", err));
    };

    // Initial fetch
    fetchPurchaseOrders();

    // Poll every 1 second
    const intervalId = setInterval(fetchPurchaseOrders, 1000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    console.log("Starting item polling every 1 second...");

    const fetchItems = () => {
      fetch("/api/items")
        .then((res) => res.json())
        .then((response) => {
          console.log("Raw response:", response);
          const data = Array.isArray(response?.items) ? response.items : [];
          console.log("Parsed items:", data);
          setItems(data);
        })
        .catch((err) => console.error("Failed to fetch items", err));
    };

    // Initial fetch
    fetchItems();

    // Poll every 1 second
    const intervalId = setInterval(fetchItems, 1000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  const router = useRouter();

  const [formData, setFormData] = useState<
    Omit<PurchaseReceiptType, "_id" | "createdAt" | "updatedAt">
  >({
    prNumber: "", // optional: auto-generated by backend
    supplierInvoiceNum: "", // user input
    poNumber: [], // array of PO numbers
    supplierName: "", // auto-filled from first PO
    warehouse: "", // auto-filled from first PO
    amount: 0, // auto-calculated from PO totals
    remarks: "", // ✅ new field for user notes
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<keyof Pick<PurchaseReceiptType, "supplierInvoiceNum">, string>
  >({
    supplierInvoiceNum: "",
  });

  // Filter and paginate data
  const filteredPurchaseReceipts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return purchaseReceipts.filter((receipt) => {
      const matchesSearch =
        !query ||
        receipt.prNumber?.toLowerCase().includes(query) ||
        receipt.supplierInvoiceNum?.toLowerCase().includes(query);

      const createdAtStr = receipt.createdAt
        ? new Date(receipt.createdAt).toISOString().split("T")[0]
        : "";

      const matchesDate = !dateFilter || createdAtStr.startsWith(dateFilter);

      const matchesStatus =
        statusFilter === "all" ||
        receipt.status?.toLowerCase() === statusFilter;

      const matchesSupplier =
        supplierFilter === "all" ||
        receipt.supplierName?.toLowerCase() === supplierFilter.toLowerCase();

      return matchesSearch && matchesDate && matchesStatus && matchesSupplier;
    });
  }, [purchaseReceipts, searchTerm, dateFilter, supplierFilter, statusFilter]);

  const totalPages = Math.ceil(filteredPurchaseReceipts.length / rowsPerPage);

  const paginatedPurchaseReceipts: PurchaseReceiptResponse[] =
    filteredPurchaseReceipts.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setSupplierFilter("all");
    setStatusFilter("all");
  };

  const allSelected =
    paginatedPurchaseReceipts.length > 0 &&
    selectedIds.length === paginatedPurchaseReceipts.length;

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Validation functions
  const validateForm = () => {
    const errors: Record<
      keyof Pick<PurchaseReceiptType, "supplierInvoiceNum">,
      string
    > = {
      supplierInvoiceNum: "",
    };

    // Required: at least one PO number
    const hasPOs =
      Array.isArray(formData.poNumber) && formData.poNumber.length > 0;
    const poError = !hasPOs ? "At least one linked PO is required" : "";

    setValidationErrors(errors);
    return (
      !Object.values(errors).some((error) => error !== "") && poError === ""
    );
  };

  function buildSelectedItemsPayload(
    items: POItem[],
    selectedItems: Record<number, boolean>,
    editableItems: Record<number, number>
  ): ReceiptItem[] {
    return items
      .map((item, index) => {
        if (!selectedItems[index]) return null;
        const quantity = editableItems[index] ?? item.quantity;

        return {
          selected: true,
          itemCode: item.itemCode,
          itemName: item.itemName,
          quantity,
          unitType: item.unitType,
          purchasePrice: item.purchasePrice,
          amount: item.purchasePrice * quantity,
        };
      })
      .filter(Boolean) as ReceiptItem[];
  }

  type ReceiptSummary = {
    prNumber: string;
    poNumber: string[];
    referenceNumber?: string;
    status: string;
    locked?: boolean;
    user?: string;
    activity?: string;
    inQty?: number;
  };

  const handlePostReceipt = async (receipt: ReceiptSummary) => {
    if (receipt.status === "RECEIVED" || receipt.locked) {
      toast.info("This receipt is already finalized.");
      return;
    }

    setPostingReceipt(receipt.prNumber); // ⏳ START LOADING

    try {
      const res = await fetch("/api/purchase-receipts/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prNumber: receipt.prNumber,
          poNumber: receipt.poNumber,
          referenceNumber: receipt.referenceNumber,
          activity: "PURCHASE",
          user: receipt.user ?? "SYSTEM",
          inQty: receipt.inQty ?? 0,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("❌ Post failed:", result.error || result);
        toast.error("Failed to post receipt.");
        return;
      }

      toast.success("Receipt posted successfully. PO locked.");
      router.refresh?.();
    } catch (error) {
      console.error("🚨 Network error:", error);
      toast.error("Something went wrong while posting.");
    } finally {
      setPostingReceipt(null); // ⏳ END LOADING
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    const normalizedPO = formData.poNumber?.[0]?.trim().toUpperCase();
    const matchedPO = purchaseOrders.find(
      (po) => po.poNumber.trim().toUpperCase() === normalizedPO
    );

    if (!matchedPO) {
      alert(`PO ${normalizedPO} not found.`);
      return;
    }

    const selectedItemsPayload = buildSelectedItemsPayload(
      matchedPO.items,
      selectedItems,
      editableItems
    );

    if (selectedItemsPayload.length === 0) {
      alert("Please select at least one item before creating.");
      return;
    }

    const payload = {
      poNumber: Array.isArray(formData.poNumber)
        ? formData.poNumber.map((po) => po.trim().toUpperCase())
        : [],
      status: formData.status?.trim().toUpperCase() || "OPEN",
      items: selectedItemsPayload,
    };

    console.log("📤 Creating purchase receipt with payload:", payload);

    try {
      const res = await fetch("/api/purchase-receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("✅ Server response:", result);

      if (!res.ok) {
        console.error("❌ Create failed:", result.message || result);
        alert("Failed to create purchase receipt. Please try again.");
        return;
      }

      toast.success("Purchase receipt created successfully!");

      onSuccess?.();

      setTimeout(() => {
        router.push("/");
      }, 300);
    } catch (error) {
      console.error("🚨 Network or unexpected error:", error);
      alert("Something went wrong. Please check your connection or try again.");
    }

    setSelectedItems({});
    setIsCreateDialogOpen(false);
  };
  const isDisabled = !formData.poNumber[0] || !isAnyItemSelected;

  const defaultValidationErrors: Record<
    keyof Pick<PurchaseReceiptType, "supplierInvoiceNum">,
    string
  > = {
    supplierInvoiceNum: "",
  };

  const allowedStatuses: PurchaseReceiptType["status"][] = ["RECEIVED", "OPEN"];

  const handleEdit = (receipt: PurchaseReceiptType) => {
    setEditingReceipt(receipt);

    const normalizedPOs = Array.isArray(receipt.poNumber)
      ? receipt.poNumber.map((po) => po.trim().toUpperCase())
      : [];

    const normalizedStatus: PurchaseReceiptType["status"] =
      receipt.status === "RECEIVED" || receipt.status === "OPEN"
        ? receipt.status
        : "OPEN";

    const normalizedItems = Array.isArray(receipt.items)
      ? receipt.items.map((item) => {
          const quantity = Math.max(Number(item.quantity) || 1, 1);
          const purchasePrice = Number(item.purchasePrice) || 0;

          return {
            itemCode: item.itemCode?.trim().toUpperCase() || "",
            itemName: item.itemName?.trim().toUpperCase() || "",
            unitType: item.unitType?.trim().toUpperCase() || "",
            quantity,
            purchasePrice,
            amount: quantity * purchasePrice,
          };
        })
      : [];

    const normalizedFormData: Omit<
      PurchaseReceiptType,
      "_id" | "createdAt" | "updatedAt"
    > = {
      prNumber: receipt.prNumber?.trim().toUpperCase() || "",
      supplierInvoiceNum:
        receipt.supplierInvoiceNum?.trim().toUpperCase() || "",
      poNumber: normalizedPOs,
      supplierName: receipt.supplierName?.trim().toUpperCase() || "",
      warehouse: receipt.warehouse?.trim().toUpperCase() || "",
      amount: Number(receipt.amount) || 0,
      remarks: receipt.remarks?.trim() || "",
      status: normalizedStatus,
      items: normalizedItems,
    };

    setFormData(normalizedFormData);

    // ✅ Initialize checkbox and quantity state
    const initialSelectedItems: Record<number, boolean> = {};
    const initialEditableItems: Record<number, number> = {};

    normalizedItems.forEach((item, index) => {
      if (item.quantity > 0) {
        initialSelectedItems[index] = true;
        initialEditableItems[index] = item.quantity;
      }
    });

    setSelectedItems(initialSelectedItems);
    setEditableItems(initialEditableItems);

    setValidationErrors(defaultValidationErrors);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingReceipt || !validateForm()) {
      console.warn("Validation failed or editingReceipt is missing:", {
        editingReceipt,
      });
      return;
    }

    // Normalize items using editable quantities
    const normalizedItems = Array.isArray(formData.items)
      ? formData.items.map((item, index) => {
          const rawQty = editableItems?.[index];
          const quantity = Math.max(Number(rawQty) || 1, 1);
          const purchasePrice = Number(item.purchasePrice) || 0;

          return {
            itemCode: item.itemCode?.trim().toUpperCase() || "",
            itemName: item.itemName?.trim().toUpperCase() || "",
            unitType: item.unitType?.trim().toUpperCase() || "",
            quantity,
            purchasePrice,
            amount: quantity * purchasePrice,
          };
        })
      : [];

    if (normalizedItems.length === 0) {
      console.error("❌ No items to update. Aborting.");
      alert("No items found in the receipt.");
      return;
    }

    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const rawStatus = formData.status?.trim().toUpperCase();
    const status: PurchaseReceiptType["status"] =
      rawStatus === "RECEIVED" || rawStatus === "OPEN" ? rawStatus : "OPEN";

    const payload: Partial<PurchaseReceiptType> = {
      prNumber: formData.prNumber?.trim().toUpperCase() || "",
      supplierInvoiceNum:
        formData.supplierInvoiceNum?.trim().toUpperCase() || "",
      poNumber: Array.isArray(formData.poNumber)
        ? formData.poNumber.map((po) => po.trim().toUpperCase())
        : [],
      status,
      remarks: formData.remarks?.trim() || "",
      items: normalizedItems,
      amount: totalAmount,
    };

    console.log("📦 Sending update payload:", payload);

    try {
      const res = await fetch(`/api/purchase-receipts/${editingReceipt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📡 Response status:", res.status);
      const result = await res.json();

      if (!res.ok) {
        const errorMessage =
          typeof result?.error === "string"
            ? result.error
            : "Unknown error occurred during update.";
        console.error("❌ Update failed:", res.status, result);
        alert(`Update failed: ${errorMessage}`);
        return;
      }

      const updatedReceipt = result as PurchaseReceiptType;
      console.log("✅ Parsed updated receipt:", updatedReceipt);

      setPurchaseReceipts((prev) =>
        prev.map((r) =>
          r._id === updatedReceipt._id
            ? (updatedReceipt as Required<PurchaseReceiptType>)
            : r
        )
      );
    } catch (err) {
      console.error("🔥 Network or unexpected error:", err);
      alert("Something went wrong while updating the purchase receipt.");
      return;
    }

    // Reset form and close dialog
    setEditingReceipt(null);
    setFormData({
      prNumber: "",
      supplierInvoiceNum: "",
      poNumber: [],
      status: "OPEN",
      remarks: "",
      items: [],
      amount: 0,
    });

    setValidationErrors(defaultValidationErrors);
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (receiptId: string) => {
    if (!receiptId || typeof receiptId !== "string") {
      console.warn("Invalid receipt ID:", receiptId);
      toast.error("Invalid purchase receipt ID");
      return;
    }

    try {
      const res = await fetch(`/api/purchase-receipts/${receiptId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to delete purchase receipt");
      }

      // Remove from local state
      setPurchaseReceipts((prev) => prev.filter((r) => r._id !== receiptId));

      console.log("✅ Deleted purchase receipt:", receiptId);
      toast.success(`Purchase receipt #${receiptId} deleted`);
    } catch (error) {
      console.error("❌ Error deleting purchase receipt:", error);
      toast.error(`Failed to delete receipt #${receiptId}`);
    }
  };

  const handleView = (receipt: PurchaseReceiptType) => {
    setViewingReceipt(receipt);
    setIsViewDialogOpen(true);
  };

  const formatDate = (date: Date | string): string => {
    const parsed = typeof date === "string" ? new Date(date) : date;

    if (!(parsed instanceof Date) || isNaN(parsed.getTime())) {
      return "Invalid date";
    }

    return parsed.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const resetForm = () => {
    setFormData({
      prNumber: "",
      supplierInvoiceNum: "",
      poNumber: [],
      supplierName: "",
      warehouse: "",
      amount: 0,
    });

    setValidationErrors({
      supplierInvoiceNum: "",
    });
  };

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      // Select all receipts on current page
      const newSelections = [
        ...selectedIds,
        ...paginatedPurchaseReceipts
          .filter((receipt) => !selectedIds.includes(receipt._id))
          .map((receipt) => receipt._id),
      ];
      setSelectedIds(newSelections);
    } else if (checked === false) {
      // Unselect all receipts on current page
      const remaining = selectedIds.filter(
        (id) => !paginatedPurchaseReceipts.some((receipt) => receipt._id === id)
      );
      setSelectedIds(remaining);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteMany = async (_ids: string[]) => {
    if (!_ids || _ids.length === 0) {
      toast.error("No purchase receipts selected for deletion.");
      return;
    }

    // Get the receipts from local state
    const receiptsToDelete = purchaseReceipts.filter((r) =>
      _ids.includes(r._id)
    );

    // Filter out RECEIVED receipts
    const deletableReceipts = receiptsToDelete.filter(
      (r) => r.status !== "RECEIVED"
    );

    if (deletableReceipts.length === 0) {
      toast.info("Receipts with RECEIVED status cannot be deleted.");
      return;
    }

    const deletableIds = deletableReceipts.map((r) => r._id);

    try {
      // Optimistically remove from UI
      setPurchaseReceipts((prev) =>
        prev.filter((r) => !deletableIds.includes(r._id))
      );

      const results = await Promise.allSettled(
        deletableIds.map(async (_id) => {
          const res = await fetch(`/api/purchase-receipts/${_id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            const error = await res.json();
            console.warn(`❌ Failed to delete ${_id}:`, error.message);
            throw new Error(error.message || `Failed to delete ${_id}`);
          }

          return res;
        })
      );

      const failures = results.filter(
        (result) => result.status === "rejected"
      ) as PromiseRejectedResult[];

      if (failures.length > 0) {
        toast.warning(
          `Some receipts could not be deleted (${failures.length} failed).`
        );
      } else {
        toast.success("✅ Selected purchase receipts deleted.");
      }

      // Notify if some were skipped due to RECEIVED status
      const skippedCount = _ids.length - deletableIds.length;
      if (skippedCount > 0) {
        toast.info(`${skippedCount} RECEIVED receipt(s) were skipped.`);
      }

      setSelectedIds([]);
      onSuccess?.(); // refresh list
    } catch (err) {
      console.error("❌ Bulk delete failed:", err);
      toast.error("Failed to delete selected purchase receipts.");
    }
  };

  const fetchPurchaseReceipts = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/purchase-receipts", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch purchase receipts");

      const data = await res.json();
      const purchaseReceipts = Array.isArray(data) ? data : [];

      console.log("Fetched receipts:", purchaseReceipts);

      setPurchaseReceipts(
        Array.isArray(purchaseReceipts) ? purchaseReceipts : []
      );
    } catch (error) {
      console.error("❌ Error loading purchase receipts:", error);
      setPurchaseReceipts([]);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    fetchPurchaseReceipts(); // initial fetch

    const interval = setInterval(() => {
      fetchPurchaseReceipts();
    }, 1000); // 1 second polling

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const params = useParams();
  const receiptId = params?.id as string;

  useEffect(() => {
    if (receiptId) fetchSingleReceipt(receiptId);
  }, [receiptId]);

  const fetchSingleReceipt = async (receiptId: string) => {
    try {
      const res = await fetch(`/api/purchase-receipts/${receiptId}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch receipt");

      const data = await res.json();

      const normalizedReceipt: PurchaseReceiptType = {
        prNumber: data.prNumber?.trim().toUpperCase() || "",
        supplierInvoiceNum: data.supplierInvoiceNum?.trim().toUpperCase() || "",
        poNumber: Array.isArray(data.poNumber)
          ? data.poNumber.map((po: string) => po.trim().toUpperCase())
          : [],
        supplierName: data.supplierName?.trim().toUpperCase() || "",
        warehouse: data.warehouse?.trim().toUpperCase() || "",
        amount: data.amount || 0,
        _id: data._id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      setFormData(normalizedReceipt);
    } catch (error) {
      console.error("Error loading receipt:", error);
      setFormData({} as PurchaseReceiptType);
    }
  };

  //   const selectedItem = items.find(
  //   (item) =>
  //     item.itemName?.trim().toUpperCase() ===
  //     formData.items[activeIndex]?.itemName?.trim().toUpperCase()
  // );
  const handleAddItem = () => {
    setItemsData((prev) => [
      ...prev,
      {
        itemCode: "",
        itemName: "",
        description: "",
        unitType: "",
        purchasePrice: 0,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveAllItems = () => {
    setItemsData([]);

    setFormData((prev) => ({
      ...prev,
      poNumber: [],
      supplierInvoiceNum: prev.supplierInvoiceNum || "",
      supplierName: "",
      warehouse: "",
      amount: 0,
    }));
  };

  // const handleAddItemEdit = () => {
  //   const newItem: PurchaseOrderItem = {
  //     itemCode: "",
  //     itemName: "",
  //     unitType: "",
  //     purchasePrice: 0,
  //     quantity: 1,
  //   };

  //   setItemsData((prev) => [...prev, newItem]);
  // };

  const handleRemoveItem = (index: number) => {
    const updatedItems = itemsData.filter((_, i) => i !== index);

    setItemsData(updatedItems);

    // Optional: if you're displaying totals in the UI
    const totalQuantity = updatedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );

    // If you're showing totals in the UI, you can store them in a separate state
    // setDerivedTotals({
    //   totalQuantity,
    //   total: totalAmount,
    // });
  };

  // const recalculateTotals = (items: PurchaseOrderItem[]) => {
  //   const totalQuantity = items.reduce(
  //     (sum, item) => sum + (item.quantity || 0),
  //     0
  //   );
  //   const totalAmount = items.reduce(
  //     (sum, item) => sum + (item.quantity * item.purchasePrice || 0),
  //     0
  //   );

  //   return { totalQuantity, total: totalAmount };
  // };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    handleCreate();
    setIsCreateDialogOpen(false);
  };

  const handleSaveAndCreate = () => {
    if (!validateForm()) {
      return;
    }
    handleCreate();
    resetForm();
    handleRemoveAllItems();
    setIsCreateDialogOpen(true);
  };

  const handleExportPDF = (
    items: ReceiptItem[],
    prMeta: PurchaseReceiptType
  ) => {
    if (!items?.length) {
      toast.error("No items to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 14;
    const marginRight = 14;
    const contentWidth = pageWidth - marginLeft - marginRight;
    const startY = 60;
    const rowsPerPage = 20;

    const totalAmount = items.reduce(
      (sum, i) => sum + (i.quantity ?? 0) * (i.purchasePrice ?? 0),
      0
    );

    const chunkedItems = [];
    for (let i = 0; i < items.length; i += rowsPerPage) {
      chunkedItems.push(items.slice(i, i + rowsPerPage));
    }

    const renderHeader = (pageNumber: number, totalPages: number) => {
      doc.setFont("helvetica", "bold").setFontSize(16);
      doc.text("NCM MARKETING CORPORATION", marginLeft, 14);
      doc.setFontSize(9).setFont("helvetica", "normal");
      doc.text("Freeman Compound, #10 Nadunada St., 6-8 Ave.", marginLeft, 18);
      doc.text("Caloocan City", marginLeft, 22);
      doc.text(
        "E-mail: ncm_office@yahoo.com.ph / Tel No.: +63(2)56760356",
        marginLeft,
        26
      );
      doc.setFont("helvetica", "bold").setFontSize(16);
      doc.text("PURCHASE RECEIPT", pageWidth - marginRight, 22, {
        align: "right",
      });
    };

    const renderMetaBoxes = () => {
      const boxWidth = 75;
      const orderDetailsX = pageWidth - marginRight - boxWidth;
      const orderDetailsY = 30;

      const orderDetailsData = [
        [
          "DATE",
          prMeta.createdAt
            ? new Date(prMeta.createdAt).toLocaleDateString("en-PH", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })
            : "N/A",
        ],
        ["PR #", prMeta.poNumber || "N/A"],
        ["PO #", prMeta.poNumber || "N/A"],
        ["WAREHOUSE", prMeta.warehouse?.trim().toUpperCase() || "N/A"],
        ["TERMS", "N/A"],
      ];

      autoTable(doc, {
        startY: orderDetailsY,
        margin: { left: orderDetailsX },
        body: orderDetailsData,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 1,
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 35 },
          1: { cellWidth: 40 },
        },
        tableWidth: boxWidth,
      });

      const customerDetailsData = [
        ["ORDER FROM", prMeta.supplierName || "N/A"],
        ["ADDRESS", "N/A"],
        ["CONTACT #", "N/A"],
        ["TIN", "N/A"],
      ];

      autoTable(doc, {
        startY: orderDetailsY,
        margin: { left: marginLeft, right: contentWidth - boxWidth - 5 },
        body: customerDetailsData,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 1,
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 35 },
          1: { cellWidth: "auto" },
        },
      });
    };

    const renderFooter = () => {
      const footerY = pageHeight - 40;
      const footerHeight = 20;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Draw single footer box
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(marginLeft, footerY, contentWidth, footerHeight);

      // Draw 4 equal horizontal lines inside the box
      const lineSpacing = footerHeight / 4;
      const horizontalEndX = marginRight + contentWidth - 110;
      for (let i = 1; i <= 4; i++) {
        const lineY = footerY + i * lineSpacing;
        doc.line(marginLeft, lineY, horizontalEndX, lineY);
      }

      // Draw vertical line just after "Approved By" section
      doc.line(
        horizontalEndX - 48,
        footerY,
        horizontalEndX - 48,
        footerY + footerHeight
      );
      doc.line(horizontalEndX, footerY, horizontalEndX, footerY + footerHeight);

      // Labels inside the box
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("Approved By", marginLeft + 2, footerY + 4);
      doc.text("Checked By", marginLeft + 2, footerY + 9);

      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text(
        "Received the above goods/s in good condition",
        marginLeft + 100,
        footerY + 4
      );

      // Signature line inside the box
      doc.text("Signature over Printed Name", marginLeft + 85, footerY + 18);
      doc.text("Date Received", pageWidth - marginRight - 12, footerY + 18, {
        align: "right",
      });
    };

    chunkedItems.forEach((chunk, index) => {
      if (index > 0) doc.addPage();
      const pageNumber = index + 1;
      const totalPages = chunkedItems.length;

      renderHeader(pageNumber, totalPages);
      renderMetaBoxes();

      autoTable(doc, {
        startY,
        head: [["Qty", "Unit", "Description", "Sales Price", "Tax", "Total"]],
        body: chunk.map((item) => [
          item.quantity ?? 0,
          item.unitType ?? "-",
          item.itemName ?? "-",
          (item.purchasePrice ?? 0).toFixed(2),
          "0.00",
          ((item.quantity ?? 0) * (item.purchasePrice ?? 0)).toFixed(2),
        ]),
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: {
          fillColor: [200, 200, 200],
          fontStyle: "bold",
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
        },
        columnStyles: {
          0: { halign: "right" }, // Qty
          1: { halign: "left" }, // Unit
          2: { halign: "left" }, // Description
          3: { halign: "right" }, // Sales Price
          4: { halign: "right" }, // Tax
          5: { halign: "right" }, // Total
        },
        didParseCell: (data) => {
          const colIndex = data.column.index;
          if (data.section === "head") {
            // Align header text
            if (
              colIndex === 0 ||
              colIndex === 3 ||
              colIndex === 4 ||
              colIndex === 5
            ) {
              data.cell.styles.halign = "right";
            } else {
              data.cell.styles.halign = "left";
            }

            // Add left and right borders
            data.cell.styles.lineWidth = 0.3;
            data.cell.styles.lineColor = [0, 0, 0];
            data.cell.styles.cellPadding = {
              left: 2,
              right: 2,
              top: 1,
              bottom: 1,
            };
          }
        },
        tableWidth: contentWidth,
        margin: { left: marginLeft, right: marginRight },
        showHead: "everyPage",
      });

      const footerY = pageHeight - 40;

      const renderRightAlignedLabelValue = (
        label: string,
        value: string,
        y: number,
        rightX: number,
        labelOffset = 65
      ) => {
        doc.text(label, rightX - labelOffset, y, { align: "left" });
        doc.text(value, rightX, y, { align: "right" });
      };

      if (index === chunkedItems.length - 1) {
        const totalQuantity = items.reduce(
          (sum, i) => sum + (i.quantity ?? 0),
          0
        );

        // Placeholder values — replace with actual computed logic if available
        const vatableSales = totalAmount;
        const vatExemptSales = 0;
        const totalSales = totalAmount;
        const discount = 0;
        const tax = 0;
        const wtax = 0;

        doc.setFont("helvetica", "italic").setFontSize(9);
        doc.text("-- Nothing follows --", pageWidth / 2, footerY - 80, {
          align: "center",
        });

        doc.setFont("helvetica", "bold").setFontSize(9);

        // Left side: Total Quantity
        doc.text("Total Quantity:", marginLeft + 10, footerY - 40, {
          align: "left",
        });
        doc.text(`${totalQuantity}`, marginLeft + 80, footerY - 40, {
          align: "left",
        });

        // Right side: Financial breakdown with padded spacing
        const rightX = pageWidth - marginRight - 10;

        renderRightAlignedLabelValue(
          "VATable Sales:",
          vatableSales.toFixed(2),
          footerY - 40,
          rightX
        );
        renderRightAlignedLabelValue(
          "VAT Exempt Sales:",
          vatExemptSales.toFixed(2),
          footerY - 35,
          rightX
        );
        renderRightAlignedLabelValue(
          "Total Sales:",
          totalSales.toFixed(2),
          footerY - 30,
          rightX
        );
        renderRightAlignedLabelValue(
          "Discount:",
          discount.toFixed(2),
          footerY - 25,
          rightX
        );
        renderRightAlignedLabelValue(
          "Tax:",
          tax.toFixed(2),
          footerY - 20,
          rightX
        );
        renderRightAlignedLabelValue(
          "WTax:",
          wtax.toFixed(2),
          footerY - 15,
          rightX
        );
        renderRightAlignedLabelValue(
          "Total Purchase:",
          totalAmount.toFixed(2),
          footerY - 10,
          rightX
        );
      } else {
        doc.setFont("helvetica", "italic").setFontSize(9);
        doc.text(
          `-- Page ${pageNumber} of ${totalPages} --`,
          pageWidth / 2,
          footerY - 10,
          { align: "center" }
        );
      }

      const finalY = doc.lastAutoTable?.finalY ?? startY + 70;

      const isLastPage = index === chunkedItems.length - 1;
      const bottomBorderY = isLastPage ? footerY - 2 : footerY - 2;

      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(marginLeft, startY, contentWidth, bottomBorderY - startY);

      renderFooter();
    });

    doc.save(`${prMeta.prNumber || "purchase_receipt"}.pdf`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Purchase Receipt</CardTitle>
              <CardDescription>Manage purchase receipts</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search PR Number or Supplier Invoice No...."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                if (open) {
                  resetForm();
                  setItemsData([]);
                  setSelectedItems({});
                }
                setIsCreateDialogOpen(open);
              }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Purchase Receipts
                </Button>
              </DialogTrigger>

              <DialogPanel className="space-y-6">
                {/* Header */}
                <DialogHeader className="border-b pb-2">
                  <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
                    Create Purchase Receipts
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Fill in the receipt details. Fields marked with{" "}
                    <span className="text-red-500">* </span>
                    are required.
                  </DialogDescription>
                </DialogHeader>

                {/* Form Content Slot (optional placeholder) */}
                <div className="space-y-4">
                  <div className="grid gap-6 py-6">
                    {/* PR Number & Receipt Date */}
                    <div className="flex flex-row flex-wrap gap-4">
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-pr-number">PR Number</Label>
                        <Input
                          id="create-pr-number"
                          value="Auto-generated"
                          readOnly
                          disabled
                          placeholder="Auto-generated"
                          className="text-sm uppercase bg-muted/50 cursor-not-allowed rounded-md border px-3 py-2"
                        />
                      </div>

                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="receipt-date">Receipt Date</Label>
                        <Input
                          id="receipt-date"
                          value={new Date().toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          readOnly
                          disabled
                          className="text-sm bg-muted/50 cursor-not-allowed rounded-md border px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap gap-4">
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="supplier-search">
                          Supplier <span className="text-red-500">* </span>
                        </Label>

                        <div className="relative">
                          <Input
                            id="supplier-search"
                            type="text"
                            autoComplete="off"
                            value={formData.supplierName || ""}
                            onClick={() => setShowSupplierSuggestions(true)}
                            onBlur={() =>
                              setTimeout(
                                () => setShowSupplierSuggestions(false),
                                200
                              )
                            }
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();

                              setFormData((prev) => ({
                                ...prev,
                                supplierName: value,
                                poNumber: [], // 🧼 Reset PO
                                warehouse: "", // 🧼 Reset warehouse
                                amount: 0, // 🧼 Reset amount
                                remarks: "", // 🧼 Reset remarks
                              }));

                              setValidationErrors((prev) => ({
                                ...prev,
                                supplierName: "",
                                poNumber: "",
                              }));

                              setShowSupplierSuggestions(true); // ✅ Show suggestions while typing
                            }}
                            placeholder="Search supplier name"
                            className="text-sm uppercase w-full bg-white px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                          />

                          {/* Magnifying Glass Icon */}
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-muted-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                              />
                            </svg>
                          </div>

                          {/* Live Suggestions (filtered by input) */}
                          {showSupplierSuggestions && (
                            <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                              {suppliers
                                .filter((supplier) =>
                                  supplier.supplierName
                                    .trim()
                                    .toUpperCase()
                                    .includes(
                                      formData.supplierName?.toUpperCase() || ""
                                    )
                                )
                                .map((supplier) => {
                                  const normalized = supplier.supplierName
                                    .trim()
                                    .toUpperCase();
                                  return (
                                    <li
                                      key={supplier._id || normalized}
                                      className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                      onClick={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          supplierName: normalized,
                                          supplierId: supplier._id,
                                          poNumber: [], // ✅ Reset PO
                                          warehouse: "", // ✅ Reset warehouse
                                          amount: 0, // ✅ Reset amount
                                          remarks: "", // ✅ Reset remarks
                                        }));

                                        setValidationErrors((prev) => ({
                                          ...prev,
                                          supplierName: "",
                                          poNumber: "",
                                        }));

                                        setShowSupplierSuggestions(false);
                                      }}>
                                      {normalized}
                                    </li>
                                  );
                                })}
                              {suppliers.filter((supplier) =>
                                supplier.supplierName
                                  .trim()
                                  .toUpperCase()
                                  .includes(
                                    formData.supplierName?.toUpperCase() || ""
                                  )
                              ).length === 0 && (
                                <li className="px-3 py-2 text-muted-foreground">
                                  No matching suppliers found
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-supplier-invoice-num">
                          Supplier Invoice Number
                        </Label>
                        <Input
                          id="create-supplier-invoice-num"
                          value={formData.supplierInvoiceNum || ""}
                          readOnly // ✅ Prevent manual editing
                          placeholder="Auto-generated"
                          className={`text-sm uppercase rounded-md border px-3 py-2 shadow-sm bg-muted cursor-not-allowed focus:outline-none transition ${
                            validationErrors.supplierInvoiceNum
                              ? "border-destructive ring-destructive/30"
                              : "border-input"
                          }`}
                        />
                        {validationErrors.supplierInvoiceNum && (
                          <p className="text-sm text-destructive mt-1">
                            {validationErrors.supplierInvoiceNum}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap gap-4">
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="po-search">
                          PO Number <span className="text-red-500">* </span>
                        </Label>

                        <div className="relative">
                          <Input
                            id="po-search"
                            type="text"
                            autoComplete="off"
                            value={formData.poNumber[0] || ""}
                            readOnly={!formData.supplierName}
                            onClick={() => {
                              if (formData.supplierName)
                                setShowSuggestions(true);
                            }}
                            onBlur={() =>
                              setTimeout(() => setShowSuggestions(false), 200)
                            }
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase(); // ✅ no .trim() here

                              setFormData((prev) => ({
                                ...prev,
                                poNumber: [value],
                              }));

                              setValidationErrors((prev) => ({
                                ...prev,
                                poNumber: "",
                              }));

                              setShowSuggestions(true); // ✅ show suggestions while typing
                            }}
                            placeholder={
                              formData.supplierName
                                ? "Search PO number"
                                : "Select supplier first"
                            }
                            className={`text-sm uppercase w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
                              !formData.supplierName
                                ? "bg-muted cursor-not-allowed"
                                : "bg-white"
                            }`}
                          />

                          {/* Magnifying Glass Icon */}
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-muted-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                              />
                            </svg>
                          </div>

                          {/* Live Suggestions */}
                          {showSuggestions && formData.supplierName && (
                            <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                              {purchaseOrders
                                .filter((po) => {
                                  const supplierMatch =
                                    po.supplierName?.trim().toUpperCase() ===
                                    formData.supplierName?.trim().toUpperCase();

                                  const poMatch = formData.poNumber[0]
                                    ? po.poNumber
                                        ?.trim()
                                        .toUpperCase()
                                        .includes(
                                          formData.poNumber[0]
                                            .trim()
                                            .toUpperCase()
                                        )
                                    : true;

                                  const isActive = po.status !== "COMPLETED";

                                  return supplierMatch && poMatch && isActive;
                                })
                                .map((po) => {
                                  const normalized =
                                    po.poNumber?.trim().toUpperCase() || "";
                                  return (
                                    <li
                                      key={po._id || normalized}
                                      className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                      onClick={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          poNumber: [normalized],
                                          warehouse:
                                            po.warehouse
                                              ?.trim()
                                              .toUpperCase() || "UNKNOWN",
                                          remarks: po.remarks || "",
                                        }));
                                        setShowSuggestions(false);
                                      }}>
                                      {normalized}
                                    </li>
                                  );
                                })}
                              {purchaseOrders.filter((po) => {
                                const supplierMatch =
                                  po.supplierName?.trim().toUpperCase() ===
                                  formData.supplierName?.trim().toUpperCase();

                                const poMatch = formData.poNumber[0]
                                  ? po.poNumber
                                      ?.trim()
                                      .toUpperCase()
                                      .includes(
                                        formData.poNumber[0]
                                          .trim()
                                          .toUpperCase()
                                      )
                                  : true;

                                const isActive = po.status !== "COMPLETED";

                                return supplierMatch && poMatch && isActive;
                              }).length === 0 && (
                                <li className="px-3 py-2 text-muted-foreground">
                                  No matching PO found
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Warehouse Display */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="warehouse-display">Warehouse</Label>
                        <Input
                          id="warehouse-display"
                          type="text"
                          value={formData.warehouse || ""}
                          readOnly
                          className="text-sm uppercase w-full bg-muted cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 min-w-[200px]">
                      <Label htmlFor="create-remarks">Remarks</Label>
                      <Textarea
                        id="create-remarks"
                        value={formData.remarks || ""}
                        readOnly
                        placeholder="Remarks from selected PO"
                        rows={3}
                        className="text-sm uppercase w-full bg-muted cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {formData.poNumber[0] && (
                  <div className="mt-4  rounded-md overflow-hidden">
                    <div className="overflow-auto max-h-96">
                      {/* Header */}
                      <div className="grid w-full grid-cols-[20px_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b py-2 mb-4 bg-primary text-primary-foreground rounded-t">
                        <div className="flex items-start justify-center px-2 min-w-[40px] ">
                          <Input
                            type="checkbox"
                            checked={
                              Object.keys(selectedItems).length > 0 &&
                              Object.values(selectedItems).every(Boolean)
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const matchedPO = purchaseOrders.find(
                                (po) =>
                                  po.poNumber.trim().toUpperCase() ===
                                  formData.poNumber[0]
                              );
                              if (!matchedPO || !Array.isArray(matchedPO.items))
                                return;

                              const allSelected = matchedPO.items.reduce(
                                (acc, item, index) => {
                                  if (item.quantity > 0) acc[index] = checked;
                                  return acc;
                                },
                                {} as Record<number, boolean>
                              );

                              setSelectedItems(allSelected);
                            }}
                            className="form-checkbox h-4 w-4 text-primary focus:ring-2 focus:ring-primary/50 hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="text-xs font-semibold uppercase text-start px-4">
                          Item Code
                        </div>
                        <div className="text-xs font-semibold uppercase text-left px-4">
                          Item Name
                        </div>
                        <div className="text-xs font-semibold uppercase text-end">
                          Qty
                        </div>
                        <div className="text-xs font-semibold uppercase text-left">
                          UOM
                        </div>
                        <div className="text-xs font-semibold uppercase text-end px-2">
                          Purchase Price
                        </div>
                        <div className="text-xs font-semibold uppercase text-end px-2">
                          Amount
                        </div>
                      </div>

                      {/* Rows */}
                      {(() => {
                        const matchedPO = purchaseOrders.find(
                          (po) =>
                            po.poNumber.trim().toUpperCase() ===
                            formData.poNumber[0]
                        );
                        if (!matchedPO || !Array.isArray(matchedPO.items))
                          return null;

                        return matchedPO.items.map((item, index) => {
                          const isZero = item.quantity === 0;

                          return (
                            <div
                              key={index}
                              className={`grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] items-center  border-border border-b-1 text-sm m-0 ${
                                isZero
                                  ? "bg-green-50 text-green-700 animate-fade-in"
                                  : selectedItems[index]
                                  ? "bg-accent/10 border-accent"
                                  : "hover:bg-muted/10"
                              }`}>
                              {/* Checkbox or Posted Badge */}
                              <div className="flex items-start justify-start px-2 min-w-[40px]">
                                {isZero ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <Check className="w-4 h-4 animate-bounce" />
                                  </div>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={selectedItems[index] || false}
                                    onChange={(e) => {
                                      setSelectedItems((prev) => ({
                                        ...prev,
                                        [index]: e.target.checked,
                                      }));
                                    }}
                                    className="form-checkbox h-4 w-4 text-primary focus:ring-2 focus:ring-primary/50 hover:scale-105 transition-transform"
                                  />
                                )}
                              </div>

                              {/* Item Code */}
                              <div className="flex items-center uppercase text-sm ">
                                {item.itemCode || "-"}
                              </div>

                              {/* Item Name */}
                              <div className="uppercase border-l border-border px-2 flex items-center text-sm ">
                                {item.itemName || "-"}
                              </div>

                              {/* Quantity Input */}
                              <div>
                                <input
                                  type="number"
                                  min={1}
                                  max={item.quantity}
                                  value={editableItems[index] ?? item.quantity}
                                  onChange={(e) => {
                                    const raw = Number(e.target.value);
                                    const clamped = Math.max(
                                      1,
                                      Math.min(raw, item.quantity)
                                    );
                                    setEditableItems((prev) => ({
                                      ...prev,
                                      [index]: clamped,
                                    }));
                                  }}
                                  disabled={isZero}
                                  className={`w-full px-2 py-1 border border-border border-l border-y-0 border-r-0 bg-white focus:outline-none focus:ring-1 focus:ring-primary text-end ${
                                    isZero
                                      ? "bg-green-50 text-green-700 cursor-not-allowed"
                                      : "bg-background"
                                  }`}
                                  inputMode="numeric"
                                />
                              </div>

                              {/* Unit Type */}
                              <div className="uppercase border-l border-border px-2 flex items-center text-sm ">
                                {item.unitType || "-"}
                              </div>

                              {/* Purchase Price */}
                              <div className="text-right uppercase border-l border-border px-2 flex items-center text-sm justify-end">
                                {item.purchasePrice !== undefined ? (
                                  item.purchasePrice.toLocaleString("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                  })
                                ) : (
                                  <span className="text-muted-foreground">
                                    ₱0.00
                                  </span>
                                )}
                              </div>

                              {/* Amount */}
                              <div className="text-right border-l border-border px-2 text-sm font-medium">
                                {item.purchasePrice && item.quantity ? (
                                  (
                                    item.purchasePrice *
                                    (editableItems[index] ?? item.quantity)
                                  ).toLocaleString("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                  })
                                ) : (
                                  <span className="text-muted-foreground">
                                    ₱0.00
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Summary Section */}
                {formData.poNumber[0] && (
                  <div className="w-full max-w-md ml-auto mt-4 bg-muted/10 rounded-md shadow-sm border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                        <tr>
                          <th className="px-4 py-2 text-left">Metric</th>
                          <th className="px-4 py-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="py-2 px-4 text-muted-foreground">
                            Total Quantity
                          </td>
                          <td className="py-2 px-4 text-right font-semibold text-foreground">
                            {(() => {
                              const matchedPO = purchaseOrders.find(
                                (po) =>
                                  po.poNumber.trim().toUpperCase() ===
                                  formData.poNumber[0]
                              );
                              if (!matchedPO || !Array.isArray(matchedPO.items))
                                return 0;

                              return matchedPO.items.reduce(
                                (sum, item, index) => {
                                  return selectedItems[index]
                                    ? sum +
                                        (editableItems[index] ??
                                          item.quantity ??
                                          0)
                                    : sum;
                                },
                                0
                              );
                            })()}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 text-primary">
                            Total Amount
                          </td>
                          <td className="py-2 px-4 text-right font-semibold text-primary">
                            {(() => {
                              const matchedPO = purchaseOrders.find(
                                (po) =>
                                  po.poNumber.trim().toUpperCase() ===
                                  formData.poNumber[0]
                              );
                              if (!matchedPO || !Array.isArray(matchedPO.items))
                                return "₱0.00";

                              const total = matchedPO.items.reduce(
                                (sum, item, index) => {
                                  return selectedItems[index]
                                    ? sum +
                                        (item.purchasePrice ?? 0) *
                                          (editableItems[index] ??
                                            item.quantity ??
                                            0)
                                    : sum;
                                },
                                0
                              );

                              return total.toLocaleString("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              });
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer Actions */}
                <DialogFooter className="pt-4 border-t">
                  <div className="flex w-full justify-end items-center">
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          resetForm();
                          setSelectedItems({});
                        }}>
                        Cancel
                      </Button>

                      <Button
                        onClick={handleCreate}
                        disabled={isDisabled}
                        className={` bg-primary text-white hover:bg-primary/90 rounded-md shadow-sm transition-colors duration-150 ${
                          isDisabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}>
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogFooter>
              </DialogPanel>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm">Filters:</Label>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="date-filter" className="text-sm">
                    Date:
                  </Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="supplier-filter" className="text-sm">
                    Supplier:
                  </Label>
                  <Select
                    value={supplierFilter}
                    onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem
                          key={supplier._id}
                          value={supplier.supplierName}>
                          {supplier.supplierName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="status-filter" className="text-sm">
                    Status:
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as string)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                ✅ {selectedIds.length} purchase order(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteMany(selectedIds)}>
                  Delete Selected
                </Button>
                <Button variant="outline" onClick={() => setSelectedIds([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all purchase orders on current page"
                    />
                  </TableHead>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Purchase Receipt No.</TableHead>
                  <TableHead>Supplier Invoice No.</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Purchase Order No.</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-48 px-4 text-muted-foreground">
                      <div className="flex h-full items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-medium tracking-wide">
                          Loading purchase receipts…
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedPurchaseReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground">
                      No purchase receipts found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPurchaseReceipts.map(
                    (receipt: PurchaseReceiptResponse) => (
                      <TableRow key={receipt._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(receipt._id)}
                            onCheckedChange={() => toggleSelectOne(receipt._id)}
                          />
                        </TableCell>
                        <TableCell>
                          {receipt.createdAt
                            ? formatDate(receipt.createdAt)
                            : "—"}
                        </TableCell>
                        <TableCell>{receipt.prNumber || "—"}</TableCell>
                        <TableCell>
                          {receipt.supplierInvoiceNum || "—"}
                        </TableCell>
                        <TableCell>{receipt.supplierName || "—"}</TableCell>
                        <TableCell>
                          {Array.isArray(receipt.poNumber)
                            ? receipt.poNumber.join(", ")
                            : "—"}
                        </TableCell>
                        <TableCell>{receipt.remarks || "—"}</TableCell>

                        <TableCell>
                          ₱
                          {receipt.amount?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          {receipt.status === "OPEN" ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={postingReceipt === receipt.prNumber} // ⛔ prevent opening if already posting
                                  className="text-blue-700 border-blue-300 hover:bg-blue-50">
                                  {postingReceipt === receipt.prNumber ? (
                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="animate-spin h-4 w-4"
                                        viewBox="0 0 24 24">
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                          fill="none"
                                        />
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
                                        />
                                      </svg>
                                      Posting…
                                    </div>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      {receipt.status}
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirm Action
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to post this receipt?
                                    This action will update the inventory and
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                  <AlertDialogCancel asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </AlertDialogCancel>

                                  <AlertDialogAction asChild>
                                    <Button
                                      variant="default"
                                      disabled={
                                        postingReceipt === receipt.prNumber
                                      } // ⛔ disable while loading
                                      onClick={() =>
                                        handlePostReceipt(receipt)
                                      }>
                                      {postingReceipt === receipt.prNumber ? (
                                        <div className="flex items-center gap-2">
                                          <svg
                                            className="animate-spin h-4 w-4"
                                            viewBox="0 0 24 24">
                                            <circle
                                              className="opacity-25"
                                              cx="12"
                                              cy="12"
                                              r="10"
                                              stroke="currentColor"
                                              strokeWidth="4"
                                              fill="none"
                                            />
                                            <path
                                              className="opacity-75"
                                              fill="currentColor"
                                              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
                                            />
                                          </svg>
                                          Posting…
                                        </div>
                                      ) : (
                                        "Confirm"
                                      )}
                                    </Button>
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <span className="text-green-700 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {receipt.status}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(receipt)}
                              title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* ✅ Only show Edit if PR is not posted */}
                            {receipt.status === "OPEN" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(receipt)}
                                title="Edit Receipt">
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                {receipt.status !== "RECEIVED" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Delete Receipt"
                                    className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Purchase Receipt
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete PR&nbsp;
                                    <span className="font-semibold">
                                      {receipt.prNumber}
                                    </span>
                                    ? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(receipt._id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Export as PDF"
                              aria-label={`Export PR ${receipt.prNumber} to PDF`}
                              onClick={() =>
                                handleExportPDF(receipt.items, {
                                  prNumber: receipt.prNumber,
                                  poNumber: receipt.poNumber.map((po) =>
                                    po.trim().toUpperCase()
                                  ),

                                  supplierInvoiceNum:
                                    receipt.supplierInvoiceNum,
                                  supplierName: receipt.supplierName,
                                  warehouse: receipt.warehouse,
                                  status: receipt.status,
                                  remarks: receipt.remarks,
                                  createdAt: receipt.createdAt,
                                })
                              }>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mt-4">
            {/* Rows per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Purchase orders per page:
              </span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(val) => {
                  setRowsPerPage(Number(val));
                  setCurrentPage(1); // reset to first page
                }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogPanel className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Edit Purchase Receipts
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the receipt details. Fields marked with{" "}
              <span className="text-red-500">* </span>
              are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-6 py-6">
              {/* PR Number & Receipt Date */}
              <div className="flex flex-row flex-wrap gap-4">
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="create-pr-number">PR Number</Label>
                  <Input
                    id="create-pr-number"
                    value="Auto-generated"
                    readOnly
                    disabled
                    placeholder="Auto-generated"
                    className="text-sm uppercase bg-muted/50 cursor-not-allowed rounded-md border px-3 py-2"
                  />
                </div>

                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="receipt-date">Receipt Date</Label>
                  <Input
                    id="receipt-date"
                    value={new Date().toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    readOnly
                    disabled
                    className="text-sm bg-muted/50 cursor-not-allowed rounded-md border px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex flex-row flex-wrap gap-4">
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <div className="flex flex-col flex-1 min-w-[200px]">
                    <Label htmlFor="po-search">
                      PO Number <span className="text-red-500">* </span>
                    </Label>

                    <div className="relative">
                      <Input
                        id="po-search"
                        type="text"
                        autoComplete="off"
                        value={formData.poNumber[0] || ""}
                        onClick={() => setShowSuggestions(true)}
                        onBlur={() =>
                          setTimeout(() => setShowSuggestions(false), 200)
                        } // optional delay for click
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().trim();

                          setFormData((prev) => ({
                            ...prev,
                            poNumber: value ? [value] : [],
                          }));

                          setValidationErrors((prev) => ({
                            ...prev,
                            poNumber: "",
                          }));

                          const matchedPO = purchaseOrders.find(
                            (po) => po.poNumber.trim().toUpperCase() === value
                          );

                          if (matchedPO) {
                            setFormData((prev) => ({
                              ...prev,
                              supplierName:
                                matchedPO.supplierName?.trim().toUpperCase() ||
                                "UNKNOWN",
                              warehouse:
                                matchedPO.warehouse?.trim().toUpperCase() ||
                                "UNKNOWN",
                              amount: matchedPO.total || 0,
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              supplierName: "",
                              warehouse: "",
                              amount: 0,
                            }));
                          }
                        }}
                        placeholder="Enter PO number"
                      />

                      {/* Magnifying Glass Icon */}
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                          />
                        </svg>
                      </div>

                      {/* Live Suggestions */}
                      {showSuggestions && (
                        <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                          {(formData.poNumber[0]
                            ? purchaseOrders.filter(
                                (po) =>
                                  po.status !== "COMPLETED" &&
                                  po.poNumber
                                    .toUpperCase()
                                    .includes(
                                      formData.poNumber[0].toUpperCase()
                                    )
                              )
                            : purchaseOrders.filter(
                                (po) => po.status !== "COMPLETED"
                              )
                          ).map((po) => {
                            const normalized = po.poNumber.trim().toUpperCase();
                            return (
                              <li
                                key={po._id || normalized}
                                className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    poNumber: [normalized],
                                    supplierName:
                                      po.supplierName?.trim().toUpperCase() ||
                                      "UNKNOWN",
                                    warehouse:
                                      po.warehouse?.trim().toUpperCase() ||
                                      "UNKNOWN",
                                    amount: po.total || 0,
                                  }));
                                  setShowSuggestions(false);
                                }}>
                                {po.poNumber}
                              </li>
                            );
                          })}
                          {(formData.poNumber[0]
                            ? purchaseOrders.filter(
                                (po) =>
                                  po.status !== "COMPLETED" &&
                                  po.poNumber
                                    .toUpperCase()
                                    .includes(
                                      formData.poNumber[0].toUpperCase()
                                    )
                              ).length === 0
                            : purchaseOrders.filter(
                                (po) => po.status !== "COMPLETED"
                              ).length === 0) && (
                            <li className="px-3 py-2 text-muted-foreground">
                              No matching PO found
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="create-supplier-invoice-num">
                    Supplier Invoice Number
                  </Label>
                  <Input
                    id="create-supplier-invoice-num"
                    value={formData.supplierInvoiceNum}
                    readOnly
                    placeholder="e.g. INV-2025-001"
                    className={`text-sm uppercase rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition ${
                      validationErrors.supplierInvoiceNum
                        ? "border-destructive ring-destructive/30"
                        : "border-input"
                    }`}
                  />

                  {validationErrors.supplierInvoiceNum && (
                    <p className="text-sm text-destructive mt-1">
                      {validationErrors.supplierInvoiceNum}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-row flex-wrap gap-4">
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="supplier-display">Supplier</Label>
                  <Input
                    id="supplier-display"
                    type="text"
                    value={formData.supplierName || ""}
                    readOnly
                    className="text-sm uppercase w-full bg-muted cursor-not-allowed"
                  />
                </div>

                {/* Warehouse Display */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="warehouse-display">Warehouse</Label>
                  <Input
                    id="warehouse-display"
                    type="text"
                    value={formData.warehouse || ""}
                    readOnly
                    className="text-sm uppercase w-full bg-muted cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex flex-col flex-1 min-w-[200px]">
                <Label htmlFor="create-remarks">Remarks</Label>
                <Textarea
                  id="create-remarks"
                  value={formData.remarks}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    setFormData((prev) => ({
                      ...prev,
                      remarks: value,
                    }));
                    setValidationErrors((prev) => ({
                      ...prev,
                      remarks: "",
                    }));
                  }}
                  placeholder="add remarks"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {formData.poNumber[0] && (
            <div className="mt-4 border rounded-md overflow-hidden">
              <div className="overflow-auto max-h-96">
                {/* Header */}
                <div className="grid w-full grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b  py-2 bg-primary text-primary-foreground sticky top-0 z-10">
                  {/* Bulk Checkbox */}
                  <div className="flex items-center justify-end min-w-[40px]">
                    <input
                      type="checkbox"
                      checked={
                        Object.keys(selectedItems).length > 0 &&
                        Object.values(selectedItems).every(Boolean)
                      }
                      onChange={(e) => {
                        const checked = (e.target as HTMLInputElement).checked;
                        const matchedPO = purchaseOrders.find(
                          (po) =>
                            po.poNumber.trim().toUpperCase() ===
                            formData.poNumber[0]
                        );
                        if (!matchedPO || !Array.isArray(matchedPO.items))
                          return;

                        const allSelected = matchedPO.items.reduce(
                          (acc, item, index) => {
                            if (item.quantity > 0) acc[index] = checked;
                            return acc;
                          },
                          {} as Record<number, boolean>
                        );

                        setSelectedItems(allSelected);
                      }}
                      className="form-checkbox h-4 w-4 text-primary focus:ring-2 focus:ring-primary/50 hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Column Headers */}
                  {[
                    "Item Code",
                    "Item Name",
                    "Qty",
                    "UOM",
                    "Purchase Price",
                    "Amount",
                  ].map((label) => (
                    <div
                      key={label}
                      className={`text-xs font-semibold uppercase px-2 ${
                        ["Qty", "Purchase Price", "Amount"].includes(label)
                          ? "text-right"
                          : "text-left"
                      }`}>
                      {label}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {(() => {
                  const matchedPO = purchaseOrders.find(
                    (po) =>
                      po.poNumber.trim().toUpperCase() === formData.poNumber[0]
                  );
                  if (!matchedPO || !Array.isArray(matchedPO.items))
                    return null;

                  return matchedPO.items.map((item, index) => {
                    const isZero = item.quantity === 0;
                    const isSelected = selectedItems[index] || false;
                    const editableQty = editableItems[index] ?? item.quantity;
                    const clampedQty = Math.max(
                      1,
                      Math.min(editableQty, item.quantity)
                    );
                    const amount = item.purchasePrice * clampedQty;

                    return (
                      <div
                        key={index}
                        className={`grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] border-t border-border text-sm px-3 py-2 items-center ${
                          isZero
                            ? "bg-green-50 text-green-700 animate-fade-in"
                            : isSelected
                            ? "bg-accent/10 border-accent"
                            : "hover:bg-muted/10"
                        }`}>
                        {/* Checkbox or Posted Badge */}
                        <div className="flex items-center justify-center px-2 min-w-[40px]">
                          {isZero ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="w-4 h-4 animate-bounce" />
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  [index]: e.target.checked,
                                }));
                              }}
                              className="form-checkbox h-4 w-4 text-primary focus:ring-2 focus:ring-primary/50 hover:scale-105 transition-transform"
                            />
                          )}
                        </div>

                        {/* Item Code */}
                        <div className="flex items-center uppercase ">
                          {item.itemCode || "-"}
                        </div>

                        {/* Item Name */}
                        <div className="border-l border-border px-2 flex items-center uppercase ">
                          {item.itemName || "-"}
                        </div>

                        {/* Quantity Input */}
                        <div>
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={clampedQty}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              const newQty = Math.max(
                                1,
                                Math.min(raw, item.quantity)
                              );
                              setEditableItems((prev) => ({
                                ...prev,
                                [index]: newQty,
                              }));
                            }}
                            disabled={isZero}
                            className={`w-full px-2 py-1 border border-border border-l border-b-0 border-r-0 bg-white focus:outline-none focus:ring-1 focus:ring-primary text-end ${
                              isZero
                                ? "bg-green-50 text-green-700 cursor-not-allowed"
                                : "bg-background"
                            }`}
                            inputMode="numeric"
                          />
                        </div>

                        {/* Unit Type */}
                        <div className="border-l border-border px-2 flex items-center uppercase ">
                          {item.unitType || "-"}
                        </div>

                        {/* Purchase Price */}
                        <div className="border-l border-border px-2 flex items-center uppercase justify-end">
                          {item.purchasePrice !== undefined ? (
                            item.purchasePrice.toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })
                          ) : (
                            <span className="text-muted-foreground">₱0.00</span>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-right border-l border-border px-2 ">
                          {item.purchasePrice && item.quantity ? (
                            amount.toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })
                          ) : (
                            <span className="text-muted-foreground">₱0.00</span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {Array.isArray(formData.items) && formData.items.length > 0 && (
            <div className="w-full max-w-md ml-auto my-4 bg-muted/10 rounded-md shadow-sm border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                  <tr>
                    <th className="px-4 py-2 text-left">Metric</th>
                    <th className="px-4 py-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 px-4 text-muted-foreground">
                      Total Quantity
                    </td>
                    <td className="py-2 px-4 text-right font-semibold text-foreground">
                      {formData.items.reduce((sum, item, index) => {
                        return selectedItems[index]
                          ? sum + (editableItems[index] ?? item.quantity ?? 0)
                          : sum;
                      }, 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-primary">Total Amount</td>
                    <td className="py-2 px-4 text-right font-semibold text-primary">
                      {formData.items
                        .reduce((sum, item, index) => {
                          return selectedItems[index]
                            ? sum +
                                (item.purchasePrice ?? 0) *
                                  (editableItems[index] ?? item.quantity ?? 0)
                            : sum;
                        }, 0)
                        .toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Actions */}
          <DialogFooter className="pt-4 border-t">
            <div className="flex w-full justify-end items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingReceipt(null);
                  resetForm();
                }}>
                Cancel
              </Button>

              <Button
                onClick={handleUpdate}
                disabled={
                  !formData.items?.length ||
                  formData.items.every((item) => !item.itemName?.trim())
                }
                className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Update Receipt">
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogPanel>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl p-6 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent bg-white shadow-xl border border-border">
          <DialogHeader>
            <DialogTitle className="sr-only">Purchase Receipt</DialogTitle>
          </DialogHeader>

          {/* 🧾 Receipt Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold text-primary tracking-wide">
                Purchase Receipt
              </h2>

              <p className="text-sm text-muted-foreground">
                PR Number:
                <span className=" text-foreground font-semibold">
                  {viewingReceipt?.prNumber || "—"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Supplier Invoice #:
                <span className="text-foreground font-semibold">
                  {viewingReceipt?.supplierInvoiceNum || "—"}
                </span>
              </p>
            </div>
            <div className="text-sm text-right text-muted-foreground">
              <p>
                Transaction Date:{" "}
                <span className="text-foreground">
                  {viewingReceipt?.createdAt
                    ? new Date(viewingReceipt.createdAt).toLocaleDateString(
                        "en-PH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : "—"}
                </span>
              </p>
              <p>
                Status:{" "}
                <span
                  className={`font-semibold ${
                    viewingReceipt?.status === "RECEIVED"
                      ? "text-green-600"
                      : viewingReceipt?.status === "OPEN"
                      ? "text-blue-600"
                      : "text-muted-foreground"
                  }`}>
                  {viewingReceipt?.status || "—"}
                </span>
              </p>
            </div>
          </div>

          {/* 🏢 Supplier & Warehouse Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium text-muted-foreground">
                  Supplier:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {viewingReceipt?.supplierName || "—"}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Warehouse Name:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {viewingReceipt?.warehouse || "—"}
                </span>
              </p>
            </div>

            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium text-muted-foreground">
                  Remarks:
                </span>{" "}
                <span
                  className="text-foreground font-semibold truncate max-w-[60%]"
                  title={viewingReceipt?.remarks}>
                  {viewingReceipt?.remarks?.trim() || (
                    <em className="text-muted-foreground">—</em>
                  )}
                </span>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full text-sm border border-border rounded-md overflow-hidden">
              <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-left">UOM</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {viewingReceipt?.items?.map((item, index) => {
                  const isZero = item.quantity === 0;
                  const amount = item.quantity * item.purchasePrice || 0;

                  return (
                    <tr
                      key={index}
                      className={`border-t transition-colors duration-150 ${
                        isZero
                          ? "bg-green-50 text-green-700 animate-fade-in"
                          : "even:bg-muted/5 hover:bg-accent/20 hover:ring-1 hover:ring-accent/50"
                      }`}>
                      <td className="px-4 py-2">
                        {item.itemName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.quantity ?? (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {item.unitType || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.purchasePrice !== undefined ? (
                          item.purchasePrice.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {amount.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="w-full max-w-md ml-auto mt-2 bg-muted/10 rounded-md shadow-sm border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Metric</th>
                  <th className="px-4 py-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-2 px-4 text-muted-foreground">
                    Total Quantity
                  </td>
                  <td className="py-2 px-4 text-right font-semibold text-foreground">
                    {(viewingReceipt?.items ?? []).reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4  text-primary">Total Amount</td>
                  <td className="py-2 px-4 text-right font-semibold text-primary">
                    {(viewingReceipt?.items ?? [])
                      .reduce(
                        (sum, item) => sum + item.quantity * item.purchasePrice,
                        0
                      )
                      .toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
