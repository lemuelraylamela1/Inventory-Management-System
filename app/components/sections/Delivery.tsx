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

import type { Delivery, SalesOrder, DeliveryItem } from "./type";
import SalesOrderModel, { SalesOrderDocument } from "@/models/salesOrder";

export default function Delivery() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Delivery>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  const [soSuggestions, setSoSuggestions] = useState<string[]>([]);
  const [isCustomerFocused, setIsCustomerFocused] = useState(false);
  const [isSoFocused, setIsSoFocused] = useState(false);
  const [items, setItems] = useState<DeliveryItem[]>([]);

  const filteredDeliveries = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return deliveries.filter((d) => {
      const dr = d.drNo?.toLowerCase() || "";
      const soNumber = d.soNumber?.toLowerCase() || "";
      return dr.includes(query) || soNumber.includes(query);
    });
  }, [deliveries, searchTerm]);

  const totalPages = Math.ceil(filteredDeliveries.length / rowsPerPage);

  const paginatedDeliveries: Delivery[] = filteredDeliveries.slice(
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

  const refreshDeliveryList = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/delivery");
      const data = await res.json();
      setDeliveries(data);
    } catch (err) {
      console.error("Failed to fetch deliveries", err);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    refreshDeliveryList(); // Initial fetch

    const interval = setInterval(() => {
      refreshDeliveryList();
    }, 1000); // 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleCustomerSearch = async (query: string) => {
    try {
      const res = await fetch("/api/sales-orders"); // fetch all SOs
      if (!res.ok) throw new Error("Failed to fetch sales orders");

      const data: { salesOrders: SalesOrder[] } = await res.json();

      // filter unique customers
      const allCustomers = Array.from(
        new Set(data.salesOrders.map((so) => so.customer))
      );

      // filter based on query
      const filtered = allCustomers.filter((cust) =>
        cust.toLowerCase().includes(query.toLowerCase())
      );

      console.log("Customer suggestions:", filtered);
      setCustomerSuggestions(filtered);
    } catch (err) {
      console.error("Customer search error:", err);
      setCustomerSuggestions([]);
    }
  };

  const handleSoSearch = async (customer: string, query: string) => {
    if (!customer) return setSoSuggestions([]);

    try {
      const res = await fetch("/api/sales-orders");
      if (!res.ok) throw new Error("Failed to fetch sales orders");

      const data: { salesOrders: SalesOrderDocument[] } = await res.json();

      const filteredSoNumbers = data.salesOrders
        .filter(
          (so) =>
            so.customer === customer &&
            (so.status === "PENDING" || so.status === "PARTIAL") &&
            so.soNumber.toLowerCase().includes(query.toLowerCase())
        )
        .map((so) => so.soNumber); // <-- only keep the string

      setSoSuggestions(filteredSoNumbers);
    } catch (err) {
      console.error("SO search error:", err);
      setSoSuggestions([]);
    }
  };

  // Populate items from Sales Order
  const populateItemsFromSO = (so: SalesOrder) => {
    if (!so?.items?.length) return [];

    return so.items.map((item) => {
      const availableQty = item.availableQuantity ?? item.quantity ?? 0;

      const initialQty = Math.min(item.quantity ?? 1, availableQty); // never exceed available

      return {
        itemCode: item.itemCode ?? "",
        itemName: item.itemName ?? "",
        availableQuantity: availableQty,
        quantity: initialQty,
        selected: availableQty > 0, // only auto-select if something is available
        unitType: item.unitType ?? "",
        price: item.price ?? 0,
        amount: item.amount ?? 0,
        weight: item.weight ?? 0,
        cbm: item.cbm ?? 0,
      };
    });
  };

  // When user selects a Sales Order
  const handleSOSelect = (so: SalesOrder) => {
    setFormData({ ...formData, soNumber: so.soNumber });
    setItems(populateItemsFromSO(so)); // <-- use availableQuantity here
  };

  const handleSoSelect = async (soNumber: string) => {
    setFormData((prev) => ({ ...prev, soNumber }));

    if (!soNumber) {
      setItems([]);
      return;
    }

    try {
      const res = await fetch("/api/sales-orders");
      if (!res.ok) throw new Error("Failed to fetch sales orders");

      const data: { salesOrders: SalesOrder[] } = await res.json();
      const selectedSO = data.salesOrders.find(
        (so) => so.soNumber === soNumber
      );
      if (!selectedSO) return;

      console.log("Fetched SO items:", selectedSO.items); // check availableQuantity here
      setItems(populateItemsFromSO(selectedSO));

      // Update form fields
      setFormData((prev) => ({
        ...prev,
        warehouse: selectedSO.warehouse,
        shippingAddress: selectedSO.shippingAddress,
        deliveryDate: selectedSO.deliveryDate?.split("T")[0],
        remarks: selectedSO.notes,
      }));

      // Populate items using shared function
      setItems(populateItemsFromSO(selectedSO));
    } catch (err) {
      console.error("Failed to select SO:", err);
    }
  };

  const handleCreate = async (formData: Partial<Delivery>) => {
    if (!formData.soNumber || !formData.customer) {
      console.warn("SO number and Customer are required.");
      return;
    }

    // Build payload including items from the items state
    const payload: Omit<Partial<Delivery>, "_id" | "drNo"> & {
      items?: DeliveryItem[];
    } = {
      soNumber: formData.soNumber,
      customer: formData.customer,
      warehouse: formData.warehouse,
      shippingAddress: formData.shippingAddress,
      deliveryDate: formData.deliveryDate,
      remarks: formData.remarks?.trim() || "",
      status: formData.status || "PREPARED",
      items: items.filter((i) => i.selected), // <-- use items state here
    };

    console.log("Create payload:", payload); // check if items exist

    try {
      const res = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create delivery");

      const created = await res.json();
      console.log("Delivery created:", created);

      await refreshDeliveryList();
      setIsCreateDialogOpen(false);
      setFormData({});
      setItems([]); // clear items table
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleEdit = (delivery: Delivery & { items?: DeliveryItem[] }) => {
    setFormData({
      _id: delivery._id,
      drNo: delivery.drNo,
      soNumber: delivery.soNumber,
      customer: delivery.customer,
      warehouse: delivery.warehouse,
      shippingAddress: delivery.shippingAddress,
      deliveryDate: delivery.deliveryDate,
      remarks: delivery.remarks,
      status: delivery.status,
      createdAt: delivery.createdAt,
    });

    // Populate items immediately
    setItems(
      delivery.items?.map((item) => ({
        ...item,
        selected: true, // auto-select all
      })) || []
    );

    setIsEditDialogOpen(true);
  };

  // 🔹 Update delivery
  const handleUpdate = async () => {
    if (!formData._id) return console.warn("Missing delivery ID");

    const payload = {
      ...formData,
      items, // send items separately
    };

    try {
      const res = await fetch(`/api/delivery/${formData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update delivery");

      const updated = await res.json();
      console.log("Delivery updated:", updated);

      await refreshDeliveryList();
      setIsEditDialogOpen(false);
      setFormData({});
      setItems([]);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDelete = async (deliveryId: string) => {
    if (!deliveryId) return console.warn("Missing delivery ID for deletion");

    try {
      const res = await fetch(`/api/delivery/${deliveryId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete delivery");

      console.log("Delivery deleted:", deliveryId);
      await refreshDeliveryList();
      setSelectedIds((prev) => prev.filter((id) => id !== deliveryId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleView = async (deliveryId: string) => {
    if (!deliveryId) return console.warn("Missing delivery ID for view");

    try {
      const res = await fetch(`/api/delivery/${deliveryId}`);
      if (!res.ok) throw new Error("Failed to fetch delivery details");

      const delivery: Delivery & { items?: DeliveryItem[] } = await res.json();
      console.log("Delivery details:", delivery);

      // Populate form fields
      setFormData({
        _id: delivery._id,
        drNo: delivery.drNo,
        soNumber: delivery.soNumber,
        customer: delivery.customer,
        warehouse: delivery.warehouse,
        shippingAddress: delivery.shippingAddress,
        deliveryDate: delivery.deliveryDate,
        remarks: delivery.remarks,
        status: delivery.status,
        createdAt: delivery.createdAt,
      });

      // Populate items table
      setItems(
        delivery.items?.map((item) => ({
          ...item,
          selected: true, // auto-select all for viewing
        })) || []
      );

      setIsViewDialogOpen(true);
    } catch (err) {
      console.error("View error:", err);
    }
  };

  const handleMarkDelivered = async (id: string) => {
    if (!id) {
      toast.error("Invalid delivery ID.");
      return;
    }

    try {
      const res = await fetch(`/api/delivery/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "DELIVERED" }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to update delivery");
      }

      toast.success("Delivery marked as DELIVERED!");

      // ✅ Update UI list immediately
      setDeliveries((prev) =>
        prev.map((d) => (d._id === id ? { ...d, status: "DELIVERED" } : d))
      );
    } catch (err) {
      console.error("handleMarkDelivered error:", err);
      toast.error("Failed to mark as delivered.");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Deliveries</CardTitle>
            <CardDescription>Manage delivery records</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Create */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search DR No. or Sales Order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Delivery
          </Button>
        </div>

        {/* Table */}
        <ScrollArea className="max-h-[500px] overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-4 px-2">
                  <Checkbox
                    checked={paginatedDeliveries
                      .map((d) => d._id)
                      .filter((id): id is string => typeof id === "string")
                      .every((id) => selectedIds.includes(id))}
                    onCheckedChange={(checked) => {
                      const visibleIds = paginatedDeliveries
                        .map((d) => d._id)
                        .filter((id): id is string => typeof id === "string");

                      setSelectedIds((prev) =>
                        checked
                          ? [...new Set([...prev, ...visibleIds])]
                          : prev.filter((id) => !visibleIds.includes(id))
                      );
                    }}
                    aria-label="Select all visible deliveries"
                    className="ml-1"
                  />
                </TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead>DR No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sales Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading deliveries…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-6 w-6" />
                      <span className="text-sm">No deliveries found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDeliveries.map((delivery) => (
                  <TableRow key={delivery._id}>
                    <TableCell className="px-2">
                      <Checkbox
                        checked={selectedIds.includes(delivery._id ?? "")}
                        onCheckedChange={(checked) => {
                          const id = delivery._id;
                          if (!id) return;

                          setSelectedIds((prev) =>
                            checked
                              ? [...prev, id]
                              : prev.filter((x) => x !== id)
                          );
                        }}
                        aria-label={`Select Delivery ${
                          delivery.drNo || "Record"
                        }`}
                        className="ml-1"
                      />
                    </TableCell>
                    <TableCell>
                      {delivery.createdAt
                        ? new Date(delivery.createdAt).toLocaleDateString(
                            "en-PH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>{delivery.drNo ?? "—"}</TableCell>
                    <TableCell>{delivery.customer ?? "—"}</TableCell>
                    <TableCell>{delivery.soNumber ?? "—"}</TableCell>
                    <TableCell>
                      {delivery.status === "PREPARED" ? (
                        <span className="text-blue-700 font-bold">
                          PREPARED
                        </span>
                      ) : delivery.status === "DELIVERED" ? (
                        <span className="text-teal-600 font-bold">
                          DELIVERED
                        </span>
                      ) : delivery.status === "COMPLETED" ? (
                        <span className="text-green-700 font-bold">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="text-red-700 font-bold">
                          CANCELLED
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkDelivered(delivery._id!)}
                        disabled={delivery.status !== "PREPARED"}
                        title="Mark as Delivered">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(delivery._id!)}
                        title="View Delivery">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(delivery)}
                        title="Edit Delivery">
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Delivery"
                            className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Delivery</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently delete this delivery record?
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(delivery._id!)}>
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
              Deliveries per page:
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
              Create Delivery
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the delivery details. Fields marked with
              <span className="text-red-500"> * </span> are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* DR No. */}
            <div className="grid gap-1.5">
              <Label htmlFor="drNo">DR No.</Label>
              <Input
                id="drNo"
                value={formData.drNo ?? "Auto-generated"}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Create Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="createDate">Create Date</Label>
              <Input
                id="createDate"
                value={new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })} // MMM DD, YYYY format
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

                  // Update customer and reset SO
                  setFormData((prev) => ({
                    ...prev,
                    customer: val,
                    soNumber: "",
                  }));

                  // Clear SO suggestions and items whenever customer changes
                  setSoSuggestions([]);
                  setItems([]);

                  // Fetch customer suggestions if there is input
                  if (val.trim().length > 0) handleCustomerSearch(val);
                  else setCustomerSuggestions([]);
                }}
                placeholder="Search Customer"
              />
              {isCustomerFocused && customerSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 z-10 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded">
                  {customerSuggestions.map((cust) => (
                    <li
                      key={cust}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          customer: cust,
                          soNumber: "",
                        }));
                        setCustomerSuggestions([]);
                        setSoSuggestions([]);
                        setItems([]);
                        setIsCustomerFocused(false);
                      }}>
                      {cust}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-1.5 relative">
              <Label htmlFor="soNumber">
                Sales Order <span className="text-red-500">*</span>
              </Label>

              <Input
                id="soNumber"
                autoComplete="off"
                value={formData.soNumber ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, soNumber: val }));

                  if (!val) {
                    setItems([]);
                    setSoSuggestions([]);
                    return;
                  }

                  if (formData.customer) handleSoSearch(formData.customer, val);
                }}
                onFocus={() => {
                  if (formData.customer) handleSoSearch(formData.customer, "");
                  setIsSoFocused(true);
                }}
                placeholder="Select Sales Order"
                disabled={!formData.customer}
              />

              {isSoFocused && soSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded z-50">
                  {soSuggestions.map((so) => (
                    <li
                      key={so}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleSoSelect(so); // so is just a string
                        setSoSuggestions([]);
                        setIsSoFocused(false);
                      }}>
                      {so} {/* only SO number */}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Warehouse & Delivery Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="warehouse">
                Warehouse <span className="text-red-500">*</span>
              </Label>
              <Input
                id="warehouse"
                value={formData.warehouse ?? ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="deliveryDate">
                Delivery Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deliveryDate"
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

          {formData.soNumber && items.length > 0 && (
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
                      <th className="p-2 text-right">Qty to Deliver</th>
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
                            type="number"
                            min={1}
                            max={item.availableQuantity ?? 1}
                            value={item.quantity}
                            onChange={(e) => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val) || val < 1) val = 1;

                              // Never allow user to exceed availableQuantity
                              val = Math.min(val, item.availableQuantity ?? 0);

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

              {/* Delivery summary */}
              <div className="w-full my-8 overflow-x-auto">
                <h3 className="text-lg font-semibold text-primary tracking-wide mb-4 py-2 text-end">
                  Delivery Summary
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
              onClick={() => handleCreate(formData)}
              disabled={
                isCreating ||
                !formData.customer?.trim() ||
                !formData.soNumber?.trim() ||
                items.filter((i) => i.selected).length === 0
              }>
              {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isCreating ? "Creating…" : "Create Delivery"}
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogPanel className="max-w-3xl" autoFocus={false}>
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Edit Delivery
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the delivery details. Fields marked with
              <span className="text-red-500"> * </span> are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* DR No. */}
            <div className="grid gap-1.5">
              <Label htmlFor="drNo">DR No.</Label>
              <Input
                id="drNo"
                value={formData.drNo ?? "Auto-generated"}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Created Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="createdDate">Created Date</Label>
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
              {isCustomerFocused && customerSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 z-10 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded">
                  {customerSuggestions.map((cust) => (
                    <li
                      key={cust}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          customer: cust,
                          soNumber: "",
                        }));
                        setCustomerSuggestions([]);
                        setSoSuggestions([]);
                        setItems([]);
                        setIsCustomerFocused(false);
                      }}>
                      {cust}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-1.5 relative">
              <Label htmlFor="soNumber">
                Sales Order <span className="text-red-500">*</span>
              </Label>

              <Input
                id="soNumber"
                autoComplete="off"
                value={formData.soNumber ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, soNumber: val }));
                  if (!val) {
                    setItems([]);
                    setSoSuggestions([]);
                    return;
                  }
                  if (formData.customer) handleSoSearch(formData.customer, val);
                }}
                onFocus={() => {
                  if (formData.customer) handleSoSearch(formData.customer, "");
                  setIsSoFocused(true);
                }}
                placeholder="Select Sales Order"
                disabled={!formData.customer}
              />

              {isSoFocused && soSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded z-50">
                  {soSuggestions.map((so) => (
                    <li
                      key={so}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleSoSelect(so);
                        setSoSuggestions([]);
                        setIsSoFocused(false);
                      }}>
                      {so}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Warehouse & Delivery Date */}
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
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="text"
                value={
                  formData.deliveryDate
                    ? new Date(formData.deliveryDate).toLocaleDateString(
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
                      <th className="p-2 text-right">Qty to Deliver</th>
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
                  Delivery Summary
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
                !formData.soNumber?.trim() ||
                items.filter((i) => i.selected).length === 0
              }>
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isUpdating ? "Updating…" : "Update Delivery"}
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogTitle className="sr-only">Delivery details</DialogTitle>
        <DialogPanel className="max-w-3xl" autoFocus={false}>
          {/* 🧾 Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold text-primary tracking-wide">
                Delivery Details
              </h2>
              <p className="text-sm text-muted-foreground">
                Delivery No:{" "}
                <span className=" text-foreground font-semibold">
                  {formData.drNo}
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
                Delivery Date:{" "}
                <span className="text-foreground">
                  {formData.deliveryDate
                    ? new Date(formData.deliveryDate).toLocaleDateString(
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
                    formData.status === "COMPLETED"
                      ? "text-green-700 font-bold"
                      : formData.status === "PREPARED"
                      ? "text-blue-600 font-bold"
                      : formData.status === "PENDING"
                      ? "text-yellow-600 font-bold"
                      : formData.status === "PARTIAL"
                      ? "text-orange-600 font-bold"
                      : formData.status === "CANCELLED"
                      ? "text-red-600"
                      : formData.status === "DELIVERED"
                      ? "text-teal-700 font-bold"
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
                  Customer Name:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.customer ?? ""}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Warehouse Name:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.warehouse ?? ""}
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
                      <th className="p-2 text-right">Qty to Deliver</th>
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
                  Delivery Summary
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
