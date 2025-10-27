"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  TransferRequest,
  TransferRequestItem,
  WarehouseType,
  InventoryType,
} from "./type";
import {
  Dialog,
  DialogTrigger,
  DialogPanel,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

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

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "../ui/card";
import {
  Plus,
  Trash2,
  Loader2,
  Inbox,
  Search,
  CalendarDays,
  Filter,
  Edit,
  Eye,
} from "lucide-react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";

export default function TransferRequestPage() {
  const [TransferRequests, setTransferRequests] = useState<TransferRequest[]>(
    []
  );
  const [showItemSuggestions, setShowItemSuggestions] = useState<number | null>(
    null
  );
  const [inventoryItems, setInventoryItems] = useState<InventoryType[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  // const [availableItemCodes, setAvailableItemCodes] = useState<string[]>([]);
  const [selectedTransferRequestId, setSelectedTransferRequestId] = useState<
    string | null
  >(null);

  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);
  const [results, setResults] = useState<string[]>([]);
  // const [showSuggestions, setShowSuggestions] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  // const [loading, setLoading] = useState(false);
  // const [dialogOpen, setDialogOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  // const pageSize = 10;
  const [isLoading, setIsLoading] = useState(false);
  const isFirstFetch = useRef(true);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [paginatedRequests, setPaginatedTransferRequests] = useState<
    TransferRequest[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<Omit<TransferRequest, "_id">>({
    requestNo: "", // ✅ Add this
    requestingWarehouse: "",
    sourceWarehouse: "",
    transactionDate: "",
    status: "PENDING",
    transferDate: "",
    preparedBy: "",
    items: [{ itemCode: "", quantity: 1, unitType: "" }],
  });

  const getInitialFormData = (): TransferRequest => ({
    requestNo: "", // ✅ now included
    status: "PENDING",
    requestingWarehouse: "",
    sourceWarehouse: "",
    transactionDate: "",
    transferDate: "",
    reference: "",
    notes: "",
    preparedBy: "",
    items: [{ itemCode: "", quantity: 1, unitType: "" }],
  });

  const fetchTransferRequests = async () => {
    if (isFirstFetch.current) {
      setIsLoading(true);
    }

    try {
      const res = await fetch("/api/transfer-requests", {
        cache: "no-store",
      });
      const data = await res.json();
      setTransferRequests(data.requests || []);
    } catch (err) {
      console.error("❌ Failed to fetch transfer requests:", err);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    fetchTransferRequests(); // initial fetch

    const intervalId = setInterval(fetchTransferRequests, 1000); // silent refetch
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isCreateDialogOpen) {
      setFormData((prev) => ({
        ...prev,
        transactionDate: new Date().toISOString(), // ✅ ISO format for payload
      }));
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setFormData(getInitialFormData());
    }
  }, [isEditDialogOpen]);

  useEffect(() => {
    if (!isViewDialogOpen) {
      setFormData(getInitialFormData());
    }
  }, [isViewDialogOpen]);

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      // 📦 Normalize items
      const normalizedItems: TransferRequestItem[] = formData.items
        .filter((item) => Number(item.quantity) > 0)
        .map((item) => ({
          itemCode: item.itemCode.trim().toUpperCase(),
          quantity: Math.max(Number(item.quantity) || 1, 1),
          unitType: item.unitType.trim().toUpperCase(),
        }));

      // 🛡️ Validate required fields
      if (
        !formData.requestingWarehouse ||
        !formData.sourceWarehouse ||
        !formData.transactionDate ||
        normalizedItems.length === 0
      ) {
        toast.error("Missing required fields or items");
        setIsCreating(false);
        return;
      }

      // 🧮 Construct payload
      const payload: Omit<
        TransferRequest,
        "_id" | "requestNo" | "status" | "createdAt" | "updatedAt"
      > = {
        requestingWarehouse: formData.requestingWarehouse.trim().toUpperCase(),
        sourceWarehouse: formData.sourceWarehouse.trim().toUpperCase(),
        transactionDate: new Date(formData.transactionDate),
        transferDate: formData.transferDate
          ? new Date(formData.transferDate)
          : undefined,
        reference: formData.reference?.trim() || "",
        notes: formData.notes?.trim() || "",
        preparedBy: formData.preparedBy.trim(),
        items: normalizedItems,
      };

      // 🧾 Log payload
      console.log("📦 Transfer request payload:", payload);

      // 🚀 Submit request
      const res = await fetch("/api/transfer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Transfer Request #${data.request.requestNo} created`);
        fetchTransferRequests();
        setIsCreateDialogOpen(false);
        setFormData(getInitialFormData()); // ✅ Modular reset
      } else {
        console.error("❌ Create failed:", data.error);
      }
    } catch (err) {
      console.error("❌ Create error:", err);
    } finally {
      setIsCreating(false);
    }
  };
  const normalizeTransferRequestItems = (
    items: TransferRequestItem[]
  ): TransferRequestItem[] =>
    items
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => ({
        itemCode: (item.itemCode ?? "").trim().toUpperCase(),
        quantity: Math.max(Number(item.quantity) || 1, 1),
        unitType: (item.unitType ?? "").trim().toUpperCase(),
      }));

  const handleEdit = (transferRequest: TransferRequest) => {
    const hydratedItems = normalizeTransferRequestItems(transferRequest.items);

    setFormData({
      requestNo: transferRequest.requestNo ?? "", // ✅ Include this
      requestingWarehouse: transferRequest.requestingWarehouse ?? "",
      sourceWarehouse: transferRequest.sourceWarehouse ?? "",
      transactionDate: transferRequest.transactionDate?.toString() ?? "",
      transferDate: transferRequest.transferDate?.toString() ?? "",
      reference: (transferRequest.reference ?? "").trim(),
      status: transferRequest.status,
      notes: (transferRequest.notes ?? "").trim(),
      preparedBy: (transferRequest.preparedBy ?? "").trim(),
      items:
        hydratedItems.length > 0
          ? hydratedItems
          : [{ itemCode: "", quantity: 1, unitType: "" }],
    });

    setSelectedTransferRequestId(transferRequest._id ?? null);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      // 📦 Normalize items
      const normalizedItems: TransferRequestItem[] = formData.items
        .filter((item) => Number(item.quantity) > 0)
        .map((item) => ({
          itemCode: item.itemCode.trim().toUpperCase(),
          quantity: Math.max(Number(item.quantity) || 1, 1),
          unitType: item.unitType.trim().toUpperCase(),
        }));

      // 🛡️ Validate required fields
      if (
        !formData.requestingWarehouse ||
        !formData.sourceWarehouse ||
        !formData.transactionDate ||
        normalizedItems.length === 0
      ) {
        toast.error("Missing required fields or items");
        setIsUpdating(false);
        return;
      }

      // 🧮 Construct payload
      const payload: Partial<TransferRequest> = {
        requestingWarehouse: formData.requestingWarehouse.trim().toUpperCase(),
        sourceWarehouse: formData.sourceWarehouse.trim().toUpperCase(),
        transactionDate: new Date(formData.transactionDate),
        transferDate: formData.transferDate
          ? new Date(formData.transferDate)
          : undefined,
        reference: formData.reference?.trim() || "",
        notes: formData.notes?.trim() || "",
        preparedBy: formData.preparedBy.trim(),
        items: normalizedItems,
      };

      // 🧾 Log payload
      console.log("✏️ Transfer request update payload:", payload);

      // 🚀 Submit update
      const res = await fetch(
        `/api/transfer-requests/${selectedTransferRequestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(`Transfer Request #${data.request.requestNo} updated`);
        fetchTransferRequests();
        setIsEditDialogOpen(false);
        setFormData({
          requestNo: "", // ✅ Include this
          requestingWarehouse: "",
          sourceWarehouse: "",
          transactionDate: "",
          transferDate: "",
          reference: "",
          status: "PENDING",
          notes: "",
          preparedBy: "",
          items: [{ itemCode: "", quantity: 1, unitType: "" }],
        });
      } else {
        console.error("❌ Update failed:", data.error);
      }
    } catch (err) {
      console.error("❌ Update error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleView = async (id: string) => {
    try {
      const res = await fetch(`/api/transfer-requests/${id}`);
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to fetch transfer request");
      }

      const data: TransferRequest = await res.json();

      const hydrated: TransferRequest = {
        _id: data._id,
        requestNo: data.requestNo ?? "",
        requestingWarehouse:
          data.requestingWarehouse?.trim().toUpperCase() ?? "",
        sourceWarehouse: data.sourceWarehouse?.trim().toUpperCase() ?? "",
        transactionDate: data.transactionDate ?? "",
        transferDate: data.transferDate ?? "",
        preparedBy: data.preparedBy?.trim() ?? "system",
        reference: data.reference?.trim() ?? "",
        notes: data.notes?.trim() ?? "",
        status: data.status ?? "pending",
        items: Array.isArray(data.items)
          ? data.items.map((item) => ({
              itemCode: item.itemCode?.trim().toUpperCase() ?? "",
              quantity: Math.max(Number(item.quantity) || 1, 1),
              unitType: item.unitType?.trim().toUpperCase() ?? "",
            }))
          : [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      setFormData(hydrated);
      setIsViewDialogOpen(true);
    } catch (err) {
      console.error("❌ View failed:", err);
      toast.error("Failed to load transfer request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transfer-requests/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Transfer Request #${data.requestNo ?? id} deleted`);
        fetchTransferRequests(); // ✅ Refresh list
      } else {
        console.error("❌ Delete failed:", data.error);
        toast.error(data.error || "Failed to delete transfer request");
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error("Internal error while deleting");
    }
  };

  const filteredTransferRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return TransferRequests.filter((req) => {
      const matchesSearch =
        req.requestNo?.toLowerCase().includes(query) ||
        req.sourceWarehouse?.toLowerCase().includes(query) ||
        req.requestingWarehouse?.toLowerCase().includes(query) ||
        req.preparedBy?.toLowerCase().includes(query) ||
        req.status?.toLowerCase().includes(query);

      const matchesDate =
        dateFilter === "" ||
        (req.transactionDate &&
          new Date(req.transactionDate).toISOString().split("T")[0] ===
            dateFilter);

      const matchesStatus =
        statusFilter === "all" || req.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [TransferRequests, searchTerm, dateFilter, statusFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredTransferRequests.length / rowsPerPage)),
    [filteredTransferRequests.length, rowsPerPage]
  );

  const clearFilters = () => {
    setDateFilter("");
    setStatusFilter("all");
    setSearchTerm("");
  };

  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    setPaginatedTransferRequests(filteredTransferRequests.slice(start, end));
  }, [filteredTransferRequests, currentPage, rowsPerPage]);

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
    const warehouse = formData.sourceWarehouse?.trim().toUpperCase();
    if (!warehouse) return;

    fetch(`/api/inventory-main?warehouse=${encodeURIComponent(warehouse)}`)
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        console.log("📦 Inventory items fetched:", items);
        console.log("📊 Total items:", items.length);
        setInventoryItems(items);
      })

      .catch((err) =>
        console.error("❌ Failed to fetch inventory items:", err)
      );
  }, [formData.sourceWarehouse]);

  useEffect(() => {
    const query = searchTerm.trim().toUpperCase();
    console.log("🔍 Search term:", query);
    console.log("📦 Inventory items available:", inventoryItems);

    if (!query || activeIndex === null) {
      console.log("⚠️ No query or no active index — skipping filter");
      setResults([]);
      return;
    }

    const filtered = inventoryItems
      .map((i) => i.itemCode)
      .filter((code) => code.toUpperCase().includes(query));

    console.log(`✅ Filtered item codes for row ${activeIndex}:`, filtered);
    setResults(filtered);
  }, [searchTerm, inventoryItems, activeIndex]);

  const handleDeleteMany = async (_ids: string[], onSuccess?: () => void) => {
    if (!_ids || _ids.length === 0) {
      toast.error("No transfer requests selected for deletion.");
      return;
    }

    try {
      setTransferRequests((prev) =>
        prev.filter((req) => !_ids.includes(String(req._id)))
      );

      const results = await Promise.allSettled(
        _ids.map(async (_id) => {
          const res = await fetch(`/api/transfer-requests/${_id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            const error = await res.json();
            console.warn(
              `❌ Failed to delete transfer request ${_id}:`,
              error.message
            );
            throw new Error(
              error.message || `Failed to delete transfer request ${_id}`
            );
          }

          return res;
        })
      );

      const failures = results.filter(
        (result) => result.status === "rejected"
      ) as PromiseRejectedResult[];

      if (failures.length > 0) {
        toast.warning(
          `Some transfer requests could not be deleted (${failures.length} failed).`
        );
      } else {
        toast.success("✅ Selected transfer requests deleted.");
      }

      setSelectedIds([]);
      onSuccess?.(); // 🔄 Refresh list
    } catch (err) {
      console.error("❌ Bulk delete failed:", err);
      toast.error("Failed to delete selected transfer requests.");
    }
  };

  // const toggleSelectAll = () => {
  //   const visibleIds = paginatedRequests
  //     .map((req) => req._id)
  //     .filter((id): id is string => typeof id === "string");

  //   const allSelected = visibleIds.every((id) => selectedIds.includes(id));
  //   setSelectedIds(
  //     allSelected ? [] : [...new Set([...selectedIds, ...visibleIds])]
  //   );
  // };

  // const toggleSelectOne = (id: string) => {
  //   setSelectedIds((prev) =>
  //     prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  //   );
  // };

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Transfer Requests</CardTitle>
              <CardDescription>Manage Transfer Requests</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search Request Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Transfer Request
            </Button>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Filter Label */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm">Filters:</Label>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="transfer-date-filter" className="text-sm">
                    Request Date:
                  </Label>
                  <Input
                    id="transfer-date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="transfer-status-filter" className="text-sm">
                    Status:
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: TransferRequest["status"] | "all") =>
                      setStatusFilter(value)
                    }>
                    <SelectTrigger className="w-32" id="transfer-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                ✅ {selectedIds.length} transfer request(s) selected
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
                  <TableHead className="w-4 px-2">
                    <Checkbox
                      checked={paginatedRequests
                        .map((req) => req._id)
                        .filter((id): id is string => typeof id === "string")
                        .every((id) => selectedIds.includes(id))}
                      onCheckedChange={(checked) => {
                        const visibleIds = paginatedRequests
                          .map((req) => req._id)
                          .filter((id): id is string => typeof id === "string"); // 🛡️ Type guard

                        setSelectedIds((prev) =>
                          checked === true
                            ? [...new Set([...prev, ...visibleIds])]
                            : prev.filter((id) => !visibleIds.includes(id))
                        );
                      }}
                      aria-label="Select all visible transfer requests"
                      className="ml-1"
                    />
                  </TableHead>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Request No</TableHead>
                  <TableHead>Requesting Warehouse</TableHead>
                  <TableHead>Source Warehouse</TableHead>
                  <TableHead>Prepared By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-sm">
                          Loading transfer requests…
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm">
                          {searchTerm
                            ? "No matching results"
                            : "No transfer requests found"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((req) => (
                    <TableRow key={req._id}>
                      <TableCell className="px-2">
                        <Checkbox
                          checked={selectedIds.includes(req._id ?? "")}
                          onCheckedChange={(checked) => {
                            const id = req._id;
                            if (!id) return; // 🛡️ Defensive guard

                            setSelectedIds((prev) =>
                              checked
                                ? [...prev, id]
                                : prev.filter((x) => x !== id)
                            );
                          }}
                          aria-label={`Select ${
                            req.requestNo || "Transfer Request"
                          }`}
                          className="ml-1"
                        />
                      </TableCell>
                      <TableCell>
                        {req.transactionDate
                          ? new Date(req.transactionDate).toLocaleDateString(
                              "en-PH",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>{req.requestNo ?? "—"}</TableCell>
                      <TableCell>{req.requestingWarehouse ?? "—"}</TableCell>
                      <TableCell>{req.sourceWarehouse ?? "—"}</TableCell>
                      <TableCell>{req.preparedBy ?? "—"}</TableCell>
                      <TableCell>
                        {req.status === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            APPROVED
                          </span>
                        ) : req.status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-600">
                            PENDING
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right flex gap-2 justify-end">
                        {/* 👁️ View Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(req._id!)}
                          title="View Transfer Request">
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* ✏️ Edit & 🗑️ Delete Buttons — only if status is pending */}
                        {req.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(req)}
                              title="Edit Transfer Request">
                              <Edit className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete Transfer Request"
                                  className="text-red-600 hover:text-red-800">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Transfer Request
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. Are you sure
                                    you want to permanently delete this transfer
                                    request?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                  <AlertDialogCancel asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </AlertDialogCancel>
                                  <AlertDialogAction asChild>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDelete(req._id!)}>
                                      Confirm Delete
                                    </Button>
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
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
                Transfer requests per page:
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
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogPanel className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Transfer Request</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Request Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Request No.</Label>
                <Input
                  value="Autogenerated"
                  disabled
                  className="text-muted-foreground"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Reference No.</Label>
                <Input
                  placeholder="Optional reference"
                  value={formData.reference ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reference: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Source Warehouse */}
              <div>
                <Label className="text-sm font-medium">
                  Request from Warehouse
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    autoComplete="off"
                    value={formData.sourceWarehouse || ""}
                    onClick={() => setShowSourceSuggestions(true)}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({
                        ...prev,
                        sourceWarehouse: value.toUpperCase(),
                      }));

                      setShowSourceSuggestions(true);
                    }}
                    onBlur={() =>
                      setTimeout(() => setShowSourceSuggestions(false), 200)
                    }
                    placeholder="Search warehouse"
                  />

                  {showSourceSuggestions && (
                    <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                      {(() => {
                        const input =
                          formData.sourceWarehouse?.trim().toUpperCase() || "";
                        const filtered = warehouses.filter((w) =>
                          w.warehouse_name?.trim().toUpperCase().includes(input)
                        );

                        return filtered.length > 0 ? (
                          filtered.map((w) => {
                            const label =
                              w.warehouse_name?.trim() || "Unnamed Warehouse";
                            const value = label.toUpperCase();
                            return (
                              <li
                                key={w._id || value}
                                className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sourceWarehouse: value,
                                  }));
                                  setShowSourceSuggestions(false);
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
              </div>

              {/* Destination Warehouse */}
              <div>
                <Label className="text-sm font-medium">
                  Destination Warehouse
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    autoComplete="off"
                    value={formData.requestingWarehouse || ""}
                    onClick={() => setShowDestinationSuggestions(true)}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({
                        ...prev,
                        requestingWarehouse: value,
                      }));
                      setShowDestinationSuggestions(true);
                    }}
                    onBlur={() =>
                      setTimeout(
                        () => setShowDestinationSuggestions(false),
                        200
                      )
                    }
                    placeholder="Search warehouse"
                  />

                  {showDestinationSuggestions && (
                    <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                      {(() => {
                        const input =
                          formData.requestingWarehouse?.trim().toUpperCase() ||
                          "";
                        const filtered = warehouses.filter((w) =>
                          w.warehouse_name?.trim().toUpperCase().includes(input)
                        );

                        return filtered.length > 0 ? (
                          filtered.map((w) => {
                            const label =
                              w.warehouse_name?.trim() || "Unnamed Warehouse";
                            const value = label.toUpperCase();
                            return (
                              <li
                                key={w._id || value}
                                className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    requestingWarehouse: value,
                                  }));
                                  setShowDestinationSuggestions(false);
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
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Transaction Date</Label>
                <Input
                  type="text"
                  value={
                    formData.transactionDate
                      ? new Date(formData.transactionDate).toLocaleDateString(
                          "en-PH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : ""
                  }
                  disabled
                  className="text-muted-foreground"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Transfer Date</Label>
                <Input
                  type="date"
                  value={
                    formData.transferDate
                      ? new Date(formData.transferDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      transferDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Prepared By & Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Prepared By</Label>
                <Input
                  value="Lemuel"
                  disabled
                  className="text-muted-foreground"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <Input
                  placeholder="Optional notes"
                  value={formData.notes ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="border rounded-md overflow-visible">
                {/* Header */}
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 bg-primary text-primary-foreground py-2 px-2 rounded-t text-xs font-semibold uppercase">
                  <div className="text-start">Item Code</div>
                  <div className="text-end">Qty</div>
                  <div className="text-end">UOM</div>
                  <div className="text-end">Action</div>
                </div>

                {/* Item Rows */}
                {formData.items.map((item, index) => {
                  const normalizedCode = item.itemCode?.trim().toUpperCase();
                  const inventoryMatch = inventoryItems.find(
                    (i) => i.itemCode?.trim().toUpperCase() === normalizedCode
                  );
                  const maxQty = inventoryMatch?.quantity || 1;
                  const unitType = inventoryMatch?.unitType || "";

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 items-center border-t px-2 py-2 text-sm">
                      {/* 🔍 Item Code Input */}
                      <div className="space-y-1 relative w-full">
                        <Input
                          id={`item-code-${index}`}
                          type="text"
                          autoComplete="off"
                          value={normalizedCode}
                          placeholder="Search item code"
                          onFocus={() => setShowItemSuggestions(index)}
                          onBlur={() =>
                            setTimeout(() => setShowItemSuggestions(null), 200)
                          }
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().trim();
                            const updated = [...formData.items];
                            updated[index].itemCode = value;
                            setFormData((prev) => ({
                              ...prev,
                              items: updated,
                            }));
                            setShowItemSuggestions(index);
                          }}
                          className="text-sm uppercase w-full px-2 py-1 pr-8 border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                        />

                        {/* 🔍 Icon */}
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* 📜 Suggestions */}
                        {showItemSuggestions === index && (
                          <div className="absolute top-full mt-1 w-full z-50">
                            <ul className="bg-white border border-border rounded-md shadow-lg max-h-[7.5rem] overflow-y-auto text-sm">
                              {/* Each item is ~2.5rem tall → 3 items = 7.5rem max height */}
                              {inventoryItems
                                .filter((option) => {
                                  const code = option.itemCode
                                    ?.trim()
                                    .toUpperCase();
                                  const isSelected = formData.items.some(
                                    (itm, i) =>
                                      i !== index &&
                                      itm.itemCode?.trim().toUpperCase() ===
                                        code
                                  );
                                  return (
                                    option.warehouse?.trim().toUpperCase() ===
                                      formData.sourceWarehouse
                                        ?.trim()
                                        .toUpperCase() &&
                                    code?.includes(
                                      item.itemCode?.toUpperCase() || ""
                                    ) &&
                                    !isSelected
                                  );
                                })
                                .map((option) => {
                                  const code = option.itemCode
                                    ?.trim()
                                    .toUpperCase();
                                  return (
                                    <li
                                      key={option._id || code}
                                      className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                      onMouseDown={() => {
                                        const updated = [...formData.items];
                                        updated[index] = {
                                          ...updated[index],
                                          itemCode: code,
                                          unitType: option.unitType || "",
                                          quantity: Math.min(
                                            updated[index].quantity || 1,
                                            option.quantity || 1
                                          ),
                                        };
                                        setFormData((prev) => ({
                                          ...prev,
                                          items: updated,
                                        }));
                                        setShowItemSuggestions(null);
                                      }}>
                                      {code}
                                    </li>
                                  );
                                })}

                              {/* 🧭 Fallback */}
                              {inventoryItems.filter(
                                (option) =>
                                  option.warehouse?.trim().toUpperCase() ===
                                    formData.sourceWarehouse
                                      ?.trim()
                                      .toUpperCase() &&
                                  option.itemCode
                                    ?.trim()
                                    .toUpperCase()
                                    .includes(
                                      item.itemCode?.toUpperCase() || ""
                                    )
                              ).length === 0 && (
                                <li className="px-3 py-2 text-muted-foreground">
                                  No matching items found
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* 🔢 Quantity */}
                      <div>
                        <Input
                          type="number"
                          min={1}
                          max={maxQty}
                          value={item.quantity}
                          onChange={(e) => {
                            const raw = Number(e.target.value) || 1;
                            const clamped = Math.max(raw, 1);
                            const updated = [...formData.items];
                            updated[index].quantity = Math.min(clamped, maxQty);
                            setFormData((prev) => ({
                              ...prev,
                              items: updated,
                            }));
                          }}
                          className="text-end"
                        />
                      </div>

                      {/* 📏 UOM */}
                      <div>
                        <Input
                          placeholder="UOM"
                          value={unitType}
                          readOnly
                          className="text-end bg-muted cursor-not-allowed"
                        />
                      </div>

                      {/* 🗑️ Remove */}
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => {
                            const updated = formData.items.filter(
                              (_, i) => i !== index
                            );
                            setFormData((prev) => ({
                              ...prev,
                              items: updated,
                            }));
                          }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Item Row */}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    items: [
                      ...prev.items,
                      { itemCode: "", quantity: 1, unitType: "" },
                    ],
                  }))
                }>
                + Add Item
              </Button>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isCreating ? "Creating…" : "Create Request"}
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogPanel className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              Edit Transfer Request
            </DialogTitle>
          </DialogHeader>

          {/* 🧭 Transaction Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1 col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Request No.
              </Label>
              <Input value={formData.requestNo ?? ""} readOnly disabled />
            </div>

            <div className="space-y-1">
              <div className="space-y-1 relative">
                <Label className="text-sm font-medium text-muted-foreground">
                  Request from Warehouse
                </Label>
                <Input
                  type="text"
                  autoComplete="off"
                  value={formData.requestingWarehouse}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setFormData((prev) => ({
                      ...prev,
                      requestingWarehouse: value,
                    }));
                    setShowDestinationSuggestions(true);
                  }}
                  onFocus={() => setShowDestinationSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowDestinationSuggestions(false), 200)
                  }
                  placeholder="Search warehouse"
                />

                {showDestinationSuggestions && (
                  <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                    {(() => {
                      const input = formData.requestingWarehouse
                        .trim()
                        .toUpperCase();
                      const filtered = warehouses.filter((w) =>
                        w.warehouse_name?.trim().toUpperCase().includes(input)
                      );

                      return filtered.length > 0 ? (
                        filtered.map((w) => {
                          const label =
                            w.warehouse_name?.trim() || "Unnamed Warehouse";
                          const value = label.toUpperCase();
                          return (
                            <li
                              key={w._id || value}
                              className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                              onMouseDown={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  requestingWarehouse: value,
                                }));
                                setShowDestinationSuggestions(false);
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
            </div>
            <div className="space-y-1">
              <div className="space-y-1 relative">
                <Label className="text-sm font-medium text-muted-foreground">
                  Destination Warehouse
                </Label>
                <Input
                  type="text"
                  autoComplete="off"
                  value={formData.sourceWarehouse}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setFormData((prev) => ({
                      ...prev,
                      sourceWarehouse: value,
                    }));
                    setShowSourceSuggestions(true);
                  }}
                  onFocus={() => setShowSourceSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSourceSuggestions(false), 200)
                  }
                  placeholder="Search warehouse"
                />

                {showSourceSuggestions && (
                  <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm transition-all duration-150 ease-out scale-95 opacity-95">
                    {(() => {
                      const input = formData.sourceWarehouse
                        .trim()
                        .toUpperCase();
                      const filtered = warehouses.filter((w) =>
                        w.warehouse_name?.trim().toUpperCase().includes(input)
                      );

                      return filtered.length > 0 ? (
                        filtered.map((w) => {
                          const label =
                            w.warehouse_name?.trim() || "Unnamed Warehouse";
                          const value = label.toUpperCase();
                          return (
                            <li
                              key={w._id || value}
                              className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                              onMouseDown={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  sourceWarehouse: value,
                                }));
                                setShowSourceSuggestions(false);
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
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Transaction Date
              </Label>
              <Input
                type="date"
                value={
                  formData.transactionDate
                    ? new Date(formData.transactionDate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                readOnly
                disabled
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Transfer Date
              </Label>
              <Input
                type="date"
                value={
                  formData.transferDate
                    ? new Date(formData.transferDate)
                        .toISOString()
                        .split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    transferDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* 🧑‍💼 Personnel Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Prepared By
              </Label>
              <Input value={formData.preparedBy ?? ""} readOnly disabled />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Reference
              </Label>
              <Input
                value={formData.reference ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* 📝 Notes */}
          <div className="space-y-1 mb-4">
            <label className="text-sm font-medium text-muted-foreground">
              Notes
            </label>
            <Textarea
              value={formData.notes ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
            />
          </div>

          {/* 📦 Transfer Items */}
          <div className="space-y-2">
            <div className="border rounded-md overflow-visible">
              {/* Header */}
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 bg-primary text-primary-foreground py-2 px-2 rounded-t text-xs font-semibold uppercase">
                <div className="text-start">Item Code</div>
                <div className="text-end">Qty</div>
                <div className="text-end">UOM</div>
                <div className="text-end">Action</div>
              </div>

              {/* Editable Rows */}
              {formData.items.map((item, index) => {
                const normalizedCode = item.itemCode?.trim().toUpperCase();
                const inventoryMatch = inventoryItems.find(
                  (i) => i.itemCode?.trim().toUpperCase() === normalizedCode
                );
                const maxQty = inventoryMatch?.quantity || 1;
                const unitType = inventoryMatch?.unitType || "";

                return (
                  <div
                    key={index}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 items-center border-t px-2 py-2 text-sm">
                    {/* 🔍 Item Code Live Search */}
                    <div className="relative w-full">
                      <Input
                        value={normalizedCode}
                        autoComplete="off"
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().trim();
                          const updated = [...formData.items];
                          updated[index].itemCode = value;
                          setFormData((prev) => ({ ...prev, items: updated }));
                          setShowItemSuggestions(index);
                        }}
                        onFocus={() => setShowItemSuggestions(index)}
                        onBlur={() =>
                          setTimeout(() => setShowItemSuggestions(null), 200)
                        }
                        placeholder="Search item code"
                        className="text-sm uppercase w-full px-2 py-1 pr-8"
                      />

                      {/* 🔎 Icon */}
                      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* 🔽 Suggestions */}
                      {showItemSuggestions === index && (
                        <ul className="absolute top-full mt-1 w-full z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto text-sm">
                          {inventoryItems
                            .filter((option) => {
                              const code = option.itemCode
                                ?.trim()
                                .toUpperCase();
                              const isSelected = formData.items.some(
                                (itm, i) =>
                                  i !== index &&
                                  itm.itemCode?.trim().toUpperCase() === code
                              );
                              return (
                                option.warehouse?.trim().toUpperCase() ===
                                  formData.sourceWarehouse
                                    ?.trim()
                                    .toUpperCase() &&
                                code?.includes(normalizedCode) &&
                                !isSelected
                              );
                            })
                            .map((option) => {
                              const code = option.itemCode
                                ?.trim()
                                .toUpperCase();
                              return (
                                <li
                                  key={option._id || code}
                                  className="px-3 py-2 hover:bg-accent cursor-pointer"
                                  onMouseDown={() => {
                                    const updated = [...formData.items];
                                    updated[index] = {
                                      ...updated[index],
                                      itemCode: code,
                                      unitType: option.unitType || "",
                                      quantity: Math.min(
                                        updated[index].quantity || 1,
                                        option.quantity || 1
                                      ),
                                    };
                                    setFormData((prev) => ({
                                      ...prev,
                                      items: updated,
                                    }));
                                    setShowItemSuggestions(null);
                                  }}>
                                  {code}
                                </li>
                              );
                            })}
                          {inventoryItems.filter(
                            (option) =>
                              option.warehouse?.trim().toUpperCase() ===
                                formData.sourceWarehouse
                                  ?.trim()
                                  .toUpperCase() &&
                              option.itemCode
                                ?.trim()
                                .toUpperCase()
                                .includes(normalizedCode)
                          ).length === 0 && (
                            <li className="px-3 py-2 text-muted-foreground">
                              No matching items found
                            </li>
                          )}
                        </ul>
                      )}
                    </div>

                    {/* 🔢 Quantity */}
                    <Input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={item.quantity}
                      onChange={(e) => {
                        const value = Math.max(Number(e.target.value) || 1, 1);
                        const updated = [...formData.items];
                        updated[index].quantity = Math.min(value, maxQty);
                        setFormData((prev) => ({ ...prev, items: updated }));
                      }}
                      className="text-end"
                    />

                    {/* 📏 UOM */}
                    <Input
                      value={unitType}
                      readOnly
                      className="text-end bg-muted cursor-not-allowed"
                    />

                    {/* 🗑️ Remove */}
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          const updated = formData.items.filter(
                            (_, i) => i !== index
                          );
                          setFormData((prev) => ({ ...prev, items: updated }));
                        }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ➕ Add Item */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  items: [
                    ...prev.items,
                    { itemCode: "", quantity: 1, unitType: "" },
                  ],
                }))
              }>
              + Add Item
            </Button>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex items-center gap-1">
              {isUpdating ? "Updating…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {" "}
              View Transfer Request
            </DialogTitle>
          </DialogHeader>

          {/* 🧾 Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold text-primary tracking-wide">
                Transfer Request
              </h2>
              <p className="text-sm text-muted-foreground">
                Request No.
                <span className=" text-foreground font-semibold">
                  {formData.requestNo ?? "—"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Reference:
                <span className="text-foreground font-semibold">
                  {formData.reference ?? "—"}
                </span>
              </p>
            </div>
            <div className="text-sm text-right text-muted-foreground">
              <p>
                Transaction Date:{" "}
                <span className="text-foreground">
                  {formData.transactionDate
                    ? new Date(formData.transactionDate).toLocaleDateString(
                        "en-PH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : "—"}
                </span>
              </p>
              <p>
                Transfer Date:{" "}
                <span className="text-foreground">
                  {formData.transferDate
                    ? new Date(formData.transferDate).toLocaleDateString(
                        "en-PH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : "—"}
                </span>
              </p>
              <p>
                Status:{" "}
                <span
                  className={`font-semibold ${
                    formData?.status === "APPROVED"
                      ? "text-green-600"
                      : formData?.status === "PENDING"
                      ? "text-yellow-600"
                      : formData?.status === "REJECTED"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}>
                  {formData.status ?? "—"}
                </span>
              </p>
            </div>
          </div>

          {/* 🏢 Supplier & Warehouse Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium text-muted-foreground">
                  Requesting Warehouse:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.requestingWarehouse ?? "—"}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Prepared By:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.preparedBy ?? "—"}
                </span>
              </p>
            </div>

            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium text-muted-foreground">
                  Source Warehouse:
                </span>{" "}
                <span className="text-foreground font-semibold">
                  {formData.sourceWarehouse ?? "—"}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  Notes:
                </span>{" "}
                <span>
                  {formData.notes?.trim() ? (
                    formData.notes
                  ) : (
                    <em>No notes provided</em>
                  )}
                </span>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full text-sm border border-border rounded-md overflow-hidden">
              <thead className="bg-muted text-muted-foreground uppercase text-[11px] tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-left">UOM</th>
                </tr>
              </thead>
              <tbody>
                {formData?.items?.map((item, index) => {
                  const isZero = item.quantity === 0;

                  return (
                    <tr
                      key={index}
                      className={`border-t transition-colors duration-150 ${
                        isZero
                          ? "bg-green-50 text-green-700 animate-fade-in"
                          : "even:bg-muted/5 hover:bg-accent/20 hover:ring-1 hover:ring-accent/50"
                      }`}>
                      <td className="px-4 py-2">
                        {item.itemCode || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.quantity ?? (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {item.unitType || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
