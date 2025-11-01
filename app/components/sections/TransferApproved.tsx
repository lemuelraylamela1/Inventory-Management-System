"use client";
import { useState, useMemo, useEffect, useRef } from "react";
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
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

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
  Dialog,
  DialogTrigger,
  DialogPanel,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";

import { TransferApproval } from "./type";
import { TransferRequest } from "@/models/transferRequest";
import { TransferRequestItem } from "./type";

export default function TransferApproved() {
  const [transferApprovals, setTransferApprovals] = useState<
    TransferApproval[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paginatedApprovals, setPaginatedTransferApprovals] = useState<
    TransferApproval[]
  >([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /* Filter and Pagination State */
  const clearFilters = () => {
    setDateFilter("");
    setStatusFilter("all");
    setSearchTerm("");
  };

  const filteredTransferApprovals = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transferApprovals.filter((approval) => {
      const matchesSearch =
        approval.transferRequestNo?.toLowerCase().includes(query) ||
        approval.approvedBy?.toLowerCase().includes(query) ||
        approval.status?.toLowerCase().includes(query);

      const matchesDate =
        dateFilter === "" ||
        (approval.approvedDate &&
          new Date(approval.approvedDate).toISOString().split("T")[0] ===
            dateFilter);

      const matchesStatus =
        statusFilter === "all" || approval.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [transferApprovals, searchTerm, dateFilter, statusFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    setPaginatedTransferApprovals(filteredTransferApprovals.slice(start, end));
  }, [filteredTransferApprovals, currentPage, rowsPerPage]);

  const totalPages = useMemo(
    () =>
      Math.max(1, Math.ceil(filteredTransferApprovals.length / rowsPerPage)),
    [filteredTransferApprovals.length, rowsPerPage]
  );

  /* CRUD Handlers */
  const [isLoading, setIsLoading] = useState(false);
  // const fetchTransferApprovals = async () => {
  //   setIsLoading(true);
  //   try {
  //     const res = await fetch("/api/transfer-approval");
  //     if (!res.ok) throw new Error("Failed to fetch transfer approvals");

  //     const data: TransferApproval[] = await res.json();
  //     setTransferApprovals(data);
  //   } catch (error: unknown) {
  //     const message =
  //       error instanceof Error ? error.message : "Unexpected error occurred.";
  //     toast.error(message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchTransferApprovals();
  // }, []);

  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>(
    []
  );
  const [paginatedRequests, setPaginatedTransferRequests] = useState<
    TransferRequest[]
  >([]);
  const isFirstFetch = useRef(true);

  const fetchTransferRequests = async () => {
    if (isFirstFetch.current) {
      console.log("🔄 Initial fetch started...");
      setIsLoading(true);
    } else {
      console.log("🔁 Silent refetch triggered...");
    }

    try {
      const res = await fetch("/api/transfer-requests", {
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(`❌ HTTP error: ${res.status} ${res.statusText}`);
        return;
      }

      const data = await res.json();
      console.log("📦 Raw response data:", data);

      const requests = data.requests || [];
      console.log(`✅ Parsed ${requests.length} transfer requests`);
      console.table(requests.slice(0, 5)); // Show first 5 for inspection

      setTransferRequests(requests);
    } catch (err) {
      console.error("❌ Failed to fetch transfer requests:", err);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
        console.log("✅ Initial fetch complete");
      }
    }
  };

  useEffect(() => {
    const pageSize = 10;
    const currentPage = 1; // or use state if paginated

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    setPaginatedTransferRequests(transferRequests.slice(start, end));
  }, [transferRequests]);

  useEffect(() => {
    fetchTransferRequests(); // initial fetch

    const intervalId = setInterval(fetchTransferRequests, 1000); // silent refetch
    return () => clearInterval(intervalId);
  }, []);

  const [viewedRequest, setViewedRequest] =
    useState<TransferRequestHydrated | null>(null);

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  type TransferRequestHydrated = {
    _id: string;
    requestNo: string;
    requestingWarehouse: string;
    sourceWarehouse: string;
    transactionDate: string;
    transferDate?: string;
    preparedBy: string;
    reference: string;
    notes: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    items: {
      itemCode: string;
      quantity: number;
      unitType: string;
    }[];
  };

  const handleView = async (id: string) => {
    console.log(`🔍 Fetching transfer request: ${id}`);

    try {
      const res = await fetch(`/api/transfer-requests/${id}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to fetch transfer request");
      }

      const data = await res.json();
      console.log("📦 Raw transfer request:", data);

      const hydrated: TransferRequestHydrated = {
        _id: data._id,
        requestNo: data.requestNo ?? "",
        requestingWarehouse:
          data.requestingWarehouse?.trim().toUpperCase() ?? "",
        sourceWarehouse: data.sourceWarehouse?.trim().toUpperCase() ?? "",
        transactionDate: data.transactionDate ?? "",
        transferDate: data.transferDate ?? undefined,
        preparedBy: data.preparedBy?.trim() ?? "system",
        reference: data.reference?.trim() ?? "",
        notes: data.notes?.trim() ?? "",
        status: data.status ?? "PENDING",
        items: Array.isArray(data.items)
          ? data.items.map((item: TransferRequestItem) => ({
              itemCode: item.itemCode?.trim().toUpperCase() ?? "",
              quantity: Math.max(Number(item.quantity) || 1, 1),
              unitType: item.unitType?.trim().toUpperCase() ?? "",
            }))
          : [],
      };

      console.log("✅ Hydrated transfer request:", hydrated);
      setViewedRequest(hydrated); // ✅ Store the data
      setIsViewDialogOpen(true); // ✅ Trigger the dialog
    } catch (err) {
      console.error("❌ View failed:", err);
      toast.error("Failed to load transfer request");
    }
  };

  const handleApprove = async (id: string) => {
    console.log(`✅ Approving transfer request: ${id}`);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/transfer-requests/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to approve transfer request");
      }

      const result = await res.json();
      console.log("📦 Transfer request approved:", result);

      toast.success("Transfer request approved");
      fetchTransferRequests(); // Refresh data
    } catch (err) {
      console.error("❌ Approval failed:", err);
      toast.error("Failed to approve transfer request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    console.log(`❌ Rejecting transfer request: ${id}`);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/transfer-requests/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to reject transfer request");
      }

      const result = await res.json();
      console.log("🚫 Transfer request rejected:", result);

      toast.success("Transfer request rejected");
      fetchTransferRequests(); // Refresh table
    } catch (err) {
      console.error("❌ Rejection failed:", err);
      toast.error("Failed to reject transfer request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Transfer Approval</CardTitle>
              <CardDescription>Manage Transfer Approvals</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            {/* 🔍 Search by Transfer Request No */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search Transfer Request No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* ➕ New Transfer Approval */}
            {/* <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Transfer Approval
            </Button> */}
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* 🧭 Filter Label */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm">Filters:</Label>
                </div>

                {/* 📅 Approval Date Filter */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="approval-date-filter" className="text-sm">
                    Approval Date:
                  </Label>
                  <Input
                    id="approval-date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40"
                  />
                </div>

                {/* 📌 Status Filter */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="approval-status-filter" className="text-sm">
                    Status:
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(
                      value: TransferApproval["status"] | "all"
                    ) => setStatusFilter(value)}>
                    <SelectTrigger className="w-32" id="approval-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 🧼 Clear Filters */}
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {/* {selectedIds.length > 0 && (
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
          )} */}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer Request No</TableHead>
                  <TableHead>From Warehouse</TableHead>
                  <TableHead>To Warehouse</TableHead>
                  <TableHead>Date Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
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
                )}

                {!isLoading && paginatedRequests.length === 0 && (
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
                )}

                {!isLoading &&
                  paginatedRequests.map((req) => {
                    const id = req._id;
                    if (typeof id !== "string") return null;

                    return (
                      <TableRow key={id}>
                        <TableCell>{req.requestNo ?? "—"}</TableCell>
                        <TableCell>{req.requestingWarehouse ?? "—"}</TableCell>
                        <TableCell>{req.sourceWarehouse ?? "—"}</TableCell>
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
                          {/* 👁️ View */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(req._id as string)}
                            title="View Transfer Request">
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* ✅ Approve & ❌ Reject — only if status is pending */}
                          {req.status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(req._id as string)}
                                className="text-green-700 border-green-300 hover:bg-green-50">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(req._id as string)}
                                className="text-red-700 border-red-300 hover:bg-red-50">
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mt-4">
            {/* 📊 Rows per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Transfer approvals per page:
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

            {/* 🔁 Pagination controls */}
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
      {viewedRequest && (
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
                    {viewedRequest.requestNo ?? "—"}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Reference:
                  <span className="text-foreground font-semibold">
                    {viewedRequest.reference ?? "—"}
                  </span>
                </p>
              </div>
              <div className="text-sm text-right text-muted-foreground">
                <p>
                  Transaction Date:{" "}
                  <span className="text-foreground">
                    {viewedRequest.transactionDate
                      ? new Date(
                          viewedRequest.transactionDate
                        ).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </p>
                <p>
                  Transfer Date:{" "}
                  <span className="text-foreground">
                    {viewedRequest.transferDate
                      ? new Date(viewedRequest.transferDate).toLocaleDateString(
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
                      viewedRequest?.status === "APPROVED"
                        ? "text-green-600"
                        : viewedRequest?.status === "PENDING"
                        ? "text-yellow-600"
                        : viewedRequest?.status === "REJECTED"
                        ? "text-red-600"
                        : "text-muted-foreground"
                    }`}>
                    {viewedRequest.status ?? "—"}
                  </span>
                </p>
              </div>
            </div>

            {/* 🏢 Supplier & Warehouse Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium text-muted-foreground">
                    From Warehouse:
                  </span>{" "}
                  <span className="text-foreground font-semibold">
                    {viewedRequest.sourceWarehouse ?? "—"}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Prepared By:
                  </span>{" "}
                  <span className="text-foreground font-semibold">
                    {viewedRequest.preparedBy ?? "—"}
                  </span>
                </p>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium text-muted-foreground">
                    To Warehouse:
                  </span>{" "}
                  <span className="text-foreground font-semibold">
                    {viewedRequest.requestingWarehouse ?? "—"}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Notes:
                  </span>{" "}
                  <span>
                    {viewedRequest.notes?.trim() ? (
                      viewedRequest.notes
                    ) : (
                      <em>No notes provided</em>
                    )}
                  </span>
                </p>
              </div>
            </div>

            {/* 📦 Items Table */}
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
                  {viewedRequest?.items?.map((item, index) => {
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
      )}
    </div>
  );
}
