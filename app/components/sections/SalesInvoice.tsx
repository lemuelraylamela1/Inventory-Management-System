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

import { SalesInvoice } from "../sections/type";
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
  const [formData, setFormData] = useState({
    customer: "",
    amount: 0,
    status: "UNPAID",
    invoiceDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [isCreating, setIsCreating] = useState(false);

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
        amount: Number(formData.amount),
        status: formData.status || "UNPAID",
        invoiceDate: new Date(formData.invoiceDate).toISOString(),
        notes: formData.notes?.trim() || "",
      };

      const res = await fetch("/api/sales-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSalesInvoices((prev) => [data.invoice, ...prev]);
        setIsCreateDialogOpen(false);
        setFormData({
          customer: "",
          amount: 0,
          status: "UNPAID",
          invoiceDate: new Date().toISOString().split("T")[0],
          notes: "",
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogPanel className="max-w-xl w-full p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>

          <Card className="shadow-none border-none">
            <CardHeader>
              <CardDescription className="text-sm text-muted-foreground">
                Fill out invoice details
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="customer"
                    className="text-sm text-muted-foreground">
                    Customer
                  </label>
                  <Input
                    id="customer"
                    value={formData.customer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer: e.target.value.toUpperCase().trim(),
                      })
                    }
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="text-sm text-muted-foreground">
                    Amount
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Number(e.target.value),
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="text-sm text-muted-foreground">
                    Status
                  </label>
                  <select
                    id="status"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }>
                    <option value="UNPAID">UNPAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PAID">PAID</option>
                    <option value="VOID">VOID</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="invoiceDate"
                    className="text-sm text-muted-foreground">
                    Invoice Date
                  </label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoiceDate: new Date(e.target.value)
                          .toISOString()
                          .split("T")[0],
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="text-sm text-muted-foreground">
                  Notes
                </label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value.trim() })
                  }
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Create Invoice
                </Button>
              </div>
            </CardContent>
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
