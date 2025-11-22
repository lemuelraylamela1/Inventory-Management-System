import { useEffect, useState, useMemo, useRef } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { format } from "date-fns";
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
  ItemType,
  SalesOrder,
  DiscountStep,
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
  const [isLoadingView, setIsLoadingView] = useState(false);
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

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <p>
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span className="font-semibold text-foreground">{value || "—"}</span>
    </p>
  );

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

  const refreshInvoiceList = async () => {
    try {
      const res = await fetch("/api/sales-invoices");
      if (!res.ok) throw new Error("Failed to fetch invoices");

      const data = await res.json();

      // Ensure invoices is always an array
      // If your API returns { invoices: [...] }, adjust accordingly
      const invoicesArray = Array.isArray(data) ? data : data.invoices ?? [];
      setInvoices(invoicesArray);

      return invoicesArray; // optional if you want to use after deletion
    } catch (err) {
      console.error("Failed to refresh invoices:", err);
      setInvoices([]); // fallback to empty array
      return [];
    }
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
      console.log("Fetching delivery:", deliveryId);
      const res = await fetch(`/api/delivery/${deliveryId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to fetch delivery details");
      }
      const delivery: Delivery = await res.json();
      console.log("Delivery fetched:", delivery);

      // Fetch linked SalesOrder
      let so: SalesOrder | null = null;
      if (delivery.soNumber) {
        const soRes = await fetch(`/api/sales-orders/${delivery.soNumber}`);
        if (soRes.ok) {
          const data = await soRes.json();
          so = data?.order ?? null;
          console.log("Linked SO fetched:", so);
        }
      }

      // Fetch Customer
      let customer: Customer | null = null;
      if (delivery.customer) {
        const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
        if (isValidObjectId(delivery.customer)) {
          const custRes = await fetch(`/api/customers/${delivery.customer}`);
          if (custRes.ok) {
            customer = await custRes.json();
            console.log("Customer fetched:", customer);
          }
        } else {
          const custRes = await fetch(
            `/api/customers?customerCode=${delivery.customer}`
          );
          if (custRes.ok) {
            customer = await custRes.json();
            console.log("Customer fetched by code:", customer);
          }
        }
      }

      // Compute total discount
      const totalDiscount = Array.isArray(so?.discountBreakdown)
        ? so.discountBreakdown.reduce(
            (sum, step) => sum + (step.amount || 0),
            0
          )
        : 0;

      // Prepare DR items with description
      const itemsWithoutDiscount = await Promise.all(
        (delivery.items ?? []).map(async (item) => {
          let description = item.description || "";

          if (item.itemName) {
            try {
              const itemRes = await fetch(
                `/api/items?name=${encodeURIComponent(item.itemName)}`
              );
              if (itemRes.ok) {
                const itemData = await itemRes.json();
                console.log("Item API response:", itemData); // debug
                if (itemData.items && itemData.items.length > 0) {
                  description = itemData.items[0].description || "";
                }
              }
            } catch (err) {
              console.warn("Failed to fetch item description:", err);
            }
          }

          return {
            itemCode: item.itemCode || "",
            itemName: item.itemName || "",
            description, // ✅ assign fetched description
            unitType: item.unitType || "",
            quantity: item.quantity || 0,
            price: item.price || 0,
            selected: true,
            availableQuantity: item.availableQuantity || 0,
          };
        })
      );

      // Compute totals & discounts
      const totalOriginal = itemsWithoutDiscount.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const baseTotal = totalOriginal || 1;

      const finalItems = itemsWithoutDiscount.map((item) => {
        const itemTotal = item.price * item.quantity;
        const itemDiscount = (itemTotal / baseTotal) * totalDiscount;
        const discountedAmount = itemTotal - itemDiscount;
        const priceAfterDiscount =
          item.quantity > 0 ? discountedAmount / item.quantity : item.price;

        return {
          ...item,
          priceAfterDiscount: Number(priceAfterDiscount.toFixed(2)),
          amount: Number(discountedAmount.toFixed(2)),
        };
      });

      const netTotal = finalItems.reduce((sum, item) => sum + item.amount, 0);

      // Update form data
      setFormData((prev) => ({
        ...prev,
        drNo: delivery.drNo || "",
        warehouse: delivery.warehouse || "",
        shippingAddress: delivery.shippingAddress || "",
        deliveryDate: delivery.deliveryDate || "",
        remarks: delivery.remarks || "",
        status: ["UNPAID", "PARTIAL", "PAID", "VOID"].includes(delivery.status)
          ? (delivery.status as SalesInvoice["status"])
          : "UNPAID",
        customer: so?.customer || delivery.customer || prev.customer || "",
        salesPerson: so?.salesPerson || prev.salesPerson || "",
        TIN: customer?.TIN || prev.TIN || "",
        terms: customer?.terms || prev.terms || "",
        discountBreakdown: so?.discountBreakdown ?? [],
        total: netTotal,
        netTotal,
      }));

      setItems(finalItems);
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

    // Filter selected items and map for payload
    const selectedInvoiceItems = items
      .filter((i) => i.selected)
      .map((i) => {
        const quantity = Number(i.quantity) || 0;
        const price = Number(i.priceAfterDiscount ?? i.price) || 0;
        const amount = quantity * price;

        return {
          itemCode: i.itemCode || "",
          itemName: i.itemName || "",
          description: i.description || "",
          quantity,
          unitType: i.unitType || "",
          price,
          amount,
          discountBreakdown: i.discountBreakdown ?? [],
        };
      });

    if (selectedInvoiceItems.length === 0) {
      console.warn("No items selected for invoicing.");
      return;
    }

    // Compute total & net total
    const totalAmount = selectedInvoiceItems.reduce(
      (sum, i) => sum + i.amount,
      0
    );

    const payload: Omit<Partial<SalesInvoice>, "_id" | "invoiceNo"> = {
      drNo: formData.drNo,
      customer: formData.customer,
      salesPerson: formData.salesPerson,
      address: formData.address,
      TIN: formData.TIN,
      terms: formData.terms,
      dueDate: formData.deliveryDate,
      notes: formData.remarks?.trim() || "",
      status: formData.status || "UNPAID",
      soNumber: formData.soNumber || "",
      discountBreakdown: formData.discountBreakdown ?? [],
      total: totalAmount,
      netTotal: totalAmount, // net total = sum of item amounts, no further deduction
      items: selectedInvoiceItems,
      warehouse: formData.warehouse,
      shippingAddress: formData.shippingAddress,
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
      // Fetch the invoice from DB
      const res = await fetch(`/api/sales-invoices/${invoiceId}`);
      if (!res.ok) throw new Error("Failed to fetch invoice details");

      const invoice: SalesInvoice & { items?: SalesInvoiceItem[] } =
        await res.json();
      console.log("Invoice details:", invoice);

      // Populate form fields directly from DB
      setFormData({
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        drNo: invoice.drNo,
        customer: invoice.customer,
        salesPerson: invoice.salesPerson,
        TIN: invoice.TIN,
        terms: invoice.terms,
        address: invoice.address,
        warehouse: invoice.warehouse, // directly from DB
        notes: invoice.notes,
        dueDate: invoice.dueDate,
        status: invoice.status,
        createdAt: invoice.createdAt,
        total: invoice.total, // total stored in DB
        netTotal: invoice.netTotal, // net total stored in DB
      });

      // Populate items directly from DB
      setItems(
        invoice.items?.map((item) => ({
          ...item,
          selected: true,
          availableQuantity: item.quantity, // just to satisfy typing
          priceAfterDiscount: item.price, // use DB value
          amount: item.amount, // use DB value
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 px-4 bg-white border rounded-lg shadow-sm">
            <div className="space-y-4">
              {/* Invoice No */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="invoiceNo"
                  className="text-sm font-medium text-gray-600">
                  Invoice No.
                </Label>
                <Input
                  id="invoiceNo"
                  value={formData.invoiceNo ?? "Auto-generated"}
                  readOnly
                  className="bg-muted border-gray-300 cursor-not-allowed"
                />
              </div>

              {/* Customer */}
              <div className="relative flex flex-col gap-1.5">
                <Label
                  htmlFor="customer"
                  className="text-sm font-medium text-gray-600">
                  Customer <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer"
                  autoComplete="off"
                  value={formData.customer ?? ""}
                  placeholder="Search Customer"
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
                />

                {/* Suggestion Dropdown */}
                {isCustomerFocused && customerSuggestions.length > 0 && (
                  <ul className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-white shadow-md z-50">
                    {customerSuggestions.map((cust) => (
                      <li
                        key={cust._id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onMouseDown={() => {
                          handleCustomerSelect(cust._id);
                          setIsCustomerFocused(false);
                        }}>
                        {cust.customerName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Invoice Date */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="createDate"
                  className="text-sm font-medium text-gray-600">
                  Invoice Date
                </Label>
                <Input
                  id="createDate"
                  value={new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                  readOnly
                  className="bg-muted border-gray-300 cursor-not-allowed"
                />
              </div>
              {/* DR No */}
              <div className="relative flex flex-col gap-1.5">
                <Label
                  htmlFor="drNo"
                  className="text-sm font-medium text-gray-600">
                  DR No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="drNo"
                  autoComplete="off"
                  placeholder="Select Delivery (DR No.)"
                  disabled={!formData.customer}
                  value={formData.drNo ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, drNo: val }));

                    if (!val) {
                      setItems([]);
                      setDrSuggestions([]);
                      return;
                    }
                    if (formData.customer)
                      handleDrSearch(formData.customer, val);
                  }}
                  onFocus={() => {
                    if (formData.customer)
                      handleDrSearch(formData.customer, "");
                    setIsDrFocused(true);
                  }}
                />

                {isDrFocused && drSuggestions.length > 0 && (
                  <ul className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-white shadow-md z-50">
                    {drSuggestions.map((dr) => (
                      <li
                        key={dr._id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onMouseDown={() => {
                          handleDrSelect(dr._id);
                          setFormData((prev) => ({ ...prev, drNo: dr.drNo }));
                          setDrSuggestions([]);
                          setIsDrFocused(false);
                        }}>
                        {dr.drNo}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 📦 CUSTOMER INFO PANEL */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Customer Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/40 rounded-lg border">
                {/* Left column */}
                <div className="space-y-2 text-sm">
                  <InfoRow label="Sales Person" value={formData.salesPerson} />
                  <InfoRow label="TIN" value={formData.TIN} />
                  <InfoRow label="Terms" value={formData.terms} />
                  <InfoRow label="Address" value={formData.address} />
                </div>

                {/* Right column */}
                <div className="space-y-2 text-sm">
                  <InfoRow label="Warehouse" value={formData.warehouse} />
                  <InfoRow
                    label="Due Date"
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
                  />
                  <InfoRow label="Remarks" value={formData.remarks} />
                </div>
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
                      <th className="p-2 text-left">Item Name</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-right">Quantity</th>
                      <th className="p-2 text-left">UOM</th>

                      {/* ✅ NEW COLUMN */}
                      <th className="p-2 text-right">Price</th>

                      <th className="p-2 text-right">Tax</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, idx) => {
                      const priceAfterDiscount =
                        item.quantity > 0 ? item.amount / item.quantity : 0;

                      return (
                        <tr
                          key={item.itemCode || idx}
                          className="hover:bg-gray-50">
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={(checked) =>
                                setItems(
                                  items.map((i, j) =>
                                    j === idx
                                      ? { ...i, selected: !!checked }
                                      : i
                                  )
                                )
                              }
                            />
                          </td>

                          <td className="p-2 text-left">{item.itemName}</td>
                          <td className="p-2 text-left">{item.description}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-left">{item.unitType}</td>
                          {/* ✅ NEW COLUMN CELL */}
                          <td className="p-2 text-right">
                            {priceAfterDiscount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td className="p-2 text-right">0.00</td>
                          <td className="p-2 text-right">{item.amount}</td>
                        </tr>
                      );
                    })}
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
                      {/* Total Quantity */}
                      <tr>
                        <td className="py-2 px-4">Total Quantity</td>
                        <td className="py-2 px-4 text-right font-semibold">
                          {items
                            .filter((i) => i.selected)
                            .reduce((sum, i) => sum + (i.quantity || 0), 0)
                            .toLocaleString()}
                        </td>
                      </tr>

                      {/* Total Amount */}
                      <tr>
                        <td className="py-2 px-4">Gross Total</td>
                        <td className="py-2 px-4 text-right font-semibold">
                          {items
                            .filter((i) => i.selected)
                            .reduce((sum, i) => sum + (i.amount || 0), 0)
                            .toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4">Discount</td>
                        <td className="py-2 px-4 text-right font-semibold">
                          0%
                        </td>
                      </tr>

                      {/* Net Total (same as total — discounts removed) */}
                      <tr>
                        <td className="py-2 px-4 text-primary">Net Total</td>
                        <td className="py-2 px-4 text-right font-semibold text-green-600">
                          {items
                            .filter((i) => i.selected)
                            .reduce((sum, i) => sum + (i.amount || 0), 0)
                            .toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogTitle className="sr-only">Sales Invoice</DialogTitle>
        <DialogPanel className="max-w-3xl" autoFocus={false}>
          {/* 🧾 Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold text-primary tracking-wide">
                Sales Invoice
              </h2>
              <p className="text-sm text-muted-foreground">
                Sales Invoice No:{" "}
                <span className=" text-foreground font-semibold">
                  {formData.invoiceNo}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                DR No.:{" "}
                <span className="text-foreground font-semibold">
                  {formData.drNo ?? ""}
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
                Delivery Date:{" "}
                <span className="text-foreground">
                  {formData.dueDate
                    ? new Date(formData.dueDate).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })
                    : ""}
                </span>
              </p>
              <p>
                Status:{" "}
                <span
                  className={`font-semibold ${
                    formData.status === "PAID"
                      ? "text-green-700 font-bold"
                      : formData.status === "UNPAID"
                      ? "text-red-600"
                      : "text-gray-500 font-bold"
                  }`}>
                  {formData.status}
                </span>
              </p>
            </div>
          </div>

          {/* 🏢 Customer & Warehouse Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium text-muted-foreground">
                  Customer:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.customer ?? ""}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Sales Person:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.salesPerson ?? ""}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">TIN:</span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.TIN ?? ""}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Terms:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.terms ?? ""}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Address:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.address ?? ""}
                </span>
              </p>
            </div>

            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium text-muted-foreground">
                  Warehouse:
                </span>{" "}
                <span className="text-foreground font-semibold truncate max-w-[60%]">
                  {formData.warehouse ?? ""}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Remarks:
                </span>{" "}
                <span className="text-foreground font-semibold truncate max-w-[60%]">
                  {formData.notes ?? ""}
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
                      <th className="p-2 text-left">Item Name</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-right">Quantity</th>
                      <th className="p-2 text-left">UOM</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Tax</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr
                        key={item.itemCode || idx}
                        className="hover:bg-gray-50">
                        <td className="p-2 text-left">{item.itemName}</td>
                        <td className="p-2 text-left">{item.description}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-left">{item.unitType}</td>
                        <td className="p-2 text-right">
                          {Number(
                            item.priceAfterDiscount ?? item.price
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-2 text-right">0.00</td>
                        <td className="p-2 text-right">
                          {Number(item.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* INVOICE SUMMARY */}
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
                        <td className="py-2 px-4">Total Quantity</td>
                        <td className="py-2 px-4 text-right font-semibold">
                          {items
                            .reduce((sum, i) => sum + (i.quantity || 0), 0)
                            .toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4">Total Amount</td>
                        <td className="py-2 px-4 text-right font-semibold">
                          {items
                            .reduce((sum, i) => sum + (i.amount || 0), 0)
                            .toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 ">Total Discount</td>
                        <td className="py-2 px-4 text-right font-semibold">
                          0.00%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-primary">Net Total</td>
                        <td className="py-2 px-4 text-right font-semibold text-primary">
                          {items
                            .reduce((sum, i) => sum + (i.amount || 0), 0)
                            .toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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
