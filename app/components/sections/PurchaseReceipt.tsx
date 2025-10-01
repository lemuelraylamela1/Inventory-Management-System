"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Eye,
  MoreVertical,
  FileText,
  Filter,
  CalendarDays,
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
  DialogContent,
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

      const matchesDate =
        !dateFilter || receipt.createdAt?.startsWith(dateFilter);

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
    poNumber: string[]; // or string if it's a single PO
    referenceNumber?: string;
    status: string;
    locked?: boolean;
  };

  const handlePostReceipt = async (receipt: ReceiptSummary) => {
    if (receipt.status === "RECEIVED" || receipt.locked) {
      toast.info("This receipt is already finalized.");
      return;
    }

    try {
      const res = await fetch("/api/purchase-receipts/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prNumber: receipt.prNumber,
          poNumber: receipt.poNumber,
          referenceNumber: receipt.referenceNumber,
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

    const normalizedItems = Array.isArray(formData.items)
      ? formData.items.map((item) => {
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
      const updatedReceipt: PurchaseReceiptType = await res.json();
      console.log("✅ Parsed updated receipt:", updatedReceipt);

      if (!res.ok) {
        console.error("❌ Update failed:", res.status, updatedReceipt);
        alert(`Update failed: ${updatedReceipt}`);
        return;
      }

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
    try {
      const res = await fetch("/api/purchase-receipts", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch purchase receipts");

      const data = await res.json();
      const purchaseReceipts = Array.isArray(data) ? data : [];
      console.log("Fetched receipts:", purchaseReceipts);

      setPurchaseReceipts(
        Array.isArray(purchaseReceipts) ? purchaseReceipts : []
      );
    } catch (error) {
      console.error("Error loading purchase receipts:", error);
      setPurchaseReceipts([]);
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

  // const enrichedPOs = purchaseOrders.map((po) => {
  //   const enrichedItems = po.items.map((poItem) => {
  //     const matchedItem = items.find(
  //       (item) =>
  //         item.itemName?.trim().toUpperCase() ===
  //         poItem.itemName?.trim().toUpperCase()
  //     );

  //     return {
  //       ...poItem,
  //       itemCode: matchedItem?.itemCode || "",
  //       unitType: matchedItem?.unitType || "",
  //       purchasePrice: matchedItem?.purchasePrice || poItem.purchasePrice || 0,
  //       amount:
  //         (matchedItem?.purchasePrice ?? poItem.purchasePrice ?? 0) *
  //         (poItem.quantity ?? 0),
  //     };
  //   });

  //   return {
  //     ...po,
  //     items: enrichedItems,
  //   };
  // });

  // const handleExportPDF = (
  //   items: ItemType[],
  //   poMeta: {
  //     poNumber: string;
  //     referenceNumber: string;
  //     supplierName: string;
  //     warehouse: string;
  //     status: string;
  //     remarks?: string;
  //   }
  // ) => {
  //   if (!items || items.length === 0) {
  //     toast.error("No items to export");
  //     return;
  //   }

  //   const doc = new jsPDF();

  //   const title = "Purchase Order Summary";
  //   const summaryLines = [
  //     `PO Number: ${poMeta.poNumber}`,
  //     `Reference No: ${poMeta.referenceNumber}`,
  //     `Supplier: ${poMeta.supplierName}`,
  //     `Warehouse: ${poMeta.warehouse}`,
  //     `Status: ${poMeta.status}`,
  //     `Remarks: ${poMeta.remarks || "—"}`,
  //   ];

  //   doc.setFontSize(16);
  //   doc.text(title, 14, 20);

  //   doc.setFontSize(10);
  //   summaryLines.forEach((line, i) => {
  //     doc.text(line, 14, 28 + i * 6);
  //   });

  //   const tableStartY = 28 + summaryLines.length * 6 + 10;

  //   const tableHead = [["Item Code", "Item Name", "UOM", "Purchase Price"]];
  //   const tableBody = items.map((item) => [
  //     item.itemCode,
  //     item.itemName,
  //     item.unitType,
  //     `₱${item.purchasePrice.toFixed(2)}`,
  //   ]);

  //   autoTable(doc, {
  //     startY: tableStartY,
  //     head: tableHead,
  //     body: tableBody,
  //     styles: {
  //       fontSize: 9,
  //       halign: "center",
  //       cellPadding: 4,
  //     },
  //     headStyles: {
  //       fillColor: [41, 98, 255],
  //       textColor: 255,
  //       fontStyle: "bold",
  //     },
  //     alternateRowStyles: {
  //       fillColor: [245, 245, 245],
  //     },
  //   });

  //   const filename = `PO-${poMeta.poNumber}.pdf`;
  //   doc.save(filename);
  //   toast.success("PDF exported successfully");
  // };

  const handleExportPDF = (
    items: ReceiptItem[],
    receiptMeta: {
      prNumber: string;
      supplierInvoiceNum?: string;
      supplierName: string;
      warehouse: string;
      status: string;
      remarks?: string;
      poNumbers: string[];
    }
  ) => {
    if (!items || items.length === 0) {
      toast.error("No items to export");
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("NCM Marketing Corporation", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Freeman Compound, #10 Nardruta St., cor. 4th Ave., Caloocan City",
      14,
      26
    );
    doc.text(`Date: ${new Date().toLocaleDateString("en-PH")}`, 160, 26);

    // Receipt Metadata
    doc.text(`PR #: ${receiptMeta.prNumber}`, 14, 34);
    doc.text(`PO #: ${receiptMeta.poNumbers.join(", ")}`, 80, 34);
    doc.text(`Warehouse: ${receiptMeta.warehouse}`, 140, 34);
    doc.text(`Supplier: ${receiptMeta.supplierName}`, 14, 40);
    doc.text(`Invoice #: ${receiptMeta.supplierInvoiceNum || "—"}`, 80, 40);
    doc.text(`Status: ${receiptMeta.status}`, 140, 40);
    doc.text(`Remarks: ${receiptMeta.remarks || "—"}`, 14, 46);

    // Table Header
    const tableStartY = 52;
    const tableHead = [["Qty", "Unit", "Description", "Unit Price", "Amount"]];
    const tableBody = items.map((item) => [
      item.quantity,
      item.unitType,
      item.itemName,
      `₱${item.purchasePrice.toFixed(2)}`,
      `₱${(item.quantity * item.purchasePrice).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: tableHead,
      body: tableBody,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        3: { halign: "right" },
        4: { halign: "right" },
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Totals
    const finalY = doc.lastAutoTable?.finalY ?? tableStartY + 10;
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );

    doc.setFontSize(10);
    doc.text(`VATable Sales: ₱${totalAmount.toFixed(2)}`, 140, finalY + 10);
    doc.text(`VAT-Exempt Sales: ₱0.00`, 140, finalY + 16);
    doc.text(`Zero-Rated Sales: ₱0.00`, 140, finalY + 22);
    doc.text(`Total Sales: ₱${totalAmount.toFixed(2)}`, 140, finalY + 28);
    doc.text(`Less: VAT: ₱0.00`, 140, finalY + 34);
    doc.text(`Total Discount: ₱0.00`, 140, finalY + 40);
    doc.setFont("helvetica", "bold");
    doc.text(`Amount Due: ₱${totalAmount.toFixed(2)}`, 140, finalY + 46);

    // Signature Block
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Representative:", 14, finalY + 60);
    doc.line(60, finalY + 60, 120, finalY + 60);
    doc.text("Date Received:", 140, finalY + 60);
    doc.line(170, finalY + 60, 195, finalY + 60);

    // Save
    const filename = `PR-${receiptMeta.prNumber}.pdf`;
    doc.save(filename);
    toast.success("PDF exported successfully");
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
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    Create Purchase Receipts
                  </DialogTitle>
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
                        <Label htmlFor="supplier-search">Supplier</Label>

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
                          placeholder="Auto-generated e.g. SI001"
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
                        <Label htmlFor="po-search">PO Number</Label>

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
                  <div className="mt-4 border rounded-md overflow-hidden">
                    <div className="overflow-auto max-h-96">
                      {/* Header */}
                      <div className="grid w-full grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b px-0 py-2 bg-primary text-primary-foreground sticky top-0 z-10">
                        <div className="flex items-center justify-end min-w-[40px]">
                          <input
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
                        <div className="text-xs font-semibold uppercase text-left">
                          Item Code
                        </div>
                        <div className="text-xs font-semibold uppercase text-left">
                          Item Name
                        </div>
                        <div className="text-xs font-semibold uppercase text-left">
                          Qty
                        </div>
                        <div className="text-xs font-semibold uppercase text-left">
                          UOM
                        </div>
                        <div className="text-xs font-semibold uppercase text-left">
                          Purchase Price
                        </div>
                        <div className="text-xs font-semibold uppercase text-left">
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
                              className={`grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] border-t border-border text-sm px-3 py-2 items-center ${
                                isZero
                                  ? "bg-green-50 text-green-700 animate-fade-in"
                                  : selectedItems[index]
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
                              <div className="flex items-center uppercase text-sm font-medium">
                                {item.itemCode || "-"}
                              </div>

                              {/* Item Name */}
                              <div className="uppercase border-l border-border px-2 flex items-center text-sm font-medium">
                                {item.itemName || "-"}
                              </div>

                              {/* Quantity Input */}
                              <div className="uppercase border-l border-border px-2 flex items-center text-sm font-medium">
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
                                  className={`w-full px-2 py-1 border border-border rounded-md text-right focus:outline-none focus:ring-2 focus:ring-primary ${
                                    isZero
                                      ? "bg-green-50 text-green-700 cursor-not-allowed"
                                      : "bg-background"
                                  }`}
                                  inputMode="numeric"
                                />
                              </div>

                              {/* Unit Type */}
                              <div className="uppercase border-l border-border px-2 flex items-center text-sm font-medium">
                                {item.unitType || "-"}
                              </div>

                              {/* Purchase Price */}
                              <div className="uppercase border-l border-border px-2 flex items-center text-sm font-medium">
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

                {/* Footer Actions */}
                <DialogFooter className="pt-4 border-t">
                  <div className="flex w-full justify-end items-center">
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="ghost"
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
                        className={`mt-4 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm transition-colors duration-150 ${
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
                {paginatedPurchaseReceipts.length === 0 ? (
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
                          <span
                            className={`inline-block text-sm font-medium px-2 py-1 rounded-full
                              ${
                                receipt.status === "OPEN"
                                  ? "bg-blue-100 text-blue-800"
                                  : receipt.status === "RECEIVED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-neutral-100 text-neutral-800"
                              }`}>
                            {receipt.status?.toUpperCase() || "—"}
                          </span>
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

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="More actions">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {/* ✅ POST Button */}
                                <DropdownMenuItem
                                  onClick={() => handlePostReceipt(receipt)}
                                  disabled={receipt.status === "RECEIVED"}
                                  className={
                                    receipt.status === "RECEIVED"
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Post Receipt
                                </DropdownMenuItem>

                                {/* Optional: Export PDF */}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleExportPDF(receipt.items, {
                                      prNumber: receipt.prNumber,
                                      supplierInvoiceNum:
                                        receipt.supplierInvoiceNum,
                                      supplierName: receipt.supplierName,
                                      warehouse: receipt.warehouse,
                                      status: receipt.status,
                                      remarks: receipt.remarks,
                                      poNumbers: receipt.poNumber, // assuming this is an array
                                    })
                                  }>
                                  <FileText className="w-4 h-4 mr-2 text-red-600" />
                                  Export as PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
          <DialogHeader>
            <DialogTitle>Edit Purchase Receipts</DialogTitle>
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
                    <Label htmlFor="po-search">PO Number</Label>

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
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({
                        ...prev,
                        supplierInvoiceNum: value,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        supplierInvoiceNum: "",
                      }));
                    }}
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
                <div className="grid w-full grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b px-0 py-2 bg-primary text-primary-foreground sticky top-0 z-10">
                  <div className="flex items-center justify-end min-w-[40px]">
                    <input
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
                      className="text-xs font-semibold uppercase text-left">
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
                        <div className="flex items-center uppercase font-medium">
                          {item.itemCode || "-"}
                        </div>

                        {/* Item Name */}
                        <div className="border-l border-border px-2 flex items-center uppercase font-medium">
                          {item.itemName || "-"}
                        </div>

                        {/* Quantity Input */}
                        <div className="border-l border-border px-2 flex items-center">
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
                            className={`w-full px-2 py-1 border border-border rounded-md text-right focus:outline-none focus:ring-2 focus:ring-primary ${
                              isZero
                                ? "bg-green-50 text-green-700 cursor-not-allowed"
                                : "bg-background"
                            }`}
                            inputMode="numeric"
                          />
                        </div>

                        {/* Unit Type */}
                        <div className="border-l border-border px-2 flex items-center uppercase font-medium">
                          {item.unitType || "-"}
                        </div>

                        {/* Purchase Price */}
                        <div className="border-l border-border px-2 flex items-center uppercase font-medium">
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
                        <div className="text-right border-l border-border px-2 font-medium">
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
                ✏️ Update
              </Button>
            </div>
          </DialogFooter>
        </DialogPanel>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl p-6 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent bg-white shadow-xl border border-border">
          <DialogHeader>
            <DialogTitle>PO Details</DialogTitle>
          </DialogHeader>

          {viewingReceipt && (
            <div className="grid gap-6 py-4">
              <Card className="p-6 rounded-xl shadow-sm border border-border">
                <h4 className="text-xl font-bold text-primary text-center mb-6 tracking-tight">
                  Purchase Receipt Info
                </h4>

                {/* Header Row */}
                <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] border-b py-3 mb-4 bg-primary text-primary-foreground rounded-t shadow-sm">
                  <div className="text-xs font-semibold uppercase text-center tracking-wide">
                    PR Number
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Supplier Invoice #
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Supplier
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Warehouse
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Status
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Remarks
                  </div>
                  <div className="text-center border-l border-border"></div>
                </div>

                {/* Data Row */}
                <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] items-center border-b py-2 text-sm">
                  <div className="text-center uppercase border-l border-border">
                    {viewingReceipt.prNumber || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingReceipt.supplierInvoiceNum || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingReceipt.supplierName || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingReceipt.warehouse || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingReceipt.status || "—"}
                  </div>
                  <div
                    className="text-center uppercase border-l border-border max-w-[160px] truncate whitespace-nowrap overflow-hidden"
                    title={viewingReceipt.remarks}>
                    {viewingReceipt.remarks || "—"}
                  </div>
                </div>

                {/* Items Header */}
                <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-0 border-b py-3 mb-2 bg-primary text-primary-foreground rounded-t shadow-sm">
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border border-border">
                    Item Code
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border border-border">
                    Item Name
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border border-border">
                    UOM
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border border-border">
                    Purchase Price
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border border-border">
                    Quantity
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border border-border">
                    Amount
                  </div>
                </div>

                {viewingReceipt.items?.map((item, index) => (
                  <div
                    key={index}
                    className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-0 py-2 text-sm">
                    <div className="text-center uppercase border-l border-border">
                      {item.itemCode || "—"}
                    </div>
                    <div className="text-center uppercase border-l border-border">
                      {item.itemName || "—"}
                    </div>
                    <div className="text-center uppercase border-l border-border">
                      {item.unitType || "—"}
                    </div>
                    <div className="text-center uppercase border-l border-border">
                      {item.purchasePrice?.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      }) || "—"}
                    </div>
                    <div className="text-center uppercase border-l border-border">
                      {item.quantity ?? 0}
                    </div>
                    <div className="text-center uppercase border-l border-border">
                      {(item.quantity * item.purchasePrice || 0).toLocaleString(
                        "en-PH",
                        {
                          style: "currency",
                          currency: "PHP",
                        }
                      )}
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="flex w-full justify-end mt-4 gap-6">
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-sm font-medium">Total Qty:</span>
                    <span className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input w-full text-right">
                      {viewingReceipt.items?.reduce(
                        (sum, item) => sum + (item.quantity || 0),
                        0
                      ) ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input w-full text-right">
                      {viewingReceipt.items
                        ?.reduce(
                          (sum, item) =>
                            sum + (item.quantity * item.purchasePrice || 0),
                          0
                        )
                        ?.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }) ?? "₱0.00"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

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
