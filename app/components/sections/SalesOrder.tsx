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

import {
  Plus,
  Search,
  Edit,
  Trash2,
  XCircle,
  Check,
  CheckCircle,
  Clock,
  ClipboardList,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  SalesOrder,
  SalesOrderItem,
  WarehouseType,
  Customer,
  InventoryItem,
  ItemType,
  CustomerType,
} from "./type";

import {
  formatWeight,
  formatCBM,
  computeNetTotal,
  computePesoDiscount,
  computeSubtotal,
} from "@/libs/salesOrderMetrics";

import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { cn } from "../ui/utils";

type Props = {
  onSuccess?: () => void;
};

const statusOptions = [
  {
    label: "Tag as Pending",
    value: "PENDING",
    color: "text-yellow-600",
    icon: Clock,
  },
  {
    label: "Tag as To Prepare",
    value: "TO PREPARE",
    color: "text-blue-600",
    icon: ClipboardList,
  },
  {
    label: "Tag as Completed",
    value: "COMPLETED",
    color: "text-green-600",
    icon: CheckCircle,
  },
  {
    label: "Tag as Cancelled",
    value: "CANCELLED",
    color: "text-red-600",
    icon: XCircle,
  },
];

type Status = (typeof statusOptions)[number]["value"];

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
  const [editingIds, setEditingIds] = useState<string[]>([]);

  const [dateFilter, setDateFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredSOs, setFilteredSOs] = useState<SalesOrder[]>([]);
  const [itemCatalog, setItemCatalog] = useState<ItemType[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showWarehouseSuggestions, setShowWarehouseSuggestions] =
    useState(false);

  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [itemsData, setItemsData] = useState<SalesOrderItem[]>([
    {
      _id: "",
      itemCode: "",
      itemName: "",
      unitType: "",
      price: 0,
      quantity: 1,
      amount: 0,
    },
  ]);

  const router = useRouter();

  const [formData, setFormData] = useState<
    Omit<SalesOrder, "_id" | "createdAt" | "updatedAt"> & {
      customerType?: string;
      customerTypeData?: CustomerType;
    }
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
    formattedWeight: "0.00 kg",
    formattedCBM: "0.000 m³",
    formattedTotal: "0.00",
    formattedNetTotal: "0.00",
    formattedPesoDiscount: "0.00%",
    discounts: [],
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
    formattedWeight: "",
    formattedCBM: "",
    formattedTotal: "",
    formattedNetTotal: "",
    formattedPesoDiscount: "",
    discounts: "",
  });

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((response) => {
        const data = Array.isArray(response?.items) ? response.items : [];
        console.log("📦 Fetched items:", data);
        setItemCatalog(data); // ✅ triggers re-render
      })
      .catch((err) => console.error("❌ Failed to fetch items", err));
  }, []);

  const salesPriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    itemCatalog.forEach((item) => {
      const key = item.itemName?.trim().toUpperCase();
      map[key] = item.salesPrice ?? 0;
    });
    console.log("🧾 salesPriceMap built:", map);
    return map;
  }, [itemCatalog]);

  const totalWeight = useMemo(() => {
    if (!Array.isArray(formData.items)) return 0;

    return formData.items.reduce((sum, entry) => {
      const itemName = entry.itemName?.trim().toUpperCase();
      const quantity = entry.quantity ?? 0;
      const item = itemCatalog.find(
        (i) => i.itemName?.trim().toUpperCase() === itemName
      );
      const weight = item?.weight ?? 0;
      return sum + weight * quantity;
    }, 0);
  }, [formData.items, itemCatalog]);

  const formattedWeight = `${totalWeight.toFixed(2)} kg`;

  const totalCBM = useMemo(() => {
    if (!Array.isArray(formData.items)) {
      console.warn("⚠️ formData.items is not an array");
      return 0;
    }

    let total = 0;

    formData.items.forEach((entry, index) => {
      const itemName = entry.itemName?.trim().toUpperCase();
      const quantity = entry.quantity ?? 0;

      const item = itemCatalog.find(
        (i) => i.itemName?.trim().toUpperCase() === itemName
      );

      if (!item) {
        console.warn(`🔍 Item not found in catalog: '${itemName}'`);
        return;
      }

      const lengthCm = item.length ?? 0;
      const widthCm = item.width ?? 0;
      const heightCm = item.height ?? 0;

      const cbmPerUnit = (lengthCm / 100) * (widthCm / 100) * (heightCm / 100);
      const cbmTotal = cbmPerUnit * quantity;

      console.log(
        `📦 [${index}] ${itemName} → L:${lengthCm}cm W:${widthCm}cm H:${heightCm}cm × Q:${quantity} = ${cbmTotal.toFixed(
          3
        )} m³`
      );

      total += cbmTotal;
    });

    console.log(`📊 Total CBM: ${total.toFixed(3)} m³`);
    return total;
  }, [formData.items, itemCatalog]);

  const formattedCBM = `${totalCBM.toFixed(5)} m³`;

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
    fetch("/api/customer-types")
      .then((res) => res.json())
      .then((response) => {
        const data = Array.isArray(response?.items) ? response.items : [];
        setCustomerTypes(data);
      })
      .catch((err) => console.error("❌ Failed to fetch customer types", err));
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
    const warehouse = formData.warehouse?.trim().toUpperCase();
    console.log("🏷️ Selected warehouse:", warehouse);
    if (!warehouse) return;

    // 🛡️ Skip reset if editing dialog is open
    if (isEditDialogOpen) {
      console.log("🛑 Skipping warehouse reset during edit");
    } else {
      // 🔁 Reset state only during create flow
      setItemsData([]);
      setFormData((prev) => ({ ...prev, items: [] }));
    }

    setInventoryItems([]);
    setIsLoadingInventory(true);

    const fetchInventoryMainItems = async () => {
      try {
        const res = await fetch(
          `/api/inventory-main?warehouse=${encodeURIComponent(warehouse)}`,
          {
            cache: "no-store",
          }
        );

        console.log("🌐 Fetch status:", res.status);

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const fallback = await res.text();
          console.error("❌ Non-JSON response:", fallback);
          setInventoryItems([]);
          return;
        }

        const data = await res.json();
        console.log("📦 Raw InventoryMain response:", data);

        const items = Array.isArray(data)
          ? data.filter(
              (item) => item.warehouse?.trim().toUpperCase() === warehouse
            )
          : [];

        console.log("✅ Parsed InventoryMain items:", items);
        setInventoryItems(items);
      } catch (error) {
        console.error("❌ Error fetching InventoryMain:", error);
        setInventoryItems([]);
      } finally {
        setIsLoadingInventory(false);
      }
    };

    fetchInventoryMainItems();
  }, [formData.warehouse, isEditDialogOpen]);

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
      formattedWeight: "",
      formattedCBM: "",
      formattedTotal: "",
      formattedNetTotal: "",
      formattedPesoDiscount: "",
      discounts: "",
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

  const totalAmount = useMemo(() => {
    return formData.items?.reduce((sum, item) => {
      const key = item.itemName?.trim().toUpperCase();
      const price = salesPriceMap[key] ?? 0;
      const quantity = item.quantity ?? 0;
      return sum + price * quantity;
    }, 0);
  }, [formData.items, salesPriceMap]);

  const formattedTotal = totalAmount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  const handleCreate = async () => {
    if (!validateForm()) return;

    const normalizedItems = formData.items.map((item) => {
      const key = item.itemName?.trim().toUpperCase();
      const price = salesPriceMap[key] ?? 0;
      const quantity = Number(item.quantity) || 0;

      return {
        itemName: key || "UNNAMED",
        quantity,
        unitType: item.unitType?.trim().toUpperCase() || "",
        price,
        itemCode: item.itemCode?.trim().toUpperCase() || "",
        description: item.description?.trim() || "",
        amount: quantity * price,
      };
    });

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
    formattedWeight: "",
    formattedCBM: "",
    formattedTotal: "",
    formattedNetTotal: "",
    formattedPesoDiscount: "",
    discounts: "",
  };

  const allowedStatuses: SalesOrder["status"][] = [
    "PENDING",
    "TO PREPARE",
    "CANCELLED",
    "COMPLETED",
  ];

  const handleEdit = (so: SalesOrder) => {
    setEditingSO(so);

    const editableItems = so.items
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => {
        const key = item.itemName?.trim().toUpperCase();
        const price = salesPriceMap[key] ?? 0;
        const quantity = Math.max(Number(item.quantity) || 1, 1);

        return {
          _id: item._id ?? crypto.randomUUID(),
          itemName: key || "UNNAMED",
          quantity,
          unitType: item.unitType?.trim().toUpperCase() || "",
          price,
          itemCode: item.itemCode?.trim().toUpperCase() || "",
          description: item.description?.trim() || "",
          amount: quantity * price,
        };
      });

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

    // 🧠 Resolve discount from customerGroup → groupName → discounts[0]
    const matchedCustomer = customers.find(
      (c) =>
        c.customerName?.trim().toUpperCase() ===
        so.customer?.trim().toUpperCase()
    );

    const customerGroup = matchedCustomer?.customerGroup?.trim().toUpperCase();

    const matchedCustomerType = customerTypes.find(
      (ct) => ct.groupName?.trim().toUpperCase() === customerGroup
    );

    const resolvedDiscounts: string[] = matchedCustomerType?.discounts ?? [];

    const discountRate = matchedCustomerType?.discounts?.[0]
      ? parseFloat(matchedCustomerType.discounts[0]) / 100
      : 0;

    const formattedPesoDiscount = `${(discountRate * 100).toFixed(2)}%`;
    const netTotal = totalAmount * (1 - discountRate);

    const hydratedFormData: typeof formData = {
      soNumber: so.soNumber.trim().toUpperCase(),
      customer: so.customer?.trim().toUpperCase() || "",
      salesPerson: so.salesPerson?.trim().toUpperCase() || "",
      warehouse: so.warehouse?.trim().toUpperCase() || "",
      transactionDate:
        so.transactionDate ?? new Date().toISOString().split("T")[0],
      deliveryDate: so.deliveryDate ?? "",
      shippingAddress: so.shippingAddress?.trim() || "",
      notes: so.notes?.trim() || "",
      status,
      creationDate: so.creationDate ?? new Date().toISOString().split("T")[0],
      items: editableItems,
      total: totalAmount,
      totalQuantity,
      balance: typeof so.balance === "number" ? so.balance : totalAmount,
      formattedWeight: so.formattedWeight ?? "0.00 kg",
      formattedCBM: so.formattedCBM ?? "0.000 m³",
      formattedTotal: totalAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      formattedNetTotal: netTotal.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      formattedPesoDiscount,
      discounts: resolvedDiscounts,
    };

    setFormData(hydratedFormData);
    setItemsData(editableItems);
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

    const normalizedItems = formData.items
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => selectedIdsSafe[index])
      .map(({ item }) => {
        const key = item.itemName?.trim().toUpperCase();
        const price = salesPriceMap[key] ?? (Number(item.price) || 0);
        const quantity = Math.max(Number(item.quantity) || 1, 1);

        return {
          _id: item._id ?? crypto.randomUUID(),
          itemCode: item.itemCode?.trim().toUpperCase() || "",
          itemName: key || "UNNAMED",
          unitType: item.unitType?.trim().toUpperCase() || "",
          quantity,
          price,
          description: item.description?.trim() || "",
          amount: quantity * price,
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
        method: "PATCH",
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
        prev.map((so) => (so._id === result.order._id ? result.order : so))
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
      formattedWeight: "0.00 kg",
      formattedCBM: "0.000 m³",
      formattedTotal: "0.00",
      formattedNetTotal: "0.00",
      formattedPesoDiscount: "0.00%",
      discounts: [],
      customerType: "",
      customerTypeData: undefined,
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
      formattedWeight: "0.00 kg",
      formattedCBM: "0.000 m³",
      formattedTotal: "0.00",
      formattedNetTotal: "0.00",
      formattedPesoDiscount: "0.00%",
      discounts: [],
      customerType: "",
      customerTypeData: undefined,
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
      formattedWeight: "",
      formattedCBM: "",
      formattedTotal: "",
      formattedNetTotal: "",
      formattedPesoDiscount: "",
      discounts: "",
    });
  };

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      console.log("🔄 Select all triggered");

      const currentPageIds = paginatedSalesOrders.map((so) => so._id);
      const newSelections = Array.from(
        new Set([
          ...selectedIds,
          ...paginatedSalesOrders
            .filter((so) => !selectedIds.includes(String(so._id)))
            .map((so) => String(so._id)),
        ])
      );

      setSelectedIds(newSelections);
    }

    if (checked === false) {
      console.log("🔄 Unselect all triggered");

      const currentPageIds = new Set(paginatedSalesOrders.map((so) => so._id));
      const remainingSelections = selectedIds.filter(
        (id) => !currentPageIds.has(id)
      );

      setSelectedIds(remainingSelections);
    }

    // No-op for "indeterminate" — handled by checkbox UI state only
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
      setSalesOrders((prev) =>
        prev.filter((so) => !_ids.includes(String(so._id)))
      );

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

  // const normalizeSalesOrderItem = (item: SalesOrderItem): SalesOrderItem => ({
  //   itemCode: item.itemCode?.trim().toUpperCase() || "",
  //   itemName: item.itemName?.trim().toUpperCase() || "",
  //   unitType: item.unitType?.trim().toUpperCase() || "",
  //   quantity: Number(item.quantity) || 0,
  //   price: Number(item.price) || 0,
  //   description: item.description?.trim() || "",
  //   amount: Number(item.quantity) * Number(item.price),
  // });

  const fetchSingleSO = async (soId: string) => {
    try {
      const res = await fetch(`/api/sales-orders/${soId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch Sales Order");

      const raw = await res.json();

      const normalizedItems = Array.isArray(raw.items)
        ? raw.items.map(soId)
        : [];

      const totalQuantity = normalizedItems.reduce(
        (sum: number, item: SalesOrderItem) => sum + item.quantity,
        0
      );

      const totalAmount = normalizedItems.reduce(
        (sum: number, item: SalesOrderItem) => sum + item.amount,
        0
      );

      const formattedWeight = formatWeight(normalizedItems);
      const formattedCBM = formatCBM(normalizedItems);
      const formattedTotal = totalAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      });

      const formattedNetTotal = computeNetTotal({
        ...raw,
        items: normalizedItems,
      });
      const formattedPesoDiscount = computePesoDiscount(raw.discounts ?? []);

      const hydratedSO: SalesOrder = {
        _id: raw._id ? String(raw._id) : "",
        soNumber: raw.soNumber ?? "",
        customer: raw.customer ?? "",
        salesPerson: raw.salesPerson ?? "",
        warehouse: raw.warehouse ?? "",
        transactionDate: raw.transactionDate ?? "",
        deliveryDate: raw.deliveryDate ?? "",
        shippingAddress: raw.shippingAddress?.trim() ?? "",
        notes: raw.notes?.trim() ?? "",
        status: raw.status ?? "PENDING",
        creationDate:
          raw.creationDate ?? new Date().toISOString().split("T")[0],
        items: normalizedItems,
        total: totalAmount,
        totalQuantity,
        balance: raw.balance ?? 0,
        formattedWeight,
        formattedCBM,
        formattedTotal,
        formattedNetTotal,
        formattedPesoDiscount,
        discounts: raw.discounts ?? [],
      };

      setItemsData(normalizedItems);
      setFormData(hydratedSO);
    } catch (error) {
      console.error("❌ Error loading Sales Order:", error);
      setItemsData([]);
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
        formattedWeight: "0.00 kg",
        formattedCBM: "0.000 m³",
        formattedTotal: "0.00",
        formattedNetTotal: "0.00",
        formattedPesoDiscount: "0.00%",
        discounts: [],
        customerType: "",
        customerTypeData: undefined,
      });
    }
  };

  const handleAddItem = () => {
    const newItem = {
      _id: crypto.randomUUID(),
      itemCode: "",
      itemName: "",
      unitType: "",
      price: 0,
      quantity: 1,
      amount: 0,
    };

    setItemsData((prev) => [...prev, newItem]);

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
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

  // const recalculateTotals = (items: SalesOrderItem[]) => {
  //   const totalQuantity = items.reduce(
  //     (sum, item) => sum + (item.quantity || 0),
  //     0
  //   );

  //   const totalAmount = items.reduce(
  //     (sum, item) => sum + (item.amount || item.quantity * item.price || 0),
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

  const handleUpdateStatus = async (soId: string, status: Status) => {
    try {
      const res = await fetch(`/api/sales-orders/${soId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update Sales Order status");

      const { order: updatedSO } = await res.json();

      // Update local state
      setPaginatedSalesOrders((prev) =>
        prev.map((so) =>
          so._id === soId ? { ...so, status: updatedSO.status } : so
        )
      );

      toast.success(`SO ${updatedSO.soNumber} marked as ${updatedSO.status}`);
    } catch (error) {
      console.error(`❌ Error updating SO status to ${status}:`, error);
      toast.error(`Could not update SO status to ${status}`);
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

  const subtotal = parseFloat(formattedTotal.replace(/[^0-9.]/g, ""));
  const discountFactor = Array.isArray(formData.discounts)
    ? formData.discounts.reduce((acc, d) => {
        const pct = parseFloat(d);
        return isNaN(pct) ? acc : acc * (1 - pct / 100);
      }, 1)
    : 1;

  const totalAfterDiscounts = subtotal * discountFactor;
  const formattedNetTotal = isNaN(totalAfterDiscounts)
    ? "Invalid"
    : totalAfterDiscounts.toLocaleString("en-US", {
        style: "currency",
        currency: "PHP",
      });

  const subtotalPeso = parseFloat(formattedTotal.replace(/[^\d.]/g, ""));
  const totalAmountPeso = parseFloat(formattedNetTotal.replace(/[^\d.]/g, ""));
  const pesoDiscount = Math.max(subtotalPeso - totalAmountPeso, 0);

  const formattedPesoDiscount = `₱${pesoDiscount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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

              <DialogPanel className="max-h-[80vh] overflow-y-auto px-6 py-4">
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
                      {/* Customer Name */}
                      <div className="flex flex-col flex-1 min-w-[240px]">
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
                              const value = e.target.value.toUpperCase();
                              setFormData((prev) => ({
                                ...prev,
                                customer: value,
                                salesPerson: "",
                                customerType: "",
                                customerTypeData: undefined,
                                discounts: [],
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
                                        onClick={async () => {
                                          const customerName =
                                            customer.customerName
                                              ?.trim()
                                              .toUpperCase() || "";
                                          const salesPerson =
                                            customer.salesAgent?.trim() || "";
                                          const customerGroup =
                                            customer.customerGroup
                                              ?.trim()
                                              .toUpperCase() || "";

                                          try {
                                            const res = await fetch(
                                              `/api/customer-types/by-group/${customerGroup}`
                                            );
                                            if (!res.ok)
                                              throw new Error(
                                                `HTTP ${res.status}`
                                              );

                                            const text = await res.text();
                                            if (!text)
                                              throw new Error(
                                                "Empty response body"
                                              );

                                            const customerTypeData: CustomerType =
                                              JSON.parse(text);
                                            const discounts = Array.isArray(
                                              customerTypeData.discounts
                                            )
                                              ? customerTypeData.discounts
                                              : [];

                                            console.log(
                                              "📦 Fetched customerTypeData:",
                                              customerTypeData
                                            );
                                            console.log(
                                              `🎯 Discounts for ${customerGroup}:`,
                                              discounts
                                            );

                                            setFormData((prev) => ({
                                              ...prev,
                                              customer: customerName,
                                              salesPerson,
                                              customerType: customerGroup,
                                              customerTypeData,
                                              discounts,
                                            }));
                                          } catch (err) {
                                            console.error(
                                              `❌ Failed to fetch customer type ${customerGroup}`,
                                              err
                                            );
                                          }

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

                      {/* Delivery Date */}
                      <div className="flex flex-col flex-1 min-w-[240px]">
                        <Label htmlFor="create-deliveryDate">
                          Delivery Date
                        </Label>
                        <Input
                          type="date"
                          id="create-deliveryDate"
                          value={formData.deliveryDate}
                          min={new Date().toISOString().split("T")[0]} // ⛔ Prevent past dates
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              deliveryDate: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              deliveryDate: "",
                            }));
                          }}
                          placeholder="Enter delivery date"
                          className={`text-sm pr-2 appearance-none bg-[url('data:image/svg+xml;utf8,<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>')] bg-no-repeat bg-right bg-[length:1.25rem_1.25rem] ${
                            validationErrors.deliveryDate
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        {validationErrors.deliveryDate && (
                          <p className="text-sm text-destructive">
                            {validationErrors.deliveryDate}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row flex-wrap gap-4">
                      {/* ✅ Sales Person Field */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="sales-person">Sales Person</Label>
                        <Input
                          id="sales-person"
                          type="text"
                          value={formData.salesPerson || ""}
                          readOnly
                          className="text-sm w-full px-2 py-1 border border-border bg-muted text-muted-foreground"
                        />
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
                                          setFormData((prev) => {
                                            const isReselect =
                                              prev.warehouse === value;
                                            return {
                                              ...prev,
                                              warehouse: value,
                                              ...(isReselect && {
                                                items: [], // ✅ Reset items if reselected
                                                inventory: [], // ✅ Optional: reset other dependent fields
                                              }),
                                            };
                                          });
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
                    <div className="flex flex-col flex-[2] min-w-[300px]">
                      <Label htmlFor="create-shippingAddress">
                        Shipping Address
                      </Label>
                      <Textarea
                        id="create-shippingAddress"
                        value={formData.shippingAddress}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            shippingAddress: value,
                          }));
                          setValidationErrors((prev) => ({
                            ...prev,
                            shippingAddress: "",
                          }));
                        }}
                        placeholder="Enter the delivery address for this order"
                        className={`text-sm ${
                          validationErrors.shippingAddress
                            ? "border-destructive"
                            : ""
                        }`}
                      />
                      {validationErrors.shippingAddress && (
                        <p className="text-sm text-destructive">
                          {validationErrors.shippingAddress}
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
                {formData.warehouse && (
                  <>
                    <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 border-b py-2 mb-4 bg-primary text-primary-foreground rounded-t">
                      {/* Item Code */}
                      <div className="text-xs font-semibold uppercase text-start px-2">
                        Item Code
                      </div>

                      {/* Item Name */}
                      <div className="text-xs font-semibold uppercase text-start px-2">
                        Item Name
                      </div>

                      {/* Quantity */}
                      <div className="text-xs font-semibold uppercase text-end px-2">
                        Qty
                      </div>

                      {/* Unit of Measure */}
                      <div className="text-xs font-semibold uppercase text-start px-2">
                        UOM
                      </div>

                      {/* Sales Price */}
                      <div className="text-xs font-semibold uppercase text-end px-2">
                        Sales Price
                      </div>

                      {/* Amount */}
                      <div className="text-xs font-semibold uppercase text-end px-2">
                        Amount
                      </div>

                      {/* Trash Icon Column */}
                      <div className="text-center"></div>
                    </div>

                    {isLoadingInventory ? (
                      <div className="flex items-center justify-center w-full py-6">
                        <p className="text-muted-foreground text-sm">
                          Loading inventory…
                        </p>
                      </div>
                    ) : inventoryItems.length === 0 ? (
                      <div className="flex items-center justify-center w-full py-6">
                        <p className="text-muted-foreground text-sm">
                          No items available for this warehouse.
                        </p>
                      </div>
                    ) : itemsData.length === 0 ? (
                      <div className="flex items-center justify-center w-full py-6">
                        <p className="text-muted-foreground text-sm">
                          No items selected yet.
                        </p>
                      </div>
                    ) : (
                      <>
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
                                  const value = e.target.value
                                    .toUpperCase()
                                    .trim();

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
                                  {(() => {
                                    const input =
                                      item.itemName?.toUpperCase().trim() || "";
                                    const filtered = inventoryItems.filter(
                                      (option) =>
                                        option.itemName
                                          ?.toUpperCase()
                                          .includes(input)
                                    );

                                    if (filtered.length === 0) {
                                      return (
                                        <li className="px-3 py-2 text-muted-foreground">
                                          No matching items found
                                        </li>
                                      );
                                    }

                                    return filtered.map((option) => {
                                      const normalized = option.itemName
                                        ?.trim()
                                        .toUpperCase();
                                      return (
                                        <li
                                          key={option.itemCode || normalized}
                                          className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                          onClick={() => {
                                            const enriched = {
                                              itemName: normalized,
                                              itemCode: option.itemCode || "",
                                              unitType: option.unitType || "",
                                              price: option.salesPrice ?? 0,
                                              quantity: 1,
                                            };

                                            setItemsData((prev) => {
                                              const updated = [...prev];
                                              updated[index] = {
                                                ...updated[index],
                                                ...enriched,
                                              };
                                              return updated;
                                            });

                                            setFormData((prev) => {
                                              const updatedItems = [
                                                ...prev.items,
                                              ];
                                              updatedItems[index] = {
                                                ...updatedItems[index],
                                                ...enriched,
                                              };
                                              return {
                                                ...prev,
                                                items: updatedItems,
                                              };
                                            });

                                            setShowItemSuggestions(null);
                                          }}>
                                          {normalized ||
                                            option.itemCode ||
                                            "Unnamed Item"}
                                        </li>
                                      );
                                    });
                                  })()}
                                </ul>
                              )}
                            </div>

                            {/* Quantity */}
                            <input
                              type="number"
                              min={1}
                              max={
                                inventoryItems.find(
                                  (inv) => inv.itemCode === item.itemCode
                                )?.quantity ?? 9999
                              }
                              value={item.quantity}
                              onChange={(e) => {
                                const raw = Number(e.target.value);
                                const maxQty =
                                  inventoryItems.find(
                                    (inv) => inv.itemCode === item.itemCode
                                  )?.quantity ?? 9999;

                                const value = Math.min(
                                  Math.max(raw, 1),
                                  maxQty
                                ); // clamp between 1 and maxQty

                                setItemsData((prev) => {
                                  const updated = [...prev];
                                  updated[index].quantity = value;
                                  return updated;
                                });

                                setFormData((prev) => {
                                  const updatedItems = [...prev.items];
                                  updatedItems[index] = {
                                    ...updatedItems[index],
                                    quantity: value,
                                  };
                                  return { ...prev, items: updatedItems };
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
                            {/* Price */}
                            <input
                              type="text"
                              value={(() => {
                                const key = item.itemName?.trim().toUpperCase();
                                const price = salesPriceMap[key] ?? 0;
                                return price > 0
                                  ? price.toLocaleString("en-PH", {
                                      style: "currency",
                                      currency: "PHP",
                                    })
                                  : "";
                              })()}
                              readOnly
                              className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-right text-sm"
                              placeholder="₱0.00"
                            />

                            {/* Amount */}
                            <input
                              type="text"
                              value={(() => {
                                const key = item.itemName?.trim().toUpperCase();
                                const price = salesPriceMap[key] ?? 0;
                                const quantity = item.quantity ?? 0;
                                const amount = price * quantity;
                                return amount > 0
                                  ? amount.toLocaleString("en-PH", {
                                      style: "currency",
                                      currency: "PHP",
                                    })
                                  : "";
                              })()}
                              readOnly
                              className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-right text-sm"
                              placeholder="₱0.00"
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
                      </>
                    )}

                    {/* Left: Add Item */}
                    <Button onClick={handleAddItem}>Add Item</Button>

                    <div className="flex flex-col w-full mt-8 gap-8">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="text-lg font-semibold text-primary tracking-wide">
                          Order Summary
                        </h3>
                      </div>

                      {/* Metrics Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          {
                            label: "Total Quantity",
                            value: formData.totalQuantity,
                          },
                          { label: "Total Weight", value: formattedWeight },
                          { label: "Total CBM", value: formattedCBM },
                        ].map(({ label, value }, i) => (
                          <div
                            key={i}
                            className="flex flex-col bg-card px-5 py-4 rounded-lg border border-border shadow-sm hover:shadow-md transition">
                            <span className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                              {label}
                            </span>
                            <span className="text-base font-semibold text-foreground text-right">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financial Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="flex flex-col gap-4">
                          {/* SubTotal */}
                          <div className="flex flex-col bg-card px-5 py-4 rounded-lg border border-border shadow-sm">
                            <span className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                              SubTotal
                            </span>
                            <span className="text-base font-semibold text-foreground text-right">
                              {formattedTotal}
                            </span>
                          </div>

                          {/* Discounts */}
                          <div className="flex flex-col bg-card px-5 py-4 rounded-lg border border-border shadow-sm">
                            <span className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                              Discounts
                            </span>
                            {Array.isArray(formData.discounts) &&
                            formData.discounts.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {formData.discounts.map((d, i) => {
                                  const value = parseFloat(d);
                                  const formatted = isNaN(value)
                                    ? "Invalid"
                                    : `${value.toFixed(2)}%`;

                                  return (
                                    <div
                                      key={i}
                                      className="flex justify-between items-center bg-background px-3 py-2 rounded border border-border hover:bg-muted/50 transition">
                                      <span className="font-medium text-primary">
                                        Discount {i + 1}
                                      </span>
                                      <span className="text-right">
                                        {formatted}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="italic text-muted-foreground">
                                No discounts available
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="flex flex-col gap-4">
                          {/* Peso Discounts */}
                          <div className="flex flex-col bg-card px-5 py-4 rounded-lg border border-border shadow-sm">
                            <span className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                              Peso Discounts
                            </span>
                            <span className="text-base font-semibold text-foreground text-right">
                              {formattedPesoDiscount}
                            </span>
                          </div>

                          {/* Total Amount */}
                          <div className="flex flex-col bg-gradient-to-r from-primary/20 to-primary/10 px-5 py-4 rounded-lg border border-primary shadow-md">
                            <span className="text-[11px] font-medium text-primary mb-1 uppercase tracking-wide">
                              Total Amount
                            </span>
                            <span className="text-xl font-bold text-primary text-right">
                              {formattedNetTotal}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* Footer Actions */}
                <DialogFooter className="pt-4 border-t">
                  <div className="flex w-full justify-end items-center gap-2">
                    {/* Cancel Button */}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        resetForm();
                      }}>
                      Cancel
                    </Button>

                    {/* Save + Dropdown */}
                    <div className="flex items-center gap-2">
                      {/* Primary Save Button */}
                      <Button
                        onClick={handleSave}
                        disabled={
                          !formData.items.length ||
                          formData.items.every((item) => !item.itemName?.trim())
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
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                    <TableRow key={String(so._id)}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(String(so._id))}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() =>
                            toggleSelectOne(String(so._id))
                          }
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
                              : so.status === "TO PREPARE"
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
                                title="Edit Sales Order"
                                aria-label={`Edit SO ${so.soNumber}`}
                                onClick={(e) => {
                                  handleEdit(so);
                                }}>
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
                                      onClick={() =>
                                        handleDelete(String(so._id))
                                      }>
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

                              {statusOptions.map(
                                ({ label, value, color, icon: Icon }) => (
                                  <DropdownMenuItem
                                    key={value}
                                    onClick={() =>
                                      handleUpdateStatus(String(so._id), value)
                                    }
                                    disabled={so.status === value}
                                    className={color}>
                                    <Icon className="w-4 h-4 mr-2" />
                                    {label}
                                  </DropdownMenuItem>
                                )
                              )}
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
        <DialogPanel className="max-h-[80vh] overflow-y-auto px-6 py-4">
          {/* Header */}
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Edit Sales Order
            </DialogTitle>
          </DialogHeader>

          {/* Form Content Slot (optional placeholder) */}
          <div className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="flex flex-row flex-wrap gap-4">
                {/* SO Number */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-so-number">SO Number</Label>
                  <Input
                    id="edit-so-number"
                    value={formData.soNumber || "—"}
                    readOnly
                    disabled
                    placeholder="Sales Order Number"
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
                    value={
                      formData.transactionDate
                        ? new Date(formData.transactionDate).toLocaleDateString(
                            "en-PH",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "—"
                    }
                    readOnly
                    disabled
                    className="text-sm bg-muted cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex flex-row flex-wrap gap-4">
                {/* Customer Name */}
                <div className="flex flex-col flex-1 min-w-[240px]">
                  <Label htmlFor="edit-customer-name">Customer Name</Label>
                  <div className="relative">
                    <Input
                      id="edit-customer-name"
                      type="text"
                      autoComplete="off"
                      value={formData.customer || ""}
                      onClick={() => setShowCustomerSuggestions(true)}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setFormData((prev) => ({
                          ...prev,
                          customer: value,
                          salesPerson: "",
                          customerType: "",
                          customerTypeData: undefined,
                          discounts: [],
                        }));
                        setValidationErrors((prev) => ({
                          ...prev,
                          customer: "",
                        }));
                        setShowCustomerSuggestions(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowCustomerSuggestions(false), 200)
                      }
                      placeholder="Search customer name"
                      className={`text-sm uppercase w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
                        validationErrors.customer ? "border-destructive" : ""
                      }`}
                    />
                    {showCustomerSuggestions && (
                      <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                        {(() => {
                          const input =
                            formData.customer?.trim().toUpperCase() || "";
                          const filtered = customers.filter((customer) => {
                            const label =
                              customer.customerName?.trim().toUpperCase() || "";
                            return input === "" || label.includes(input);
                          });

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
                                  onClick={async () => {
                                    const customerName =
                                      customer.customerName
                                        ?.trim()
                                        .toUpperCase() || "";
                                    const salesPerson =
                                      customer.salesAgent?.trim() || "";
                                    const customerGroup =
                                      customer.customerGroup
                                        ?.trim()
                                        .toUpperCase() || "";

                                    try {
                                      const res = await fetch(
                                        `/api/customer-types/by-group/${customerGroup}`
                                      );
                                      if (!res.ok)
                                        throw new Error(`HTTP ${res.status}`);

                                      const text = await res.text();
                                      if (!text)
                                        throw new Error("Empty response body");

                                      const customerTypeData: CustomerType =
                                        JSON.parse(text);
                                      const discounts = Array.isArray(
                                        customerTypeData.discounts
                                      )
                                        ? customerTypeData.discounts
                                        : [];

                                      console.log(
                                        "📦 Fetched customerTypeData:",
                                        customerTypeData
                                      );
                                      console.log(
                                        `🎯 Discounts for ${customerGroup}:`,
                                        discounts
                                      );

                                      setFormData((prev) => ({
                                        ...prev,
                                        customer: customerName,
                                        salesPerson,
                                        customerType: customerGroup,
                                        customerTypeData,
                                        discounts,
                                      }));
                                    } catch (err) {
                                      console.error(
                                        `❌ Failed to fetch customer type ${customerGroup}`,
                                        err
                                      );
                                    }

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

                {/* Delivery Date */}
                <div className="flex flex-col flex-1 min-w-[240px]">
                  <Label htmlFor="edit-deliveryDate">Delivery Date</Label>
                  <Input
                    type="date"
                    id="edit-deliveryDate"
                    value={formData.deliveryDate}
                    min={new Date().toISOString().split("T")[0]} // ⛔ Prevent past dates
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        deliveryDate: value,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        deliveryDate: "",
                      }));
                    }}
                    placeholder="Enter delivery date"
                    className={`text-sm pr-2 appearance-none bg-[url('data:image/svg+xml;utf8,<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>')] bg-no-repeat bg-right bg-[length:1.25rem_1.25rem] ${
                      validationErrors.deliveryDate ? "border-destructive" : ""
                    }`}
                  />
                  {validationErrors.deliveryDate && (
                    <p className="text-sm text-destructive">
                      {validationErrors.deliveryDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-row flex-wrap gap-4">
                {/* ✅ Sales Person Field */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-sales-person">Sales Person</Label>
                  <Input
                    id="edit-sales-person"
                    type="text"
                    value={formData.salesPerson || ""}
                    readOnly
                    className="text-sm w-full px-2 py-1 border border-border bg-muted text-muted-foreground"
                  />
                </div>

                {/* Warehouse */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-warehouse">Warehouse</Label>
                  <div className="relative">
                    <Input
                      id="edit-warehouse"
                      type="text"
                      autoComplete="off"
                      value={formData.warehouse || ""}
                      onClick={() => setShowWarehouseSuggestions(true)}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
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
                                    setFormData((prev) => {
                                      const isReselect =
                                        prev.warehouse === value;
                                      return {
                                        ...prev,
                                        warehouse: value,
                                        ...(isReselect && {
                                          items: [],
                                          inventory: [],
                                        }),
                                      };
                                    });
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

              {/* Shipping Address */}
              <div className="flex flex-col flex-[2] min-w-[300px]">
                <Label htmlFor="edit-shippingAddress">Shipping Address</Label>
                <Textarea
                  id="edit-shippingAddress"
                  value={formData.shippingAddress}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      shippingAddress: value,
                    }));
                    setValidationErrors((prev) => ({
                      ...prev,
                      shippingAddress: "",
                    }));
                  }}
                  placeholder="Enter the delivery address for this order"
                  className={`text-sm ${
                    validationErrors.shippingAddress ? "border-destructive" : ""
                  }`}
                />
                {validationErrors.shippingAddress && (
                  <p className="text-sm text-destructive">
                    {validationErrors.shippingAddress}
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
          {formData.warehouse && (
            <>
              <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 border-b py-2 mb-4 bg-primary text-primary-foreground rounded-t">
                {/* Item Code */}
                <div className="text-xs font-semibold uppercase text-start px-2">
                  Item Code
                </div>

                {/* Item Name */}
                <div className="text-xs font-semibold uppercase text-start px-2">
                  Item Name
                </div>

                {/* Quantity */}
                <div className="text-xs font-semibold uppercase text-end px-2">
                  Qty
                </div>

                {/* Unit of Measure */}
                <div className="text-xs font-semibold uppercase text-start px-2">
                  UOM
                </div>

                {/* Sales Price */}
                <div className="text-xs font-semibold uppercase text-end px-2">
                  Sales Price
                </div>

                {/* Amount */}
                <div className="text-xs font-semibold uppercase text-end px-2">
                  Amount
                </div>

                {/* Trash Icon Column */}
                <div className="text-center"></div>
              </div>

              {isLoadingInventory ? (
                <div className="flex items-center justify-center w-full py-6">
                  <p className="text-muted-foreground text-sm">
                    Loading inventory…
                  </p>
                </div>
              ) : inventoryItems.length === 0 ? (
                <div className="flex items-center justify-center w-full py-6">
                  <p className="text-muted-foreground text-sm">
                    No items available for this warehouse.
                  </p>
                </div>
              ) : itemsData.length === 0 ? (
                <div className="flex items-center justify-center w-full py-6">
                  <p className="text-muted-foreground text-sm">
                    No items selected yet.
                  </p>
                </div>
              ) : (
                <>
                  {Array.isArray(itemsData) &&
                    itemsData.map((item, index) => (
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
                              {(() => {
                                const input =
                                  item.itemName?.toUpperCase().trim() || "";
                                const filtered = inventoryItems.filter(
                                  (option) =>
                                    option.itemName
                                      ?.toUpperCase()
                                      .includes(input)
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <li className="px-3 py-2 text-muted-foreground">
                                      No matching items found
                                    </li>
                                  );
                                }

                                return filtered.map((option) => {
                                  const normalized = option.itemName
                                    ?.trim()
                                    .toUpperCase();
                                  return (
                                    <li
                                      key={option.itemCode || normalized}
                                      className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                      onClick={() => {
                                        const enriched = {
                                          itemName: normalized,
                                          itemCode: option.itemCode || "",
                                          unitType: option.unitType || "",
                                          price: option.salesPrice ?? 0,
                                          quantity: 1,
                                        };

                                        setItemsData((prev) => {
                                          const updated = [...prev];
                                          updated[index] = {
                                            ...updated[index],
                                            ...enriched,
                                          };
                                          return updated;
                                        });

                                        setFormData((prev) => {
                                          const updatedItems = [...prev.items];
                                          updatedItems[index] = {
                                            ...updatedItems[index],
                                            ...enriched,
                                          };
                                          return {
                                            ...prev,
                                            items: updatedItems,
                                          };
                                        });

                                        setShowItemSuggestions(null);
                                      }}>
                                      {normalized ||
                                        option.itemCode ||
                                        "Unnamed Item"}
                                    </li>
                                  );
                                });
                              })()}
                            </ul>
                          )}
                        </div>

                        {/* Quantity */}
                        <input
                          type="number"
                          min={1}
                          max={
                            inventoryItems.find(
                              (inv) => inv.itemCode === item.itemCode
                            )?.quantity ?? 9999
                          }
                          value={item.quantity}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            const maxQty =
                              inventoryItems.find(
                                (inv) => inv.itemCode === item.itemCode
                              )?.quantity ?? 9999;

                            const value = Math.min(Math.max(raw, 1), maxQty); // clamp between 1 and maxQty

                            setItemsData((prev) => {
                              const updated = [...prev];
                              updated[index].quantity = value;
                              return updated;
                            });

                            setFormData((prev) => {
                              const updatedItems = [...prev.items];
                              updatedItems[index] = {
                                ...updatedItems[index],
                                quantity: value,
                              };
                              return { ...prev, items: updatedItems };
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
                        {/* Price */}
                        <input
                          type="text"
                          value={(() => {
                            const key = item.itemName?.trim().toUpperCase();
                            const price = salesPriceMap[key] ?? 0;
                            return price > 0
                              ? price.toLocaleString("en-PH", {
                                  style: "currency",
                                  currency: "PHP",
                                })
                              : "";
                          })()}
                          readOnly
                          className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-right text-sm"
                          placeholder="₱0.00"
                        />

                        {/* Amount */}
                        <input
                          type="text"
                          value={(() => {
                            const key = item.itemName?.trim().toUpperCase();
                            const price = salesPriceMap[key] ?? 0;
                            const quantity = item.quantity ?? 0;
                            const amount = price * quantity;
                            return amount > 0
                              ? amount.toLocaleString("en-PH", {
                                  style: "currency",
                                  currency: "PHP",
                                })
                              : "";
                          })()}
                          readOnly
                          className="w-full px-2 py-1 border border-border border-l-0 border-t-0 bg-white text-right text-sm"
                          placeholder="₱0.00"
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
                </>
              )}

              {/* Left: Add Item */}
              <Button onClick={handleAddItem}>Add Item</Button>

              <div className="flex flex-col w-full mt-8 gap-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-lg font-semibold text-primary tracking-wide">
                    Order Summary
                  </h3>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      label: "Total Quantity",
                      value: formData.totalQuantity,
                    },
                    { label: "Total Weight", value: formattedWeight },
                    { label: "Total CBM", value: formattedCBM },
                  ].map(({ label, value }, i) => (
                    <div
                      key={i}
                      className="flex flex-col bg-card px-5 py-4 rounded-lg border border-border shadow-sm hover:shadow-md transition">
                      <span className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                        {label}
                      </span>
                      <span className="text-base font-semibold text-foreground text-right">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="flex flex-col gap-4">
                    {/* SubTotal */}
                    <div className="flex flex-col bg-card px-5 py-4 rounded-lg border border-border shadow-sm">
                      <span className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                        SubTotal
                      </span>
                      <span className="text-base font-semibold text-foreground text-right">
                        {formattedTotal}
                      </span>
                    </div>

                    {/* Discounts */}
                    <div className="flex flex-col bg-card px-5 py-4 rounded-lg border border-border shadow-sm">
                      <span className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Discounts
                      </span>
                      {Array.isArray(formData.discounts) &&
                      formData.discounts.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {formData.discounts.map((discount, index) => {
                            const value = parseFloat(discount);
                            const formatted = isNaN(value)
                              ? "Invalid"
                              : `${value.toFixed(2)}%`;

                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center bg-background px-3 py-2 rounded border border-border hover:bg-muted/50 transition">
                                <span className="font-medium text-primary">
                                  Discount {index + 1}
                                </span>
                                <span className="text-right">{formatted}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="italic text-muted-foreground">
                          No discounts available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-4">
                    {/* Peso Discounts */}
                    <div className="flex flex-col bg-card px-5 py-4 rounded-lg border border-border shadow-sm">
                      <span className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                        Peso Discounts
                      </span>
                      <span className="text-base font-semibold text-foreground text-right">
                        {formattedPesoDiscount}
                      </span>
                    </div>

                    {/* Total Amount */}
                    <div className="flex flex-col bg-gradient-to-r from-primary/20 to-primary/10 px-5 py-4 rounded-lg border border-primary shadow-md">
                      <span className="text-[11px] font-medium text-primary mb-1 uppercase tracking-wide">
                        Total Amount
                      </span>
                      <span className="text-xl font-bold text-primary text-right">
                        {formattedNetTotal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          <DialogFooter className="pt-4 border-t">
            <div className="flex w-full justify-end items-center gap-2">
              {/* Cancel Button */}
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}>
                Cancel
              </Button>

              {/* Save + Dropdown */}
              <div className="flex items-center gap-2">
                {/* Primary Save Button */}
                <Button
                  onClick={handleUpdate}
                  disabled={
                    !formData.items.length ||
                    formData.items.every((item) => !item.itemName?.trim())
                  }
                  className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Save changes">
                  💾 Save Changes
                </Button>

                {/* Dropdown for More Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="bg-muted text-foreground hover:bg-muted/80 px-3 py-2 rounded-md shadow-sm transition-colors duration-150"
                      aria-label="Open more edit options">
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

                    {/* <DropdownMenuItem
            onClick={handleSaveAndDuplicate}
            disabled={
              !formData.items.length ||
              formData.items.every((item) => !item.itemName?.trim())
            }
            className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            📄 Save & Duplicate
          </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
