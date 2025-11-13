"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Eye,
  FileText,
  Filter,
  CalendarDays,
  Loader2,
  ArrowRightCircle,
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
import StatusStepperButton from "./StatusStepperButton";

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
  DiscountStep,
  SalesOrderMeta,
} from "./type";

import {
  formatWeight,
  formatCBM,
  computeNetTotal,
  computePesoDiscount,
  computeSubtotal,
} from "@/libs/salesOrderMetrics";

import { computeDiscountBreakdown } from "@/libs/discountUtils";

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
  const [activeSOId, setActiveSOId] = useState<string | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

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
  const [isLoading, setIsLoading] = useState(true);

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
      quantity: 0,
      amount: 0,
    },
  ]);

  const router = useRouter();

  const [formData, setFormData] = useState<
    Omit<SalesOrder, "_id" | "createdAt" | "updatedAt"> & {
      customerType?: string;
      customerTypeData?: CustomerType;
      discountBreakdown: {
        rate: number;
        amount: number;
        remaining: number;
      }[];
    }
  >({
    soNumber: "",
    customer: "",
    address: "",
    contactNumber: "",
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
    creationDate: new Date().toISOString().split("T")[0],
    formattedWeight: "0.00 kg",
    formattedCBM: "0.000 m³",
    formattedTotal: "0.00",
    formattedNetTotal: "0.00",
    discounts: [],
    discountBreakdown: [],
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<
      keyof Omit<SalesOrder, "_id" | "createdAt" | "updatedAt" | "items">,
      string
    >
  >({
    soNumber: "",
    customer: "",
    address: "",
    contactNumber: "",
    salesPerson: "",
    warehouse: "",
    transactionDate: "",
    deliveryDate: "",
    shippingAddress: "",
    notes: "",
    status: "",
    total: "",
    totalQuantity: "",
    creationDate: "",
    formattedWeight: "",
    formattedCBM: "",
    formattedTotal: "",
    formattedNetTotal: "",
    discounts: "",
    discountBreakdown: "",
    freightCharges: "",
    otherCharges: "",
    pesoDiscounts: "",
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

  const enrichedItems = formData.items.map((entry) => {
    const itemName = entry.itemName?.trim().toUpperCase();
    const catalogItem = itemCatalog.find(
      (i) => i.itemName?.trim().toUpperCase() === itemName
    );

    const weight = catalogItem?.weight ?? 0;

    const lengthCm = catalogItem?.length ?? 0;
    const widthCm = catalogItem?.width ?? 0;
    const heightCm = catalogItem?.height ?? 0;
    const cbm =
      (lengthCm / 100) *
      (widthCm / 100) *
      (heightCm / 100) *
      (entry.quantity ?? 0);

    return {
      ...entry,
      weight,
      cbm: parseFloat(cbm.toFixed(5)),
    };
  });

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
    if (isEditDialogOpen || isViewDialogOpen) {
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
      address: "",
      contactNumber: "",
      salesPerson: "",
      warehouse: "",
      transactionDate: "",
      deliveryDate: "",
      shippingAddress: "",
      notes: "",
      status: "",
      total: "",
      totalQuantity: "",
      creationDate: "",
      formattedWeight: "",
      formattedCBM: "",
      formattedTotal: "",
      formattedNetTotal: "",
      discounts: "",
      discountBreakdown: "",
      freightCharges: "",
      otherCharges: "",
      pesoDiscounts: "",
    };

    // 🔹 Required: customer
    if (!formData.customer.trim()) {
      errors.customer = "Customer is required";
    }

    if (!formData.salesPerson.trim()) {
      errors.salesPerson = "Sales Person is required! Select customer first";
    }

    // 🔹 Required: warehouse
    if (!formData.warehouse.trim()) {
      errors.warehouse = "Warehouse is required";
    }

    // 🔹 Required: shippingAddress
    if (!formData.shippingAddress?.trim()) {
      errors.shippingAddress = "Shipping address is required";
    }

    // 🔹 Required: deliveryDate
    if (!formData.deliveryDate) {
      errors.deliveryDate = "Delivery date is required";
    } else {
      const delivery = new Date(formData.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (delivery < today) {
        errors.deliveryDate = "Delivery date cannot be in the past";
      }
    }

    // 🔹 Validate items[]
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

  const prepareCreateForm = () => {
    const normalizedItems = itemsData.map((item) => {
      const key = item.itemName?.trim().toUpperCase();
      const price = salesPriceMap[key] ?? 0;
      const quantity = Number(item.quantity) || 0;

      return {
        ...item,
        itemName: key || "UNNAMED",
        price,
        amount: price * quantity,
      };
    });

    const total = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
    const totalQuantity = normalizedItems.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0
    );

    const customerName = formData.customer?.trim().toUpperCase();
    const matchedCustomer = customers.find(
      (c) => c.customerName?.trim().toUpperCase() === customerName
    );
    const customerGroup = matchedCustomer?.customerGroup?.trim().toUpperCase();
    const matchedType = customerTypes.find(
      (ct) => ct.groupName?.trim().toUpperCase() === customerGroup
    );
    const resolvedDiscounts = matchedType?.discounts ?? [];

    const { breakdown, formattedNetTotal, formattedPesoDiscount } =
      computeDiscountBreakdown(total, resolvedDiscounts);

    setFormData((prev) => ({
      ...prev,
      items: normalizedItems,
      total,
      totalQuantity,
      balance: total,
      formattedTotal: total.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      formattedNetTotal,
      formattedPesoDiscount,
      discounts: resolvedDiscounts,
      discountBreakdown: breakdown,
      customerType: matchedType?.groupName ?? "",
      customerTypeData: matchedType,
    }));

    setIsCreateDialogOpen(true);
  };

  useEffect(() => {
    const customerName = formData.customer?.trim().toUpperCase();
    if (
      !customerName ||
      !Array.isArray(formData.items) ||
      formData.items.length === 0 ||
      customers.length === 0 ||
      customerTypes.length === 0
    ) {
      console.log("⏳ Waiting for customer and items to hydrate...");
      return;
    }

    const matchedCustomer = customers.find(
      (c) => c.customerName?.trim().toUpperCase() === customerName
    );
    const customerGroup = matchedCustomer?.customerGroup?.trim().toUpperCase();
    const matchedType = customerTypes.find(
      (ct) => ct.groupName?.trim().toUpperCase() === customerGroup
    );
    const resolvedDiscounts = matchedType?.discounts ?? [];

    const total = formData.items.reduce((sum, item) => {
      const key = item.itemName?.trim().toUpperCase();
      const price = salesPriceMap[key] ?? item.price ?? 0;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);

    const { breakdown, formattedNetTotal, formattedPesoDiscount } =
      computeDiscountBreakdown(total, resolvedDiscounts);

    console.log("🧠 Real-time discount breakdown:", breakdown);

    setFormData((prev) => ({
      ...prev,
      discounts: resolvedDiscounts,
      discountBreakdown: breakdown,
      formattedNetTotal,
      formattedPesoDiscount,
      formattedTotal: total.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      total,
      balance: total,
      totalQuantity: formData.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      ),
    }));
  }, [
    formData.customer,
    formData.items,
    customers,
    customerTypes,
    salesPriceMap,
  ]);

  const handleCreate = async () => {
    if (!validateForm()) return;

    console.log("🧠 Starting handleCreate...");

    // 🔹 Normalize items with weight, CBM, and pricing
    const normalizedItems = formData.items.map((item, index) => {
      const key = item.itemName?.trim().toUpperCase();
      const price = salesPriceMap[key] ?? 0;
      const quantity = Math.max(Number(item.quantity) || 0, 0);
      const amount = quantity * price;

      const catalogItem = itemCatalog.find(
        (i) => i.itemName?.trim().toUpperCase() === key
      );

      const weight = catalogItem?.weight ?? 0;
      const lengthCm = catalogItem?.length ?? 0;
      const widthCm = catalogItem?.width ?? 0;
      const heightCm = catalogItem?.height ?? 0;
      const cbmPerUnit = (lengthCm / 100) * (widthCm / 100) * (heightCm / 100);
      const cbm = cbmPerUnit * quantity;

      console.log(
        `🔧 [${index}] ${key} → Qty:${quantity}, Price:${price}, Amount:${amount}, Weight:${weight}, CBM:${cbm.toFixed(
          5
        )}`
      );

      return {
        itemName: key || "UNNAMED",
        itemCode: item.itemCode?.trim().toUpperCase() || "",
        description: item.description?.trim() || "",
        unitType: item.unitType?.trim().toUpperCase() || "",
        quantity,
        price,
        amount,
        weight,
        cbm: parseFloat(cbm.toFixed(5)),
      };
    });

    // 🔹 Compute totals
    const { total, totalQuantity } = normalizedItems.reduce(
      (acc, item) => {
        acc.total += item.amount;
        acc.totalQuantity += item.quantity;
        return acc;
      },
      { total: 0, totalQuantity: 0 }
    );

    console.log("💰 Total:", total);
    console.log("📊 Quantity:", totalQuantity);

    // 🔹 Resolve discounts via customerGroup → groupName
    const selectedCustomer = customers.find(
      (c) =>
        c.customerName?.trim().toUpperCase() ===
        formData.customer?.trim().toUpperCase()
    );
    const customerGroup = selectedCustomer?.customerGroup?.trim().toUpperCase();
    const matchedType = customerTypes.find(
      (type) => type.groupName?.trim().toUpperCase() === customerGroup
    );
    const finalDiscounts =
      Array.isArray(formData.discounts) && formData.discounts.length > 0
        ? formData.discounts
        : matchedType?.discounts ?? [];

    console.log("🎯 Final Discounts:", finalDiscounts);

    // 🔹 Compute discount breakdown
    const {
      breakdown: discountBreakdown,
      formattedNetTotal,
      formattedPesoDiscount,
    } = computeDiscountBreakdown(total, finalDiscounts);

    console.log("📉 Breakdown:", discountBreakdown);
    console.log("✅ Net Total:", formattedNetTotal);
    console.log("✅ Peso Discount:", formattedPesoDiscount);

    // 🔹 Update form state
    setFormData((prev) => ({
      ...prev,
      discountBreakdown,
      formattedNetTotal,
      formattedPesoDiscount,
    }));

    // 🔹 Prepare payload
    const payload = {
      soNumber: formData.soNumber.trim().toUpperCase(),
      customer: formData.customer.trim().toUpperCase(),
      address: formData.address?.trim().toUpperCase() || "",
      contactNumber: formData.contactNumber?.trim().toUpperCase() || "",
      salesPerson: formData.salesPerson.trim().toUpperCase(),
      warehouse: formData.warehouse.trim().toUpperCase(),
      transactionDate: formData.transactionDate,
      deliveryDate: formData.deliveryDate,
      shippingAddress: formData.shippingAddress?.trim() || "",
      notes: formData.notes?.trim() || "",
      status: formData.status?.trim().toUpperCase() || "PENDING",
      creationDate: formData.creationDate,
      items: normalizedItems,
      total,
      totalQuantity,
      discounts: finalDiscounts,
      discountBreakdown,
      formattedNetTotal,
      formattedPesoDiscount,
    };

    console.log("📦 Final Payload:", payload);

    // 🔹 Submit to backend
    try {
      const res = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("📡 Server Response:", result);

      if (!res.ok) {
        console.error("❌ Create failed:", result.message || result);
        alert("Failed to create sales order. Please try again.");
        return;
      }

      toast.success("Sales order created successfully!");

      if (typeof onSuccess === "function") onSuccess();

      setTimeout(() => router.push("/"), 300);
    } catch (error) {
      console.error("🔥 Network or unexpected error:", error);
      alert("Something went wrong. Please check your connection or try again.");
    }
  };

  useEffect(() => {
    const customerName = formData.customer?.trim().toUpperCase();
    if (
      !customerName ||
      !Array.isArray(itemsData) ||
      customers.length === 0 ||
      customerTypes.length === 0
    )
      return;

    const matchedCustomer = customers.find(
      (c) => c.customerName?.trim().toUpperCase() === customerName
    );

    const customerGroup = matchedCustomer?.customerGroup?.trim().toUpperCase();
    const matchedType = customerTypes.find(
      (ct) => ct.groupName?.trim().toUpperCase() === customerGroup
    );

    const resolvedDiscounts = matchedType?.discounts ?? [];

    const { total } = itemsData.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        acc.total += quantity * price;
        return acc;
      },
      { total: 0 }
    );

    const { breakdown, formattedNetTotal, formattedPesoDiscount } =
      computeDiscountBreakdown(total, resolvedDiscounts);

    setFormData((prev) => ({
      ...prev,
      customerType: matchedType?.groupName ?? "",
      customerTypeData: matchedType,
      discounts: resolvedDiscounts,
      discountBreakdown: breakdown,
      formattedNetTotal,
      formattedPesoDiscount,
    }));
  }, [formData.customer, customers, customerTypes, itemsData]);

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
      balance: total,
    }));
  }, [itemsData]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      items: itemsData,
    }));
  }, [itemsData]);

  const defaultValidationErrors: Record<
    keyof Omit<SalesOrder, "_id" | "createdAt" | "updatedAt" | "items">,
    string
  > = {
    soNumber: "",
    customer: "",
    address: "",
    contactNumber: "",
    salesPerson: "",
    warehouse: "",
    transactionDate: "",
    deliveryDate: "",
    shippingAddress: "",
    notes: "",
    status: "",
    total: "",
    totalQuantity: "",
    creationDate: "",
    formattedWeight: "",
    formattedCBM: "",
    formattedTotal: "",
    formattedNetTotal: "",
    discounts: "",
    discountBreakdown: "",
    freightCharges: "",
    otherCharges: "",
    pesoDiscounts: "",
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
        const quantity = Math.max(Number(item.quantity) || 0, 0);

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

    // 🧠 Resolve discount from customerGroup → groupName → discounts[]
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

    // 🧠 Compute full breakdown
    const {
      breakdown: discountBreakdown,
      netTotal,
      formattedNetTotal,
      formattedPesoDiscount,
    } = computeDiscountBreakdown(totalAmount, resolvedDiscounts);

    const hydratedFormData: typeof formData = {
      soNumber: so.soNumber.trim().toUpperCase(),
      customer: so.customer?.trim().toUpperCase() || "",
      address: so.address?.trim().toUpperCase() || "",
      contactNumber: so.contactNumber?.trim().toUpperCase() || "",
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
      formattedWeight: so.formattedWeight ?? "0.00 kg",
      formattedCBM: so.formattedCBM ?? "0.000 m³",
      formattedTotal: totalAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      formattedNetTotal,
      discounts: resolvedDiscounts,
      discountBreakdown,
      customerType: matchedCustomerType?.groupName ?? "",
      customerTypeData: matchedCustomerType,
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

    // 🧠 Compute discount breakdown
    const {
      breakdown: discountBreakdown,
      netTotal,
      formattedNetTotal,
      formattedPesoDiscount,
    } = computeDiscountBreakdown(totalAmount, formData.discounts ?? []);

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
      formattedTotal: totalAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      formattedNetTotal,
      discountBreakdown,
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
      address: "",
      contactNumber: "",
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
      formattedWeight: "0.00 kg",
      formattedCBM: "0.000 m³",
      formattedTotal: "0.00",
      formattedNetTotal: "0.00",
      discounts: [],
      discountBreakdown: [],
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
      address: "",
      contactNumber: "",
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
      formattedWeight: "0.00 kg",
      formattedCBM: "0.000 m³",
      formattedTotal: "0.00",
      formattedNetTotal: "0.00",
      discounts: [],
      discountBreakdown: [], // ✅ Added
      customerType: "",
      customerTypeData: undefined,
    });

    setValidationErrors({
      soNumber: "",
      customer: "",
      address: "",
      contactNumber: "",
      salesPerson: "",
      warehouse: "",
      transactionDate: "",
      deliveryDate: "",
      shippingAddress: "",
      notes: "",
      status: "",
      total: "",
      totalQuantity: "",
      creationDate: "",
      formattedWeight: "",
      formattedCBM: "",
      formattedTotal: "",
      formattedNetTotal: "",
      discounts: "",
      discountBreakdown: "",
      freightCharges: "",
      otherCharges: "",
      pesoDiscounts: "",
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

  const isFirstFetch = useRef(true);

  useEffect(() => {
    const fetchSalesOrders = async () => {
      if (isFirstFetch.current) {
        setIsLoading(true);
      }

      try {
        const res = await fetch("/api/sales-orders", { cache: "no-store" });
        const data = await res.json();
        const parsed = Array.isArray(data.salesOrders) ? data.salesOrders : [];
        setSalesOrders(parsed);
      } catch (err) {
        console.error("❌ Failed to fetch sales orders:", err);
        setSalesOrders([]);
      } finally {
        if (isFirstFetch.current) {
          setIsLoading(false);
          isFirstFetch.current = false;
        }
      }
    };

    fetchSalesOrders(); // initial fetch

    const intervalId = setInterval(fetchSalesOrders, 1000); // silent refetch

    return () => clearInterval(intervalId);
  }, []);

  // const fetchSingleSO = async (soId: string) => {
  //   if (!soId || typeof soId !== "string") {
  //     console.warn("⚠️ Invalid Sales Order ID:", soId);
  //     return;
  //   }

  //   try {
  //     console.log(`📡 Fetching Sales Order: ${soId}`);

  //     const res = await fetch(`/api/sales-orders/${soId}`, {
  //       cache: "no-store",
  //     });

  //     if (!res.ok) throw new Error("Failed to fetch Sales Order");

  //     const { order } = await res.json();

  //     console.log("📥 Raw Sales Order from DB:", order);

  //     setItemsData(order.items ?? []);
  //     setFormData(order);
  //   } catch (error) {
  //     console.error("❌ Error loading Sales Order:", error);

  //     setItemsData([]);
  //     setFormData({
  //       soNumber: "",
  //       customer: "",
  //       address: "",
  //       contactNumber: "",
  //       salesPerson: "",
  //       warehouse: "",
  //       transactionDate: new Date().toISOString().split("T")[0],
  //       deliveryDate: "",
  //       shippingAddress: "",
  //       notes: "",
  //       status: "PENDING",
  //       creationDate: new Date().toISOString().split("T")[0],
  //       items: [],
  //       total: 0,
  //       totalQuantity: 0,
  //       formattedWeight: "0.00 kg",
  //       formattedCBM: "0.000 m³",
  //       formattedTotal: "₱0.00",
  //       formattedNetTotal: "₱0.00",
  //       discounts: [],
  //       discountBreakdown: [],
  //       customerType: "",
  //       customerTypeData: undefined,
  //     });
  //   }
  // };

  // const params = useParams();
  // const soId = params?.id as string;

  // useEffect(() => {
  //   if (soId) {
  //     fetchSingleSO(soId);
  //   }
  // }, [soId]);

  // const isHydrationReady = useMemo(() => {
  //   return (
  //     itemCatalog.length > 0 && customers.length > 0 && customerTypes.length > 0
  //   );
  // }, [itemCatalog, customers, customerTypes]);

  const handleView = async (id: string) => {
    try {
      const res = await fetch(`/api/sales-orders/${id}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn(
          `⚠️ Failed to fetch sales order ${id}: HTTP ${res.status}`
        );
        toast.error("Sales order not found");
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const fallback = await res.text();
        console.error("❌ Non-JSON response:", fallback);
        toast.error("Invalid response format");
        return;
      }

      const { order }: { order: SalesOrder } = await res.json();
      if (!order) {
        console.warn("⚠️ No sales order returned for ID:", id);
        toast.error("Sales order not found");
        return;
      }

      console.log("📦 Raw items from order:", order.items);

      const normalizedItems = Array.isArray(order.items)
        ? order.items.map((item, i) => ({
            ...item,
            id: item._id ?? `item-${i}`,
          }))
        : [];

      console.log("✅ Normalized items:", normalizedItems);

      setFormData({ ...order, items: normalizedItems });
      setItemsData(normalizedItems);
      setIsViewDialogOpen(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Failed to load sales order:", error);
        toast.error(`Unable to load sales order: ${error.message}`);
      } else {
        console.error("❌ Unknown error:", error);
        toast.error("Unable to load sales order");
      }
    }
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

  const handleAddItem = () => {
    const newItem = {
      _id: crypto.randomUUID(),
      itemCode: "",
      itemName: "",
      unitType: "",
      price: 0,
      quantity: 0,
      amount: 0,
    };

    setItemsData((prev) => [...prev, newItem]);

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = itemsData.filter((_, i) => i !== index);

    const totalQuantity = updatedItems.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0
    );

    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.amount || (item.quantity ?? 0) * item.price,
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
    prepareCreateForm();
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

  function updateQuantity(index: number, value: number | null) {
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
  }

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
    : totalAfterDiscounts.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  const subtotalPeso = parseFloat(formattedTotal.replace(/[^\d.]/g, ""));
  const totalAmountPeso = parseFloat(formattedNetTotal.replace(/[^\d.]/g, ""));
  const pesoDiscount = Math.max(subtotalPeso - totalAmountPeso, 0);

  const formattedPesoDiscount = `₱${pesoDiscount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const handleExportPDF = (items: SalesOrderItem[], soMeta: SalesOrder) => {
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
      (sum, i) => sum + (i.quantity ?? 0) * (i.salesPrice ?? 0),
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
      doc.text("SALES ORDER", pageWidth - marginRight, 22, {
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
          soMeta.createdAt
            ? new Date(soMeta.createdAt).toLocaleDateString("en-PH", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })
            : "N/A",
        ],

        [
          "DELIVERY DATE",
          soMeta.deliveryDate
            ? format(new Date(soMeta.deliveryDate), "MMM dd yyyy")
            : "N/A",
        ],
        ["SO #", soMeta.soNumber || "N/A"],
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
        ["SOLD TO", soMeta.customer || "N/A"],
        ["ADDRESS", soMeta.address || "N/A"],
        ["CONTACT #", soMeta.contactNumber || "N/A"],
        ["SALES PERSON", soMeta.salesPerson || "N/A"],
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
          (item.price ?? 0).toFixed(2),
          "0.00",
          ((item.quantity ?? 0) * (item.price ?? 0)).toFixed(2),
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

      if (index === chunkedItems.length - 1) {
        const totalQuantity = soMeta.totalQuantity;
        const grandTotal =
          typeof soMeta.formattedNetTotal === "number"
            ? soMeta.formattedNetTotal
            : parseFloat(
                (soMeta.formattedNetTotal ?? "0").replace(/[^\d.-]/g, "")
              );

        const freightCharges = soMeta.freightCharges ?? 0;
        const otherCharges = soMeta.otherCharges ?? 0;
        const pesoDiscount = soMeta.pesoDiscounts ?? 0;

        // Optional: derive discount from breakdown

        const discountText = [
          ...soMeta.discountBreakdown
            .filter((step) => step.rate > 0)
            .map(
              (step) =>
                `${(step.rate * 100).toLocaleString("en-PH", {
                  minimumFractionDigits: step.rate * 100 < 1 ? 2 : 1,
                  maximumFractionDigits: 2,
                })}%`
            ),
          ...Array(4).fill("0.00%"),
        ]
          .slice(0, 4)
          .join("  ");

        doc.setFont("helvetica", "italic").setFontSize(9);
        doc.text("-- Nothing follows --", pageWidth / 2, footerY - 80, {
          align: "center",
        });

        doc.setFont("helvetica", "bold").setFontSize(9);

        const renderRightAlignedLabelValue = (
          label: string,
          value: string,
          y: number,
          rightX: number,
          labelOffset = 60
        ) => {
          doc.text(label, rightX - labelOffset, y, { align: "left" });
          doc.text(value, rightX, y, { align: "right" });
        };

        // Left side: Total Quantity
        doc.text("Total Quantity:", marginLeft + 10, footerY - 40, {
          align: "left",
        });
        doc.text(`${totalQuantity}`, marginLeft + 80, footerY - 40, {
          align: "left",
        });

        const remarksY = footerY - 35;

        doc.text("Remarks:", marginLeft + 10, remarksY, { align: "left" });
        doc.text(soMeta.notes ?? "N/A", marginLeft + 80, remarksY, {
          align: "left",
        });

        // Right side: Financial breakdown
        const rightX = pageWidth - marginRight - 10;

        renderRightAlignedLabelValue(
          "Grand Total:",
          grandTotal.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          footerY - 40,
          rightX
        );

        renderRightAlignedLabelValue(
          "Freight Charge(s):",
          freightCharges.toFixed(2),
          footerY - 35,
          rightX
        );
        renderRightAlignedLabelValue(
          "Other Charge(s):",
          otherCharges.toFixed(2),
          footerY - 30,
          rightX
        );
        renderRightAlignedLabelValue(
          "Discount:",
          discountText,
          footerY - 25,
          rightX
        );
        renderRightAlignedLabelValue(
          "Peso Discounts:",
          pesoDiscount.toFixed(2),
          footerY - 20,
          rightX
        );
        renderRightAlignedLabelValue(
          "Total Amount:",
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

    doc.save(`${soMeta.soNumber || "sales_order"}.pdf`);
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

              <DialogPanel className="max-h-[80vh] overflow-y-auto px-6 py-4">
                {/* Header */}
                <DialogHeader className="border-b pb-2">
                  <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
                    Create Sales Order
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Fill in the order details. Fields marked with{" "}
                    <span className="text-red-500">* </span>
                    are required.
                  </DialogDescription>
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
                          Customer Name<span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="create-customer-name"
                            type="text"
                            name="create-customer-name-no-autofill"
                            autoComplete="off"
                            value={formData.customer || ""}
                            onClick={() => setShowCustomerSuggestions(true)}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();
                              setFormData((prev) => ({
                                ...prev,
                                customer: value,
                                address: "",
                                contactNumber: "",
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
                            placeholder="Search Customer name"
                            className={`text-sm w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
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
                                              address:
                                                customer.address
                                                  ?.trim()
                                                  .toUpperCase() || "",
                                              contactNumber:
                                                customer.contactNumber
                                                  ?.trim()
                                                  .toUpperCase() || "",
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
                          Delivery Date <span className="text-red-500">*</span>
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
                              ? "border-destructive bg-muted"
                              : "bg-muted"
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
                          placeholder="Select Customer"
                          className={`text-sm w-full px-2 py-1 border ${
                            validationErrors.salesPerson
                              ? "border-destructive"
                              : "border-border"
                          } bg-muted text-muted-foreground`}
                        />
                        {validationErrors.salesPerson && (
                          <p className="text-sm text-destructive">
                            {validationErrors.salesPerson}
                          </p>
                        )}
                      </div>
                      {/* Warehouse */}
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <Label htmlFor="create-warehouse">
                          Warehouse <span className="text-red-500">*</span>
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
                            placeholder="Search Warehouse"
                            className={`text-sm  w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary ${
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
                        Shipping Address <span className="text-red-500">*</span>
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
                            className={`grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] items-center 
      border border-border rounded-lg mb-1 bg-white hover:shadow-sm transition-all
      ${index % 2 === 0 ? "bg-muted/40" : "bg-white"}`}>
                            {/* Item Code */}
                            <input
                              type="text"
                              value={item.itemCode || ""}
                              readOnly
                              className="w-full px-3 py-2 border-r border-border text-sm bg-gray-50 text-gray-700 rounded-l-lg"
                            />

                            {/* Item Name + Suggestions */}
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
                                placeholder="🔍 Search item"
                                className="text-sm uppercase w-full px-3 py-2 border-none bg-transparent focus:ring-2 focus:ring-primary/60 focus:bg-white rounded-none transition-all"
                              />

                              {/* Stock Indicator */}
                              {(() => {
                                const inventory = inventoryItems.find(
                                  (inv) => inv.itemCode === item.itemCode
                                );
                                const availableQty =
                                  Number(inventory?.availableQuantity) || 0;

                                return (
                                  <div className="text-xs text-gray-600 mt-1 ml-1">
                                    {item.itemName ? (
                                      availableQty > 0 ? (
                                        <span className="text-green-600 font-medium">
                                          🟢 {availableQty} available
                                        </span>
                                      ) : (
                                        <span className="text-red-500 font-medium">
                                          🔴 Out of Stock
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-muted-foreground">
                                        Select item to view stock
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Dropdown Suggestions */}
                              {showItemSuggestions === index && (
                                <ul className="absolute top-full left-0 w-full z-20 bg-white border border-border rounded-md shadow-lg max-h-56 overflow-y-auto text-sm mt-1 animate-in fade-in-0 zoom-in-95">
                                  {(() => {
                                    const input =
                                      item.itemName?.toUpperCase().trim() || "";
                                    const selectedNames = itemsData
                                      .map((i) =>
                                        i.itemName?.trim().toUpperCase()
                                      )
                                      .filter(Boolean);

                                    const filtered = inventoryItems.filter(
                                      (option) => {
                                        const normalized = option.itemName
                                          ?.trim()
                                          .toUpperCase();
                                        const availableQty =
                                          Number(option.availableQuantity) || 0;

                                        return (
                                          normalized &&
                                          normalized.includes(input) &&
                                          availableQty > 0 &&
                                          !selectedNames.includes(normalized)
                                        );
                                      }
                                    );

                                    if (filtered.length === 0) {
                                      return (
                                        <li className="px-3 py-2 text-muted-foreground text-center">
                                          No items found
                                        </li>
                                      );
                                    }

                                    return filtered.map((option) => {
                                      const normalized = option.itemName
                                        ?.trim()
                                        .toUpperCase();
                                      const availableQty =
                                        option.availableQuantity ?? 0;

                                      return (
                                        <li
                                          key={option.itemCode || normalized}
                                          className="px-3 py-2 hover:bg-primary/10 cursor-pointer transition-colors flex justify-between items-center"
                                          onClick={() => {
                                            const enriched = {
                                              itemName: normalized,
                                              itemCode: option.itemCode || "",
                                              unitType: option.unitType || "",
                                              price: option.salesPrice ?? 0,
                                              quantity: 1,
                                              availableQuantity: availableQty,
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
                                          <span className="font-medium">
                                            {normalized}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {availableQty} available
                                          </span>
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
                              inputMode="decimal"
                              value={item.quantity ?? ""}
                              disabled={!item.itemName}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  updateQuantity(index, null);
                                  return;
                                }
                                if (/^\d*\.?\d*$/.test(value)) {
                                  const parsed = parseFloat(value);
                                  if (!isNaN(parsed)) {
                                    const inventory = inventoryItems.find(
                                      (inv) => inv.itemCode === item.itemCode
                                    );
                                    const availableQty =
                                      Number(inventory?.availableQuantity) || 0;
                                    const clamped = Math.min(
                                      Math.max(parsed, 1),
                                      availableQty
                                    );
                                    updateQuantity(index, clamped);
                                  }
                                }
                              }}
                              placeholder="0"
                              className={`w-full text-end px-2 py-2 border-l border-border bg-white focus:ring-2 focus:ring-primary/60 rounded-none text-sm ${
                                !item.itemName
                                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                                  : ""
                              }`}
                            />

                            {/* Unit */}
                            <input
                              type="text"
                              value={item.unitType || ""}
                              readOnly
                              className="w-full px-2 py-2 border-l border-border text-center text-gray-700 bg-gray-50"
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
                              className="w-full px-2 py-2 border-l border-border text-right bg-gray-50 text-gray-700 text-sm"
                            />

                            {/* Amount */}
                            <input
                              type="text"
                              value={(() => {
                                const key = item.itemName?.trim().toUpperCase();
                                const price = salesPriceMap[key] ?? 0;
                                const qty = item.quantity ?? 0;
                                const amount = price * qty;
                                return amount > 0
                                  ? amount.toLocaleString("en-PH", {
                                      style: "currency",
                                      currency: "PHP",
                                    })
                                  : "";
                              })()}
                              readOnly
                              className="w-full px-2 py-2 border-l border-border text-right bg-gray-50 text-gray-700 text-sm"
                            />

                            {/* Trash */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-r-lg"
                              onClick={() => handleRemoveItem(index)}
                              title="Remove item">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Left: Add Item */}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleAddItem}
                      disabled={
                        formData.items.length > 0 &&
                        (!formData.items.at(-1)?.itemCode ||
                          Number(formData.items.at(-1)?.quantity) <= 0)
                      }
                      className="w-fit text-sm">
                      + Add Item
                    </Button>

                    <div className="w-full mt-8 overflow-x-auto">
                      <h3 className="text-lg font-semibold text-primary tracking-wide mb-4 border-t py-2 text-end">
                        Order Summary
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-4">
                        {/* Placeholder for Column 1 */}
                        <div className="hidden md:block" />

                        {/* Placeholder for Column 2 */}
                        <div className="hidden md:block" />

                        {/* Third Column: Metrics */}
                        <div className="w-full max-w-md ml-auto mt-2 bg-muted/10 rounded-md shadow-sm border border-border">
                          <table className="w-full border border-border rounded-lg overflow-hidden text-sm">
                            <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                              <tr>
                                <th className="px-4 py-2 text-left">Metric</th>
                                <th className="px-4 py-2 text-right">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-t">
                                <td className="px-4 py-2">Total Quantity</td>
                                <td className="px-4 py-2 text-right">
                                  {formData.items.reduce(
                                    (sum, item) =>
                                      sum + Number(item.quantity || 0),
                                    0
                                  )}
                                </td>
                              </tr>
                              <tr className="border-t">
                                <td className="px-4 py-2">Total Weight</td>
                                <td className="px-4 py-2 text-right">
                                  {formattedWeight}
                                </td>
                              </tr>
                              <tr className="border-t">
                                <td className="px-4 py-2">Total CBM</td>
                                <td className="px-4 py-2 text-right">
                                  {formattedCBM}
                                </td>
                              </tr>
                              <tr className="border-t">
                                <td className="px-4 py-2">UOM</td>
                                <td className="px-4 py-2 text-right">
                                  {Array.from(
                                    new Set(
                                      formData.items.map((item) =>
                                        item.unitType?.trim().toUpperCase()
                                      )
                                    )
                                  )
                                    .filter(Boolean)
                                    .join(", ")}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Fourth Column: Financials */}
                        <div className="w-full max-w-md ml-auto mt-2 bg-muted/10 rounded-md shadow-sm border border-border">
                          <table className="w-full border border-border rounded-lg overflow-hidden text-sm">
                            <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                              <tr>
                                <th className="px-4 py-2 text-left">
                                  Breakdown
                                </th>
                                <th className="px-4 py-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-t">
                                <td className="px-4 py-2">Gross Amount</td>
                                <td className="px-4 py-2 text-right">
                                  {formattedTotal}
                                </td>
                              </tr>
                              {/* First row: label + first discount */}
                              <tr className="border-t bg-muted/10">
                                <td className="px-4 py-2 font-medium text-muted-foreground">
                                  Discounts (%)
                                </td>
                                <td className="px-4 py-2 text-right text-foreground text-sm">
                                  {typeof formData.discountBreakdown?.[0]
                                    ?.rate === "number"
                                    ? `${parseFloat(
                                        (
                                          formData.discountBreakdown[0].rate *
                                          100
                                        ).toFixed(2)
                                      )}%`
                                    : "0.00%"}
                                </td>
                              </tr>

                              {formData.discountBreakdown
                                .slice(1)
                                .map((step, index) => (
                                  <tr
                                    key={index}
                                    className="border-t bg-muted/10">
                                    <td className="px-4 py-2"></td>
                                    <td className="px-4 py-2 text-right text-foreground text-sm">
                                      {typeof step.rate === "number"
                                        ? `${parseFloat(
                                            (step.rate * 100).toFixed(2)
                                          )}%`
                                        : "0.00%"}
                                    </td>
                                  </tr>
                                ))}

                              <tr className="border-t">
                                <td className="px-4 py-2 font-medium text-primary">
                                  Net Amount
                                </td>
                                <td className="px-4 py-2 text-right font-bold text-primary">
                                  {formattedNetTotal}
                                </td>
                              </tr>
                            </tbody>
                          </table>
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
                      variant="outline"
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
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-48 px-4 text-muted-foreground">
                      <div className="flex h-full items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-medium tracking-wide">
                          Loading orders, please wait…
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedSalesOrders.length === 0 ? (
                  // your empty state

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

                      <TableCell>{so.formattedNetTotal}</TableCell>

                      <TableCell>
                        <StatusStepperButton
                          soId={String(so._id)}
                          currentStatus={so.status}
                          handleUpdateStatus={handleUpdateStatus}
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(String(so._id))}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Export as PDF"
                            aria-label={`Export SO ${so.soNumber} to PDF`}
                            onClick={() => handleExportPDF(so.items, so)}>
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
                Sales orders per page:
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
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Edit Sales Order
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the order details. Fields marked with{" "}
              <span className="text-red-500">* </span>
              are required.
            </DialogDescription>
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
                          address: "",
                          contactNumber: "",
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
                                        address:
                                          customer.address
                                            ?.trim()
                                            .toUpperCase() || "",
                                        contactNumber:
                                          customer.contactNumber
                                            ?.trim()
                                            .toUpperCase() || "",
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
                  <Label htmlFor="edit-deliveryDate">
                    Delivery Date<span className="text-red-500">*</span>
                  </Label>
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
                      validationErrors.deliveryDate
                        ? "border-destructive muted"
                        : "bg-muted"
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
                    className={`text-sm w-full px-2 py-1 border ${
                      validationErrors.salesPerson
                        ? "border-destructive"
                        : "border-border"
                    } bg-muted text-muted-foreground`}
                  />
                  {validationErrors.salesPerson && (
                    <p className="text-sm text-destructive">
                      {validationErrors.salesPerson}
                    </p>
                  )}
                </div>

                {/* Warehouse */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <Label htmlFor="edit-warehouse">
                    Warehouse<span className="text-red-500">*</span>
                  </Label>
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
                <Label htmlFor="edit-shippingAddress">
                  Shipping Address<span className="text-red-500">*</span>
                </Label>
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
                        className={`grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_40px] 
      items-center text-sm border border-border rounded-md mb-1
      bg-white hover:bg-muted/50 hover:shadow-sm transition-all`}>
                        {/* Item Code */}
                        <input
                          type="text"
                          value={item.itemCode || ""}
                          readOnly
                          className="w-full px-3 py-2 border-r border-border bg-gray-50 text-gray-700 rounded-l-md"
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
                            placeholder="🔍 Search item name"
                            className="w-full text-sm uppercase px-3 py-2 border-none bg-transparent 
          focus:ring-2 focus:ring-primary/60 rounded-none pr-8 transition-all"
                          />

                          {/* Search Icon */}
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

                          {/* Suggestions Dropdown */}
                          {showItemSuggestions === index && (
                            <ul className="absolute top-full left-0 w-full z-20 bg-white border border-border rounded-md shadow-lg max-h-56 overflow-y-auto text-sm mt-1 animate-in fade-in-0 zoom-in-95">
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
                                    <li className="px-3 py-2 text-center text-muted-foreground">
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
                                      className="px-3 py-2 hover:bg-primary/10 cursor-pointer transition-colors flex justify-between items-center"
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
                                      <span>
                                        {normalized ||
                                          option.itemCode ||
                                          "Unnamed Item"}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Avail: {option.availableQuantity ?? 0}
                                      </span>
                                    </li>
                                  );
                                });
                              })()}
                            </ul>
                          )}
                        </div>

                        {/* Quantity */}
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="^\d*\.?\d*$"
                          value={
                            item.itemName
                              ? item.quantity !== null &&
                                item.quantity !== undefined
                                ? item.quantity.toString()
                                : ""
                              : ""
                          }
                          disabled={!item.itemName}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (value === "") {
                              updateQuantity(index, null);
                              return;
                            }

                            if (/^\d*\.?\d*$/.test(value)) {
                              const parsed = parseFloat(value);
                              if (!isNaN(parsed)) {
                                const maxQty =
                                  inventoryItems.find(
                                    (inv) => inv.itemCode === item.itemCode
                                  )?.quantity ?? 9999;
                                const clamped = Math.min(
                                  Math.max(parsed, 1),
                                  maxQty
                                );
                                updateQuantity(index, clamped);
                              }
                            }
                          }}
                          placeholder="e.g. 5"
                          className={`w-full text-end px-3 py-2 border-l border-border bg-white focus:ring-2 focus:ring-primary/60 text-sm rounded-none ${
                            !item.itemName
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }`}
                        />

                        {/* Unit Type */}
                        <input
                          type="text"
                          value={item.unitType || ""}
                          readOnly
                          className="w-full px-3 py-2 border-l border-border text-center text-gray-700 bg-gray-50"
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
                          className="w-full px-3 py-2 border-l border-border text-right bg-gray-50 text-gray-700 text-sm"
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
                          className="w-full px-3 py-2 border-l border-border text-right bg-gray-50 text-gray-700 text-sm"
                          placeholder="₱0.00"
                        />

                        {/* Trash Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-r-md"
                          onClick={() => handleRemoveItem(index)}
                          title="Remove item">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </>
              )}

              {/* Left: Add Item */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleAddItem}
                disabled={
                  formData.items.length > 0 &&
                  (!formData.items.at(-1)?.itemCode ||
                    Number(formData.items.at(-1)?.quantity) <= 0)
                }
                className="w-fit text-sm">
                + Add Item
              </Button>

              <div className="w-full mt-8 overflow-x-auto">
                <h3 className="text-lg font-semibold text-primary tracking-wide mb-4 border-t py-2 text-end">
                  Order Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-4">
                  {/* Placeholder for Column 1 */}
                  <div className="hidden md:block" />

                  {/* Placeholder for Column 2 */}
                  <div className="hidden md:block" />

                  {/* Third Column: Metrics */}
                  <div className="w-full max-w-md ml-auto mt-2 bg-muted/10 rounded-md shadow-sm border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                        <tr>
                          <th className="px-4 py-2 text-left">Metric</th>
                          <th className="px-4 py-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-4 py-2">Total Quantity</td>
                          <td className="px-4 py-2 text-right">
                            {formData.items.reduce(
                              (sum, item) => sum + Number(item.quantity || 0),
                              0
                            )}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="px-4 py-2">Total Weight</td>
                          <td className="px-4 py-2 text-right">
                            {formattedWeight}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="px-4 py-2">Total CBM</td>
                          <td className="px-4 py-2 text-right">
                            {formattedCBM}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="px-4 py-2">UOM</td>
                          <td className="px-4 py-2 text-right">
                            {Array.from(
                              new Set(
                                formData.items.map((item) =>
                                  item.unitType?.trim().toUpperCase()
                                )
                              )
                            )
                              .filter(Boolean)
                              .join(", ")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Fourth Column: Financials */}
                  <div className="w-full max-w-md ml-auto mt-2 bg-muted/10 rounded-md shadow-sm border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                        <tr>
                          <th className="px-4 py-2 text-left">Breakdown</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-4 py-2">Gross Amount</td>
                          <td className="px-4 py-2 text-right">
                            {formattedTotal}
                          </td>
                        </tr>
                        {/* First row: label + first discount */}
                        <tr className="border-t bg-muted/10">
                          <td className="px-4 py-2 font-medium text-muted-foreground">
                            Discounts (%)
                          </td>
                          <td className="px-4 py-2 text-right text-foreground text-sm">
                            {typeof formData.discountBreakdown?.[0]?.rate ===
                            "number"
                              ? `${parseFloat(
                                  (
                                    formData.discountBreakdown[0].rate * 100
                                  ).toFixed(2)
                                )}%`
                              : "0.00%"}
                          </td>
                        </tr>

                        {formData.discountBreakdown
                          .slice(1)
                          .map((step, index) => (
                            <tr key={index} className="border-t bg-muted/10">
                              <td className="px-4 py-2"></td>
                              <td className="px-4 py-2 text-right text-foreground text-sm">
                                {typeof step.rate === "number"
                                  ? `${parseFloat(
                                      (step.rate * 100).toFixed(2)
                                    )}%`
                                  : "0.00%"}
                              </td>
                            </tr>
                          ))}

                        <tr className="border-t">
                          <td className="px-4 py-2 font-medium text-primary">
                            Net Amount
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-primary">
                            {formattedNetTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
          <DialogFooter className="pt-4 border-t">
            <div className="flex w-full justify-end items-center gap-2">
              {/* Cancel Button */}
              <Button
                variant="outline"
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
                  Save Changes
                </Button>

                {/* Dropdown for More Actions */}
                {/* <DropdownMenu>
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

                    <DropdownMenuSeparator /> */}

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
                {/* </DropdownMenuContent>
                </DropdownMenu> */}
              </div>
            </div>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="w-full px-6 py-6">
          {isLoadingView ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading sales order…
              </span>
            </div>
          ) : formData.soNumber ? (
            <>
              <DialogTitle className="sr-only">Sales Order</DialogTitle>

              {/* Invoice Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-2">
                <div>
                  <h2 className="text-xl font-bold text-primary tracking-wide">
                    Sales Order
                  </h2>
                  <p className="text-sm text-muted-foreground ">
                    Sales Order No:{" "}
                    <span className=" text-foreground font-semibold">
                      {formData.soNumber}
                    </span>
                  </p>
                </div>

                <div className="text-sm text-right text-muted-foreground">
                  <p>
                    Transaction Date:{" "}
                    {formData.transactionDate
                      ? format(
                          new Date(formData.transactionDate),
                          "MMM dd yyyy"
                        )
                      : "N/A"}
                  </p>
                  <p>
                    Delivery Date:{" "}
                    {formData.deliveryDate
                      ? format(new Date(formData.deliveryDate), "MMM dd yyyy")
                      : "N/A"}
                  </p>

                  <p>
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        formData.status === "COMPLETED"
                          ? "text-green-600"
                          : formData.status === "TO PREPARE"
                          ? "text-blue-600"
                          : formData.status === "PENDING"
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}>
                      {formData.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Customer & Warehouse Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Customer Name:
                    </span>{" "}
                    <span className="text-foreground font-semibold">
                      {formData.customer}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground ">
                      Customer Type:
                    </span>{" "}
                    <span className="text-foreground font-semibold">
                      {formData.customerType || "—"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Sales Person:
                    </span>{" "}
                    <span className="text-foreground font-semibold">
                      {formData.salesPerson || "—"}
                    </span>
                  </p>
                </div>

                {/* Warehouse Info */}
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Warehouse Name:
                    </span>{" "}
                    <span className="text-foreground font-semibold">
                      {formData.warehouse}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Shipping Address:
                    </span>{" "}
                    <span className="text-foreground font-semibold">
                      {formData.shippingAddress || "—"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Notes:
                    </span>{" "}
                    <span className="text-foreground font-semibold">
                      {formData.notes || "—"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
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
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.itemName}</td>
                        <td className="px-4 py-2 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2">{item.unitType}</td>
                        <td className="px-4 py-2 text-right">
                          ₱
                          {item.price.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2 text-right">
                          ₱
                          {item.amount.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Section - 4 Column Grid with Spacers */}
              <div className="w-full mt-8 overflow-x-auto">
                <h3 className="text-lg font-semibold text-primary tracking-wide mb-4 border-t py-2 text-end">
                  Order Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-4">
                  {/* Placeholder for Column 1 */}
                  <div className="hidden md:block" />

                  {/* Placeholder for Column 2 */}
                  <div className="hidden md:block" />

                  {/* Third Column: Metrics */}
                  <div className="w-full max-w-md ml-auto mt-2 bg-muted/10 rounded-md shadow-sm border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                        <tr>
                          <th className="px-4 py-2 text-left">Metric</th>
                          <th className="px-4 py-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-4 py-2">Total Quantity</td>
                          <td className="px-4 py-2 text-right">
                            {formData.items.reduce(
                              (sum, item) => sum + Number(item.quantity || 0),
                              0
                            )}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="px-4 py-2">Total Weight</td>
                          <td className="px-4 py-2 text-right">
                            {formattedWeight}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="px-4 py-2">Total CBM</td>
                          <td className="px-4 py-2 text-right">
                            {formattedCBM}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="px-4 py-2">UOM</td>
                          <td className="px-4 py-2 text-right">
                            {Array.from(
                              new Set(
                                formData.items.map((item) =>
                                  item.unitType?.trim().toUpperCase()
                                )
                              )
                            )
                              .filter(Boolean)
                              .join(", ")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Fourth Column: Financials */}
                  <div className="w-full max-w-md ml-auto mt-2 bg-muted/10 rounded-md shadow-sm border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                        <tr>
                          <th className="px-4 py-2 text-left">Breakdown</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-4 py-2">Gross Amount</td>
                          <td className="px-4 py-2 text-right">
                            {formattedTotal}
                          </td>
                        </tr>
                        {/* First row: label + first discount */}
                        <tr className="border-t bg-muted/10">
                          <td className="px-4 py-2 font-medium text-muted-foreground">
                            Discounts (%)
                          </td>
                          <td className="px-4 py-2 text-right text-foreground text-sm">
                            {typeof formData.discountBreakdown?.[0]?.rate ===
                            "number"
                              ? `${parseFloat(
                                  (
                                    formData.discountBreakdown[0].rate * 100
                                  ).toFixed(2)
                                )}%`
                              : "0.00%"}
                          </td>
                        </tr>

                        {formData.discountBreakdown
                          .slice(1)
                          .map((step, index) => (
                            <tr key={index} className="border-t bg-muted/10">
                              <td className="px-4 py-2"></td>
                              <td className="px-4 py-2 text-right text-foreground text-sm">
                                {typeof step.rate === "number"
                                  ? `${parseFloat(
                                      (step.rate * 100).toFixed(2)
                                    )}%`
                                  : "0.00%"}
                              </td>
                            </tr>
                          ))}

                        <tr className="border-t">
                          <td className="px-4 py-2 font-medium text-primary">
                            Net Amount
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-primary">
                            {formattedNetTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <DialogFooter className="py-4 border-t border-border flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No sales order data found.
            </p>
          )}
        </DialogPanel>
      </Dialog>
    </div>
  );
}
