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

import { Plus, Search, Edit, Trash2 } from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  ItemType,
  WarehouseType,
  SupplierType,
  PurchaseReturnType,
} from "./type";
import { PurchaseReturnResponse, PurchaseReceiptType } from "../sections/type";
import { ReceiptItem } from "./type";

import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { cn } from "../ui/utils";

type Props = {
  onSuccess?: () => void;
};

export default function PurchaseReturn({ onSuccess }: Props) {
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturnType[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [items, setItems] = useState<ItemType[]>([]);
  const [editingReturn, setEditingReturn] = useState<PurchaseReturnType | null>(
    null
  );
  const [viewingReturn, setViewingReturn] = useState<PurchaseReturnType | null>(
    null
  );
  const [purchaseReceipts, setPurchaseReceipts] = useState<
    PurchaseReceiptType[]
  >([]);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [showPrSuggestions, setShowPrSuggestions] = useState(false);
  const [showReasonSuggestions, setShowReasonSuggestions] = useState(false);
  const reasonOptions = [
    "Defective goods - no replacement",
    "Defective goods - for replacement",
    "Not Defective - item for Replacement (exact item)",
    "Not Defective - item for Replacement (different item)",
    "Not Defective - items Returned but not to be replaced",
  ];

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredReturns, setFilteredReturns] = useState<PurchaseReturnType[]>(
    []
  );

  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);

  // Items linked to selected PR number
  const [linkedItems, setLinkedItems] = useState<ReceiptItem[]>([]);

  // Editable item data for return mutation
  const [itemsData, setItemsData] = useState<ReceiptItem[]>([
    {
      itemCode: "",
      itemName: "",
      unitType: "",
      purchasePrice: 0,
      quantity: 1,
      amount: 0,
      receiptQty: 0, // ✅ required by ReceiptItem
      qtyLeft: 0, // ✅ required by ReceiptItem
    },
  ]);

  const [itemCatalog, setItemCatalog] = useState<ItemType[]>([]);

  const descriptionMap = useMemo(() => {
    const map: Record<string, string> = {};
    itemCatalog.forEach((item) => {
      const key = item.itemName.trim().toUpperCase();
      map[key] = item.description?.trim().toUpperCase() || "NO DESCRIPTION";
    });
    return map;
  }, [itemCatalog]);

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
    console.log("Fetching items...");

    fetch("/api/items")
      .then((res) => res.json())
      .then((response) => {
        console.log("Raw response:", response);

        const data = Array.isArray(response?.items) ? response.items : [];
        console.log("Parsed items:", data);

        setItems(data);
      })
      .catch((err) => console.error("Failed to fetch items", err));
  }, []);

  const router = useRouter();

  // const enrichedItems: ReceiptItem[] = (receipt.items || []).map((item) => {
  //   const normalizedQty = Number(item.quantity) || 0;
  //   const normalizedPrice = Number(item.purchasePrice) || 0;

  //   return {
  //     itemCode: item.itemCode?.trim().toUpperCase() || "",
  //     itemName: item.itemName?.trim().toUpperCase() || "",
  //     unitType: item.unitType?.trim().toUpperCase() || "",
  //     purchasePrice: normalizedPrice,
  //     quantity: 0, // default return quantity
  //     amount: 0, // will be computed on mutation
  //     receiptQty: normalizedQty,
  //     qtyLeft: normalizedQty, // initially same as receiptQty
  //   };
  // });

  const [formData, setFormData] = useState<
    Omit<PurchaseReturnType, "_id" | "createdAt" | "updatedAt">
  >({
    returnNumber: "", // backend-generated, but useful for preview
    prNumber: "", // links to original receipt
    supplierName: "", // derived from receipt
    warehouse: "",
    reason: "", // required for audit
    notes: "", // optional
    items: [], // ReceiptItem[] — linked from PR
    status: "RETURNED", // default lifecycle state
    receiptQty: 0, // total quantity received
    qtyLeft: 0, // remaining quantity after return
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<
      keyof Omit<
        PurchaseReturnType,
        "_id" | "createdAt" | "updatedAt" | "items"
      >,
      string
    >
  >({
    returnNumber: "", // optional, but useful for preview
    prNumber: "", // required for linkage
    supplierName: "", // derived from receipt, but still validate
    reason: "", // required for audit
    notes: "", // optional
    status: "", // required lifecycle state
    receiptQty: "", // must be ≥ 0
    qtyLeft: "", // must be ≤ receiptQty
    warehouse: "", // ✅ now included to match the expected type
  });

  // Filter and paginate data
  const filteredPurchaseReturns = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return purchaseReturns.filter((ret) => {
      const matchesSearch =
        !query ||
        ret.returnNumber?.toLowerCase().includes(query) ||
        ret.prNumber?.toLowerCase().includes(query);

      const matchesDate = !dateFilter || ret.createdAt?.startsWith(dateFilter);

      const matchesSupplier =
        supplierFilter === "all" || ret.supplierName === supplierFilter;

      // Optional: if you add status to returns later
      const matchesStatus =
        statusFilter === "all" || ret.status?.toLowerCase() === statusFilter;

      return matchesSearch && matchesDate && matchesSupplier && matchesStatus;
    });
  }, [purchaseReturns, searchTerm, dateFilter, supplierFilter, statusFilter]);

  const totalPages = Math.ceil(filteredPurchaseReturns.length / rowsPerPage);

  const paginatedPurchaseReturns: PurchaseReturnType[] =
    filteredPurchaseReturns.slice(
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
    paginatedPurchaseReturns.length > 0 &&
    selectedIds.length === paginatedPurchaseReturns.length;

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Validation functions
  const validateForm = (isEdit = false) => {
    const errors: Record<
      keyof Omit<
        PurchaseReturnType,
        "_id" | "createdAt" | "updatedAt" | "items"
      >,
      string
    > = {
      returnNumber: "", // optional, but useful for preview
      prNumber: "", // required
      supplierName: "", // derived, but validate
      reason: "", // required
      notes: "", // optional
      status: "", // required lifecycle state
      receiptQty: "", // must be ≥ 0
      qtyLeft: "", // must be ≤ receiptQty
      warehouse: "", // required for logistics traceability
    };

    // Required: prNumber
    if (!formData.prNumber.trim()) {
      errors.prNumber = "PR Number is required";
    }

    // Required: supplierName
    if (!formData.supplierName.trim()) {
      errors.supplierName = "Supplier Name is required";
    }

    // Required: reason
    if (!formData.reason.trim()) {
      errors.reason = "Reason for return is required";
    }

    // Required: status
    if (!formData.status.trim()) {
      errors.status = "Status is required";
    }

    // Required: warehouse
    if (!formData.warehouse?.trim()) {
      errors.warehouse = "Warehouse is required";
    }

    // Validate: receiptQty
    if (Number(formData.receiptQty) < 0) {
      errors.receiptQty = "Receipt quantity must be zero or greater";
    }

    // Validate: qtyLeft
    if (Number(formData.qtyLeft) < 0) {
      errors.qtyLeft = "Remaining quantity must be zero or greater";
    } else if (Number(formData.qtyLeft) > Number(formData.receiptQty)) {
      errors.qtyLeft = "Remaining quantity cannot exceed receipt quantity";
    }

    // Validate items[]
    const itemErrors = formData.items.map((item, index) => {
      const itemError: Record<string, string> = {};

      if (!item.itemName?.trim()) {
        itemError.itemName = "Item name is required";
      }

      // if (Number(item.quantity) <= 0) {
      //   itemError.quantity = "Quantity must be greater than 0";
      // }

      if (Number(item.purchasePrice) < 0) {
        itemError.purchasePrice = "Price must be zero or greater";
      }

      return itemError;
    });

    const hasItemErrors = itemErrors.some((err) =>
      Object.values(err).some((msg) => msg !== "")
    );

    // Optionally store itemErrors in state
    // setItemValidationErrors(itemErrors);

    setValidationErrors(errors);

    return (
      !Object.values(errors).some((error) => error !== "") && !hasItemErrors
    );
  };

  // Compute amount and balance directly before submission
  useEffect(() => {
    const { total, totalQuantity } = itemsData.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.purchasePrice) || 0;

        acc.total += quantity * price;
        acc.totalQuantity += quantity;

        return acc;
      },
      { total: 0, totalQuantity: 0 }
    );

    setFormData((prev) => ({
      ...prev,
      total,
      totalQuantity,
    }));
  }, [itemsData]);

  // const formattedTotal = new Intl.NumberFormat("en-PH", {
  //   style: "currency",
  //   currency: "PHP",
  // }).format(Number(formData.total ?? 0));

  const handleCreate = async () => {
    if (!validateForm()) return;

    const normalizedItems = formData.items
      .map((item) => {
        const quantity = Number(item.quantity) || 0;
        const purchasePrice = Number(item.purchasePrice) || 0;
        const receiptQty = Number(item.receiptQty) || 0;

        return {
          itemCode: (item.itemCode ?? "").trim().toUpperCase(),
          itemName: (item.itemName ?? "").trim().toUpperCase() || "UNNAMED",
          unitType: (item.unitType ?? "").trim().toUpperCase(),
          purchasePrice,
          quantity,
          amount: quantity * purchasePrice,
          receiptQty,
          qtyLeft: Math.max(receiptQty - quantity, 0),
          selected: !!item.selected, // ✅ explicitly include selection state
        };
      })
      .filter(
        (item) =>
          item.selected === true &&
          item.quantity >= 1 &&
          item.quantity <= item.receiptQty
      );

    if (normalizedItems.length === 0) {
      alert("Please select at least one item with a valid quantity.");
      return;
    }

    const receiptQty = normalizedItems.reduce(
      (sum, item) => sum + item.receiptQty,
      0
    );
    const qtyLeft = normalizedItems.reduce(
      (sum, item) => sum + item.qtyLeft,
      0
    );

    const payload = {
      prNumber: formData.prNumber.trim().toUpperCase(),
      supplierName: formData.supplierName.trim().toUpperCase(),
      warehouse: formData.warehouse?.trim().toUpperCase() || "UNKNOWN",
      reason: formData.reason.trim(),
      notes: formData.notes?.trim() || "",
      status: formData.status || "RETURNED",
      receiptQty,
      qtyLeft,
      items: normalizedItems,
    };

    console.log("📦 Creating purchase return with payload:", payload);

    try {
      const res = await fetch("/api/purchase-returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let result;
      try {
        result = await res.json();
      } catch (err) {
        console.error("❌ Failed to parse server response:", err);
        alert("Server returned an invalid response. Please try again.");
        return;
      }

      if (!res.ok) {
        console.error("🚫 Create failed:", result?.error || result);
        alert(
          result?.error || "Failed to create purchase return. Please try again."
        );
        return;
      }

      toast.success("✅ Purchase return created successfully!");

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      setTimeout(() => {
        router.push("/");
      }, 300);
    } catch (error) {
      console.error("🌐 Network or unexpected error:", error);
      alert("Something went wrong. Please check your connection or try again.");
    }

    // Optionally close dialog here
    // setIsCreateDialogOpen(false);
  };

  const defaultValidationErrors: Record<
    keyof Omit<PurchaseReturnType, "_id" | "createdAt" | "updatedAt" | "items">,
    string
  > = {
    returnNumber: "", // optional, but useful for preview
    prNumber: "", // required for linkage
    supplierName: "", // derived from receipt, but still validate
    reason: "", // required for audit
    notes: "", // optional
    status: "", // required lifecycle state
    receiptQty: "", // must be ≥ 0
    qtyLeft: "", // must be ≤ receiptQty
    warehouse: "", // required for logistics traceability
  };

  const allowedStatuses: PurchaseReturnType["status"][] = ["RETURNED"];

  const handleEdit = (ret: PurchaseReturnType) => {
    setEditingReturn(ret);

    const normalizedFormData: Omit<
      PurchaseReturnType,
      "_id" | "createdAt" | "updatedAt"
    > = {
      returnNumber: ret.returnNumber?.trim().toUpperCase() || "",
      prNumber: ret.prNumber?.trim().toUpperCase() || "",
      supplierName: ret.supplierName?.trim().toUpperCase() || "",
      reason: ret.reason?.trim() || "",
      notes: ret.notes?.trim() || "",
      status: allowedStatuses.includes(
        ret.status?.trim() as PurchaseReturnType["status"]
      )
        ? (ret.status?.trim() as PurchaseReturnType["status"])
        : "RETURNED",
      receiptQty: Number(ret.receiptQty) || 0,
      qtyLeft: Number(ret.qtyLeft) || 0,
      warehouse: ret.warehouse?.trim().toUpperCase() || "", // ✅ added for completeness
      items: ret.items.map((item) => ({
        itemCode: item.itemCode?.trim().toUpperCase() || "",
        itemName: item.itemName?.trim().toUpperCase() || "",
        unitType: item.unitType?.trim().toUpperCase() || "",
        purchasePrice: Number(item.purchasePrice) || 0,
        quantity: Number(item.quantity) || 0,
        amount: Number(item.quantity) * Number(item.purchasePrice),
        receiptQty: Number(item.receiptQty) || 0,
        qtyLeft: Number(item.qtyLeft) || 0,
      })),
    };

    setFormData(normalizedFormData);
    setValidationErrors(defaultValidationErrors);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingReturn || !validateForm(true)) {
      console.warn("Validation failed or editingReturn is missing:", {
        editingReturn,
      });
      return;
    }

    const normalizedItems = formData.items.map((item) => ({
      itemCode: item.itemCode?.trim().toUpperCase() || "",
      itemName: item.itemName?.trim().toUpperCase() || "UNNAMED",
      unitType: item.unitType?.trim().toUpperCase() || "",
      purchasePrice: Number(item.purchasePrice),
      quantity: Number(item.quantity),
      amount: Number(item.quantity) * Number(item.purchasePrice),
    }));

    const payload = {
      prNumber: formData.prNumber.trim().toUpperCase(),
      supplierName: formData.supplierName.trim().toUpperCase(),
      reason: formData.reason.trim(),
      notes: formData.notes?.trim() || "",
      status: allowedStatuses.includes(
        formData.status?.trim().toUpperCase() as PurchaseReturnType["status"]
      )
        ? (formData.status
            ?.trim()
            .toUpperCase() as PurchaseReturnType["status"])
        : "RETURNED",
      items: normalizedItems,
    };

    console.log("🔄 Sending update payload:", payload);

    try {
      const res = await fetch(`/api/purchase-returns/${editingReturn._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📡 Response status:", res.status);
      const text = await res.text();
      console.log("📨 Raw response body:", text);

      if (!res.ok) {
        console.error("❌ Update failed:", res.status, text);
        alert(`Update failed: ${text}`);
        return;
      }

      let updatedReturn: PurchaseReturnType;
      try {
        updatedReturn = JSON.parse(text);
      } catch (parseErr) {
        console.error("⚠️ Failed to parse JSON:", parseErr, text);
        alert("Unexpected server response. Please try again.");
        return;
      }

      console.log("✅ Parsed updated return:", updatedReturn);

      setPurchaseReturns((prev) =>
        prev.map((ret) => (ret._id === updatedReturn._id ? updatedReturn : ret))
      );
    } catch (err) {
      console.error("🔥 Network or unexpected error:", err);
      alert("Something went wrong while updating the purchase return.");
      return;
    }

    // Reset form and close dialog
    setEditingReturn(null);
    setFormData({
      returnNumber: "",
      prNumber: "",
      supplierName: "",
      reason: "",
      notes: "",
      status: "RETURNED",
      items: [],
      receiptQty: 0,
      qtyLeft: 0,
    });

    setValidationErrors(defaultValidationErrors);
    setIsEditDialogOpen(false);
  };
  const handleDelete = async (returnId: string) => {
    if (!returnId || typeof returnId !== "string") {
      console.warn("Invalid return ID:", returnId);
      toast.error("Invalid purchase return ID");
      return;
    }

    try {
      const res = await fetch(`/api/purchase-returns/${returnId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to delete purchase return");
      }

      // Remove from local state
      setPurchaseReturns((prev) => prev.filter((ret) => ret._id !== returnId));

      console.log("✅ Deleted purchase return:", returnId);
      toast.success(`Purchase return #${returnId} deleted`);
    } catch (error) {
      console.error("❌ Error deleting purchase return:", error);
      toast.error(`Failed to delete return #${returnId}`);
    }
  };

  const handleView = (ret: PurchaseReturnType) => {
    setViewingReturn(ret);
    setIsViewDialogOpen(true);
  };

  const formatDate = (date: Date | string) => {
    const parsed = typeof date === "string" ? new Date(date) : date;
    return isNaN(parsed.getTime())
      ? "Invalid date"
      : parsed.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const resetForm = () => {
    setFormData({
      returnNumber: "", // optional preview
      prNumber: "", // required linkage
      supplierName: "", // derived from receipt
      reason: "", // required for audit
      notes: "", // optional
      status: "RETURNED", // default lifecycle state
      items: [], // ReceiptItem[]
      receiptQty: 0, // total quantity received
      qtyLeft: 0, // remaining quantity after return
    });

    setValidationErrors({
      returnNumber: "",
      prNumber: "",
      supplierName: "",
      reason: "",
      notes: "",
      status: "",
      receiptQty: "",
      qtyLeft: "",
      warehouse: "", // ✅ required to satisfy the type
    });
  };

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      // Select all purchase returns on current page
      const newSelections = [
        ...selectedIds,
        ...paginatedPurchaseReturns
          .filter((ret) => !selectedIds.includes(ret._id))
          .map((ret) => ret._id),
      ];
      setSelectedIds(newSelections);
    } else if (checked === false) {
      // Unselect all purchase returns on current page
      const remaining = selectedIds.filter(
        (id) => !paginatedPurchaseReturns.some((ret) => ret._id === id)
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
      toast.error("No purchase returns selected for deletion.");
      return;
    }

    try {
      // Optimistically remove from UI
      setPurchaseReturns((prev) =>
        prev.filter((ret) => !_ids.includes(ret._id))
      );

      const results = await Promise.allSettled(
        _ids.map(async (_id) => {
          const res = await fetch(`/api/purchase-returns/${_id}`, {
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
          `Some purchase returns could not be deleted (${failures.length} failed).`
        );
      } else {
        toast.success("✅ Selected purchase returns deleted.");
      }

      setSelectedIds([]);
      onSuccess?.(); // refresh list
    } catch (err) {
      console.error("❌ Bulk delete failed:", err);
      toast.error("Failed to delete selected purchase returns.");
    }
  };

  const fetchPurchaseReturns = async () => {
    try {
      const res = await fetch("/api/purchase-returns", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch purchase returns");

      const data = await res.json();
      const purchaseReturns = Array.isArray(data) ? data : data.items;

      setPurchaseReturns(Array.isArray(purchaseReturns) ? purchaseReturns : []);
    } catch (error) {
      console.error("Error loading purchase returns:", error);
      setPurchaseReturns([]);
    }
  };

  useEffect(() => {
    fetchPurchaseReturns(); // initial fetch

    const interval = setInterval(() => {
      fetchPurchaseReturns();
    }, 1000); // 1 second polling

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const params = useParams();
  const poId = params?.id as string;

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const res = await fetch("/api/purchase-receipts");
        const data = await res.json();
        setPurchaseReceipts(data);
      } catch (error) {
        console.error("Failed to fetch purchase receipts:", error);
      }
    };

    fetchReceipts();
  }, []);

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    handleCreate();
    setIsCreateDialogOpen(false);
  };

  // const handleSaveAndCreate = () => {
  //   if (!validateForm()) {
  //     return;
  //   }
  //   handleCreate();
  //   resetForm();
  //   handleRemoveAllItems();
  //   setIsCreateDialogOpen(true);
  // };

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

  useEffect(() => {
    const syncQtyLeft = async () => {
      const updatedItems = await Promise.all(
        formData.items.map(async (item) => {
          if (!item.itemCode || !formData.warehouse) return item;

          try {
            const res = await fetch(
              `/api/inventory?itemCode=${item.itemCode}&warehouse=${formData.warehouse}`
            );
            const data = await res.json();

            return {
              ...item,
              qtyLeft: res.ok ? data.qtyLeft : item.qtyLeft || 0,
            };
          } catch (err) {
            console.warn(`❌ Failed to sync qtyLeft for ${item.itemCode}`, err);
            return item;
          }
        })
      );

      setFormData((prev) => ({ ...prev, items: updatedItems }));
    };

    syncQtyLeft();
  }, [formData.warehouse]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Purchase Return</CardTitle>
              <CardDescription>Manage purchase returns</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search Return Number ..."
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
                }
                setIsCreateDialogOpen(open);
              }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Purchase Return
                </Button>
              </DialogTrigger>

              <DialogPanel className="space-y-6">
                {/* Header */}
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    Create Purchase Return
                  </DialogTitle>
                </DialogHeader>

                {/* Form Content Slot (optional placeholder) */}
                <div className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-row flex-wrap gap-4">
                      {/* Return Number */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-return-number">
                          Return Number
                        </Label>
                        <Input
                          id="create-return-number"
                          value={"Auto-generated"}
                          readOnly
                          disabled
                          placeholder="Auto-generated"
                          className="text-sm uppercase bg-muted cursor-not-allowed"
                        />
                      </div>

                      {/* Requested Date */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="requested-date">Requested Date</Label>
                        <Input
                          id="requested-date"
                          value={new Date().toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          readOnly
                          disabled
                          className="text-sm bg-muted cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap gap-4">
                      {/* Supplier Name (read-only) */}
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

                      {/* PR Number with live suggestions */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="pr-search">PR Number</Label>

                        <div className="relative">
                          <Input
                            id="pr-search"
                            type="text"
                            autoComplete="off"
                            value={formData.prNumber || ""}
                            readOnly={!formData.supplierName}
                            onClick={() => {
                              if (formData.supplierName)
                                setShowPrSuggestions(true);
                            }}
                            onBlur={() =>
                              setTimeout(() => setShowPrSuggestions(false), 200)
                            }
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase(); // ✅ no .trim()

                              setFormData((prev) => ({
                                ...prev,
                                prNumber: value,
                              }));

                              setValidationErrors((prev) => ({
                                ...prev,
                                prNumber: "",
                              }));

                              setShowPrSuggestions(true); // ✅ show suggestions while typing
                            }}
                            placeholder={
                              formData.supplierName
                                ? "Search PR for selected supplier"
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
                          {showPrSuggestions && formData.supplierName && (
                            <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                              {purchaseReceipts
                                .filter((pr) => {
                                  const supplierMatch =
                                    pr.supplierName?.trim().toUpperCase() ===
                                    formData.supplierName?.trim().toUpperCase();

                                  const prMatch = formData.prNumber
                                    ? pr.prNumber
                                        ?.trim()
                                        .toUpperCase()
                                        .includes(
                                          formData.prNumber.trim().toUpperCase()
                                        )
                                    : true;

                                  const isReceived = pr.status === "RECEIVED";

                                  return supplierMatch && prMatch && isReceived;
                                })
                                .map((pr) => {
                                  const normalized =
                                    pr.prNumber?.trim().toUpperCase() || "";
                                  return (
                                    <li
                                      key={pr._id || normalized}
                                      className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                      onClick={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          prNumber: normalized,
                                          warehouse:
                                            pr.warehouse
                                              ?.trim()
                                              .toUpperCase() || "UNKNOWN",
                                          receiptQty:
                                            pr.items?.reduce(
                                              (sum, item) =>
                                                sum +
                                                Number(item.quantity || 0),
                                              0
                                            ) || 0,
                                          qtyLeft:
                                            pr.items?.reduce(
                                              (sum, item) =>
                                                sum +
                                                Number(item.quantity || 0),
                                              0
                                            ) || 0,
                                          items: (pr.items || []).map(
                                            (item) => ({
                                              itemCode:
                                                item.itemCode
                                                  ?.trim()
                                                  .toUpperCase() || "",
                                              itemName:
                                                item.itemName
                                                  ?.trim()
                                                  .toUpperCase() || "",
                                              unitType:
                                                item.unitType
                                                  ?.trim()
                                                  .toUpperCase() || "",
                                              purchasePrice:
                                                Number(item.purchasePrice) || 0,
                                              quantity: 0, // default return quantity
                                              amount: 0,
                                              receiptQty:
                                                Number(item.quantity) || 0,
                                              qtyLeft:
                                                Number(item.quantity) || 0,
                                            })
                                          ),
                                        }));

                                        setShowPrSuggestions(false);
                                      }}>
                                      {normalized}
                                    </li>
                                  );
                                })}
                              {purchaseReceipts.filter((pr) => {
                                const supplierMatch =
                                  pr.supplierName?.trim().toUpperCase() ===
                                  formData.supplierName?.trim().toUpperCase();

                                const prMatch = formData.prNumber
                                  ? pr.prNumber
                                      ?.trim()
                                      .toUpperCase()
                                      .includes(
                                        formData.prNumber.trim().toUpperCase()
                                      )
                                  : true;

                                const isReceived = pr.status === "RECEIVED";

                                return supplierMatch && prMatch && isReceived;
                              }).length === 0 && (
                                <li className="px-3 py-2 text-muted-foreground">
                                  No matching RECEIVED PR found
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reason for Return */}
                    <div className="flex flex-col flex-1 min-w-[200px]">
                      <Label htmlFor="create-reason">Reason</Label>

                      <div className="relative">
                        <Input
                          id="create-reason"
                          type="text"
                          autoComplete="off"
                          value={formData.reason}
                          placeholder="e.g. Damaged items, wrong delivery"
                          className={`text-sm ${
                            validationErrors.reason ? "border-destructive" : ""
                          }`}
                          onClick={() => setShowReasonSuggestions(true)}
                          onBlur={() =>
                            setTimeout(
                              () => setShowReasonSuggestions(false),
                              200
                            )
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              reason: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              reason: "",
                            }));
                          }}
                        />

                        {/* Scrollable Dropdown */}
                        {showReasonSuggestions && (
                          <div className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg text-sm">
                            <ul className="max-h-48 overflow-y-auto">
                              {reasonOptions
                                .filter((option) =>
                                  option
                                    .toLowerCase()
                                    .includes(formData.reason.toLowerCase())
                                )
                                .map((option) => (
                                  <li
                                    key={option}
                                    className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        reason: option,
                                      }));
                                      setShowReasonSuggestions(false);
                                    }}>
                                    {option}
                                  </li>
                                ))}
                              {reasonOptions.filter((option) =>
                                option
                                  .toLowerCase()
                                  .includes(formData.reason.toLowerCase())
                              ).length === 0 && (
                                <li className="px-3 py-2 text-muted-foreground">
                                  No matching reason found
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      {validationErrors.reason && (
                        <p className="text-sm text-destructive">
                          {validationErrors.reason}
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col flex-[2] min-w-[300px]">
                      <Label htmlFor="create-notes">Notes</Label>
                      <Textarea
                        id="create-notes"
                        value={formData.notes}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            notes: value,
                          }));
                          setValidationErrors((prev) => ({
                            ...prev,
                            notes: "",
                          }));
                        }}
                        placeholder="Add any additional notes or comments here"
                        className={`text-sm ${
                          validationErrors.notes ? "border-destructive" : ""
                        }`}
                      />
                      {validationErrors.notes && (
                        <p className="text-sm text-destructive">
                          {validationErrors.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Header Row */}
                <div className="grid w-full grid-cols-[40px_1.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b py-2 mb-4 bg-primary text-primary-foreground rounded-t">
                  {/* Select All Checkbox */}
                  <div className="flex justify-center items-center">
                    <input
                      type="checkbox"
                      checked={formData.items.every((item) => item.selected)}
                      onChange={(e) => {
                        const updatedItems = formData.items.map((item) => ({
                          ...item,
                          selected: e.target.checked,
                        }));
                        setFormData({ ...formData, items: updatedItems });
                      }}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="text-xs font-semibold uppercase text-center">
                    Item Code
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Description
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Warehouse
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Unit Cost
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Receipt Qty
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Qty Left
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Qty
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    UOM
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Amount
                  </div>
                </div>

                {/* Item Rows */}
                {formData.items?.length > 0 ? (
                  formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="grid w-full grid-cols-[40px_1.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center border-t border-border text-sm m-0">
                      {/* Checkbox */}
                      <div className="flex justify-center items-center">
                        <input
                          type="checkbox"
                          checked={item.selected || false}
                          onChange={(e) => {
                            const updatedItems = [...formData.items];
                            updatedItems[index].selected = e.target.checked;
                            setFormData({ ...formData, items: updatedItems });
                          }}
                          className="w-4 h-4"
                        />
                      </div>

                      {/* Item Code */}
                      <input
                        type="text"
                        value={item.itemCode || ""}
                        readOnly
                        className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-center"
                      />

                      {/* Description */}
                      <input
                        type="text"
                        value={
                          descriptionMap[item.itemName.trim().toUpperCase()] ??
                          "No description"
                        }
                        readOnly
                        className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-left"
                      />

                      {/* Warehouse */}
                      <input
                        type="text"
                        value={formData.warehouse || ""}
                        readOnly
                        className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-center"
                      />

                      {/* Unit Cost */}
                      <input
                        type="text"
                        value={
                          item.purchasePrice !== undefined
                            ? item.purchasePrice.toLocaleString("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              })
                            : ""
                        }
                        readOnly
                        className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-right"
                      />

                      {/* Receipt Quantity */}
                      <input
                        type="number"
                        value={item.receiptQty || 0}
                        readOnly
                        className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-right"
                      />

                      {/* Qty Left */}
                      <input
                        type="number"
                        value={item.qtyLeft || 0}
                        readOnly
                        className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-right"
                      />

                      {/* Qty (editable if selected) */}
                      <input
                        type="number"
                        value={item.selected ? item.quantity || 0 : ""}
                        min={item.selected ? 1 : undefined}
                        max={
                          item.selected ? item.qtyLeft || undefined : undefined
                        }
                        onChange={(e) => {
                          if (!item.selected) return;

                          const inputValue = Number(e.target.value);
                          const clampedValue = Math.min(
                            Math.max(inputValue, 1),
                            item.qtyLeft || 0
                          );

                          const updatedItems = [...formData.items];
                          updatedItems[index].quantity = clampedValue;
                          setFormData({ ...formData, items: updatedItems });
                        }}
                        disabled={!item.selected}
                        className={`w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-right ${
                          !item.selected
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : ""
                        }`}
                      />

                      {/* UOM */}
                      <input
                        type="text"
                        value={item.unitType || ""}
                        readOnly
                        className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white uppercase text-center"
                      />

                      {/* Amount */}
                      <input
                        type="text"
                        value={
                          item.purchasePrice && item.quantity
                            ? (
                                item.purchasePrice * item.quantity
                              ).toLocaleString("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              })
                            : ""
                        }
                        readOnly
                        className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-right"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground py-2">
                    No items linked to this PR.
                  </div>
                )}

                {/* Footer Actions */}
                <DialogFooter className="pt-4 border-t">
                  <div className="flex w-full justify-end items-center">
                    {/* Left: Add Item */}

                    {/* Right: Cancel & Create */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          resetForm();
                        }}>
                        Cancel
                      </Button>
                      {/* <Button onClick={handleCreate}>Create</Button> */}
                      <div className="flex items-center gap-2">
                        {/* Primary Save Button */}
                        <Button
                          onClick={handleSave}
                          disabled={
                            !formData.items.length ||
                            formData.items.every(
                              (item) =>
                                !item.selected || Number(item.quantity) < 1
                            )
                          }
                          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Save">
                          💾 Save
                        </Button>

                        {/* Dropdown for More Actions */}
                        {/* <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              className="bg-muted text-foreground hover:bg-muted/80 px-3 py-2 rounded-md shadow-sm transition-colors duration-150"
                              aria-label="Open more save options">
                              ▾ More
                            </Button>
                          </DropdownMenuTrigger> */}

                        {/* <DropdownMenuContent
                            // align="end"
                            // sideOffset={8}
                            // className="w-[220px] rounded-md border border-border bg-white shadow-lg animate-in fade-in slide-in-from-top-2">
                            // <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-muted-foreground">
                            //   Additional actions
                            // </DropdownMenuLabel>

                            // <DropdownMenuSeparator />

                            {/* <DropdownMenuItem
                              onClick={handleSaveAndCreate}
                              disabled={
                                !formData.items.length ||
                                formData.items.every(
                                  (item) => !item.itemName?.trim()
                                )
                              }
                              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                              🆕 Save & New
                            </DropdownMenuItem> */}

                        {/* <DropdownMenuItem
                              onClick={handleSaveAndPreview}
                              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                              👁️ Save & Preview
                            </DropdownMenuItem> 
                          </DropdownMenuContent> */}
                        {/* </DropdownMenu> */}
                      </div>
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
                    onValueChange={(
                      value: PurchaseReturnType["status"] | "all"
                    ) => setStatusFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
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
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Purchase Return Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Purchase Receipt No.</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedPurchaseReturns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground">
                      No purchase returns found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPurchaseReturns.map(
                    (ret: PurchaseReturnResponse) => (
                      <TableRow key={ret._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(ret._id)}
                            onCheckedChange={() => toggleSelectOne(ret._id)}
                          />
                        </TableCell>
                        <TableCell>
                          {ret.createdAt ? formatDate(ret.createdAt) : "—"}
                        </TableCell>
                        <TableCell>{ret.returnNumber || "—"}</TableCell>
                        <TableCell>{ret.supplierName || "—"}</TableCell>
                        <TableCell>{ret.prNumber || "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block text-sm font-medium px-2 py-1 rounded-full ${
                              ret.status === "RETURNED"
                                ? "bg-green-100 text-green-800"
                                : ret.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800"
                                : ret.status === "OPEN"
                                ? "bg-yellow-100 text-yellow-800"
                                : ret.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                            {ret.status || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {/* <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(ret)}
                              title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(ret)}
                              title="Edit Purchase Return">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete Purchase Return"
                                  className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Purchase Return
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete Return&nbsp;
                                    <span className="font-semibold">
                                      {ret.returnNumber}
                                    </span>
                                    ? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(ret._id)}>
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
                                <DropdownMenuLabel>
                                  Export Options
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleExportPDF(ret.items, {
                                      returnNumber: ret.returnNumber,
                                      prNumber: ret.prNumber,
                                      supplierName: ret.supplierName,
                                      status: ret.status,
                                      notes: ret.notes,
                                    })
                                  }>
                                  <FileText className="w-4 h-4 mr-2 text-red-600" />
                                  Export as PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div> */}
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
    </div>
  );
}
