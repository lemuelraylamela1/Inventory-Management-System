import { useEffect, useState, useMemo, useRef } from "react";
import { ScrollArea } from "../ui/scroll-area";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Eye,
  Edit,
  Trash2,
  Banknote,
  Loader2,
  Inbox,
  Search,
  Plus,
  CheckCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";

import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogContent,
} from "../ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import toast from "react-hot-toast";

import type {
  SalesInvoice,
  Delivery,
  SalesInvoiceItem,
  DeliveryItem,
  Customer,
} from "./type";
export default function SalesInvoice() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SalesInvoice>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>(
    []
  );

  const [soSuggestions, setSoSuggestions] = useState<string[]>([]);
  const [isCustomerFocused, setIsCustomerFocused] = useState(false);
  const [isSoFocused, setIsSoFocused] = useState(false);
  const [items, setItems] = useState<DeliveryItem[]>([]);

  const filteredInvoices = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return invoices.filter((inv) => {
      const invoiceNo = inv.invoiceNo?.toLowerCase() || "";
      const drNo = inv.drNo?.toLowerCase() || "";
      const customer = inv.customer?.toLowerCase() || "";
      return (
        invoiceNo.includes(query) ||
        drNo.includes(query) ||
        customer.includes(query)
      );
    });
  }, [invoices, searchTerm]);

  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);

  const paginatedInvoices: SalesInvoice[] = filteredInvoices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const resetForm = () => {
    setFormData({});
  };

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setFormData({});
      setIsCustomerFocused(false); // Reset focus when create dialog closes
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setFormData({});
      setIsCustomerFocused(false); // Reset focus when edit dialog closes
    }
  }, [isEditDialogOpen]);

  useEffect(() => {
    if (!isViewDialogOpen) {
      setFormData({});
      setIsCustomerFocused(false); // Reset focus when view dialog closes
    }
  }, [isViewDialogOpen]);

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setFormData({});
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setFormData({});
    }
  }, [isEditDialogOpen]);

  useEffect(() => {
    if (!isViewDialogOpen) {
      setFormData({});
    }
  }, [isViewDialogOpen]);

  const isFirstFetch = useRef(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (isFirstFetch.current) {
        setIsLoading(true);
      }

      try {
        const res = await fetch("/api/sales-invoices", { cache: "no-store" });
        const data = await res.json();
        setInvoices(data.invoices || []);
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

  const refreshInvoiceList = () => {
    // Example: re-fetch invoices from your API
    fetch("/api/sales-invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data))
      .catch((err) => console.error("Failed to refresh invoices:", err));
  };

  const handleCustomerSearch = async (query: string) => {
    try {
      const res = await fetch("/api/customers"); // fetch all customers
      if (!res.ok) throw new Error("Failed to fetch customers");

      const json = await res.json();
      const data: Customer[] = json.items ?? []; // extract items array

      // filter by query
      const filtered = data.filter((c) =>
        c.customerName.toLowerCase().includes(query.toLowerCase())
      );

      setCustomerSuggestions(filtered);
    } catch (err) {
      console.error("Customer search error:", err);
      setCustomerSuggestions([]);
    }
  };

  const handleCustomerSelect = async (customerId: string) => {
    if (!customerId) return console.warn("Customer ID is required");

    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Customer not found");
      }

      const customer: Customer = await res.json();

      setFormData((prev) => ({
        ...prev,
        customer: customer.customerName,
        TIN: customer.TIN,
        address: customer.address,
        terms: customer.terms,
        salesPerson: customer.salesAgent,
        salesOrder: "",
        drNo: "",
      }));

      // Enable DR input
      setIsDrFocused(true);
      setDrSuggestions([]);
      setItems([]);
      setCustomerSuggestions([]); // clear suggestions after select
    } catch (err) {
      console.error("Failed to select customer:", err);
    }
  };

  const [drSuggestions, setDrSuggestions] = useState<
    { _id: string; drNo: string }[]
  >([]);

  const [isDrFocused, setIsDrFocused] = useState(false);

  const handleDrSearch = async (customer: string, query: string) => {
    if (!customer) return setDrSuggestions([]);

    try {
      const res = await fetch("/api/delivery"); // get deliveries
      if (!res.ok) throw new Error("Failed to fetch deliveries");

      const data: Delivery[] = await res.json();

      const filtered = data
        .filter(
          (d) =>
            d.customer === customer &&
            d.drNo.toLowerCase().includes(query.toLowerCase())
        )
        .map((d) => ({ _id: d._id, drNo: d.drNo }));

      setDrSuggestions(filtered);
    } catch (err) {
      console.error("DR search error:", err);
      setDrSuggestions([]);
    }
  };

  const handleDrSelect = async (deliveryId: string) => {
    if (!deliveryId) return console.warn("Delivery ID is required");

    try {
      const res = await fetch(`/api/delivery/${deliveryId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to fetch delivery details");
      }

      // Backend response
      const delivery: Delivery & { items?: DeliveryItem[] } = await res.json();

      // Allowed invoice statuses
      type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "VOID";
      const isInvoiceStatus = (status: string): status is InvoiceStatus =>
        ["UNPAID", "PARTIAL", "PAID", "VOID"].includes(status);

      // Update main form data
      setFormData((prev) => ({
        ...prev,
        drNo: delivery.drNo || "",
        warehouse: delivery.warehouse || "",
        shippingAddress: delivery.shippingAddress || "",
        deliveryDate: delivery.deliveryDate || "",
        remarks: delivery.remarks || "",
        status: isInvoiceStatus(delivery.status) ? delivery.status : "UNPAID",
        _id: delivery._id,
        items:
          delivery.items?.map((item) => ({
            itemCode: item.itemCode || "",
            itemName: item.itemName || "",
            description: item.description || "",
            unitType: item.unitType || "",
            quantity: item.quantity || 0,
            price: item.price || 0,
            amount: (item.quantity || 0) * (item.price || 0),
          })) || [],
      }));

      // Optionally preselect all items in a separate state
      setItems(
        delivery.items?.map((item) => ({
          ...item,
          selected: true,
          quantity: item.quantity || 0,
          availableQuantity: item.availableQuantity || 0,
        })) || []
      );
    } catch (err) {
      console.error("Failed to select DR:", err);
    }
  };

  const handleCreate = async (
    formData: Partial<SalesInvoice>,
    items: DeliveryItem[]
  ) => {
    if (!formData.drNo || !formData.customer) {
      console.warn("DR Number and Customer are required.");
      return;
    }

    const selectedInvoiceItems = items
      .filter((i) => i.selected)
      .map((i) => ({
        itemCode: i.itemCode || "",
        itemName: i.itemName || "",
        description: i.description || "",
        quantity: Number(i.quantity) || 0,
        unitType: i.unitType || "",
        price: Number(i.price) || 0,
        amount: (Number(i.quantity) || 0) * (Number(i.price) || 0),
      }));

    if (selectedInvoiceItems.length === 0) {
      console.warn("No items selected for invoicing.");
      return;
    }

    const payload: Omit<Partial<SalesInvoice>, "_id" | "invoiceNo"> = {
      drNo: formData.drNo,
      customer: formData.customer,
      salesPerson: formData.salesPerson,
      address: formData.address,
      TIN: formData.TIN,
      terms: formData.terms,
      dueDate: formData.dueDate,
      notes: formData.notes?.trim() || "",
      status: formData.status || "UNPAID",
      items: selectedInvoiceItems,
    };

    try {
      const res = await fetch("/api/sales-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create invoice");

      const result = await res.json();
      console.log("Invoice created:", result);

      // ✅ Close dialog after success
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error("Create invoice error:", err);
    }
  };

  const handleEdit = (
    invoice: SalesInvoice & { items?: SalesInvoiceItem[] }
  ) => {
    setFormData({
      _id: invoice._id,
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate,
      drNo: invoice.drNo,
      customer: invoice.customer,
      salesPerson: invoice.salesPerson,
      address: invoice.address,
      TIN: invoice.TIN,
      terms: invoice.terms,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      status: invoice.status,
      createdAt: invoice.createdAt,
    });

    // Populate items table for editing, convert SalesInvoiceItem -> DeliveryItem
    setItems(
      invoice.items?.map((item) => ({
        _id: item._id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        description: item.description || "",
        unitType: item.unitType,
        price: item.price,
        quantity: item.quantity,
        amount: item.amount,
        selected: true,
        availableQuantity: item.quantity, // required by DeliveryItem
      })) || []
    );

    setIsEditDialogOpen(true);
  };

  // 🔹 Update Sales Invoice
  const handleUpdate = async () => {
    if (!formData._id) return console.warn("Missing invoice ID");

    // Convert items state (DeliveryItem[]) → SalesInvoiceItem[]
    const invoiceItems = items.map((i) => ({
      itemCode: i.itemCode || "",
      itemName: i.itemName || "",
      description: i.description || "",
      unitType: i.unitType || "",
      price: i.price || 0,
      quantity: i.quantity || 0,
      amount: (i.quantity || 0) * (i.price || 0),
    }));

    const payload = {
      ...formData,
      items: invoiceItems,
    };

    try {
      const res = await fetch(`/api/sales-invoices/${formData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update invoice");

      const updated = await res.json();
      console.log("Invoice updated:", updated);

      await refreshInvoiceList(); // rename your fetch list function accordingly
      setIsEditDialogOpen(false);
      setFormData({});
      setItems([]);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!invoiceId) return console.warn("Missing invoice ID for deletion");

    try {
      const res = await fetch(`/api/sales-invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete invoice");

      console.log("Invoice deleted:", invoiceId);
      await refreshInvoiceList();
      setSelectedIds((prev) => prev.filter((id) => id !== invoiceId));
    } catch (err) {
      console.error("Delete invoice error:", err);
    }
  };

  const handleView = async (invoiceId: string) => {
    if (!invoiceId) return console.warn("Missing invoice ID for view");

    try {
      const res = await fetch(`/api/sales-invoices/${invoiceId}`);
      if (!res.ok) throw new Error("Failed to fetch invoice details");

      const invoice: SalesInvoice & { items?: SalesInvoiceItem[] } =
        await res.json();
      console.log("Invoice details:", invoice);

      // Populate form fields
      setFormData({
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        drNo: invoice.drNo,
        customer: invoice.customer,
        salesPerson: invoice.salesPerson,
        TIN: invoice.TIN,
        terms: invoice.terms,
        address: invoice.address,
        reference: invoice.reference,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        status: invoice.status,
        createdAt: invoice.createdAt,
      });

      // Populate items table
      setItems(
        invoice.items?.map((item) => ({
          ...item,
          selected: true, // auto-select all for viewing
          availableQuantity: item.quantity, // for consistency with DeliveryItem typing
        })) || []
      );

      setIsViewDialogOpen(true);
    } catch (err) {
      console.error("View invoice error:", err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Sales Invoices</CardTitle>
            <CardDescription>Manage sales invoice records</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Create */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Invoice No. or Sales Order..."
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

        {/* Table */}
        <ScrollArea className="max-h-[500px] overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-4 px-2">
                  <Checkbox
                    checked={paginatedInvoices
                      .map((d) => d._id)
                      .filter((id): id is string => typeof id === "string")
                      .every((id) => selectedIds.includes(id))}
                    onCheckedChange={(checked) => {
                      const visibleIds = paginatedInvoices
                        .map((d) => d._id)
                        .filter((id): id is string => typeof id === "string");

                      setSelectedIds((prev) =>
                        checked
                          ? [...new Set([...prev, ...visibleIds])]
                          : prev.filter((id) => !visibleIds.includes(id))
                      );
                    }}
                    aria-label="Select all visible invoices"
                    className="ml-1"
                  />
                </TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>DR No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading invoices…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-6 w-6" />
                      <span className="text-sm">No invoices found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell className="px-2">
                      <Checkbox
                        checked={selectedIds.includes(invoice._id ?? "")}
                        onCheckedChange={(checked) => {
                          const id = invoice._id;
                          if (!id) return;

                          setSelectedIds((prev) =>
                            checked
                              ? [...prev, id]
                              : prev.filter((x) => x !== id)
                          );
                        }}
                        aria-label={`Select Invoice ${
                          invoice.invoiceNo || "Record"
                        }`}
                        className="ml-1"
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.createdAt
                        ? new Date(invoice.createdAt).toLocaleDateString(
                            "en-PH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>{invoice.invoiceNo ?? "—"}</TableCell>
                    <TableCell>{invoice.customer ?? "—"}</TableCell>
                    <TableCell>{invoice.drNo ?? "—"}</TableCell>
                    <TableCell>
                      {invoice.status === "UNPAID" ? (
                        <span className="text-red-700 font-bold">UNPAID</span>
                      ) : invoice.status === "PARTIAL" ? (
                        <span className="text-yellow-700 font-bold">
                          PARTIAL
                        </span>
                      ) : invoice.status === "PAID" ? (
                        <span className="text-green-700 font-bold">PAID</span>
                      ) : (
                        <span className="text-gray-700 font-bold">VOID</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(invoice._id!)}
                        title="View Invoice">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(invoice)}
                        title="Edit Invoice">
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Invoice"
                            className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently delete this invoice record?
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(invoice._id!)}>
                                Confirm Delete
                              </Button>
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
        </ScrollArea>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Invoices per page:
            </span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(val) => {
                setRowsPerPage(Number(val));
                setCurrentPage(1);
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

          {/* Page controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogPanel className="max-w-3xl" autoFocus={false}>
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Create Sales Invoice
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the invoice details. Fields marked with
              <span className="text-red-500"> * </span> are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Invoice No. */}
            <div className="grid gap-1.5">
              <Label htmlFor="invoiceNo">Invoice No.</Label>
              <Input
                id="invoiceNo"
                value={formData.invoiceNo ?? "Auto-generated"}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Create Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="createDate">Invoice Date</Label>
              <Input
                id="createDate"
                value={new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Customer & Sales Order */}
            <div className="grid gap-1.5 relative">
              <Label htmlFor="customer">
                Customer <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer"
                autoComplete="off"
                value={formData.customer ?? ""}
                onFocus={() => {
                  setIsCustomerFocused(true);
                  if (!formData.customer) handleCustomerSearch("");
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    customer: val,
                    salesOrder: "",
                    TIN: "",
                    address: "",
                    terms: "",
                    salesPerson: "",
                  }));
                  setSoSuggestions([]);
                  setItems([]);
                  if (val.trim().length > 0) handleCustomerSearch(val);
                  else setCustomerSuggestions([]);
                }}
                placeholder="Search Customer"
              />
              {isCustomerFocused && customerSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 z-10 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded">
                  {customerSuggestions.map((cust) => (
                    <li
                      key={cust._id}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleCustomerSelect(cust._id); // ✅ fetch customer by ID
                        setIsCustomerFocused(false);
                      }}>
                      {cust.customerName}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Customer Details */}
            <div className="grid gap-1.5">
              <Label htmlFor="TIN">TIN</Label>
              <Input
                id="TIN"
                value={formData.TIN ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="terms">Terms</Label>
              <Input
                id="terms"
                value={formData.terms ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="salesPerson">Sales Agent</Label>
              <Input
                id="salesPerson"
                value={formData.salesPerson ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5 relative">
              <Label htmlFor="drNo">
                DR No. <span className="text-red-500">*</span>
              </Label>
              <Input
                id="drNo"
                autoComplete="off"
                value={formData.drNo ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, drNo: val }));

                  if (!val) {
                    setItems([]);
                    setDrSuggestions([]);
                    return;
                  }

                  if (formData.customer) handleDrSearch(formData.customer, val);
                }}
                onFocus={() => {
                  if (formData.customer) handleDrSearch(formData.customer, "");
                  setIsDrFocused(true);
                }}
                placeholder="Select Delivery (DR No.)"
                disabled={!formData.customer}
              />

              {isDrFocused && drSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded z-50">
                  {drSuggestions.map((dr) => (
                    <li
                      key={dr._id}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => {
                        handleDrSelect(dr._id); // fetch by _id
                        setFormData((prev) => ({ ...prev, drNo: dr.drNo })); // show drNo
                        setDrSuggestions([]);
                        setIsDrFocused(false);
                      }}>
                      {dr.drNo}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Warehouse & Invoice Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Input
                id="warehouse"
                value={formData.warehouse ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="invoiceDate">Due Date</Label>
              <Input
                id="dueDate"
                type="text"
                value={
                  formData.deliveryDate
                    ? new Date(formData.deliveryDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        }
                      )
                    : ""
                }
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Shipping Address & Remarks */}
            <div className="grid grid-cols-2 gap-4 col-span-2">
              <div className="grid gap-1.5">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <textarea
                  id="shippingAddress"
                  value={formData.shippingAddress ?? ""}
                  readOnly
                  className="w-full bg-gray-100 cursor-not-allowed p-2 rounded border border-gray-300 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="remarks">Remarks</Label>
                <textarea
                  id="remarks"
                  value={formData.remarks ?? ""}
                  placeholder="Additional notes (optional)"
                  readOnly
                  className="w-full bg-gray-100 cursor-not-allowed p-2 rounded border border-gray-300 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          {formData.drNo && items.length > 0 && (
            <div className="col-span-2 mt-4">
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="p-2">
                        <Checkbox
                          checked={items.every((item) => item.selected)}
                          onCheckedChange={(checked) =>
                            setItems(
                              items.map((i) => ({ ...i, selected: !!checked }))
                            )
                          }
                        />
                      </th>
                      <th className="p-2 text-left">Item Code</th>
                      <th className="p-2 text-left">Item Name</th>
                      <th className="p-2 text-right">Available Qty</th>
                      <th className="p-2 text-right">Qty to Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr
                        key={item.itemCode || idx}
                        className="hover:bg-gray-50">
                        <td className="p-2 text-center">
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={(checked) =>
                              setItems(
                                items.map((i, j) =>
                                  j === idx ? { ...i, selected: !!checked } : i
                                )
                              )
                            }
                          />
                        </td>
                        <td className="p-2 text-left font-medium">
                          {item.itemCode}
                        </td>
                        <td className="p-2 text-left">{item.itemName}</td>
                        <td className="p-2 text-right font-semibold">
                          {item.availableQuantity}
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.quantity}
                            onChange={(e) => {
                              let val = parseInt(
                                e.target.value.replace(/\D/g, ""),
                                10
                              );
                              if (isNaN(val)) val = 1;
                              val = Math.min(
                                Math.max(val, 1),
                                item.availableQuantity
                              );
                              setItems(
                                items.map((i, j) =>
                                  j === idx ? { ...i, quantity: val } : i
                                )
                              );
                            }}
                            className="w-20 text-right bg-transparent border-none focus:outline-none focus:ring-0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Summary */}
              <div className="w-full my-8 overflow-x-auto">
                <h3 className="text-lg font-semibold text-primary tracking-wide mb-4 py-2 text-end">
                  Invoice Summary
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
                          Total Items
                        </td>
                        <td className="py-2 px-4 text-right font-semibold text-foreground">
                          {items.filter((i) => i.selected).length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-primary">
                          Total Quantity
                        </td>
                        <td className="py-2 px-4 text-right font-semibold text-primary">
                          {items
                            .filter((i) => i.selected)
                            .reduce((sum, i) => sum + i.quantity, 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button
              onClick={() => handleCreate(formData, items)}
              disabled={
                isCreating ||
                !formData.customer?.trim() ||
                !formData.drNo?.trim() ||
                items.filter((i) => i.selected).length === 0
              }>
              {isCreating ? "Creating…" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogPanel className="max-w-3xl" autoFocus={false}>
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Edit Sales Invoice
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the sales invoice details. Fields marked with
              <span className="text-red-500"> * </span> are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Invoice No. */}
            <div className="grid gap-1.5">
              <Label htmlFor="invoiceNo">Invoice No.</Label>
              <Input
                id="invoiceNo"
                value={formData.invoiceNo ?? "Auto-generated"}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Created Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="createdDate">Invoice Date</Label>
              <Input
                id="createdDate"
                type="text"
                value={
                  formData.createdAt
                    ? new Date(formData.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })
                    : ""
                }
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Customer & Sales Order */}
            <div className="grid gap-1.5 relative">
              <Label htmlFor="customer">
                Customer <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer"
                autoComplete="off"
                value={formData.customer ?? ""}
                onFocus={() => setIsCustomerFocused(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    customer: val,
                    soNumber: "",
                  }));
                  setSoSuggestions([]);
                  setItems([]);
                  if (val.trim().length > 0) handleCustomerSearch(val);
                  else setCustomerSuggestions([]);
                }}
                placeholder="Search Customer"
              />
              {customerSuggestions.map((cust) => (
                <li
                  key={cust._id}
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      customer: cust.customerName,
                      TIN: cust.TIN || "",
                      address: cust.address || "",
                      terms: cust.terms || "",
                      salesPerson: cust.salesAgent || "",
                    }));
                    setCustomerSuggestions([]);
                    setIsCustomerFocused(false);
                  }}>
                  {cust.customerName}
                </li>
              ))}
            </div>

            {/* Customer Details */}
            <div className="grid gap-1.5">
              <Label htmlFor="TIN">TIN</Label>
              <Input
                id="TIN"
                value={formData.TIN ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="terms">Terms</Label>
              <Input
                id="terms"
                value={formData.terms ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="salesPerson">Sales Agent</Label>
              <Input
                id="salesPerson"
                value={formData.salesPerson ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5 relative">
              <Label htmlFor="drNo">
                DR No. <span className="text-red-500">*</span>
              </Label>
              <Input
                id="drNo"
                autoComplete="off"
                value={formData.drNo ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, drNo: val }));

                  if (!val) {
                    setItems([]);
                    setDrSuggestions([]); // renamed suggestions array for DR
                    return;
                  }

                  if (formData.customer) handleDrSearch(formData.customer, val);
                }}
                onFocus={() => {
                  if (formData.customer) handleDrSearch(formData.customer, "");
                  setIsDrFocused(true); // renamed focus state for DR
                }}
                placeholder="Select Delivery (DR No.)"
                disabled={!formData.customer}
              />

              {isDrFocused && drSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded z-50">
                  {drSuggestions.map((dr) => (
                    <li
                      key={dr._id}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => {
                        handleDrSelect(dr._id); // fetch by _id
                        setFormData((prev) => ({ ...prev, drNo: dr.drNo })); // show DR No.
                        setDrSuggestions([]);
                        setIsDrFocused(false);
                      }}>
                      {dr.drNo}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Invoice Date & Payment Terms */}
            <div className="grid gap-1.5">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="text"
                value={
                  formData.invoiceDate
                    ? new Date(formData.invoiceDate).toLocaleDateString(
                        "en-PH",
                        {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        }
                      )
                    : ""
                }
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="terms">Payment Terms</Label>
              <Input
                id="terms"
                value={formData.terms ?? ""}
                placeholder="Payment terms"
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Shipping Address & Remarks */}
            <div className="grid grid-cols-2 gap-4 col-span-2">
              <div className="grid gap-1.5">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <textarea
                  id="shippingAddress"
                  value={formData.shippingAddress ?? ""}
                  readOnly
                  className="w-full bg-gray-100 cursor-not-allowed p-2 rounded border border-gray-300 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="remarks">Remarks</Label>
                <textarea
                  id="remarks"
                  value={formData.remarks ?? ""}
                  placeholder="Additional notes (optional)"
                  readOnly
                  className="w-full bg-gray-100 cursor-not-allowed p-2 rounded border border-gray-300 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="col-span-2 mt-4">
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="p-2">
                        <Checkbox
                          checked={items.every((item) => item.selected)}
                          onCheckedChange={(checked) =>
                            setItems(
                              items.map((i) => ({ ...i, selected: !!checked }))
                            )
                          }
                        />
                      </th>
                      <th className="p-2 text-left">Item Code</th>
                      <th className="p-2 text-left">Item Name</th>
                      <th className="p-2 text-right">Available Qty</th>
                      <th className="p-2 text-right">Qty to Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr
                        key={item.itemCode || idx}
                        className="hover:bg-gray-50">
                        <td className="p-2 text-center">
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={(checked) =>
                              setItems(
                                items.map((i, j) =>
                                  j === idx ? { ...i, selected: !!checked } : i
                                )
                              )
                            }
                          />
                        </td>
                        <td className="p-2 text-left font-medium">
                          {item.itemCode}
                        </td>
                        <td className="p-2 text-left">{item.itemName}</td>
                        <td className="p-2 text-right font-semibold">
                          {item.availableQuantity}
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.quantity}
                            onChange={(e) => {
                              let val = parseInt(
                                e.target.value.replace(/\D/g, ""),
                                10
                              );
                              if (isNaN(val)) val = 1;
                              val = Math.min(
                                Math.max(val, 1),
                                item.availableQuantity
                              );
                              setItems(
                                items.map((i, j) =>
                                  j === idx ? { ...i, quantity: val } : i
                                )
                              );
                            }}
                            className="w-20 text-right bg-transparent border-none focus:outline-none focus:ring-0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="w-full my-8 overflow-x-auto">
                <h3 className="text-lg font-semibold text-primary tracking-wide mb-4 py-2 text-end">
                  Invoice Summary
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
                          Total Items
                        </td>
                        <td className="py-2 px-4 text-right font-semibold text-foreground">
                          {items.filter((i) => i.selected).length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-primary">
                          Total Quantity
                        </td>
                        <td className="py-2 px-4 text-right font-semibold text-primary">
                          {items
                            .filter((i) => i.selected)
                            .reduce((sum, i) => sum + i.quantity, 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleUpdate}
              disabled={
                isUpdating ||
                !formData.customer?.trim() ||
                !formData.invoiceNo?.trim() ||
                items.filter((i) => i.selected).length === 0
              }>
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isUpdating ? "Updating…" : "Update Invoice"}
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogTitle className="sr-only">Sales Invoice details</DialogTitle>
        <DialogPanel className="max-w-3xl" autoFocus={false}>
          {/* 🧾 Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold text-primary tracking-wide">
                Sales Invoice Details
              </h2>
              <p className="text-sm text-muted-foreground">
                Invoice No:{" "}
                <span className="text-foreground font-semibold">
                  {formData.invoiceNo}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                SO No.:{" "}
                <span className="text-foreground font-semibold">
                  {formData.soNumber ?? ""}
                </span>
              </p>
            </div>
            <div className="text-sm text-right text-muted-foreground">
              <p>
                Created Date:{" "}
                <span className="text-foreground">
                  {formData.createdAt
                    ? new Date(formData.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })
                    : ""}
                </span>
              </p>
              <p>
                Invoice Date:{" "}
                <span className="text-foreground">
                  {formData.invoiceDate
                    ? new Date(formData.invoiceDate).toLocaleDateString(
                        "en-PH",
                        {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        }
                      )
                    : ""}
                </span>
              </p>
              <p>
                Status:{" "}
                <span
                  className={`font-semibold ${
                    formData.status === "PAID"
                      ? "text-green-700 font-bold"
                      : formData.status === "PARTIAL"
                      ? "text-yellow-600 font-bold"
                      : formData.status === "UNPAID"
                      ? "text-red-600 font-bold"
                      : "text-gray-500 font-bold"
                  }`}>
                  {formData.status}
                </span>
              </p>
            </div>
          </div>

          {/* 🏢 Customer & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium text-muted-foreground">
                  Customer Name:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.customer ?? ""}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Payment Terms:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.terms ?? ""}
                </span>
              </p>
            </div>

            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium text-muted-foreground">
                  Shipping Address:
                </span>{" "}
                <span className="text-foreground font-semibold truncate max-w-[60%]">
                  {formData.shippingAddress ?? ""}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Remarks:
                </span>{" "}
                <span className="text-foreground font-semibold truncate max-w-[60%]">
                  {formData.remarks ?? ""}
                </span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="col-span-2 mt-4">
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="p-2 text-left">Item Code</th>
                      <th className="p-2 text-left">Item Name</th>
                      <th className="p-2 text-right">Available Qty</th>
                      <th className="p-2 text-right">Qty to Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr
                        key={item.itemCode || idx}
                        className="hover:bg-gray-50">
                        <td className="p-2 text-left font-medium">
                          {item.itemCode}
                        </td>
                        <td className="p-2 text-left">{item.itemName}</td>
                        <td className="p-2 text-right font-semibold">
                          {item.availableQuantity}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="w-full my-8 overflow-x-auto">
                <h3 className="text-lg font-semibold text-primary tracking-wide mb-4 py-2 text-end">
                  Invoice Summary
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
                          Total Items
                        </td>
                        <td className="py-2 px-4 text-right font-semibold text-foreground">
                          {items.length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-primary">
                          Total Quantity
                        </td>
                        <td className="py-2 px-4 text-right font-semibold text-primary">
                          {items.reduce((sum, i) => sum + i.quantity, 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
    </Card>
  );
}
