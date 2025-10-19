"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { format } from "date-fns";
import {
  Eye,
  Plus,
  Trash2,
  Loader2,
  Search,
  Filter,
  CalendarDays,
} from "lucide-react";

import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import {
  SalesInvoice,
  Customer,
  SalesOrder,
  SalesOrderItem,
  ItemType,
} from "../sections/type";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogPanel, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../ui/card";
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

export default function SalesInvoicePage({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [itemCatalog, setItemCatalog] = useState<ItemType[]>([]);

  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [paginatedSalesInvoices, setPaginatedSalesInvoices] = useState<
    SalesInvoice[]
  >([]);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    customer: string;
    reference: string;
    status: "UNPAID" | "PARTIAL" | "PAID" | "VOID";
    invoiceDate: string;
    dueDate: string;
    notes: string;
    salesPerson: string;
    TIN: string;
    terms: string;
    address: string;
    salesOrder: string;
    salesOrderLabel: string;
    soItems: SalesOrderItem[];
  }>({
    customer: "",
    reference: "",
    status: "UNPAID",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    salesPerson: "",
    TIN: "",
    terms: "",
    address: "",
    salesOrder: "",
    salesOrderLabel: "",
    soItems: [],
  });

  const [isCreating, setIsCreating] = useState(false);

  const [salesOrderSuggestions, setSalesOrderSuggestions] = useState<
    SalesOrder[]
  >([]);

  const [showSalesOrderSuggestions, setShowSalesOrderSuggestions] =
    useState(false);

  useEffect(() => {
    const fetchSalesOrders = async () => {
      const name = formData.customer?.trim().toUpperCase();
      if (!name) return;

      try {
        const res = await fetch(
          `/api/sales-orders/by-customer/${encodeURIComponent(name)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { orders } = await res.json();
        setSalesOrderSuggestions(orders || []);
      } catch (err) {
        console.error("❌ Failed to fetch sales orders:", err);
        setSalesOrderSuggestions([]);
      }
    };

    fetchSalesOrders();
  }, [formData.customer]);

  const descriptionMap = useMemo(() => {
    const map: Record<string, string> = {};
    itemCatalog.forEach((item) => {
      const key = item.itemName?.trim().toUpperCase();
      map[key] = item.description?.trim() || "—";
    });
    return map;
  }, [itemCatalog]);

  // ✅ Fetch item catalog
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch items");

        const response = await res.json();
        const data = Array.isArray(response)
          ? response
          : Array.isArray(response.items)
          ? response.items
          : [];

        setItemCatalog(data);
      } catch (err) {
        console.error("Failed to fetch item catalog", err);
        setItemCatalog([]);
      }
    };

    fetchItems();
  }, []);

  const isFirstFetch = useRef(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (isFirstFetch.current) {
        setIsLoading(true);
      }

      try {
        const res = await fetch("/api/sales-invoices", { cache: "no-store" });
        const data = await res.json();
        setSalesInvoices(data.invoices || []);
      } catch (err) {
        console.error("❌ Failed to fetch invoices:", err);
      } finally {
        if (isFirstFetch.current) {
          setIsLoading(false);
          isFirstFetch.current = false;
        }
      }
    };

    fetchInvoices(); // initial fetch

    const intervalId = setInterval(fetchInvoices, 1000); // silent refetch

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    console.log("Fetching customers...");

    fetch("/api/customers")
      .then((res) => res.json())
      .then((response) => {
        console.log("Raw response:", response);

        const data = Array.isArray(response?.items) ? response.items : [];

        console.log("Parsed customers:", data);
        setCustomers(data);
      })
      .catch((err) => console.error("Failed to fetch customers", err));
  }, []);

  const filteredSalesInvoices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return salesInvoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNo.toLowerCase().includes(query) ||
        inv.customer.toLowerCase().includes(query) ||
        inv.status.toLowerCase().includes(query);

      const matchesDate =
        dateFilter === "" ||
        (inv.invoiceDate &&
          new Date(inv.invoiceDate).toISOString().split("T")[0] === dateFilter);

      const matchesStatus =
        statusFilter === "all" || inv.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [salesInvoices, searchTerm, dateFilter, statusFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredSalesInvoices.length / rowsPerPage)),
    [filteredSalesInvoices.length, rowsPerPage]
  );

  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    setPaginatedSalesInvoices(filteredSalesInvoices.slice(start, end));
  }, [filteredSalesInvoices, currentPage, rowsPerPage]);

  const clearFilters = () => {
    setDateFilter("");
    setStatusFilter("all");
    setSearchTerm("");
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    const visibleIds = paginatedSalesInvoices.map((inv) => inv._id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : visibleIds);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  const handleView = (invoice: SalesInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (invoiceId: string) => {
    if (!invoiceId || typeof invoiceId !== "string") {
      console.warn("Invalid invoice ID:", invoiceId);
      toast.error("Invalid sales invoice ID");
      return;
    }

    try {
      const res = await fetch(`/api/sales-invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to delete sales invoice");
      }

      // Remove from local state
      setSalesInvoices((prev) => prev.filter((inv) => inv._id !== invoiceId));

      console.log("✅ Deleted sales invoice:", invoiceId);
      toast.success(`Sales invoice #${invoiceId} deleted`);
    } catch (error) {
      console.error("❌ Error deleting sales invoice:", error);
      toast.error(`Failed to delete invoice #${invoiceId}`);
    }
  };

  const handleDeleteMany = async (_ids: string[]) => {
    if (!_ids || _ids.length === 0) {
      toast.error("No sales invoices selected for deletion.");
      return;
    }

    try {
      // Optimistically remove from UI
      setSalesInvoices((prev) =>
        prev.filter((inv) => !_ids.includes(String(inv._id)))
      );

      const results = await Promise.allSettled(
        _ids.map(async (_id) => {
          const res = await fetch(`/api/sales-invoices/${_id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            const error = await res.json();
            console.warn(`❌ Failed to delete invoice ${_id}:`, error.message);
            throw new Error(error.message || `Failed to delete invoice ${_id}`);
          }

          return res;
        })
      );

      const failures = results.filter(
        (result) => result.status === "rejected"
      ) as PromiseRejectedResult[];

      if (failures.length > 0) {
        toast.warning(
          `Some invoices could not be deleted (${failures.length} failed).`
        );
      } else {
        toast.success("✅ Selected invoices deleted.");
      }

      setSelectedIds([]);
      onSuccess?.(); // refresh list
    } catch (err) {
      console.error("❌ Bulk delete failed:", err);
      toast.error("Failed to delete selected invoices.");
    }
  };

  const formatCurrency = (value?: number) =>
    typeof value === "number" ? `₱${value.toFixed(2)}` : "₱0.00";

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const payload = {
        customer: formData.customer.trim().toUpperCase(),
        reference: formData.reference || "",
        status: formData.status || "UNPAID",
        invoiceDate: new Date(formData.invoiceDate).toLocaleDateString(
          "en-PH",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        ),
        notes: formData.notes?.trim() || "",
        salesOrder: formData.salesOrderLabel || "",
        items: formData.soItems.map((item) => {
          const key = item.itemName?.trim().toUpperCase();
          return {
            itemCode: item.itemCode?.trim().toUpperCase() || "",
            itemName: key,
            description: item.description?.trim() || descriptionMap[key] || "—",
            quantity: Math.max(Number(item.quantity) || 1, 1),
            unitType: item.unitType?.trim().toUpperCase() || "",
            price: Number(item.price) || 0,
            amount: Number(item.quantity) * Number(item.price),
          };
        }),
      };

      console.log("📦 Creating Sales Invoice with payload:", payload);

      const res = await fetch("/api/sales-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log("📨 Server response:", data);

      if (res.ok) {
        console.log("✅ Invoice created:", data.invoice);
        setSalesInvoices((prev) => [data.invoice, ...prev]);
        setIsCreateDialogOpen(false);
        setFormData({
          customer: "",
          reference: "",
          status: "UNPAID",
          invoiceDate: new Date().toISOString().split("T")[0],
          dueDate: "",
          notes: "",
          salesPerson: "",
          TIN: "",
          terms: "",
          address: "",
          salesOrder: "",
          salesOrderLabel: "",
          soItems: [],
        });

        toast.success(
          `Invoice #${data.invoice.invoiceNo} created successfully`
        );
      } else {
        console.error("❌ Create failed:", data.error);
      }
    } catch (err) {
      console.error("❌ Create error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Sales Invoice</CardTitle>
              <CardDescription>Manage sales invoice</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
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

            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
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
                  <Label htmlFor="invoice-date-filter" className="text-sm">
                    Invoice Date:
                  </Label>
                  <Input
                    id="invoice-date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="invoice-status-filter" className="text-sm">
                    Status:
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: SalesInvoice["status"] | "all") =>
                      setStatusFilter(value)
                    }>
                    <SelectTrigger className="w-32" id="invoice-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="VOID">Void</SelectItem>
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

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-4">
                    <Checkbox
                      checked={
                        paginatedSalesInvoices.length > 0 &&
                        paginatedSalesInvoices.every((inv) =>
                          selectedIds.includes(inv._id)
                        )
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all sales orders on current page"
                    />
                  </TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : paginatedSalesInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-muted-foreground">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSalesInvoices.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell className="w-4">
                        <Checkbox
                          checked={selectedIds.includes(String(inv._id))}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() =>
                            toggleSelectOne(String(inv._id))
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {format(new Date(inv.invoiceDate), "MMM d, yyyy")}
                      </TableCell>

                      <TableCell>{inv.invoiceNo}</TableCell>
                      <TableCell>{inv.customer}</TableCell>
                      <TableCell>{formatCurrency(inv.amount)}</TableCell>
                      <TableCell>{formatCurrency(inv.balance)}</TableCell>
                      <TableCell>{inv.status}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleView(inv)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              title={`Delete invoice ${inv.invoiceNo}`}
                              aria-label={`Delete invoice ${inv.invoiceNo}`}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Invoice
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete invoice{" "}
                                <span className="font-semibold">
                                  {inv.invoiceNo}
                                </span>
                                ? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(inv._id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Results count */}
            <div className="flex items-center justify-between mt-4">
              {/* Rows per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Sales invoice per page:
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
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setFormData({
              customer: "",
              reference: "",
              status: "UNPAID",
              invoiceDate: new Date().toISOString().split("T")[0],
              dueDate: "",
              notes: "",
              salesPerson: "",
              TIN: "",
              terms: "",
              address: "",
              salesOrder: "",
              salesOrderLabel: "",
              soItems: [],
            });
          }
        }}>
        <DialogPanel className="max-w-xl w-full p-6 space-y-4">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Create Sales Invoice
            </DialogTitle>
          </DialogHeader>

          <Card className="shadow-none border-none">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-invoice-no"> Invoice No.</Label>
                  <Input
                    id="create-si-number"
                    value={"Auto-generated"}
                    readOnly
                    disabled
                    placeholder="Auto-generated"
                    className="text-sm uppercase bg-muted cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label htmlFor="create-invoice-date"> Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="text"
                    value={new Date(formData.invoiceDate).toLocaleDateString(
                      "en-PH",
                      {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      }
                    )}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col flex-1 min-w-[240px]">
                  <Label htmlFor="create-customer-name">Customer Name</Label>
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
                          TIN: "",
                          terms: "",
                          address: "",
                        }));
                        setShowCustomerSuggestions(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowCustomerSuggestions(false), 200)
                      }
                      placeholder="Search customer name"
                      className="text-sm uppercase w-full px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
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

                                      setFormData((prev) => ({
                                        ...prev,
                                        customer: customerName,
                                        salesPerson,
                                        TIN: customer.TIN || "",
                                        terms: customer.terms || "",
                                        address: customer.address || "",
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
                </div>

                <div>
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={formData.dueDate || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    className="text-sm"
                  />
                </div>

                {formData.customer && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sales-agent">Sales Agent</Label>
                      <Input
                        id="sales-agent"
                        value={formData.salesPerson || ""}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tin">TIN</Label>
                      <Input
                        id="tin"
                        value={formData.TIN || ""}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="terms">Terms</Label>
                      <Input
                        id="terms"
                        value={formData.terms || ""}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address || ""}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="create-reference">Reference</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reference: e.target.value.trim(),
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="create-notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value.trim() })
                    }
                    placeholder="Optional notes"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="sales-order-select">Sales Order</Label>
                  <div className="relative">
                    <Input
                      id="sales-order-select"
                      type="text"
                      value={formData.salesOrderLabel}
                      disabled={!formData.customer}
                      placeholder={
                        formData.customer
                          ? "Type or select matching sales order"
                          : "Select customer first"
                      }
                      className={`text-sm w-full ${
                        formData.customer
                          ? "bg-white"
                          : "bg-muted cursor-not-allowed"
                      }`}
                      onChange={(e) => {
                        const input = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          salesOrderLabel: input,
                          salesOrder: "", // clear selected ID when typing
                          soItems: [],
                        }));
                        setShowSalesOrderSuggestions(true);
                      }}
                      onFocus={() => {
                        if (formData.customer)
                          setShowSalesOrderSuggestions(true);
                      }}
                    />

                    {formData.customer &&
                      showSalesOrderSuggestions &&
                      salesOrderSuggestions.length > 0 && (
                        <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                          {salesOrderSuggestions
                            .filter((so) =>
                              so.soNumber
                                .toLowerCase()
                                .includes(
                                  formData.salesOrderLabel.toLowerCase()
                                )
                            )
                            .map((so) => (
                              <li
                                key={
                                  typeof so._id === "string"
                                    ? so._id
                                    : so._id.toString()
                                }
                                className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                onClick={async () => {
                                  const soId =
                                    typeof so._id === "string"
                                      ? so._id
                                      : so._id.toString();

                                  setFormData((prev) => ({
                                    ...prev,
                                    salesOrder: soId,
                                    salesOrderLabel: so.soNumber,
                                  }));
                                  setShowSalesOrderSuggestions(false);

                                  try {
                                    const res = await fetch(
                                      `/api/sales-orders/${soId}`
                                    );
                                    if (!res.ok)
                                      throw new Error(`HTTP ${res.status}`);
                                    const { order } = await res.json();
                                    setFormData((prev) => ({
                                      ...prev,
                                      soItems: order?.items || [],
                                    }));
                                  } catch (err) {
                                    console.error(
                                      "❌ Failed to fetch SO details:",
                                      err
                                    );
                                    setFormData((prev) => ({
                                      ...prev,
                                      soItems: [],
                                    }));
                                  }
                                }}>
                                {so.soNumber}
                              </li>
                            ))}
                        </ul>
                      )}
                  </div>
                </div>
              </div>

              {formData.soItems?.length > 0 && (
                <div className="mt-4">
                  {/* Header */}
                  <div className="grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b py-2 mb-2 bg-primary text-primary-foreground rounded-t">
                    <div className="text-xs font-semibold uppercase text-start px-2">
                      Item Name
                    </div>
                    <div className="text-xs font-semibold uppercase text-start px-2">
                      Description
                    </div>
                    <div className="text-xs font-semibold uppercase text-end px-2">
                      Qty
                    </div>
                    <div className="text-xs font-semibold uppercase text-end px-2">
                      UOM
                    </div>
                    <div className="text-xs font-semibold uppercase text-end px-2">
                      Price
                    </div>
                    <div className="text-xs font-semibold uppercase text-end px-2">
                      Tax
                    </div>
                    <div className="text-xs font-semibold uppercase text-end px-2">
                      Amount
                    </div>
                  </div>

                  {/* Rows */}
                  {formData.soItems.map((item, idx) => {
                    const key = item.itemName?.trim().toUpperCase();
                    const description =
                      item.description?.trim() || descriptionMap[key] || "—";

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center text-sm py-2 border-b border-border">
                        <div className="px-2 text-start">
                          {item.itemName || "—"}
                        </div>
                        <div className="px-2 text-start">{description}</div>
                        <div className="px-2 text-end">{item.quantity}</div>
                        <div className="px-2 text-end">{item.unitType}</div>
                        <div className="px-2 text-end">
                          ₱{item.price.toFixed(2)}
                        </div>
                        <div className="px-2 text-end">
                          ₱{item.price.toFixed(2)}
                        </div>{" "}
                        {/* Replace with actual tax if available */}
                        <div className="px-2 text-end">
                          ₱{item.amount.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Create Invoice
                </Button>
              </div>
            </div>
          </Card>
        </DialogPanel>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>

          <Card className="shadow-none border-none">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {selectedInvoice ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Invoice No</p>
                      <p className="font-medium">{selectedInvoice.invoiceNo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{selectedInvoice.customer}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{selectedInvoice.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium">
                        {formatCurrency(selectedInvoice.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Balance</p>
                      <p className="font-medium">
                        {formatCurrency(selectedInvoice.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Invoice Date</p>
                      <p className="font-medium">
                        {format(
                          new Date(selectedInvoice.invoiceDate),
                          "yyyy-MM-dd"
                        )}
                      </p>
                    </div>
                  </div>
                  {selectedInvoice.notes && (
                    <div>
                      <p className="text-muted-foreground">Notes</p>
                      <p className="font-medium">{selectedInvoice.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No invoice selected.</p>
              )}
            </CardContent>
          </Card>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
