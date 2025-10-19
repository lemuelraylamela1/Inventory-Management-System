"use client";

import { useEffect, useMemo, useState } from "react";
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

import {
  SalesInvoice,
  Customer,
  SalesOrder,
  SalesOrderItem,
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

export default function SalesInvoicePage() {
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [paginatedSalesInvoices, setPaginatedSalesInvoices] = useState<
    SalesInvoice[]
  >([]);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
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

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/sales-invoices", { cache: "no-store" });
        const data = await res.json();
        setSalesInvoices(data.invoices || []);
      } catch (err) {
        console.error("❌ Failed to fetch invoices:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
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

  const formatCurrency = (value?: number) =>
    typeof value === "number" ? `₱${value.toFixed(2)}` : "₱0.00";

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const payload = {
        customer: formData.customer.trim().toUpperCase(),
        reference: formData.reference || "",
        status: formData.status || "UNPAID",
        invoiceDate: new Date(formData.invoiceDate).toISOString(),
        notes: formData.notes?.trim() || "",
        salesOrder: formData.salesOrderLabel || "", // ✅ send SO number
        items: formData.soItems.map((item) => ({
          itemCode: item.itemCode?.trim().toUpperCase() || "",
          itemName: item.itemName?.trim().toUpperCase() || "",
          description: item.description?.trim() || "",
          quantity: Math.max(Number(item.quantity) || 1, 1),
          unitType: item.unitType?.trim().toUpperCase() || "",
          price: Number(item.price) || 0,
          amount: Number(item.quantity) * Number(item.price),
        })),
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

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-4">
                    <input
                      type="checkbox"
                      checked={
                        paginatedSalesInvoices.length > 0 &&
                        paginatedSalesInvoices.every((inv) =>
                          selectedIds.includes(inv._id)
                        )
                      }
                      onChange={toggleSelectAll}
                      aria-label="Select all invoices"
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
                        <input
                          type="checkbox"
                          checked={isSelected(inv._id)}
                          onChange={() => toggleSelectOne(inv._id)}
                          aria-label={`Select invoice ${inv.invoiceNo}`}
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(inv.invoiceDate), "yyyy-MM-dd")}
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
                        <Button size="icon" variant="ghost">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
                  <h3 className="text-sm font-semibold mb-2">
                    Sales Order Items
                  </h3>
                  <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground mb-1">
                    <div>Item Name</div>
                    <div>Description</div>
                    <div>Qty</div>
                    <div>Unit</div>
                    <div>Price</div>
                    <div>Amount</div>
                  </div>
                  {formData.soItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-6 gap-2 text-sm py-1 border-b border-border">
                      <div>{item.itemName}</div>
                      <div>{item.description || "—"}</div>
                      <div>{item.quantity}</div>
                      <div>{item.unitType}</div>
                      <div>₱{item.price.toFixed(2)}</div>
                      <div>₱{item.amount.toFixed(2)}</div>
                    </div>
                  ))}
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
