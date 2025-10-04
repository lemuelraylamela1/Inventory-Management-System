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
  SalesOrder,
  SalesOrderItem,
  WarehouseType,
  Customer,
  ItemType,
} from "./type";

import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { cn } from "../ui/utils";

type Props = {
  onSuccess?: () => void;
};

export default function SalesOrder({ onSuccess }: Props) {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [paginatedSalesOrders, setPaginatedSalesOrders] = useState<
    SalesOrder[]
  >([]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [editingSO, setEditingSO] = useState<SalesOrder | null>(null);
  const [viewingSO, setViewingSO] = useState<SalesOrder | null>(null);
  const [showItemSuggestions, setShowItemSuggestions] = useState<number | null>(
    null
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredSOs, setFilteredSOs] = useState<SalesOrder[]>([]);

  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showWarehouseSuggestions, setShowWarehouseSuggestions] =
    useState(false);

  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<ItemType[]>([]);

  const [itemsData, setItemsData] = useState<SalesOrderItem[]>([
    {
      _id: "",
      itemCode: "",
      itemName: "",
      description: "",
      unitType: "",
      price: 0,
      quantity: 1,
      amount: 0,
    },
  ]);

  useEffect(() => {
    console.log("Fetching customers...");

    fetch("/api/customers")
      .then((res) => res.json())
      .then((response) => {
        console.log("Raw response:", response);

        const data = Array.isArray(response?.items) ? response.items : [];

        console.log("Parsed customers:", data);
        setCustomers(data); // ✅ Should match CustomerType[]
      })
      .catch((err) => console.error("Failed to fetch customers", err));
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
    Omit<SalesOrder, "_id" | "createdAt" | "updatedAt">
  >({
    soNumber: "",
    customer: "",
    salesPerson: "",
    warehouse: "",
    transactionDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    shippingAddress: "",
    notes: "",
    status: "PENDING",
    items: [],
    total: 0,
    totalQuantity: 0,
    balance: 0,
    creationDate: new Date().toISOString().split("T")[0],
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<
      keyof Omit<SalesOrder, "_id" | "createdAt" | "updatedAt" | "items">,
      string
    >
  >({
    soNumber: "",
    customer: "",
    salesPerson: "",
    warehouse: "",
    transactionDate: "",
    deliveryDate: "",
    shippingAddress: "",
    notes: "",
    status: "",
    total: "",
    totalQuantity: "",
    balance: "",
    creationDate: "",
  });

  // Filter and paginate data
  const normalizeString = (value?: string) =>
    (value ?? "").toLowerCase().trim();

  const filteredSalesOrders = useMemo(() => {
    if (!Array.isArray(salesOrders)) return [];

    const query = normalizeString(searchTerm);
    const normalizedCustomerFilter = normalizeString(customerFilter);
    const normalizedStatusFilter = normalizeString(statusFilter);
    const normalizedDateFilter = dateFilter?.trim() ?? "";

    return salesOrders.filter((so) => {
      const soNumber = normalizeString(so.soNumber?.toString());
      const customer = normalizeString(so.customer);
      const status = normalizeString(so.status);
      const createdDate = (so.createdAt ?? "").slice(0, 10);

      const matchesSearch =
        !query || soNumber.includes(query) || customer.includes(query);

      const matchesDate =
        !normalizedDateFilter || createdDate === normalizedDateFilter;

      const matchesCustomer =
        customerFilter === "all" || customer === normalizedCustomerFilter;

      const matchesStatus =
        statusFilter === "all" || status === normalizedStatusFilter;

      return matchesSearch && matchesDate && matchesCustomer && matchesStatus;
    });
  }, [salesOrders, searchTerm, dateFilter, customerFilter, statusFilter]);

  const totalPages = useMemo(
    () => Math.ceil(filteredSalesOrders.length / rowsPerPage),
    [filteredSalesOrders.length, rowsPerPage]
  );

  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    const sliced = filteredSalesOrders.slice(start, end);

    console.log("📊 Pagination range:", start, end);
    console.log("📦 Filtered sales orders:", filteredSalesOrders);
    console.log("📄 Paginated sales orders:", sliced);

    setPaginatedSalesOrders(sliced);
  }, [filteredSalesOrders, currentPage, rowsPerPage]);

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setCustomerFilter("all");
    setStatusFilter("all");
  };

  const allSelected =
    paginatedSalesOrders.length > 0 &&
    selectedIds.length === paginatedSalesOrders.length;

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Validation functions
  const validateForm = (isEdit = false) => {
    const errors: Record<
      keyof Omit<SalesOrder, "_id" | "createdAt" | "updatedAt" | "items">,
      string
    > = {
      soNumber: "",
      customer: "",
      salesPerson: "",
      warehouse: "",
      transactionDate: "",
      deliveryDate: "",
      shippingAddress: "",
      notes: "",
      status: "",
      total: "",
      totalQuantity: "",
      balance: "",
      creationDate: "",
    };

    // Required: customer
    if (!formData.customer.trim()) {
      errors.customer = "Customer is required";
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

      if (Number(item.price) < 0) {
        itemError.price = "Price must be zero or greater";
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
        const price = Number(item.price) || 0;

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
      balance: total, // ✅ optional: reset balance to match total
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
      price: Number(item.price) || 0,
      itemCode: item.itemCode?.trim().toUpperCase() || "",
      description: item.description?.trim() || "",
      amount: Number(item.quantity) * Number(item.price),
    }));

    const { total, totalQuantity } = normalizedItems.reduce(
      (acc, item) => {
        acc.total += item.amount;
        acc.totalQuantity += item.quantity;
        return acc;
      },
      { total: 0, totalQuantity: 0 }
    );
    console.log(total, totalQuantity);

    const payload = {
      soNumber: formData.soNumber.trim().toUpperCase(),
      customer: formData.customer.trim().toUpperCase(),
      salesPerson: formData.salesPerson.trim().toUpperCase(),
      warehouse: formData.warehouse.trim().toUpperCase(),
      transactionDate: formData.transactionDate,
      deliveryDate: formData.deliveryDate,
      shippingAddress: formData.shippingAddress?.trim() || "",
      notes: formData.notes?.trim() || "",
      status: formData.status?.trim() || "PENDING",
      creationDate: formData.creationDate,
      items: normalizedItems,
      total,
      totalQuantity,
      balance: Number(formData.balance ?? total) || 0,
    };

    console.log("Creating sales order:", payload);

    try {
      const res = await fetch("/api/sales-orders", {
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
        alert("Failed to create sales order. Please try again.");
        return;
      }

      toast.success("Sales order created successfully!");

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
    keyof Omit<SalesOrder, "_id" | "createdAt" | "updatedAt" | "items">,
    string
  > = {
    soNumber: "",
    customer: "",
    salesPerson: "",
    warehouse: "",
    transactionDate: "",
    deliveryDate: "",
    shippingAddress: "",
    notes: "",
    status: "",
    total: "",
    totalQuantity: "",
    balance: "",
    creationDate: "",
  };

  const allowedStatuses: SalesOrder["status"][] = [
    "PENDING",
    "PARTIAL",
    "CANCELLED",
    "COMPLETED",
  ];

  const handleEdit = (so: SalesOrder) => {
    setEditingSO(so);

    const editableItems = so.items
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => ({
        _id: item._id,
        itemName: item.itemName?.trim().toUpperCase() || "",
        quantity: Math.max(Number(item.quantity) || 1, 1),
        unitType: item.unitType?.trim().toUpperCase() || "",
        price: Number(item.price) || 0,
        itemCode: item.itemCode?.trim().toUpperCase() || "",
        description: item.description?.trim() || "",
        amount: Number(item.quantity) * Number(item.price),
      }));

    const totalQuantity = editableItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = editableItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const normalizedStatus = so.status?.trim().toUpperCase();
    const status: SalesOrder["status"] = allowedStatuses.includes(
      normalizedStatus as SalesOrder["status"]
    )
      ? (normalizedStatus as SalesOrder["status"])
      : "PENDING";

    const normalizedFormData: Omit<
      SalesOrder,
      "_id" | "createdAt" | "updatedAt"
    > = {
      soNumber: so.soNumber.trim().toUpperCase(),
      customer: so.customer?.trim().toUpperCase() || "",
      salesPerson: so.salesPerson?.trim().toUpperCase() || "",
      warehouse: so.warehouse?.trim().toUpperCase() || "",
      transactionDate: so.transactionDate,
      deliveryDate: so.deliveryDate,
      shippingAddress: so.shippingAddress?.trim() || "",
      notes: so.notes?.trim() || "",
      status,
      creationDate: so.creationDate,
      items: editableItems,
      total: totalAmount,
      totalQuantity,
      balance:
        typeof so.balance === "number" && !isNaN(so.balance)
          ? so.balance
          : totalAmount,
    };

    setFormData(normalizedFormData);
    setSelectedIds(Array(editableItems.length).fill(true)); // default to all selected
    setValidationErrors(defaultValidationErrors);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingSO || !validateForm(true)) {
      console.warn("Validation failed or editingSO is missing:", { editingSO });
      return;
    }

    const selectedIdsSafe =
      selectedIds.length === formData.items.length
        ? selectedIds
        : formData.items.map(() => true);

    const normalizedItems: SalesOrderItem[] = formData.items
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => selectedIdsSafe[index])
      .map(({ item, index }) => {
        const fallbackId = editingSO.items?.[index]?._id ?? crypto.randomUUID(); // fallback if missing
        return {
          _id: item._id ?? fallbackId,
          itemCode: item.itemCode?.trim().toUpperCase() || "",
          itemName: item.itemName?.trim().toUpperCase() || "",
          unitType: item.unitType?.trim().toUpperCase() || "",
          quantity: Math.max(Number(item.quantity) || 1, 1),
          price: Number(item.price) || 0,
          description: item.description?.trim() || "",
          amount: Number(item.quantity) * Number(item.price),
        };
      });

    const totalQuantity = normalizedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const rawStatus = formData.status?.trim().toUpperCase();
    const status: SalesOrder["status"] = allowedStatuses.includes(
      rawStatus as SalesOrder["status"]
    )
      ? (rawStatus as SalesOrder["status"])
      : "PENDING";

    const payload: Partial<SalesOrder> = {
      soNumber: formData.soNumber.trim().toUpperCase(),
      customer: formData.customer.trim().toUpperCase(),
      salesPerson: formData.salesPerson.trim().toUpperCase(),
      warehouse: formData.warehouse.trim().toUpperCase(),
      transactionDate: formData.transactionDate,
      deliveryDate: formData.deliveryDate,
      shippingAddress: formData.shippingAddress?.trim() || "",
      notes: formData.notes?.trim() || "",
      status,
      creationDate: formData.creationDate,
      items: normalizedItems,
      total: totalAmount,
      totalQuantity,
      balance:
        typeof formData.balance === "number" && !isNaN(formData.balance)
          ? formData.balance
          : totalAmount,
    };

    console.log("📦 Sending update payload:", payload);

    try {
      const res = await fetch(`/api/sales-orders/${editingSO._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("📡 Response status:", res.status);
      console.log("✅ Parsed updated SO:", result);

      if (!res.ok) {
        console.error("❌ Update failed:", res.status, result);
        alert(`Update failed: ${result?.error || "Unknown error"}`);
        return;
      }

      setSalesOrders((prev) =>
        prev.map((so) => (so._id === result._id ? result : so))
      );
    } catch (err) {
      console.error("🔥 Network or unexpected error:", err);
      alert("Something went wrong while updating the sales order.");
      return;
    }

    // ✅ Reset state
    setEditingSO(null);
    setFormData({
      soNumber: "",
      customer: "",
      salesPerson: "",
      warehouse: "",
      transactionDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      shippingAddress: "",
      notes: "",
      status: "PENDING",
      creationDate: new Date().toISOString().split("T")[0],
      items: [],
      total: 0,
      totalQuantity: 0,
      balance: 0,
    });
    setSelectedIds([]);
    setValidationErrors(defaultValidationErrors);
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (soId: string) => {
    if (!soId || typeof soId !== "string") {
      console.warn("Invalid SO ID:", soId);
      toast.error("Invalid sales order ID");
      return;
    }

    try {
      const res = await fetch(`/api/sales-orders/${soId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to delete sales order");
      }

      // Remove from local state
      setSalesOrders((prev) => prev.filter((so) => so._id !== soId));

      console.log("✅ Deleted sales order:", soId);
      toast.success(`Sales order #${soId} deleted`);
    } catch (error) {
      console.error("❌ Error deleting sales order:", error);
      toast.error(`Failed to delete SO #${soId}`);
    }
  };

  const handleView = (so: SalesOrder) => {
    setViewingSO(so);
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
      soNumber: "",
      customer: "",
      salesPerson: "",
      warehouse: "",
      transactionDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      shippingAddress: "",
      notes: "",
      status: "PENDING",
      creationDate: new Date().toISOString().split("T")[0],
      items: [],
      total: 0,
      totalQuantity: 0,
      balance: 0,
    });

    setValidationErrors({
      soNumber: "",
      customer: "",
      salesPerson: "",
      warehouse: "",
      transactionDate: "",
      deliveryDate: "",
      shippingAddress: "",
      notes: "",
      status: "",
      creationDate: "",
      total: "",
      totalQuantity: "",
      balance: "",
    });
  };

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      // Select all sales orders on current page
      const newSelections = [
        ...selectedIds,
        ...paginatedSalesOrders
          .filter((so) => !selectedIds.includes(so._id))
          .map((so) => so._id),
      ];
      setSelectedIds(newSelections);
    } else if (checked === false) {
      // Unselect all sales orders on current page
      const remaining = selectedIds.filter(
        (id) => !paginatedSalesOrders.some((so) => so._id === id)
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
      toast.error("No sales orders selected for deletion.");
      return;
    }

    try {
      // Optimistically remove from UI
      setSalesOrders((prev) => prev.filter((so) => !_ids.includes(so._id)));

      const results = await Promise.allSettled(
        _ids.map(async (_id) => {
          const res = await fetch(`/api/sales-orders/${_id}`, {
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
          `Some sales orders could not be deleted (${failures.length} failed).`
        );
      } else {
        toast.success("✅ Selected sales orders deleted.");
      }

      setSelectedIds([]);
      onSuccess?.(); // refresh list
    } catch (err) {
      console.error("❌ Bulk delete failed:", err);
      toast.error("Failed to delete selected sales orders.");
    }
  };

  const fetchSalesOrders = async () => {
    try {
      const res = await fetch("/api/sales-orders", {
        cache: "no-store",
      });

      console.log("📡 Fetch status:", res.status);

      if (!res.ok) throw new Error("Failed to fetch sales orders");

      const raw = await res.json();
      console.log("🧾 Raw response data:", raw);

      const parsed = Array.isArray(raw.salesOrders) ? raw.salesOrders : [];
      console.log("✅ Parsed salesOrders:", parsed);

      setSalesOrders(parsed);
    } catch (error) {
      console.error("❌ Error loading sales orders:", error);
      setSalesOrders([]);
    }
  };

  useEffect(() => {
    fetchSalesOrders(); // initial fetch

    const interval = setInterval(() => {
      fetchSalesOrders();
    }, 1000); // 1 second polling

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const params = useParams();
  const soId = params?.id as string;

  useEffect(() => {
    if (soId) fetchSingleSO(soId);
  }, [soId]);

  const fetchSingleSO = async (soId: string) => {
    try {
      const res = await fetch(`/api/sales-orders/${soId}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch Sales Order");

      const data = await res.json();

      const normalizedItems = (data.items || []).map(
        (item: SalesOrderItem) => ({
          itemName: item.itemName?.trim().toUpperCase() || "",
          quantity: Number(item.quantity) || 0,
          unit: item.unitType?.trim().toUpperCase() || "",
          price: Number(item.price) || 0,
          itemCode: item.itemCode?.trim().toUpperCase() || "",
          description: item.description?.trim() || "",
          amount: Number(item.quantity) * Number(item.price),
        })
      );

      setItemsData(normalizedItems);
      setFormData({ ...data, items: normalizedItems });
    } catch (error) {
      console.error("Error loading Sales Order:", error);
      setItemsData([]);
      setFormData({} as SalesOrder);
    }
  };
  const handleAddItem = () => {
    setItemsData((prev) => [
      ...prev,
      {
        _id: crypto.randomUUID(), // or use nanoid() if preferred
        itemCode: "",
        itemName: "",
        description: "",
        unitType: "",
        price: 0,
        quantity: 1,
        amount: 0,
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
    const newItem: SalesOrderItem = {
      _id: crypto.randomUUID(), // ensures uniqueness and satisfies required field
      itemCode: "",
      itemName: "",
      description: "",
      unitType: "",
      price: 0,
      quantity: 1,
      amount: 0,
    };

    setFormData((prev) => {
      const updatedItems = [...prev.items, newItem];

      const totalQuantity = updatedItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );

      const total = updatedItems.reduce(
        (sum, item) => sum + (item.amount || item.quantity * item.price),
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
      (sum, item) => sum + item.amount || item.quantity * item.price,
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

  const recalculateTotals = (items: SalesOrderItem[]) => {
    const totalQuantity = items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    const totalAmount = items.reduce(
      (sum, item) => sum + (item.amount || item.quantity * item.price || 0),
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

  const handleTagAsComplete = async (soId: string) => {
    try {
      const res = await fetch(`/api/sales-orders/${soId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!res.ok) throw new Error("Failed to update Sales Order status");

      const updatedSO = await res.json();

      // Update local state
      setPaginatedSalesOrders((prev) =>
        prev.map((so) =>
          so._id === soId ? { ...so, status: updatedSO.status } : so
        )
      );

      toast.success(`SO ${updatedSO.soNumber} marked as completed`);
    } catch (error) {
      console.error("❌ Error tagging SO as complete:", error);
      toast.error("Could not tag SO as complete");
    }
  };

  const handleExportPDF = (
    items: SalesOrderItem[],
    soMeta: {
      soNumber: string;
      customer: string;
      salesPerson: string;
      warehouse: string;
      status: string;
      notes?: string;
    }
  ) => {
    if (!items?.length) {
      toast.error("No items to export");
      return;
    }

    const doc = new jsPDF();
    const title = "Sales Order Summary";

    // 🧾 Summary Section
    const summaryLines = [
      `SO Number: ${soMeta.soNumber}`,
      `Customer: ${soMeta.customer}`,
      `Sales Person: ${soMeta.salesPerson}`,
      `Warehouse: ${soMeta.warehouse}`,
      `Status: ${soMeta.status}`,
      `Notes: ${soMeta.notes?.trim() || "—"}`,
    ];

    doc.setFontSize(16);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    summaryLines.forEach((line, i) => {
      doc.text(line, 14, 28 + i * 6);
    });

    const tableStartY = 28 + summaryLines.length * 6 + 10;

    // 📊 Table Data
    const tableHead = [
      ["Item Code", "Item Name", "UOM", "Price", "Qty", "Amount"],
    ];
    const tableBody = items.map((item) => [
      item.itemCode ?? "—",
      item.itemName ?? "—",
      item.unitType ?? "—",
      `₱${(item.price ?? 0).toFixed(2)}`,
      `${item.quantity ?? 0}`,
      `₱${(item.amount ?? (item.quantity ?? 0) * (item.price ?? 0)).toFixed(
        2
      )}`,
    ]);

    // ➕ Totals Row
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

    const totalAmt = items.reduce(
      (sum, i) => sum + (i.amount ?? i.quantity * i.price),
      0
    );

    tableBody.push([
      "",
      "",
      "",
      "Total",
      `${totalQty}`,
      `₱${totalAmt.toFixed(2)}`,
    ]);

    // 🧷 Render Table
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

    // 🕒 Timestamp Footer
    doc.setFontSize(8);
    const finalY = doc.lastAutoTable?.finalY ?? 100; // fallback Y if undefined
    doc.text(
      `Generated on: ${new Date().toLocaleString("en-PH")}`,
      14,
      finalY + 10
    );

    // 📁 Save PDF
    const safeNumber = soMeta.soNumber.replace(/[^\w\-]/g, "_");
    doc.save(`SO-${safeNumber}.pdf`);
    toast.success("PDF exported successfully");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Sales Order</CardTitle>
              <CardDescription>Manage sales orders</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search SO Number or Customer Name..."
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
                  Create Sales Order
                </Button>
              </DialogTrigger>

              <DialogPanel className="space-y-6">
                {/* Header */}
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    Create Sales Order
                  </DialogTitle>
                </DialogHeader>

                {/* Form Content Slot (optional placeholder) */}
                <div className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-row flex-wrap gap-4">
                      {/* SO Number */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-so-number">SO Number</Label>
                        <Input
                          id="create-so-number"
                          value={"Auto-generated"}
                          readOnly
                          disabled
                          placeholder="Auto-generated"
                          className="text-sm uppercase bg-muted cursor-not-allowed"
                        />
                      </div>

                      {/* Transaction Date */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="transaction-date">
                          Transaction Date
                        </Label>
                        <Input
                          id="transaction-date"
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
                      {/* Customer Name */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-customer-name">
                          Customer Name
                        </Label>

                        <div className="relative">
                          <Input
                            id="create-customer-name"
                            type="text"
                            autoComplete="off"
                            value={formData.customer || ""}
                            onClick={() => setShowCustomerSuggestions(true)}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase(); // ✅ no .trim()
                              setFormData((prev) => ({
                                ...prev,
                                customer: value,
                              }));
                              setValidationErrors((prev) => ({
                                ...prev,
                                customer: "",
                              }));
                              setShowCustomerSuggestions(true);
                            }}
                            onBlur={() =>
                              setTimeout(
                                () => setShowCustomerSuggestions(false),
                                200
                              )
                            }
                            placeholder="Search customer name"
                            className={`text-sm uppercase w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
                              validationErrors.customer
                                ? "border-destructive"
                                : ""
                            }`}
                          />

                          {/* Suggestions Dropdown */}
                          {showCustomerSuggestions && (
                            <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                              {(() => {
                                const input =
                                  formData.customer?.trim().toUpperCase() || "";
                                const filtered = customers.filter(
                                  (customer) => {
                                    const label =
                                      customer.customerName
                                        ?.trim()
                                        .toUpperCase() || "";
                                    return (
                                      input === "" || label.includes(input)
                                    );
                                  }
                                );

                                return filtered.length > 0 ? (
                                  filtered.map((customer) => {
                                    const label =
                                      customer.customerName?.trim() ||
                                      "Unnamed Customer";
                                    const value = label.toUpperCase();
                                    return (
                                      <li
                                        key={customer._id || value}
                                        className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            customer: value,
                                          }));
                                          setShowCustomerSuggestions(false);
                                        }}>
                                        {label}
                                      </li>
                                    );
                                  })
                                ) : (
                                  <li className="px-3 py-2 text-muted-foreground">
                                    No matching customer found
                                  </li>
                                );
                              })()}
                            </ul>
                          )}
                        </div>

                        {validationErrors.customer && (
                          <p className="text-sm text-destructive">
                            {validationErrors.customer}
                          </p>
                        )}
                      </div>

                      {/* Warehouse */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-warehouse">Warehouse</Label>
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
                            className={`text-sm uppercase w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
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
                </div>
                {formData.warehouse && (
                  <>
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
                      <div className="text-center"></div>{" "}
                      {/* Trash icon column */}
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
                              const value = e.target.value.toUpperCase().trim();

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
                            className="text-sm uppercase w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white focus:outline-none focus:ring-1 focus:ring-primary pr-8"
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
                                    ?.trim()
                                    .toUpperCase()
                                    .includes(
                                      item.itemName?.toUpperCase() || ""
                                    )
                                )
                                .map((option) => {
                                  const normalized = option.itemName
                                    ?.trim()
                                    .toUpperCase();
                                  return (
                                    <li
                                      key={option._id || normalized}
                                      className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                      onClick={() => {
                                        setItemsData((prev) => {
                                          const updated = [...prev];
                                          updated[index] = {
                                            ...updated[index],
                                            itemName: normalized,
                                            itemCode: option.itemCode || "",
                                            unitType: option.unitType || "",
                                            price: option.purchasePrice || 0,
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
                                            price: option.purchasePrice || 0,
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
                                      {normalized}
                                    </li>
                                  );
                                })}
                              {items.filter((option) =>
                                option.itemName
                                  ?.trim()
                                  .toUpperCase()
                                  .includes(item.itemName?.toUpperCase() || "")
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
                            item.price !== undefined
                              ? item.price.toLocaleString("en-PH", {
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
                            item.price && item.quantity
                              ? (item.price * item.quantity).toLocaleString(
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
                        <span className="text-sm font-medium">
                          Total Amount:
                        </span>
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
                  </>
                )}
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
                  <Label htmlFor="status-filter" className="text-sm">
                    Status:
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: SalesOrder["status"] | "all") =>
                      setStatusFilter(value)
                    }>
                    <SelectTrigger className="w-32" id="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                ✅ {selectedIds.length} sales order(s) selected
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
                      aria-label="Select all sales orders on current page"
                    />
                  </TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedSalesOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground">
                      No sales orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSalesOrders.map((so: SalesOrder) => (
                    <TableRow key={so._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(so._id)}
                          onCheckedChange={() => toggleSelectOne(so._id)}
                        />
                      </TableCell>
                      <TableCell>
                        {so.createdAt ? formatDate(so.createdAt) : "—"}
                      </TableCell>
                      <TableCell>{so.soNumber || "—"}</TableCell>
                      <TableCell>{so.customer || "—"}</TableCell>

                      <TableCell>
                        ₱
                        {so.total?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-block text-sm font-medium px-2 py-1 rounded-full ${
                            so.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : so.status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-800"
                              : so.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                          {so.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(so)}
                            title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>

                          {so.status !== "COMPLETED" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(so)}
                                title="Edit Sales Order">
                                <Edit className="w-4 h-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Delete Sales Order"
                                    className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Sales Order
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete SO&nbsp;
                                      <span className="font-semibold">
                                        {so.soNumber}
                                      </span>
                                      ? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(so._id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}

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
                              {/* <DropdownMenuItem
                                onClick={() => {
                                  const enrichedItems: SalesOrderItem[] =
                                    items.map((item, index) => ({
                                      _id: item._id ?? crypto.randomUUID(),
                                      itemCode: item.itemCode ?? "—",
                                      itemName: item.itemName ?? "—",
                                      unitType: item.unitType ?? "—",
                                      quantity: item.quantity ?? 0,
                                      price: item.purchasePrice ?? 0,
                                      description: item.description ?? "",
                                      amount:
                                        item.amount ??
                                        item.quantity * item.price ??
                                        0,
                                    }));

                                  handleExportPDF(enrichedItems, {
                                    soNumber: so.soNumber,
                                    customer: so.customer,
                                    salesPerson: so.salesPerson,
                                    warehouse: so.warehouse,
                                    status: so.status,
                                    notes: so.notes,
                                  });
                                }}>
                                <FileText className="w-4 h-4 mr-2 text-red-600" />
                                Export as PDF
                              </DropdownMenuItem> */}

                              <DropdownMenuItem
                                onClick={() => handleTagAsComplete(so._id)}
                                disabled={so.status === "COMPLETED"}
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
                {/* SO Number */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-so-number">SO Number</Label>
                  <Input
                    id="edit-so-number"
                    value={formData.soNumber}
                    readOnly
                    disabled
                    placeholder="Auto-generated"
                    className="text-sm uppercase bg-muted cursor-not-allowed"
                  />
                </div>

                {/* Transaction Date */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-transaction-date">
                    Transaction Date
                  </Label>
                  <Input
                    id="edit-transaction-date"
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
                {/* Customer Name */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-customer-name">Customer Name</Label>
                  <Select
                    value={formData.customer}
                    onValueChange={(value) => {
                      const normalized = value.toUpperCase().trim();
                      setFormData((prev) => ({
                        ...prev,
                        customer: normalized,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        customer: "",
                      }));
                    }}>
                    <SelectTrigger
                      className={`text-sm uppercase w-full ${
                        validationErrors.customer ? "border-destructive" : ""
                      }`}>
                      {formData.customer || "Select Customer"}
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(customers) && customers.length > 0 ? (
                        customers.map((customer) => {
                          const label =
                            customer.customerName?.trim() || "Unnamed Customer";
                          const value = label.toUpperCase();
                          return (
                            <SelectItem
                              key={customer._id || value}
                              value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem disabled value="no-customers">
                          No customers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {validationErrors.customer && (
                    <p className="text-sm text-destructive">
                      {validationErrors.customer}
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

                {/* Notes */}
                <div className="flex flex-col flex-[2] min-w-[300px]">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({ ...prev, notes: value }));
                      setValidationErrors((prev) => ({ ...prev, notes: "" }));
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
                        price: selected.purchasePrice || 0,
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
                    item.price !== undefined
                      ? item.price.toLocaleString("en-PH", {
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
                    item.price && item.quantity
                      ? (item.price * item.quantity).toLocaleString("en-PH", {
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
                    setEditingSO(null);
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
            <DialogTitle>SO Details</DialogTitle>
          </DialogHeader>

          {viewingSO && (
            <div className="grid gap-6 py-4">
              <Card className="p-6 rounded-xl shadow-sm border border-border">
                <h4 className="text-xl font-bold text-primary text-center mb-6 tracking-tight">
                  Sales Order Info
                </h4>

                {/* Header Row */}
                <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] border-b py-3 mb-4 bg-primary text-primary-foreground rounded-t shadow-sm">
                  <div className="text-xs font-semibold uppercase text-center tracking-wide">
                    SO Number
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Customer
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Sales Person
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Warehouse
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Status
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border-l border-border">
                    Notes
                  </div>
                  <div className="text-center border-l border-border"></div>
                </div>

                {/* Data Row */}
                <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] items-center border-b py-2 text-sm">
                  <div className="text-center uppercase border-l border-border">
                    {viewingSO.soNumber || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingSO.customer || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingSO.salesPerson || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingSO.warehouse || "—"}
                  </div>
                  <div className="text-center uppercase border-l border-border">
                    {viewingSO.status || "—"}
                  </div>
                  <div
                    className="text-center uppercase border-l border-border max-w-[160px] truncate whitespace-nowrap overflow-hidden"
                    title={viewingSO.notes}>
                    {viewingSO.notes || "—"}
                  </div>
                </div>

                {/* Item Table Header */}
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
                    Price
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border border-border">
                    Quantity
                  </div>
                  <div className="text-xs font-semibold uppercase text-center tracking-wide border border-border">
                    Amount
                  </div>
                </div>

                {/* Item Rows */}
                {viewingSO.items?.map((item, index) => {
                  const isZero = item.quantity === 0;
                  return (
                    <div
                      key={index}
                      className={`grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] items-center text-sm py-2 px-1 rounded-md transition-all duration-150 ${
                        isZero
                          ? "bg-green-50 text-green-700 animate-fade-in"
                          : "even:bg-muted/5 hover:ring-1 hover:ring-muted"
                      }`}>
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.itemCode || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.itemName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.unitType || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.price !== undefined ? (
                          item.price.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="text-center uppercase px-3 font-semibold">
                        {item.quantity ?? (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </div>
                      <div className="text-center uppercase px-3 font-semibold">
                        {(
                          item.amount ||
                          item.quantity * item.price ||
                          0
                        ).toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Totals */}
                <div className="flex w-full justify-end mt-4 gap-6">
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-sm font-medium">Total Qty:</span>
                    <span className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input w-full text-right">
                      {viewingSO.totalQuantity ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-sm font-semibold bg-muted px-3 py-2 rounded border border-input w-full text-right">
                      {viewingSO.items
                        ?.reduce(
                          (sum, item) =>
                            sum +
                            (item.amount || item.quantity * item.price || 0),
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
