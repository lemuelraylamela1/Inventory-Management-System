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
  CalendarDays,
  Loader2,
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
  const [showItemSuggestions, setShowItemSuggestions] = useState<number | null>(
    null
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredPOs, setFilteredPOs] = useState<PurchaseOrderType[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const isFirstFetch = useRef(true);

  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [showWarehouseSuggestions, setShowWarehouseSuggestions] =
    useState(false);
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

      const createdAtStr = po.createdAt
        ? new Date(po.createdAt).toISOString().split("T")[0]
        : "";

      const matchesDate = !dateFilter || createdAtStr.startsWith(dateFilter);

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
    "PARTIAL",
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
    // setSelectedIds(Array(editableItems.length).fill(true)); // default to all selected
    setValidationErrors(defaultValidationErrors);
    setIsEditDialogOpen(true);
  };

  const [formattedNewTotal, setFormattedTotal] = useState("₱0.00");

  useEffect(() => {
    const totalQuantity = formData.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );

    const totalAmount = formData.items.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.purchasePrice) || 0),
      0
    );

    setFormData((prev) => ({
      ...prev,
      totalQuantity,
      total: totalAmount,
    }));

    setFormattedTotal(
      totalAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      })
    );
  }, [formData.items]);

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
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/purchase-orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch purchase orders");

      const data = await res.json();
      const purchaseOrders = Array.isArray(data) ? data : data.items;

      setPurchaseOrders(Array.isArray(purchaseOrders) ? purchaseOrders : []);
    } catch (error) {
      console.error("❌ Error loading purchase orders:", error);
      setPurchaseOrders([]);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
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

  // const drawThemeGrid = (
  //   doc: jsPDF,
  //   x: number,
  //   y: number,
  //   width: number,
  //   height: number
  // ) => {
  //   // Outer border (darker)
  //   doc.setDrawColor(0, 0, 0); // Black
  //   doc.setLineWidth(0.8);
  //   doc.rect(x, y, width, height);

  //   // Inner grid (lighter)
  //   const rowHeight = 10;
  //   const colWidths = [40, 60, 40, 50]; // Customize as needed
  //   const numRows = 5;

  //   doc.setDrawColor(150, 150, 150); // Gray
  //   doc.setLineWidth(0.3);

  //   // Horizontal lines
  //   for (let i = 1; i < numRows; i++) {
  //     const yPos = y + i * rowHeight;
  //     doc.line(x, yPos, x + width, yPos);
  //   }

  //   // Vertical lines
  //   let xPos = x;
  //   for (let i = 0; i < colWidths.length - 1; i++) {
  //     xPos += colWidths[i];
  //     doc.line(xPos, y, xPos, y + height);
  //   }
  // };

  const handleExportPDF = (
    items: PurchaseOrderItem[],
    poMeta: PurchaseOrderType
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
      doc.text("PURCHASE ORDER", pageWidth - marginRight, 22, {
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
          poMeta.createdAt
            ? new Date(poMeta.createdAt).toLocaleDateString("en-PH", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })
            : "N/A",
        ],
        ["PO #", poMeta.poNumber?.trim().toUpperCase() || "N/A"],
        ["REF #", poMeta.referenceNumber?.trim().toUpperCase() || "N/A"],
        ["WAREHOUSE", poMeta.warehouse?.trim().toUpperCase() || "N/A"],
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
        ["ORDER FROM", poMeta.supplierName || "N/A"],
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
        head: [["Qty", "Unit", "Description", "Sales Price", "Total"]],
        body: chunk.map((item) => [
          item.quantity ?? 0,
          item.unitType ?? "-",
          item.itemName ?? "-",
          (item.purchasePrice ?? 0).toFixed(2),
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
          4: { halign: "right" }, // Total
        },
        didParseCell: (data) => {
          const colIndex = data.column.index;
          if (data.section === "head") {
            // Align header text
            if (colIndex === 0 || colIndex === 3 || colIndex === 4) {
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

      if (index === chunkedItems.length - 1) {
        doc.setFont("helvetica", "italic").setFontSize(9);
        doc.text("-- Nothing follows --", pageWidth / 2, footerY - 20, {
          align: "center",
        });

        doc.setFont("helvetica", "bold").setFontSize(9);

        const rightX = pageWidth - marginRight - 10;
        const labelOffset = 65;

        doc.text("Total Purchase:", rightX - labelOffset, footerY - 10, {
          align: "left",
        });
        doc.text(totalAmount.toFixed(2), rightX, footerY - 10, {
          align: "right",
        });
      } else {
        const finalY = doc.lastAutoTable?.finalY ?? startY;
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

    doc.save(`${poMeta.poNumber || "purchase_order"}.pdf`);
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
                <DialogHeader className="border-b pb-2">
                  <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
                    Create Purchase Order
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Fill in the invoice details. Fields marked with{" "}
                    <span className="text-red-500">* </span>
                    are required.
                  </DialogDescription>
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
                    </div>

                    <div className="flex flex-row flex-wrap gap-4">
                      {/* Supplier Name */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-supplier-name">
                          Supplier Name <span className="text-red-500">* </span>
                        </Label>

                        <div className="relative">
                          <Input
                            id="create-supplier-name"
                            type="text"
                            autoComplete="off"
                            value={formData.supplierName || ""}
                            onClick={() => setShowSupplierSuggestions(true)}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase(); // ✅ no .trim()
                              setFormData((prev) => ({
                                ...prev,
                                supplierName: value,
                              }));
                              setValidationErrors((prev) => ({
                                ...prev,
                                supplierName: "",
                              }));
                              setShowSupplierSuggestions(true);
                            }}
                            onBlur={() =>
                              setTimeout(
                                () => setShowSupplierSuggestions(false),
                                200
                              )
                            }
                            placeholder="Search supplier name"
                            className={`text-sm w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
                              validationErrors.supplierName
                                ? "border-destructive"
                                : ""
                            }`}
                          />

                          {/* Suggestions Dropdown */}
                          {showSupplierSuggestions && (
                            <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                              {(() => {
                                const input =
                                  formData.supplierName?.trim().toUpperCase() ||
                                  "";
                                const filtered = suppliers.filter(
                                  (supplier) => {
                                    const label =
                                      supplier.supplierName
                                        ?.trim()
                                        .toUpperCase() || "";
                                    return (
                                      input === "" || label.includes(input)
                                    );
                                  }
                                );

                                return filtered.length > 0 ? (
                                  filtered.map((supplier) => {
                                    const label =
                                      supplier.supplierName?.trim() ||
                                      "Unnamed Supplier";
                                    const value = label.toUpperCase();
                                    return (
                                      <li
                                        key={supplier._id || value}
                                        className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            supplierName: value,
                                          }));
                                          setShowSupplierSuggestions(false);
                                        }}>
                                        {label}
                                      </li>
                                    );
                                  })
                                ) : (
                                  <li className="px-3 py-2 text-muted-foreground">
                                    No matching supplier found
                                  </li>
                                );
                              })()}
                            </ul>
                          )}
                        </div>
                        {validationErrors.supplierName && (
                          <p className="text-sm text-destructive">
                            {validationErrors.supplierName}
                          </p>
                        )}
                      </div>

                      {/* Warehouse */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-warehouse">
                          Warehouse <span className="text-red-500">* </span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="create-warehouse"
                            type="text"
                            autoComplete="off"
                            value={formData.warehouse || ""}
                            onClick={() => setShowWarehouseSuggestions(true)}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase(); // ✅ no .trim()
                              setFormData((prev) => ({
                                ...prev,
                                warehouse: value,
                              }));
                              setValidationErrors((prev) => ({
                                ...prev,
                                warehouse: "",
                              }));
                              setShowWarehouseSuggestions(true);
                            }}
                            onBlur={() =>
                              setTimeout(
                                () => setShowWarehouseSuggestions(false),
                                200
                              )
                            }
                            placeholder="Search warehouse"
                            className={`text-sm w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
                              validationErrors.warehouse
                                ? "border-destructive"
                                : ""
                            }`}
                          />

                          {/* Suggestions Dropdown */}
                          {showWarehouseSuggestions && (
                            <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                              {(() => {
                                const input =
                                  formData.warehouse?.trim().toUpperCase() ||
                                  "";
                                const filtered = warehouses.filter(
                                  (warehouse) => {
                                    const label =
                                      warehouse.warehouse_name
                                        ?.trim()
                                        .toUpperCase() || "";
                                    return (
                                      input === "" || label.includes(input)
                                    );
                                  }
                                );

                                return filtered.length > 0 ? (
                                  filtered.map((warehouse) => {
                                    const label =
                                      warehouse.warehouse_name?.trim() ||
                                      "Unnamed Warehouse";
                                    const value = label.toUpperCase();
                                    return (
                                      <li
                                        key={warehouse._id || value}
                                        className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            warehouse: value,
                                          }));
                                          setShowWarehouseSuggestions(false);
                                        }}>
                                        {label}
                                      </li>
                                    );
                                  })
                                ) : (
                                  <li className="px-3 py-2 text-muted-foreground">
                                    No matching warehouse found
                                  </li>
                                );
                              })()}
                            </ul>
                          )}
                        </div>
                        {validationErrors.warehouse && (
                          <p className="text-sm text-destructive">
                            {validationErrors.warehouse}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap gap-4">
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
                          placeholder="Enter reference number"
                          className={`text-sm ${
                            validationErrors.referenceNumber
                              ? "border-destructive bg-muted"
                              : "bg-muted"
                          }`}
                        />
                        {validationErrors.referenceNumber && (
                          <p className="text-sm ">
                            {validationErrors.referenceNumber}
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
                {formData.supplierName && formData.warehouse && (
                  <>
                    <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_20px] gap-4 border-b py-2 mb-4 bg-primary text-primary-foreground rounded-t">
                      {/* Item Code */}
                      <div className="text-xs font-semibold uppercase text-start px-2">
                        Item Code
                      </div>

                      {/* Item Name */}
                      <div className="text-xs font-semibold uppercase text-start px-2">
                        Item Name
                      </div>

                      {/* Quantity */}
                      <div className="text-xs font-semibold uppercase text-end">
                        Qty
                      </div>

                      {/* Unit of Measure */}
                      <div className="text-xs font-semibold uppercase text-start">
                        UOM
                      </div>

                      {/* Purchase Price */}
                      <div className="text-xs font-semibold uppercase text-end px-2">
                        Purchase Price
                      </div>

                      {/* Amount */}
                      <div className="text-xs font-semibold uppercase text-end px-2">
                        Amount
                      </div>

                      {/* Trash Icon Column */}
                      <div className="text-center"></div>
                    </div>

                    {itemsData.map((item, index) => (
                      <div
                        key={index}
                        className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] items-center  border-border text-sm m-0">
                        {/* Item Code */}
                        <input
                          type="text"
                          value={item.itemCode || ""}
                          readOnly
                          className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white"
                        />
                        {/* Item Name */}
                        <div className="relative w-full">
                          <input
                            id={`item-name-${index}`}
                            type="text"
                            autoComplete="off"
                            value={item.itemName || ""}
                            onClick={() => setShowItemSuggestions(index)}
                            onBlur={() =>
                              setTimeout(
                                () => setShowItemSuggestions(null),
                                200
                              )
                            }
                            onChange={(e) => {
                              const value = e.target.value; // allow spaces

                              setItemsData((prev) => {
                                const updated = [...prev];
                                updated[index] = {
                                  ...updated[index],
                                  itemName: value,
                                };
                                return updated;
                              });

                              setFormData((prev) => {
                                const updatedItems = [...prev.items];
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  itemName: value,
                                };
                                return { ...prev, items: updatedItems };
                              });

                              setShowItemSuggestions(index);
                            }}
                            placeholder="Search item name"
                            className="text-sm w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white focus:outline-none focus:ring-1 focus:ring-primary pr-8"
                          />

                          {/* Magnifying Glass Icon */}
                          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
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
                          {showItemSuggestions === index && (
                            <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                              {items
                                .filter((option) =>
                                  option.itemName
                                    ?.toLowerCase()
                                    .includes(
                                      item.itemName?.toLowerCase() || ""
                                    )
                                )
                                .map((option) => {
                                  const query = item.itemName || "";
                                  const name = option.itemName || "";

                                  // Highlight matched part
                                  const parts = name.split(
                                    new RegExp(`(${query})`, "gi")
                                  );

                                  return (
                                    <li
                                      key={option._id || name}
                                      className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                      onMouseDown={(e) => e.preventDefault()} // prevent blur
                                      onClick={() => {
                                        const normalized = name;

                                        setItemsData((prev) => {
                                          const updated = [...prev];
                                          updated[index] = {
                                            ...updated[index],
                                            itemName: normalized,
                                            itemCode: option.itemCode || "",
                                            unitType: option.unitType || "",
                                            purchasePrice:
                                              option.purchasePrice || 0,
                                          };
                                          return updated;
                                        });

                                        setFormData((prev) => {
                                          const updatedItems = [...prev.items];
                                          updatedItems[index] = {
                                            ...updatedItems[index],
                                            itemName: normalized,
                                            itemCode: option.itemCode || "",
                                            unitType: option.unitType || "",
                                            purchasePrice:
                                              option.purchasePrice || 0,
                                            quantity:
                                              updatedItems[index]?.quantity ||
                                              1,
                                          };
                                          return {
                                            ...prev,
                                            items: updatedItems,
                                          };
                                        });

                                        setShowItemSuggestions(null);
                                      }}>
                                      {parts.map((part, i) => (
                                        <span
                                          key={i}
                                          className={
                                            part.toLowerCase() ===
                                            query.toLowerCase()
                                              ? "font-semibold bg-yellow-200"
                                              : ""
                                          }>
                                          {part}
                                        </span>
                                      ))}
                                    </li>
                                  );
                                })}
                              {items.filter((option) =>
                                option.itemName
                                  ?.toLowerCase()
                                  .includes(item.itemName?.toLowerCase() || "")
                              ).length === 0 && (
                                <li className="px-3 py-2 text-muted-foreground">
                                  No matching items found
                                </li>
                              )}
                            </ul>
                          )}
                        </div>

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
                          className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white focus:outline-none focus:ring-1 focus:ring-primary text-end"
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
                          className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-end"
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
                          className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-end"
                        />

                        {/* Trash Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800 pb-1"
                          onClick={() => handleRemoveItem(index)}
                          title="Remove item">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleAddItem}
                      className="w-fit text-sm">
                      + Add Item
                    </Button>
                    <div className="w-full mt-8 overflow-x-auto">
                      <h3 className="text-lg font-semibold text-primary tracking-wide mb-4 border-t py-2 text-end">
                        Order Summary
                      </h3>
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
                                {formData.totalQuantity}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4  text-primary">
                                Total Amount
                              </td>
                              <td className="py-2 px-4 text-right font-semibold text-primary">
                                {formattedTotal}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>{" "}
                    </div>
                  </>
                )}
                {/* Footer Actions */}
                <DialogFooter className="pt-4 border-t">
                  <div className="flex w-full justify-end">
                    {/* Right: Cancel & Create */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          resetForm();
                        }}>
                        Cancel
                      </Button>

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
                          Create
                        </Button>

                        {/* Dropdown for More Actions */}
                        {/* <DropdownMenu>
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
                          </DropdownMenuContent>
                        </DropdownMenu> */}
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
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="h-48 px-4 text-muted-foreground">
                      <div className="flex h-full items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-medium tracking-wide">
                          Loading purchase orders…
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground">
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
                              ? "inline-flex items-center gap-1 text-green-600"
                              : po.status === "PARTIAL"
                              ? "inline-flex items-center gap-1 text-blue-600"
                              : po.status === "PENDING"
                              ? "inline-flex items-center gap-1 text-yellow-600"
                              : po.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                          {po.status.toUpperCase() || "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          {/* Hide Edit and Delete if status is PARTIAL or COMPLETED */}
                          {po.status !== "PARTIAL" &&
                            po.status !== "COMPLETED" && (
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

                          {/* Always show View button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(po)}
                            title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Export PDF button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title={`Export PO ${po.poNumber} to PDF`}
                            aria-label={`Export PO ${po.poNumber} to PDF`}
                            onClick={() =>
                              handleExportPDF(po.items, {
                                _id: po._id,
                                referenceNumber: po.referenceNumber,
                                status: po.status,
                                poNumber: po.poNumber,
                                supplierName: po.supplierName,
                                warehouse: po.warehouse,
                                items: po.items,
                                total: po.total,
                                totalQuantity: po.totalQuantity,
                                createdAt: po.createdAt,
                                updatedAt: po.updatedAt,
                              })
                            }>
                            <Download className="w-4 h-4" />
                          </Button>
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
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Edit Purchase Order
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the order details. Fields marked with{" "}
              <span className="text-red-500">* </span>
              are required.
            </DialogDescription>
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
              </div>

              {/* Second Row */}
              <div className="flex flex-row flex-wrap gap-4">
                {/* Supplier Name */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-supplier-name">
                    Supplier Name <span className="text-red-500">* </span>
                  </Label>

                  <div className="relative">
                    <Input
                      id="edit-supplier-name"
                      type="text"
                      autoComplete="off"
                      value={formData.supplierName || ""}
                      onClick={() => setShowSupplierSuggestions(true)}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase(); // ✅ no .trim()
                        setFormData((prev) => ({
                          ...prev,
                          supplierName: value,
                        }));
                        setValidationErrors((prev) => ({
                          ...prev,
                          supplierName: "",
                        }));
                        setShowSupplierSuggestions(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowSupplierSuggestions(false), 200)
                      }
                      placeholder="Search supplier name"
                      className={`text-sm w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
                        validationErrors.supplierName
                          ? "border-destructive"
                          : ""
                      }`}
                    />

                    {/* Suggestions Dropdown */}
                    {showSupplierSuggestions && (
                      <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                        {(() => {
                          const input =
                            formData.supplierName?.trim().toUpperCase() || "";
                          const filtered = suppliers.filter((supplier) => {
                            const label =
                              supplier.supplierName?.trim().toUpperCase() || "";
                            return input === "" || label.includes(input);
                          });

                          return filtered.length > 0 ? (
                            filtered.map((supplier) => {
                              const label =
                                supplier.supplierName?.trim() ||
                                "Unnamed Supplier";
                              const value = label.toUpperCase();
                              return (
                                <li
                                  key={supplier._id || value}
                                  className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      supplierName: value,
                                    }));
                                    setShowSupplierSuggestions(false);
                                  }}>
                                  {label}
                                </li>
                              );
                            })
                          ) : (
                            <li className="px-3 py-2 text-muted-foreground">
                              No matching supplier found
                            </li>
                          );
                        })()}
                      </ul>
                    )}
                  </div>
                  {validationErrors.supplierName && (
                    <p className="text-sm text-destructive">
                      {validationErrors.supplierName}
                    </p>
                  )}
                </div>

                {/* Warehouse */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-warehouse">
                    Warehouse <span className="text-red-500">* </span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-warehouse"
                      type="text"
                      autoComplete="off"
                      value={formData.warehouse || ""}
                      onClick={() => setShowWarehouseSuggestions(true)}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase(); // ✅ no .trim()
                        setFormData((prev) => ({
                          ...prev,
                          warehouse: value,
                        }));
                        setValidationErrors((prev) => ({
                          ...prev,
                          warehouse: "",
                        }));
                        setShowWarehouseSuggestions(true);
                      }}
                      onBlur={() =>
                        setTimeout(
                          () => setShowWarehouseSuggestions(false),
                          200
                        )
                      }
                      placeholder="Search warehouse"
                      className={`text-sm w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
                        validationErrors.warehouse ? "border-destructive" : ""
                      }`}
                    />

                    {/* Suggestions Dropdown */}
                    {showWarehouseSuggestions && (
                      <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                        {(() => {
                          const input =
                            formData.warehouse?.trim().toUpperCase() || "";
                          const filtered = warehouses.filter((warehouse) => {
                            const label =
                              warehouse.warehouse_name?.trim().toUpperCase() ||
                              "";
                            return input === "" || label.includes(input);
                          });

                          return filtered.length > 0 ? (
                            filtered.map((warehouse) => {
                              const label =
                                warehouse.warehouse_name?.trim() ||
                                "Unnamed Warehouse";
                              const value = label.toUpperCase();
                              return (
                                <li
                                  key={warehouse._id || value}
                                  className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      warehouse: value,
                                    }));
                                    setShowWarehouseSuggestions(false);
                                  }}>
                                  {label}
                                </li>
                              );
                            })
                          ) : (
                            <li className="px-3 py-2 text-muted-foreground">
                              No matching warehouse found
                            </li>
                          );
                        })()}
                      </ul>
                    )}
                  </div>
                  {validationErrors.warehouse && (
                    <p className="text-sm text-destructive">
                      {validationErrors.warehouse}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-row flex-wrap gap-4">
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
            <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_20px] gap-4 border-b py-2 mb-4 bg-primary text-primary-foreground rounded-t">
              {/* Item Code */}
              <div className="text-xs font-semibold uppercase text-start px-2">
                Item Code
              </div>

              {/* Item Name */}
              <div className="text-xs font-semibold uppercase text-start">
                Item Name
              </div>

              {/* Quantity */}
              <div className="text-xs font-semibold uppercase text-end">
                Qty
              </div>

              {/* Unit of Measure */}
              <div className="text-xs font-semibold uppercase text-start ">
                UOM
              </div>

              {/* Sales Price */}
              <div className="text-xs font-semibold uppercase text-end px-2">
                Purchase Price
              </div>

              {/* Amount */}
              <div className="text-xs font-semibold uppercase text-end px-2">
                Amount
              </div>

              {/* Trash Icon Column */}
              <div className="text-center"></div>
            </div>
          </div>

          {formData.items?.map((item, index) => {
            const isZero = item.quantity === 0;

            return (
              <div
                key={index}
                className={`grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] items-center  border-border text-sm m-0 ${
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
                <div className="relative w-full">
                  <input
                    id={`item-name-${index}`}
                    type="text"
                    autoComplete="off"
                    value={item.itemName || ""}
                    onClick={() => setShowItemSuggestions(index)}
                    onBlur={() =>
                      setTimeout(() => setShowItemSuggestions(null), 200)
                    }
                    onChange={(e) => {
                      const value = e.target.value; // allow spaces

                      setItemsData((prev) => {
                        const updated = [...prev];
                        updated[index] = {
                          ...updated[index],
                          itemName: value,
                        };
                        return updated;
                      });

                      setFormData((prev) => {
                        const updatedItems = [...prev.items];
                        updatedItems[index] = {
                          ...updatedItems[index],
                          itemName: value,
                        };
                        return { ...prev, items: updatedItems };
                      });

                      setShowItemSuggestions(index);
                    }}
                    placeholder="Search item name"
                    className="text-sm w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white focus:outline-none focus:ring-1 focus:ring-primary pr-8"
                  />

                  {/* Magnifying Glass Icon */}
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
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
                  {showItemSuggestions === index && (
                    <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                      {items
                        .filter((option) =>
                          option.itemName
                            ?.toLowerCase()
                            .includes(item.itemName?.toLowerCase() || "")
                        )
                        .map((option) => {
                          const query = item.itemName || "";
                          const name = option.itemName || "";

                          // Highlight matched part
                          const parts = name.split(
                            new RegExp(`(${query})`, "gi")
                          );

                          return (
                            <li
                              key={option._id || name}
                              className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                              onMouseDown={(e) => e.preventDefault()} // prevent blur
                              onClick={() => {
                                const normalized = name;

                                setItemsData((prev) => {
                                  const updated = [...prev];
                                  updated[index] = {
                                    ...updated[index],
                                    itemName: normalized,
                                    itemCode: option.itemCode || "",
                                    unitType: option.unitType || "",
                                    purchasePrice: option.purchasePrice || 0,
                                  };
                                  return updated;
                                });

                                setFormData((prev) => {
                                  const updatedItems = [...prev.items];
                                  updatedItems[index] = {
                                    ...updatedItems[index],
                                    itemName: normalized,
                                    itemCode: option.itemCode || "",
                                    unitType: option.unitType || "",
                                    purchasePrice: option.purchasePrice || 0,
                                    quantity:
                                      updatedItems[index]?.quantity || 1,
                                  };
                                  return { ...prev, items: updatedItems };
                                });

                                setShowItemSuggestions(null);
                              }}>
                              {parts.map((part, i) => (
                                <span
                                  key={i}
                                  className={
                                    part.toLowerCase() === query.toLowerCase()
                                      ? "font-semibold bg-yellow-200"
                                      : ""
                                  }>
                                  {part}
                                </span>
                              ))}
                            </li>
                          );
                        })}
                      {items.filter((option) =>
                        option.itemName
                          ?.toLowerCase()
                          .includes(item.itemName?.toLowerCase() || "")
                      ).length === 0 && (
                        <li className="px-3 py-2 text-muted-foreground">
                          No matching items found
                        </li>
                      )}
                    </ul>
                  )}
                </div>

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
                      ? "bg-green-50 text-green-700 cursor-not-allowed text-end"
                      : "bg-white text-end"
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
                  className={`w-full px-2 py-1 border border-border border-l-0 border-t-0 text-end${
                    isZero
                      ? "bg-green-50 text-green-700 text-end"
                      : "bg-white text-end"
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
                  className={`w-full px-2 py-1 border border-border border-l-0 border-t-0 text-end${
                    isZero
                      ? "bg-green-50 text-green-700 text-end"
                      : "bg-white text-end"
                  }`}
                />

                {/* Trash Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-800 pb-1"
                  onClick={() => handleRemoveItem(index)}
                  title="Remove item">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
          {/* Left: Add Item */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleAddItemEdit}
            className="w-fit text-sm">
            + Add Item
          </Button>

          <div className="w-full mt-8 overflow-x-auto">
            <h3 className="text-lg font-semibold text-primary tracking-wide mb-4 border-t py-2 text-end">
              Order Summary
            </h3>
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
                      {formData.totalQuantity ?? 0}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4  text-primary">Total Amount</td>
                    <td className="py-2 px-4 text-right font-semibold text-primary">
                      {formattedNewTotal ?? "₱0.00"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-4 border-t">
            <div className="flex w-full justify-end items-center gap-2">
              {/* Right: Cancel & Update */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingPO(null);
                    resetForm();
                  }}>
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  <div className="flex w-full justify-end items-center gap-2">
                    {/* Primary Update Button */}
                    <Button
                      onClick={handleUpdate}
                      disabled={
                        !formData.items.length ||
                        formData.items.every((item) => !item.itemName?.trim())
                      }
                      className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm transition-colors duration-150"
                      aria-label="Update">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogFooter>
        </DialogPanel>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="w-full px-6 py-6">
          <DialogTitle className="sr-only">Purchase Order</DialogTitle>

          {/* 🧾 Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold text-primary tracking-wide">
                Purchase Order
              </h2>
              <p className="text-sm text-muted-foreground">
                Purchase Order No:{" "}
                <span className=" text-foreground font-semibold">
                  {viewingPO?.poNumber || "—"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Reference No.:{" "}
                <span className="text-foreground font-semibold">
                  {viewingPO?.referenceNumber || "—"}
                </span>
              </p>
            </div>
            <div className="text-sm text-right text-muted-foreground">
              <p>
                Transaction Date:{" "}
                <span className="text-foreground">
                  {viewingPO?.createdAt
                    ? new Date(viewingPO.createdAt).toLocaleDateString(
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
                    viewingPO?.status === "COMPLETED"
                      ? "text-green-600"
                      : viewingPO?.status === "PARTIAL"
                      ? "text-blue-600"
                      : viewingPO?.status === "PENDING"
                      ? "text-yellow-600"
                      : "text-muted-foreground"
                  }`}>
                  {viewingPO?.status || "—"}
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
                  {viewingPO?.supplierName || "—"}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Warehouse Name:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {viewingPO?.warehouse || "—"}
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
                  title={viewingPO?.remarks}>
                  {viewingPO?.remarks?.trim() || (
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
                {viewingPO?.items?.map((item, index) => {
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
                    {(viewingPO?.items ?? []).reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4  text-primary">Total Amount</td>
                  <td className="py-2 px-4 text-right font-semibold text-primary">
                    {(viewingPO?.items ?? [])
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

          {/* 🔘 Footer */}
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
