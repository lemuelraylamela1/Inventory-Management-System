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

import { Button } from "../ui/button";
import { Input } from "../ui/input";

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
  const [availableItemCodes, setAvailableItemCodes] = useState<string[]>([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
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
  const [formData, setFormData] = useState<
    Omit<TransferRequest, "_id" | "requestNo" | "status">
  >({
    date: new Date().toISOString(),
    requestingWarehouse: "",
    sourceWarehouse: "",
    transactionDate: "",
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

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      // 📦 Normalize items
      const normalizedItems: TransferRequestItem[] = formData.items
        .filter((item) => Number(item.quantity) > 0)
        .map((item) => ({
          itemCode: item.itemCode.trim().toUpperCase(),
          quantity: Math.max(Number(item.quantity) || 1, 1),
          unitType: item.unitType.trim().toUpperCase(), // ✅ align with backend
        }));

      // 🛡️ Validate required fields (mirror backend)
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
        date: new Date(),
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

      // 🧾 Log payload for validation
      console.log("📦 Transfer request payload:", payload);

      // 🚀 Submit request
      const res = await fetch("/api/transfer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // ✅ Success
      if (res.ok) {
        toast.success(`Transfer Request #${data.request.requestNo} created`);
        fetchTransferRequests();
        setIsCreateDialogOpen(false);
        setFormData({
          date: "",
          requestingWarehouse: "",
          sourceWarehouse: "",
          transactionDate: "",
          transferDate: "",
          reference: "",
          notes: "",
          preparedBy: "",
          items: [{ itemCode: "", quantity: 1, unitType: "" }],
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
              New Invoice
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
                {/* <Button variant="destructive" onClick={() => handleDeleteMany(selectedIds)}>
        Delete Selected
      </Button> */}
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
                  <TableHead>Date</TableHead>
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
                      colSpan={7}
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
                      colSpan={7}
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
                      <TableCell>{req.status}</TableCell>
                      {/* <TableCell className="text-right">
          <button
            className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
            onClick={() => handleDelete(req._id!)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </TableCell> */}
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
                  value={new Date().toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  disabled
                  className="text-muted-foreground"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Transfer Date</Label>
                <Input
                  type="date"
                  value={formData.transactionDate.toString()}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      transactionDate: e.target.value,
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
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 items-center border-t px-2 py-2 text-sm">
                    {/* Item Code Live Search */}
                    <div className="relative w-full">
                      <Input
                        id={`item-code-${index}`}
                        type="text"
                        autoComplete="off"
                        value={item.itemCode || ""}
                        onClick={() => setShowItemSuggestions(index)}
                        onBlur={() =>
                          setTimeout(() => setShowItemSuggestions(null), 200)
                        }
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().trim();

                          setFormData((prev) => {
                            const updatedItems = [...prev.items];
                            updatedItems[index] = {
                              ...updatedItems[index],
                              itemCode: value,
                            };
                            return { ...prev, items: updatedItems };
                          });

                          setShowItemSuggestions(index);
                        }}
                        placeholder="Search item code"
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
                          {inventoryItems
                            .filter((option) =>
                              option.itemCode
                                ?.trim()
                                .toUpperCase()
                                .includes(item.itemCode?.toUpperCase() || "")
                            )
                            .map((option) => {
                              const normalized = option.itemCode
                                ?.trim()
                                .toUpperCase();
                              return (
                                <li
                                  key={option._id || normalized}
                                  className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                  onClick={() => {
                                    const maxQty = option.quantity || 1;

                                    setFormData((prev) => {
                                      const updatedItems = [...prev.items];
                                      updatedItems[index] = {
                                        ...updatedItems[index],
                                        itemCode: normalized,
                                        unitType: option.unitType || "",
                                        quantity: Math.min(
                                          updatedItems[index]?.quantity || 1,
                                          maxQty
                                        ),
                                      };
                                      return { ...prev, items: updatedItems };
                                    });

                                    setShowItemSuggestions(null);
                                  }}>
                                  {normalized}
                                </li>
                              );
                            })}
                          {inventoryItems.filter((option) =>
                            option.itemCode
                              ?.trim()
                              .toUpperCase()
                              .includes(item.itemCode?.toUpperCase() || "")
                          ).length === 0 && (
                            <li className="px-3 py-2 text-muted-foreground">
                              No matching items found
                            </li>
                          )}
                        </ul>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <Input
                        type="number"
                        min={1}
                        max={
                          inventoryItems.find(
                            (i) => i.itemCode === item.itemCode
                          )?.quantity || 1
                        }
                        value={item.quantity}
                        onChange={(e) => {
                          const value = Math.max(
                            Number(e.target.value) || 1,
                            1
                          );
                          const maxQty =
                            inventoryItems.find(
                              (i) => i.itemCode === item.itemCode
                            )?.quantity || 1;

                          setFormData((prev) => {
                            const updatedItems = [...prev.items];
                            updatedItems[index].quantity = Math.min(
                              value,
                              maxQty
                            );
                            return { ...prev, items: updatedItems };
                          });
                        }}
                        className="text-end"
                      />
                    </div>

                    {/* UOM */}
                    <div>
                      <Input
                        placeholder="UOM"
                        value={
                          inventoryItems.find(
                            (i) => i.itemCode === item.itemCode
                          )?.unitType || ""
                        }
                        readOnly
                        className="text-end bg-muted cursor-not-allowed"
                      />
                    </div>

                    {/* Action */}
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
                ))}
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
    </div>
  );
}
