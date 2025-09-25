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

import { Plus, Search, Edit, Trash2, Check, CheckCircle } from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  ItemType,
  WarehouseType,
  SupplierType,
  PurchaseOrderType,
} from "./type";
import { PurchaseOrderResponse } from "../sections/type";
import { PurchaseOrderItem } from "./type";

import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { cn } from "../ui/utils";

type Props = {
  onSuccess?: () => void;
};

export default function PurchaseOrder({ onSuccess }: Props) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderResponse[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [paginatedPurchaseOrders, setPaginatedPurchaseOrders] = useState<
    PurchaseOrderResponse[]
  >([]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [editingPO, setEditingPO] = useState<PurchaseOrderType | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrderType | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredPOs, setFilteredPOs] = useState<PurchaseOrderType[]>([]);

  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [items, setItems] = useState<ItemType[]>([]);
  const [itemsData, setItemsData] = useState([
    {
      itemCode: "",
      itemName: "",
      unitType: "",
      purchasePrice: 0,
      quantity: 1,
    },
  ]);

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
    console.log("Fetching warehouses...");

    fetch("/api/warehouses")
      .then((res) => res.json())
      .then((response) => {
        console.log("Raw response:", response);

        const data = Array.isArray(response?.warehouses)
          ? response.warehouses
          : [];
        console.log("Parsed warehouses:", data);

        setWarehouses(data);
      })
      .catch((err) => console.error("Failed to fetch warehouses", err));
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

  const [formData, setFormData] = useState<
    Omit<PurchaseOrderType, "_id" | "createdAt" | "updatedAt">
  >({
    poNumber: "",
    referenceNumber: "",
    supplierName: "",
    warehouse: "",
    items: [], // ← this replaces itemName
    total: 0,
    totalQuantity: 0,
    balance: 0,
    remarks: "",
    status: "PENDING",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<
      keyof Omit<
        PurchaseOrderType,
        "_id" | "createdAt" | "updatedAt" | "items"
      >,
      string
    >
  >({
    poNumber: "",
    referenceNumber: "",
    supplierName: "",
    warehouse: "",
    total: "",
    totalQuantity: "",
    balance: "",
    remarks: "",
    status: "",
  });
  // Filter and paginate data
  const filteredPurchaseOrders = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return purchaseOrders.filter((po) => {
      const matchesSearch =
        !query ||
        po.poNumber?.toString().toLowerCase().includes(query) ||
        po.referenceNumber?.toLowerCase().includes(query);

      const matchesDate = !dateFilter || po.createdAt?.startsWith(dateFilter);

      const matchesSupplier =
        supplierFilter === "all" || po.supplierName === supplierFilter;

      const matchesStatus =
        statusFilter === "all" || po.status?.toLowerCase() === statusFilter;

      return matchesSearch && matchesDate && matchesSupplier && matchesStatus;
    });
  }, [purchaseOrders, searchTerm, dateFilter, supplierFilter, statusFilter]);

  const totalPages = Math.ceil(filteredPurchaseOrders.length / rowsPerPage);

  // const paginatedPurchaseOrders: PurchaseOrderResponse[] =
  //   filteredPurchaseOrders.slice(
  //     (currentPage - 1) * rowsPerPage,
  //     currentPage * rowsPerPage
  //   );

  useEffect(() => {
    const sliced = filteredPurchaseOrders.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
    setPaginatedPurchaseOrders(sliced);
  }, [filteredPurchaseOrders, currentPage, rowsPerPage]);

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setSupplierFilter("all");
    setStatusFilter("all");
  };

  const allSelected =
    paginatedPurchaseOrders.length > 0 &&
    selectedIds.length === paginatedPurchaseOrders.length;

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Validation functions
  const validateForm = (isEdit = false) => {
    const errors: Record<
      keyof Omit<
        PurchaseOrderType,
        "_id" | "createdAt" | "updatedAt" | "items"
      >,
      string
    > = {
      poNumber: "",
      referenceNumber: "",
      supplierName: "",
      warehouse: "",
      total: "",
      totalQuantity: "",
      balance: "",
      remarks: "",
      status: "",
    };

    // Required: supplierName
    if (!formData.supplierName.trim()) {
      errors.supplierName = "Supplier Name is required";
    }

    // Required: warehouse
    if (!formData.warehouse.trim()) {
      errors.warehouse = "Warehouse is required";
    }

    // Validate items[]
    const itemErrors = formData.items.map((item, index) => {
      const itemError: Record<string, string> = {};

      if (!item.itemName?.trim()) {
        itemError.itemName = "Item name is required";
      }

      if (Number(item.quantity) <= 0) {
        itemError.quantity = "Quantity must be greater than 0";
      }

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

  const formattedTotal = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(formData.total ?? 0));

  const handleCreate = async () => {
    if (!validateForm()) return;

    const normalizedItems = formData.items.map((item) => ({
      itemName: item.itemName?.trim().toUpperCase() || "UNNAMED",
      quantity: Number(item.quantity) || 0,
      unitType: item.unitType?.trim().toUpperCase() || "",
      purchasePrice: Number(item.purchasePrice) || 0,
      itemCode: item.itemCode?.trim().toUpperCase() || "",
    }));

    const { total, totalQuantity } = normalizedItems.reduce(
      (acc, item) => {
        acc.total += item.quantity * item.purchasePrice;
        acc.totalQuantity += item.quantity;
        return acc;
      },
      { total: 0, totalQuantity: 0 }
    );
    console.log(total, totalQuantity);

    const payload = {
      referenceNumber: formData.referenceNumber.trim().toUpperCase(),
      supplierName: formData.supplierName.trim().toUpperCase(),
      warehouse: formData.warehouse.trim().toUpperCase(),
      items: normalizedItems,
      total: total,
      totalQuantity: totalQuantity,
      balance: Number(formData.balance ?? total) || 0,
      remarks: formData.remarks?.trim() || "",
      status: formData.status?.trim() || "Pending",
    };

    console.log("Creating purchase order:", payload);

    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("Server response:", result);

      if (!res.ok) {
        console.error("Create failed:", result.message || result);
        alert("Failed to create purchase order. Please try again.");
        return;
      }

      toast.success("Purchase order created successfully!");

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      setTimeout(() => {
        router.push("/");
      }, 300);
    } catch (error) {
      console.error("Network or unexpected error:", error);
      alert("Something went wrong. Please check your connection or try again.");
    }

    // setIsCreateDialogOpen(false);
  };

  const defaultValidationErrors: Record<
    keyof Omit<PurchaseOrderType, "_id" | "createdAt" | "updatedAt" | "items">,
    string
  > = {
    poNumber: "",
    referenceNumber: "",
    supplierName: "",
    warehouse: "",
    total: "",
    totalQuantity: "",
    balance: "",
    remarks: "",
    status: "",
  };

  const allowedStatuses: PurchaseOrderType["status"][] = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
  ];

  const handleEdit = (po: PurchaseOrderType) => {
    setEditingPO(po);

    const editableItems = po.items
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => ({
        itemName: item.itemName?.trim().toUpperCase() || "",
        quantity: Math.max(Number(item.quantity) || 1, 1),
        unitType: item.unitType?.trim().toUpperCase() || "",
        purchasePrice: Number(item.purchasePrice) || 0,
        itemCode: item.itemCode?.trim().toUpperCase() || "",
      }));

    const totalQuantity = editableItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = editableItems.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );

    const normalizedStatus = po.status?.trim().toUpperCase();
    const status: PurchaseOrderType["status"] = allowedStatuses.includes(
      normalizedStatus as PurchaseOrderType["status"]
    )
      ? (normalizedStatus as PurchaseOrderType["status"])
      : "PENDING";

    const normalizedFormData: Omit<
      PurchaseOrderType,
      "_id" | "createdAt" | "updatedAt"
    > = {
      poNumber: po.poNumber.trim().toUpperCase(),
      referenceNumber: po.referenceNumber?.trim().toUpperCase() || "",
      supplierName: po.supplierName?.trim().toUpperCase() || "",
      warehouse: po.warehouse?.trim().toUpperCase() || "",
      items: editableItems,
      total: totalAmount,
      totalQuantity,
      balance:
        typeof po.balance === "number" && !isNaN(po.balance)
          ? po.balance
          : totalAmount,
      remarks: po.remarks?.trim() || "",
      status,
    };

    setFormData(normalizedFormData);
    setSelectedIds(Array(editableItems.length).fill(true)); // default to all selected
    setValidationErrors(defaultValidationErrors);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPO || !validateForm(true)) {
      console.warn("Validation failed or editingPO is missing:", { editingPO });
      return;
    }

    const selectedIdsSafe =
      selectedIds.length === formData.items.length
        ? selectedIds
        : formData.items.map(() => true);

    const normalizedItems = formData.items
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => selectedIdsSafe[index])
      .map(({ item }) => ({
        itemCode: item.itemCode?.trim().toUpperCase() || "",
        itemName: item.itemName?.trim().toUpperCase() || "",
        unitType: item.unitType?.trim().toUpperCase() || "",
        quantity: Math.max(Number(item.quantity) || 1, 1),
        purchasePrice: Number(item.purchasePrice) || 0,
      }));

    const totalQuantity = normalizedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );

    const rawStatus = formData.status?.trim().toUpperCase();
    const status: PurchaseOrderType["status"] = allowedStatuses.includes(
      rawStatus as PurchaseOrderType["status"]
    )
      ? (rawStatus as PurchaseOrderType["status"])
      : "PENDING";

    const payload: Partial<PurchaseOrderType> = {
      poNumber: formData.poNumber.trim().toUpperCase(),
      referenceNumber: formData.referenceNumber.trim().toUpperCase(),
      supplierName: formData.supplierName.trim().toUpperCase(),
      warehouse: formData.warehouse.trim().toUpperCase(),
      items: normalizedItems,
      total: totalAmount,
      totalQuantity,
      balance:
        typeof formData.balance === "number" && !isNaN(formData.balance)
          ? formData.balance
          : totalAmount,
      remarks: formData.remarks?.trim() || "",
      status,
    };

    console.log("📦 Sending update payload:", payload);

    try {
      const res = await fetch(`/api/purchase-orders/${editingPO._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("📡 Response status:", res.status);
      console.log("✅ Parsed updated PO:", result);

      if (!res.ok) {
        console.error("❌ Update failed:", res.status, result);
        alert(`Update failed: ${result?.error || "Unknown error"}`);
        return;
      }

      setPurchaseOrders((prev) =>
        prev.map((po) => (po._id === result._id ? result : po))
      );
    } catch (err) {
      console.error("🔥 Network or unexpected error:", err);
      alert("Something went wrong while updating the purchase order.");
      return;
    }

    // ✅ Reset state
    setEditingPO(null);
    setFormData({
      poNumber: "",
      referenceNumber: "",
      supplierName: "",
      warehouse: "",
      items: [],
      total: 0,
      totalQuantity: 0,
      balance: 0,
      remarks: "",
      status: "PENDING",
    });
    setSelectedIds([]);
    setValidationErrors(defaultValidationErrors);
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (poId: string) => {
    if (!poId || typeof poId !== "string") {
      console.warn("Invalid PO ID:", poId);
      toast.error("Invalid purchase order ID");
      return;
    }

    try {
      const res = await fetch(`/api/purchase-orders/${poId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to delete purchase order");
      }

      // Remove from local state
      setPurchaseOrders((prev) => prev.filter((po) => po._id !== poId));

      console.log("✅ Deleted purchase order:", poId);
      toast.success(`Purchase order #${poId} deleted`);
    } catch (error) {
      console.error("❌ Error deleting purchase order:", error);
      toast.error(`Failed to delete PO #${poId}`);
    }
  };

  const handleView = (po: PurchaseOrderType) => {
    setViewingPO(po);
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
      poNumber: "",
      referenceNumber: "",
      supplierName: "",
      warehouse: "",
      items: [],
      total: 0,
      totalQuantity: 0,
      balance: 0,
      remarks: "",
      status: "PENDING",
    });

    setValidationErrors({
      poNumber: "",
      referenceNumber: "",
      supplierName: "",
      warehouse: "",
      total: "",
      totalQuantity: "",
      balance: "",
      remarks: "",
      status: "",
    });
  };

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      // Select all purchase orders on current page
      const newSelections = [
        ...selectedIds,
        ...paginatedPurchaseOrders
          .filter((po) => !selectedIds.includes(po._id))
          .map((po) => po._id),
      ];
      setSelectedIds(newSelections);
    } else if (checked === false) {
      // Unselect all purchase orders on current page
      const remaining = selectedIds.filter(
        (id) => !paginatedPurchaseOrders.some((po) => po._id === id)
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
      toast.error("No purchase orders selected for deletion.");
      return;
    }

    try {
      // Optimistically remove from UI
      setPurchaseOrders((prev) => prev.filter((po) => !_ids.includes(po._id)));

      const results = await Promise.allSettled(
        _ids.map(async (_id) => {
          const res = await fetch(`/api/purchase-orders/${_id}`, {
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
          `Some purchase orders could not be deleted (${failures.length} failed).`
        );
      } else {
        toast.success("✅ Selected purchase orders deleted.");
      }

      setSelectedIds([]);
      onSuccess?.(); // refresh list
    } catch (err) {
      console.error("❌ Bulk delete failed:", err);
      toast.error("Failed to delete selected purchase orders.");
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const res = await fetch("/api/purchase-orders", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch purchase orders");

      const data = await res.json();
      const purchaseOrders = Array.isArray(data) ? data : data.items;

      setPurchaseOrders(Array.isArray(purchaseOrders) ? purchaseOrders : []);
    } catch (error) {
      console.error("Error loading purchase orders:", error);
      setPurchaseOrders([]);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders(); // initial fetch

    const interval = setInterval(() => {
      fetchPurchaseOrders();
    }, 1000); // 1 second polling

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const params = useParams();
  const poId = params?.id as string;

  useEffect(() => {
    if (poId) fetchSinglePO(poId);
  }, [poId]);

  const fetchSinglePO = async (poId: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${poId}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch PO");

      const data = await res.json();

      const normalizedItems = (data.items || []).map(
        (item: PurchaseOrderItem) => ({
          itemName: item.itemName?.trim().toUpperCase() || "",
          quantity: Number(item.quantity) || 0,
          unit: item.unitType?.trim().toUpperCase() || "",
          purchasePrice: Number(item.purchasePrice) || 0,
          itemCode: item.itemCode?.trim().toUpperCase() || "",
        })
      );

      setItemsData(normalizedItems);
      setFormData({ ...data, items: normalizedItems });
    } catch (error) {
      console.error("Error loading PO:", error);
      setItemsData([]);
      setFormData({} as PurchaseOrderType);
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
      items: [],
      totalQuantity: 0,
      total: 0,
    }));
  };

  const handleAddItemEdit = () => {
    const newItem: PurchaseOrderItem = {
      itemCode: "",
      itemName: "",
      unitType: "",
      purchasePrice: 0,
      quantity: 1,
    };

    setFormData((prev) => {
      const updatedItems = [...prev.items, newItem];

      const totalQuantity = updatedItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );

      const total = updatedItems.reduce(
        (sum, item) => sum + (item.quantity * item.purchasePrice || 0),
        0
      );

      return {
        ...prev,
        items: updatedItems,
        totalQuantity,
        total,
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = itemsData.filter((_, i) => i !== index);

    const totalQuantity = updatedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );

    setItemsData(updatedItems);
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalQuantity,
      total: totalAmount,
    }));
  };

  const recalculateTotals = (items: PurchaseOrderItem[]) => {
    const totalQuantity = items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.quantity * item.purchasePrice || 0),
      0
    );

    return { totalQuantity, total: totalAmount };
  };

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

  const handleTagAsComplete = async (poId: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!res.ok) throw new Error("Failed to update PO status");

      const updatedPO = await res.json();

      // Update local state
      setPaginatedPurchaseOrders((prev) =>
        prev.map((po) =>
          po._id === poId ? { ...po, status: updatedPO.status } : po
        )
      );

      toast.success(`PO ${updatedPO.poNumber} marked as completed`);
    } catch (error) {
      console.error("❌ Error tagging PO as complete:", error);
      toast.error("Could not tag PO as complete");
    }
  };

  const handleExportPDF = (
    items: ItemType[],
    poMeta: {
      poNumber: string;
      referenceNumber: string;
      supplierName: string;
      warehouse: string;
      status: string;
      remarks?: string;
    }
  ) => {
    if (!items || items.length === 0) {
      toast.error("No items to export");
      return;
    }

    const doc = new jsPDF();

    const title = "Purchase Order Summary";
    const summaryLines = [
      `PO Number: ${poMeta.poNumber}`,
      `Reference No: ${poMeta.referenceNumber}`,
      `Supplier: ${poMeta.supplierName}`,
      `Warehouse: ${poMeta.warehouse}`,
      `Status: ${poMeta.status}`,
      `Remarks: ${poMeta.remarks || "—"}`,
    ];

    doc.setFontSize(16);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    summaryLines.forEach((line, i) => {
      doc.text(line, 14, 28 + i * 6);
    });

    const tableStartY = 28 + summaryLines.length * 6 + 10;

    const tableHead = [["Item Code", "Item Name", "UOM", "Purchase Price"]];
    const tableBody = items.map((item) => [
      item.itemCode,
      item.itemName,
      item.unitType,
      `₱${item.purchasePrice.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: tableHead,
      body: tableBody,
      styles: {
        fontSize: 9,
        halign: "center",
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    const filename = `PO-${poMeta.poNumber}.pdf`;
    doc.save(filename);
    toast.success("PDF exported successfully");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Purchase Order</CardTitle>
              <CardDescription>Manage purchase orders</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search PO Number or Reference Number..."
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
                  Create Purchase Order
                </Button>
              </DialogTrigger>

              <DialogPanel className="space-y-6">
                {/* Header */}
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    Create Purchase Order
                  </DialogTitle>
                </DialogHeader>

                {/* Form Content Slot (optional placeholder) */}
                <div className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-row flex-wrap gap-4">
                      {/* PO Number */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-po-number">PO Number</Label>
                        <Input
                          id="create-po-number"
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

                      {/* Reference Number */}
                      <div className="flex flex-col flex-[2] min-w-[300px]">
                        <Label htmlFor="create-reference-number">
                          Reference Number
                        </Label>
                        <Input
                          id="create-reference-number"
                          value={formData.referenceNumber}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            setFormData((prev) => ({
                              ...prev,
                              referenceNumber: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              referenceNumber: "",
                            }));
                          }}
                          placeholder="e.g. REF-2025-001"
                          className={`text-sm uppercase ${
                            validationErrors.referenceNumber
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        {validationErrors.referenceNumber && (
                          <p className="text-sm text-destructive">
                            {validationErrors.referenceNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row flex-wrap gap-4">
                      {/* Supplier Name */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-supplier-name">
                          Supplier Name
                        </Label>
                        <Select
                          value={formData.supplierName}
                          onValueChange={(value) => {
                            const normalized = value.toUpperCase().trim();
                            setFormData((prev) => ({
                              ...prev,
                              supplierName: normalized,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              supplierName: "",
                            }));
                          }}>
                          <SelectTrigger
                            className={`text-sm uppercase w-full ${
                              validationErrors.supplierName
                                ? "border-destructive"
                                : ""
                            }`}>
                            {formData.supplierName || "Select Supplier"}
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(suppliers) &&
                            suppliers.length > 0 ? (
                              suppliers.map((supplier) => {
                                const label =
                                  supplier.supplierName?.trim() ||
                                  "Unnamed Supplier";
                                const value = label.toUpperCase();
                                return (
                                  <SelectItem
                                    key={supplier._id || value}
                                    value={value}>
                                    {label}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem disabled value="no-suppliers">
                                No suppliers available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {validationErrors.supplierName && (
                          <p className="text-sm text-destructive">
                            {validationErrors.supplierName}
                          </p>
                        )}
                      </div>

                      {/* Warehouse */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-warehouse">Warehouse</Label>
                        <Select
                          value={formData.warehouse}
                          onValueChange={(value) => {
                            const normalized = value.toUpperCase().trim();
                            setFormData((prev) => ({
                              ...prev,
                              warehouse: normalized,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              warehouse: "",
                            }));
                          }}>
                          <SelectTrigger
                            className={`text-sm uppercase w-full ${
                              validationErrors.warehouse
                                ? "border-destructive"
                                : ""
                            }`}>
                            {formData.warehouse || "Select Warehouse"}
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(warehouses) &&
                            warehouses.length > 0 ? (
                              warehouses.map((warehouse) => {
                                const label =
                                  warehouse.warehouse_name?.trim() ||
                                  "Unnamed Warehouse";
                                return (
                                  <SelectItem
                                    key={warehouse._id || label}
                                    value={label.toUpperCase()}>
                                    {label}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem disabled value="no-warehouses">
                                No warehouses available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {validationErrors.warehouse && (
                          <p className="text-sm text-destructive">
                            {validationErrors.warehouse}
                          </p>
                        )}
                      </div>

                      {/* Remarks */}
                      <div className="flex flex-col flex-[2] min-w-[300px]">
                        <Label htmlFor="create-remarks">Remarks</Label>
                        <Textarea
                          id="create-remarks"
                          value={formData.remarks}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              remarks: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              remarks: "",
                            }));
                          }}
                          placeholder="Add any additional notes or comments here"
                          className={`text-sm ${
                            validationErrors.remarks ? "border-destructive" : ""
                          }`}
                        />
                        {validationErrors.remarks && (
                          <p className="text-sm text-destructive">
                            {validationErrors.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 border-b py-2 mb-4 bg-primary text-primary-foreground rounded-t">
                  {/* Header Row */}
                  <div className="text-xs font-semibold uppercase text-center">
                    Item Code
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Item Name
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Qty
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    UOM
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Purchase Price
                  </div>
                  <div className="text-xs font-semibold uppercase text-center">
                    Amount
                  </div>
                  <div className="text-center"></div> {/* Trash icon column */}
                </div>

                {itemsData.map((item, index) => (
                  <div
                    key={index}
                    className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] items-center border-t border-border text-sm m-0">
                    {/* Item Code */}
                    <input
                      type="text"
                      value={item.itemCode || ""}
                      readOnly
                      className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white"
                    />
                    {/* Item Name */}
                    <Select
                      value={item.itemName}
                      onValueChange={(value) => {
                        const normalized = value.toUpperCase().trim();
                        const selected = items.find(
                          (option) =>
                            option.itemName?.toUpperCase().trim() === normalized
                        );
                        if (!selected) return;

                        // ✅ Update itemsData
                        setItemsData((prev) => {
                          const updated = [...prev];
                          updated[index] = {
                            ...updated[index],
                            itemName: normalized,
                            itemCode: selected.itemCode || "",
                            unitType: selected.unitType || "",
                            purchasePrice: selected.purchasePrice || 0,
                          };
                          return updated;
                        });

                        // ✅ Sync to formData.items[index]
                        setFormData((prev) => {
                          const updatedItems = [...prev.items];
                          updatedItems[index] = {
                            ...updatedItems[index],
                            itemName: normalized,
                            itemCode: selected.itemCode || "",
                            unitType: selected.unitType || "",
                            purchasePrice: selected.purchasePrice || 0,
                            quantity: updatedItems[index]?.quantity || 1, // fallback
                          };
                          return {
                            ...prev,
                            items: updatedItems,
                          };
                        });
                      }}>
                      <SelectTrigger
                        id={`item-name-${index}`}
                        className="w-full px-2 py-1 border border-border border-l-0 border-t-0 uppercase focus:outline-none focus:ring-1 focus:ring-primary">
                        {item.itemName || "Select Item"}
                      </SelectTrigger>

                      <SelectContent>
                        {items.length > 0 ? (
                          items.map((option) => {
                            const label =
                              option.itemName?.trim() || "Unnamed Item";
                            return (
                              <SelectItem
                                key={option._id || label}
                                value={label.toUpperCase()}>
                                {label}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem disabled value="no-items">
                            No items available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Quantity */}
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const value = Number(e.target.value);

                        // ✅ Update itemsData
                        setItemsData((prev) => {
                          const updated = [...prev];
                          updated[index].quantity = value;
                          return updated;
                        });

                        // ✅ Sync to formData.items
                        setFormData((prev) => {
                          const updatedItems = [...prev.items];
                          updatedItems[index] = {
                            ...updatedItems[index],
                            quantity: value,
                          };
                          return {
                            ...prev,
                            items: updatedItems,
                          };
                        });
                      }}
                      className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    {/* Unit Type */}
                    <input
                      type="text"
                      value={item.unitType || ""}
                      readOnly
                      className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white"
                    />

                    {/* Purchase Price */}
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
                      className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white"
                    />

                    {/* Amount */}
                    <input
                      type="text"
                      value={
                        item.purchasePrice && item.quantity
                          ? (item.purchasePrice * item.quantity).toLocaleString(
                              "en-PH",
                              {
                                style: "currency",
                                currency: "PHP",
                              }
                            )
                          : ""
                      }
                      readOnly
                      className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white"
                    />

                    {/* Trash Button */}
                    <Button
                      variant="destructive"
                      className="w-full h-[32px] px-1 text-xs border border-border bg-red-50 hover:bg-red-100 text-red-700 rounded transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-1 focus:ring-red-400 flex items-center justify-center"
                      onClick={() => handleRemoveItem(index)}
                      title="Remove item">
                      <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
                    </Button>
                  </div>
                ))}
                <div className="flex w-full justify-end mt-4 gap-6">
                  {/* Total Quantity */}
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-sm font-medium">Total Qty:</span>
                    <input
                      type="text"
                      id="total-quantity"
                      value={formData.totalQuantity}
                      readOnly
                      disabled
                      className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input cursor-not-allowed w-full"
                    />
                  </div>

                  {/* Total Amount */}
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <input
                      type="text"
                      id="total-amount"
                      value={formattedTotal}
                      readOnly
                      disabled
                      className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input cursor-not-allowed w-full"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <DialogFooter className="pt-4 border-t">
                  <div className="flex w-full justify-between items-center">
                    {/* Left: Add Item */}
                    <Button onClick={handleAddItem}>Add Item</Button>

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
                              (item) => !item.itemName?.trim()
                            )
                          }
                          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Save">
                          💾 Save
                        </Button>

                        {/* Dropdown for More Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              className="bg-muted text-foreground hover:bg-muted/80 px-3 py-2 rounded-md shadow-sm transition-colors duration-150"
                              aria-label="Open more save options">
                              ▾ More
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-[220px] rounded-md border border-border bg-white shadow-lg animate-in fade-in slide-in-from-top-2">
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-muted-foreground">
                              Additional actions
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={handleSaveAndCreate}
                              disabled={
                                !formData.items.length ||
                                formData.items.every(
                                  (item) => !item.itemName?.trim()
                                )
                              }
                              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                              🆕 Save & New
                            </DropdownMenuItem>

                            {/* <DropdownMenuItem
                              onClick={handleSaveAndPreview}
                              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                              👁️ Save & Preview
                            </DropdownMenuItem> */}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                      value: PurchaseOrderType["status"] | "all"
                    ) => setStatusFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <TableHead>PO Number</TableHead>
                  <TableHead>Reference Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedPurchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPurchaseOrders.map((po: PurchaseOrderResponse) => (
                    <TableRow key={po._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(po._id)}
                          onCheckedChange={() => toggleSelectOne(po._id)}
                        />
                      </TableCell>
                      <TableCell>
                        {po.createdAt ? formatDate(po.createdAt) : "—"}
                      </TableCell>
                      <TableCell>{po.poNumber || "—"}</TableCell>
                      <TableCell>{po.referenceNumber || "—"}</TableCell>
                      <TableCell>{po.supplierName || "—"}</TableCell>
                      <TableCell>{po.warehouse || "—"}</TableCell>
                      <TableCell>
                        ₱
                        {po.total?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        ₱
                        {po.balance?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell
                        className="max-w-[160px] truncate whitespace-nowrap overflow-hidden"
                        title={po.remarks}>
                        {po.remarks || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-block text-sm font-medium px-2 py-1 rounded-full ${
                            po.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : po.status === "APPROVED"
                              ? "bg-blue-100 text-blue-800"
                              : po.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : po.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                          {po.status.toUpperCase() || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {/* Always show View button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(po)}
                            title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Hide Edit and Delete if status is COMPLETED */}
                          {po.status !== "COMPLETED" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(po)}
                                title="Edit Purchase Order">
                                <Edit className="w-4 h-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Delete Purchase Order"
                                    className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Purchase Order
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete PO&nbsp;
                                      <span className="font-semibold">
                                        {po.poNumber}
                                      </span>
                                      ? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(po._id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}

                          {/* Always show Export dropdown */}
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
                                  handleExportPDF(items, {
                                    poNumber: po.poNumber,
                                    referenceNumber: po.referenceNumber,
                                    supplierName: po.supplierName,
                                    warehouse: po.warehouse,
                                    status: po.status,
                                    remarks: po.remarks,
                                  })
                                }>
                                <FileText className="w-4 h-4 mr-2 text-red-600" />
                                Export as PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTagAsComplete(po._id)}
                                disabled={po.status === "COMPLETED"}
                                className="text-green-600">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Tag as Completed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
            <DialogTitle>Edit Purchase Orders</DialogTitle>
          </DialogHeader>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid gap-4 py-4">
              {/* First Row */}
              <div className="flex flex-row flex-wrap gap-4">
                {/* PO Number */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-po-number">PO Number</Label>
                  <Input
                    id="edit-po-number"
                    value={formData.poNumber}
                    readOnly
                    disabled
                    placeholder="Auto-generated"
                    className="text-sm uppercase bg-muted cursor-not-allowed"
                  />
                </div>

                {/* Requested Date */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-requested-date">Requested Date</Label>
                  <Input
                    id="edit-requested-date"
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

                {/* Reference Number */}
                <div className="flex flex-col flex-[2] min-w-[300px]">
                  <Label htmlFor="edit-reference-number">
                    Reference Number
                  </Label>
                  <Input
                    id="edit-reference-number"
                    value={formData.referenceNumber}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({
                        ...prev,
                        referenceNumber: value,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        referenceNumber: "",
                      }));
                    }}
                    placeholder="e.g. REF-2025-001"
                    className={`text-sm uppercase ${
                      validationErrors.referenceNumber
                        ? "border-destructive"
                        : ""
                    }`}
                  />
                  {validationErrors.referenceNumber && (
                    <p className="text-sm text-destructive">
                      {validationErrors.referenceNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Second Row */}
              <div className="flex flex-row flex-wrap gap-4">
                {/* Supplier Name */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-supplier-name">Supplier Name</Label>
                  <Select
                    value={formData.supplierName}
                    onValueChange={(value) => {
                      const normalized = value.toUpperCase().trim();
                      setFormData((prev) => ({
                        ...prev,
                        supplierName: normalized,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        supplierName: "",
                      }));
                    }}>
                    <SelectTrigger
                      className={`text-sm uppercase w-full ${
                        validationErrors.supplierName
                          ? "border-destructive"
                          : ""
                      }`}>
                      {formData.supplierName || "Select Supplier"}
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(suppliers) && suppliers.length > 0 ? (
                        suppliers.map((supplier) => {
                          const label =
                            supplier.supplierName?.trim() || "Unnamed Supplier";
                          const value = label.toUpperCase();
                          return (
                            <SelectItem
                              key={supplier._id || value}
                              value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem disabled value="no-suppliers">
                          No suppliers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {validationErrors.supplierName && (
                    <p className="text-sm text-destructive">
                      {validationErrors.supplierName}
                    </p>
                  )}
                </div>

                {/* Warehouse */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-warehouse">Warehouse</Label>
                  <Select
                    value={formData.warehouse}
                    onValueChange={(value) => {
                      const normalized = value.toUpperCase().trim();
                      setFormData((prev) => ({
                        ...prev,
                        warehouse: normalized,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        warehouse: "",
                      }));
                    }}>
                    <SelectTrigger
                      className={`text-sm uppercase w-full ${
                        validationErrors.warehouse ? "border-destructive" : ""
                      }`}>
                      {formData.warehouse || "Select Warehouse"}
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(warehouses) && warehouses.length > 0 ? (
                        warehouses.map((warehouse) => {
                          const label =
                            warehouse.warehouse_name?.trim() ||
                            "Unnamed Warehouse";
                          return (
                            <SelectItem
                              key={warehouse._id || label}
                              value={label.toUpperCase()}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem disabled value="no-warehouses">
                          No warehouses available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {validationErrors.warehouse && (
                    <p className="text-sm text-destructive">
                      {validationErrors.warehouse}
                    </p>
                  )}
                </div>

                {/* Remarks */}
                <div className="flex flex-col flex-[2] min-w-[300px]">
                  <Label htmlFor="edit-remarks">Remarks</Label>
                  <Textarea
                    id="edit-remarks"
                    value={formData.remarks}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({ ...prev, remarks: value }));
                      setValidationErrors((prev) => ({ ...prev, remarks: "" }));
                    }}
                    placeholder="Add any additional notes or comments here"
                    className={`text-sm ${
                      validationErrors.remarks ? "border-destructive" : ""
                    }`}
                  />
                  {validationErrors.remarks && (
                    <p className="text-sm text-destructive">
                      {validationErrors.remarks}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 border-b py-2 mb-4 bg-primary text-primary-foreground rounded-t">
              {/* Header Row */}
              <div className="text-xs font-semibold uppercase text-center">
                Item Code
              </div>
              <div className="text-xs font-semibold uppercase text-center">
                Item Name
              </div>
              <div className="text-xs font-semibold uppercase text-center">
                Qty
              </div>
              <div className="text-xs font-semibold uppercase text-center">
                UOM
              </div>
              <div className="text-xs font-semibold uppercase text-center">
                Purchase Price
              </div>
              <div className="text-xs font-semibold uppercase text-center">
                Amount
              </div>
              <div className="text-center"></div> {/* Trash icon column */}
            </div>
          </div>

          {formData.items?.map((item, index) => {
            const isZero = item.quantity === 0;

            return (
              <div
                key={index}
                className={`grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] items-center border-t border-border text-sm m-0 ${
                  isZero ? "bg-green-50 text-green-700 animate-fade-in" : ""
                }`}>
                {/* Item Code */}
                <input
                  type="text"
                  value={item.itemCode || ""}
                  readOnly
                  className={`w-full px-2 py-1 border border-border border-l-0 border-t-0 ${
                    isZero ? "bg-green-50 text-green-700" : "bg-white"
                  }`}
                />

                {/* Item Name */}
                <Select
                  value={item.itemName}
                  onValueChange={(value) => {
                    const normalized = value.toUpperCase().trim();
                    const selected = items.find(
                      (option) =>
                        option.itemName?.toUpperCase().trim() === normalized
                    );
                    if (!selected) return;

                    setFormData((prev) => {
                      const updatedItems = [...prev.items];
                      updatedItems[index] = {
                        ...updatedItems[index],
                        itemName: normalized,
                        itemCode: selected.itemCode || "",
                        unitType: selected.unitType || "",
                        purchasePrice: selected.purchasePrice || 0,
                        quantity: updatedItems[index]?.quantity || 1,
                      };

                      const { totalQuantity, total } =
                        recalculateTotals(updatedItems);

                      return {
                        ...prev,
                        items: updatedItems,
                        totalQuantity,
                        total,
                      };
                    });
                  }}>
                  <SelectTrigger
                    id={`edit-item-name-${index}`}
                    className={`w-full px-2 py-1 border border-border border-l-0 border-t-0 uppercase focus:outline-none focus:ring-1 focus:ring-primary ${
                      isZero
                        ? "bg-green-50 text-green-700 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={isZero}>
                    {item.itemName || "Select Item"}
                  </SelectTrigger>

                  <SelectContent>
                    {items.length > 0 ? (
                      items.map((option) => {
                        const label = option.itemName?.trim() || "Unnamed Item";
                        return (
                          <SelectItem
                            key={option._id || label}
                            value={label.toUpperCase()}>
                            {label}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem disabled value="no-items">
                        No items available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* Quantity */}
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setFormData((prev) => {
                      const updatedItems = [...prev.items];
                      updatedItems[index].quantity = value;

                      const { totalQuantity, total } =
                        recalculateTotals(updatedItems);

                      return {
                        ...prev,
                        items: updatedItems,
                        totalQuantity,
                        total,
                      };
                    });
                  }}
                  className={`w-full px-2 py-1 border border-border border-l-0 border-t-0 focus:outline-none focus:ring-1 focus:ring-primary ${
                    isZero
                      ? "bg-green-50 text-green-700 cursor-not-allowed"
                      : "bg-white"
                  }`}
                  disabled={isZero}
                />

                {/* Unit Type */}
                <input
                  type="text"
                  value={item.unitType || ""}
                  readOnly
                  className={`w-full px-2 py-1 border border-border border-l-0 border-t-0 ${
                    isZero ? "bg-green-50 text-green-700" : "bg-white"
                  }`}
                />

                {/* Purchase Price */}
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
                  className={`w-full px-2 py-1 border border-border border-l-0 border-t-0 ${
                    isZero ? "bg-green-50 text-green-700" : "bg-white"
                  }`}
                />

                {/* Amount */}
                <input
                  type="text"
                  value={
                    item.purchasePrice && item.quantity
                      ? (item.purchasePrice * item.quantity).toLocaleString(
                          "en-PH",
                          {
                            style: "currency",
                            currency: "PHP",
                          }
                        )
                      : ""
                  }
                  readOnly
                  className={`w-full px-2 py-1 border border-border border-l-0 border-t-0 ${
                    isZero ? "bg-green-50 text-green-700" : "bg-white"
                  }`}
                />

                {/* Action Button */}
                <div className="w-full h-full flex items-center justify-center border border-border border-l-0 border-t-0">
                  {isZero ? (
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-600 animate-bounce" />
                      <span className="text-xs font-semibold text-green-700">
                        Posted
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setFormData((prev) => {
                          const updatedItems = prev.items.filter(
                            (_, i) => i !== index
                          );
                          const { totalQuantity, total } =
                            recalculateTotals(updatedItems);

                          return {
                            ...prev,
                            items: updatedItems,
                            totalQuantity,
                            total,
                          };
                        });
                      }}
                      title="Remove item">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Totals */}
          <div className="flex w-full justify-end mt-4 gap-6">
            {/* Total Quantity */}
            <div className="flex items-center gap-2 min-w-[180px]">
              <span className="text-sm font-medium">Total Qty:</span>
              <span className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input w-full text-right">
                {formData.totalQuantity ?? 0}
              </span>
            </div>

            {/* Total Amount */}
            <div className="flex items-center gap-2 min-w-[180px]">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input w-full text-right">
                {formData.total?.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-4 border-t">
            <div className="flex w-full justify-between items-center">
              {/* Left: Add Item */}
              <Button onClick={handleAddItemEdit}>➕ Add Item</Button>

              {/* Right: Cancel & Update */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingPO(null);
                    resetForm();
                  }}>
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  {/* Primary Update Button */}
                  <Button
                    onClick={handleUpdate}
                    disabled={
                      !formData.items.length ||
                      formData.items.every((item) => !item.itemName?.trim())
                    }
                    className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm transition-colors duration-150"
                    aria-label="Update">
                    ✏️ Update
                  </Button>
                </div>
              </div>
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

          {viewingPO && (
            <div className="grid gap-6 py-4">
              <Card className="p-6 rounded-xl shadow-sm border border-border">
                <h4 className="text-xl font-bold text-primary text-center mb-6 tracking-tight">
                  Purchase Order Info
                </h4>

                {/* Header Row */}
                <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] border-b py-3 mb-4 bg-primary text-primary-foreground rounded-t shadow-sm">
                  <div className="text-xs font-semibold uppercase text-center tracking-wide">
                    PO Number
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Reference Number
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
                  <div className="text-center border-l border-border"></div>{" "}
                  {/* Trash icon column */}
                </div>

                {/* Data Row */}
                <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] items-center border-b py-2 text-sm">
                  <div className="text-center uppercase border-l border-border">
                    {viewingPO.poNumber || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingPO.referenceNumber || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingPO.supplierName || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingPO.warehouse || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingPO.status || "—"}
                  </div>
                  <div
                    className="text-center uppercase border-l border-border max-w-[160px] truncate whitespace-nowrap overflow-hidden"
                    title={viewingPO.remarks}>
                    {viewingPO.remarks || "—"}
                  </div>
                </div>

                {/* Header Row */}
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

                {viewingPO.items?.map((item, index) => {
                  const isZero = item.quantity === 0;

                  return (
                    <div
                      key={index}
                      className={`grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] items-center text-sm py-2 px-1 rounded-md transition-all duration-150
        ${
          isZero
            ? "bg-green-50 text-green-700 animate-fade-in"
            : "even:bg-muted/5 hover:ring-1 hover:ring-muted"
        }`}>
                      {/* Item Code */}
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.itemCode || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Item Name */}
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.itemName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Unit Type */}
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.unitType || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Purchase Price */}
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.purchasePrice !== undefined ? (
                          item.purchasePrice.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.quantity ?? (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-center uppercase px-3 font-semibold">
                        {(
                          item.quantity * item.purchasePrice || 0
                        ).toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="flex w-full justify-end mt-4 gap-6">
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-sm font-medium">Total Qty:</span>
                    <span className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input w-full text-right">
                      {viewingPO.totalQuantity ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input w-full text-right">
                      {viewingPO.items
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
