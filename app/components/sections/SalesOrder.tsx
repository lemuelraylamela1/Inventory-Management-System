import React, { useState, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CalendarDays,
  Filter,
} from "lucide-react";
import type { SalesOrder } from "../../components/sections/type";

import { format } from "date-fns";

const statusOptions = [
  "all",
  "draft",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
const itemsPerPageOptions = [10, 50, 100];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "delivered":
      return "default";
    case "shipped":
      return "secondary";
    case "processing":
      return "outline";
    case "confirmed":
      return "outline";
    case "draft":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function SalesOrder() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "PENDING" | "PARTIAL" | "COMPLETED" | "CANCELLED"
  >("all");

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingSO, setEditingSO] = useState<SalesOrder | null>(null);
  const [viewingSO, setViewingSO] = useState<SalesOrder | null>(null);
  const [formData, setFormData] = useState({
    soNumber: "",
    customer: "",
    amount: "",
    status: "PENDING" as "PENDING" | "PARTIAL" | "COMPLETED" | "CANCELLED",
    remarks: "",
    shippingAddress: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    creationDate: new Date().toISOString().split("T")[0],
    transactionDate: new Date().toISOString().split("T")[0],
  });

  const [validationErrors, setValidationErrors] = useState({
    soNumber: "",
    customer: "",
    amount: "",
    contactEmail: "",
  });

  // Filter and paginate data
  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter((so) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        (so.soNumber ?? "").toLowerCase().includes(search) ||
        (so.customer ?? "").toLowerCase().includes(search) ||
        (so.remarks ?? "").toLowerCase().includes(search);

      const matchesDate =
        !dateFilter ||
        format(new Date(so.creationDate), "yyyy-MM-dd") === dateFilter;

      const matchesCustomer =
        customerFilter === "all" || so.customer === customerFilter;

      const matchesStatus =
        statusFilter === "all" || so.status === statusFilter;

      return matchesSearch && matchesDate && matchesCustomer && matchesStatus;
    });
  }, [salesOrders, searchTerm, dateFilter, customerFilter, statusFilter]);

  const totalPages = Math.ceil(filteredSalesOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSalesOrders = filteredSalesOrders.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, customerFilter, statusFilter, itemsPerPage]);

  // Validation functions
  const validateForm = (isEdit = false): boolean => {
    const errors = {
      soNumber: "",
      customer: "",
      amount: "",
      contactEmail: "",
    };

    const trimmedSO = formData.soNumber?.trim() || "";
    const trimmedCustomer = formData.customer?.trim() || "";
    const trimmedEmail = formData.contactEmail?.trim() || "";

    // 🔍 Required: SO Number
    if (!trimmedSO) {
      errors.soNumber = "SO Number is required";
    } else {
      const duplicate = salesOrders.find(
        (so) =>
          so.soNumber.toLowerCase() === trimmedSO.toLowerCase() &&
          (!isEdit || so._id !== editingSO?._id)
      );
      if (duplicate) {
        errors.soNumber = "This SO Number already exists";
      }
    }

    // 🔍 Required: Customer
    if (!trimmedCustomer) {
      errors.customer = "Customer is required";
    }

    // 🔍 Required: Amount
    const parsedAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = "Amount must be greater than 0";
    }

    // 🔍 Optional: Email format
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.contactEmail = "Invalid email format";
    }

    setValidationErrors(errors);

    return Object.values(errors).every((msg) => msg === "");
  };

  useEffect(() => {
    async function fetchCustomers() {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    }

    fetchCustomers();
  }, []);

  // CRUD Operations - Ready for API integration
  useEffect(() => {
    let isMounted = true;

    const fetchSalesOrders = async () => {
      try {
        const response = await fetch("/api/sales-orders", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        if (isMounted) {
          setSalesOrders(data.salesOrders || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
      }
    };

    // Initial fetch
    fetchSalesOrders();

    // Polling + optional page refresh
    const interval = setInterval(() => {
      console.log("⏱ Polling...");
      fetchSalesOrders();

      // Optional: uncomment to enable full page reload
      // console.log("🔁 Refreshing page...");
      // window.location.reload();
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // CREATE
  const handleCreate = async () => {
    if (!validateForm()) return;

    const newSalesOrder = {
      soNumber: formData.soNumber.trim(),
      customer: formData.customer.trim(),
      amount: parseFloat(formData.amount),
      status: formData.status,
      creationDate: new Date(),
      transactionDate: new Date(),
      remarks: formData.remarks?.trim() || "",
      shippingAddress: formData.shippingAddress?.trim() || "",
      contactPerson: formData.contactPerson?.trim() || "",
      contactPhone: formData.contactPhone?.trim() || "",
      contactEmail: formData.contactEmail?.trim() || "",
    };

    try {
      const response = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: [newSalesOrder] }),
      });

      if (!response.ok) {
        console.error("❌ Failed to create sales order");
        return;
      }

      const created = await response.json();
      const inserted = created.orders?.[0];

      if (inserted) {
        setSalesOrders((prev) => [...prev, inserted]);
      }

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("🚨 Error creating sales order:", error);
    }
  };

  // UPDATE
  const handleUpdate = async () => {
    if (!validateForm(true) || !editingSO) return;

    const updatedPayload = {
      soNumber: formData.soNumber.trim(),
      customer: formData.customer.trim(),
      amount: parseFloat(formData.amount),
      status: formData.status,
      remarks: formData.remarks?.trim() || "",
      shippingAddress: formData.shippingAddress?.trim() || "",
      contactPerson: formData.contactPerson?.trim() || "",
      contactPhone: formData.contactPhone?.trim() || "",
      contactEmail: formData.contactEmail?.trim() || "",
    };

    try {
      const response = await fetch(`/api/sales-orders/${editingSO._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });

      if (!response.ok) {
        console.error("❌ Failed to update sales order");
        return;
      }

      const updated = await response.json();

      setSalesOrders((prev) =>
        prev.map((so) => (so._id === editingSO._id ? updated : so))
      );

      setIsEditDialogOpen(false);
      setEditingSO(null);
      resetForm();
    } catch (error) {
      console.error("🚨 Error updating sales order:", error);
    }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/sales-orders/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("❌ Failed to delete sales order");
        return;
      }

      setSalesOrders((prev) => prev.filter((so) => so._id !== id));
    } catch (error) {
      console.error("🚨 Error deleting sales order:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      soNumber: "",
      customer: "",
      amount: "",
      status: "PENDING", // default aligned with backend enum
      remarks: "",
      shippingAddress: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      creationDate: new Date().toISOString().split("T")[0],
      transactionDate: new Date().toISOString().split("T")[0],
    });

    setValidationErrors({
      soNumber: "",
      customer: "",
      amount: "",
      contactEmail: "",
    });
  };

  const handleEdit = (salesOrder: SalesOrder) => {
    setEditingSO(salesOrder);

    setFormData({
      soNumber: salesOrder.soNumber,
      customer: salesOrder.customer,
      amount: salesOrder.amount.toString(),
      status: salesOrder.status,
      remarks: salesOrder.remarks || "",
      shippingAddress: salesOrder.shippingAddress || "",
      contactPerson: salesOrder.contactPerson || "",
      contactPhone: salesOrder.contactPhone || "",
      contactEmail: salesOrder.contactEmail || "",
      creationDate:
        salesOrder.creationDate || new Date().toISOString().split("T")[0],
      transactionDate:
        salesOrder.transactionDate || new Date().toISOString().split("T")[0],
    });

    setIsEditDialogOpen(true);
  };

  const handleView = (salesOrder: SalesOrder) => {
    setViewingSO(salesOrder);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Sales Orders</h2>
          <p className="text-muted-foreground">
            Manage customer sales orders and track order status
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Sales Order
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Sales Order</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soNumber">SO Number *</Label>
                  <Input
                    id="soNumber"
                    placeholder="SO-2024-001"
                    value={formData.soNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, soNumber: e.target.value })
                    }
                    className={
                      validationErrors.soNumber ? "border-destructive" : ""
                    }
                  />
                  {validationErrors.soNumber && (
                    <p className="text-sm text-destructive">
                      {validationErrors.soNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Input
                    id="customer"
                    placeholder="Customer Name"
                    value={formData.customer}
                    onChange={(e) =>
                      setFormData({ ...formData, customer: e.target.value })
                    }
                    className={
                      validationErrors.customer ? "border-destructive" : ""
                    }
                  />
                  {validationErrors.customer && (
                    <p className="text-sm text-destructive">
                      {validationErrors.customer}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className={
                      validationErrors.amount ? "border-destructive" : ""
                    }
                  />
                  {validationErrors.amount && (
                    <p className="text-sm text-destructive">
                      {validationErrors.amount}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(
                      value: "PENDING" | "PARTIAL" | "COMPLETED" | "CANCELLED"
                    ) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <Textarea
                  id="shippingAddress"
                  placeholder="Enter shipping address"
                  value={formData.shippingAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingAddress: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    placeholder="John Doe"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    placeholder="+63-912-345-6789"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPhone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    className={
                      validationErrors.contactEmail ? "border-destructive" : ""
                    }
                  />
                  {validationErrors.contactEmail && (
                    <p className="text-sm text-destructive">
                      {validationErrors.contactEmail}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Order details and notes"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Sales Order</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* 🔍 Search + Date Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by SO Number, customer, or remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
            </div>

            {/* 🧩 Customer + Status Filters */}
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="all">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "PENDING"
                      | "PARTIAL"
                      | "COMPLETED"
                      | "CANCELLED"
                  )
                }
                className="h-10 rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>SO No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : salesOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground">
                      No sales orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  salesOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        {order.creationDate
                          ? new Date(order.creationDate).toLocaleDateString()
                          : "—"}
                      </TableCell>

                      <TableCell>{order.soNumber ?? "—"}</TableCell>
                      <TableCell>{order.customer ?? "—"}</TableCell>

                      <TableCell className="text-right">
                        ₱
                        {(order.amount ?? 0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status ?? "Unknown"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(order)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Sales Order
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete sales order{" "}
                                  <strong>
                                    {order.soNumber ?? "this entry"}
                                  </strong>
                                  ? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(order._id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredSalesOrders.length)} of{" "}
            {filteredSalesOrders.length} results
          </p>
        </div>
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer">
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sales Order</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* SO Number + Customer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-soNumber">SO Number *</Label>
                <Input
                  id="edit-soNumber"
                  placeholder="SO-2024-001"
                  value={formData.soNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, soNumber: e.target.value })
                  }
                  className={
                    validationErrors.soNumber ? "border-destructive" : ""
                  }
                />
                {validationErrors.soNumber && (
                  <p className="text-sm text-destructive">
                    {validationErrors.soNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-customer">Customer *</Label>
                <Input
                  id="edit-customer"
                  placeholder="Customer Name"
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
                  className={
                    validationErrors.customer ? "border-destructive" : ""
                  }
                />
                {validationErrors.customer && (
                  <p className="text-sm text-destructive">
                    {validationErrors.customer}
                  </p>
                )}
              </div>
            </div>

            {/* Amount + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className={
                    validationErrors.amount ? "border-destructive" : ""
                  }
                />
                {validationErrors.amount && (
                  <p className="text-sm text-destructive">
                    {validationErrors.amount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(
                    value: "PENDING" | "PARTIAL" | "COMPLETED" | "CANCELLED"
                  ) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-2">
              <Label htmlFor="edit-shippingAddress">Shipping Address</Label>
              <Textarea
                id="edit-shippingAddress"
                placeholder="Enter shipping address"
                value={formData.shippingAddress}
                onChange={(e) =>
                  setFormData({ ...formData, shippingAddress: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contactPerson">Contact Person</Label>
                <Input
                  id="edit-contactPerson"
                  placeholder="John Doe"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                <Input
                  id="edit-contactPhone"
                  placeholder="+63-912-345-6789"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  className={
                    validationErrors.contactEmail ? "border-destructive" : ""
                  }
                />
                {validationErrors.contactEmail && (
                  <p className="text-sm text-destructive">
                    {validationErrors.contactEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="edit-remarks">Remarks</Label>
              <Textarea
                id="edit-remarks"
                placeholder="Order details and notes"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Sales Order</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sales Order Details</DialogTitle>
          </DialogHeader>

          {viewingSO && (
            <div className="space-y-4">
              {/* Core Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SO Number</p>
                  <p>{viewingSO.soNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creation Date</p>
                  <p>{new Date(viewingSO.creationDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p>{viewingSO.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(viewingSO.status)}>
                    {viewingSO.status}
                  </Badge>
                </div>
              </div>

              {/* Financials */}
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">
                  ₱
                  {viewingSO.amount.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* Optional Fields */}
              {viewingSO.shippingAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Shipping Address
                  </p>
                  <p>{viewingSO.shippingAddress}</p>
                </div>
              )}

              {(viewingSO.contactPerson ||
                viewingSO.contactPhone ||
                viewingSO.contactEmail) && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Contact Information
                  </p>
                  {viewingSO.contactPerson && (
                    <p>Name: {viewingSO.contactPerson}</p>
                  )}
                  {viewingSO.contactPhone && (
                    <p>Phone: {viewingSO.contactPhone}</p>
                  )}
                  {viewingSO.contactEmail && (
                    <p>Email: {viewingSO.contactEmail}</p>
                  )}
                </div>
              )}

              {viewingSO.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p>{viewingSO.remarks}</p>
                </div>
              )}

              {/* Items Table */}
              {/* {viewingSO.items && viewingSO.items.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Order Items
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingSO.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ₱
                            {item.unitPrice.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            ₱
                            {(item.quantity * item.unitPrice).toLocaleString(
                              "en-PH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )} */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
