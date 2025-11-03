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

import type { AtcCode } from "./type";
export default function AtcCodes() {
  const [atcCodes, setAtcCodes] = useState<AtcCode[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AtcCode>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredAtcCodes = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return atcCodes.filter((atc) => {
      const code = atc.atcCode?.toLowerCase() || "";
      const tax = atc.taxCode?.toLowerCase() || "";
      const desc = atc.description?.toLowerCase() || "";
      return (
        code.includes(query) || tax.includes(query) || desc.includes(query)
      );
    });
  }, [atcCodes, searchTerm]);

  const totalPages = Math.ceil(filteredAtcCodes.length / rowsPerPage);

  const paginatedAtcCodes: AtcCode[] = filteredAtcCodes.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const isFirstFetch = useRef(true);

  const refreshAtcCodeList = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/atc-codes");
      const data = await res.json();
      setAtcCodes(data);
    } catch (err) {
      console.error("Failed to fetch ATC codes", err);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    refreshAtcCodeList(); // Initial fetch

    const interval = setInterval(() => {
      refreshAtcCodeList();
    }, 1000); // 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const resetForm = () => {
    setFormData({});
  };

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

  const handleCreate = async (formData: Partial<AtcCode>) => {
    const payload: Partial<AtcCode> = {
      atcCode: formData.atcCode?.trim() || "",
      taxRate: formData.taxRate ?? 0,
      taxCode: formData.taxCode?.trim() || "",
      description: formData.description?.trim() || "",
      ewt: formData.ewt ?? 0,
      cwt: formData.cwt ?? 0,
      status: formData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    };

    try {
      const res = await fetch("/api/atc-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create ATC code");

      const created = await res.json();
      console.log("ATC code created:", created);

      await refreshAtcCodeList();
      setIsCreateDialogOpen(false);
      setFormData({});
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleEdit = (atc: AtcCode) => {
    setFormData({
      _id: atc._id,
      atcCode: atc.atcCode ?? "",
      taxRate: atc.taxRate ?? 0,
      taxCode: atc.taxCode ?? "",
      description: atc.description ?? "",
      ewt: atc.ewt ?? 0,
      cwt: atc.cwt ?? 0,
      status: atc.status ?? "ACTIVE",
    });

    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (formData: Partial<AtcCode>) => {
    if (!formData._id) return console.warn("Missing ATC ID for update");

    const payload: Partial<AtcCode> = {
      atcCode: formData.atcCode?.trim() || "",
      taxRate: formData.taxRate ?? 0,
      taxCode: formData.taxCode?.trim() || "",
      description: formData.description?.trim() || "",
      ewt: formData.ewt ?? 0,
      cwt: formData.cwt ?? 0,
      status: formData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    };

    try {
      const res = await fetch(`/api/atc-codes/${formData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update ATC code");

      const updated = await res.json();
      console.log("ATC code updated:", updated);

      await refreshAtcCodeList();
      setIsEditDialogOpen(false);
      setFormData({});
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDelete = async (atcId: string) => {
    if (!atcId) return console.warn("Missing ATC ID for deletion");

    try {
      const res = await fetch(`/api/atc-codes/${atcId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete ATC code");

      console.log("ATC code deleted:", atcId);
      await refreshAtcCodeList();
      setSelectedIds((prev) => prev.filter((id) => id !== atcId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleView = async (atcId: string) => {
    if (!atcId) return console.warn("Missing ATC ID for view");

    try {
      const res = await fetch(`/api/atc-codes/${atcId}`);
      if (!res.ok) throw new Error("Failed to fetch ATC code details");

      const atc = await res.json();
      console.log("ATC code details:", atc);

      setFormData(atc);
      setIsViewDialogOpen(true);
    } catch (err) {
      console.error("View error:", err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>ATC Codes</CardTitle>
            <CardDescription>Manage ATC codes</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Create */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search ATC Code, Tax Code, or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New ATC Code
          </Button>
        </div>

        {/* Table */}
        <ScrollArea className="max-h-[500px] overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-4 px-2">
                  <Checkbox
                    checked={paginatedAtcCodes
                      .map((a) => a._id)
                      .filter((id): id is string => typeof id === "string")
                      .every((id) => selectedIds.includes(id))}
                    onCheckedChange={(checked) => {
                      const visibleIds = paginatedAtcCodes
                        .map((a) => a._id)
                        .filter((id): id is string => typeof id === "string");

                      setSelectedIds((prev) =>
                        checked
                          ? [...new Set([...prev, ...visibleIds])]
                          : prev.filter((id) => !visibleIds.includes(id))
                      );
                    }}
                    aria-label="Select all visible ATC codes"
                    className="ml-1"
                  />
                </TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead>ATC Code</TableHead>
                <TableHead>Tax Code</TableHead>
                <TableHead>Tax Rate</TableHead>
                <TableHead>EWT</TableHead>
                <TableHead>CWT</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading ATC codes…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAtcCodes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-6 w-6" />
                      <span className="text-sm">No ATC codes found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAtcCodes.map((atc) => (
                  <TableRow key={atc._id}>
                    <TableCell className="px-2">
                      <Checkbox
                        checked={selectedIds.includes(atc._id ?? "")}
                        onCheckedChange={(checked) => {
                          const id = atc._id;
                          if (!id) return;

                          setSelectedIds((prev) =>
                            checked
                              ? [...prev, id]
                              : prev.filter((x) => x !== id)
                          );
                        }}
                        aria-label={`Select ${atc.atcCode || "ATC Code"}`}
                        className="ml-1"
                      />
                    </TableCell>
                    <TableCell>
                      {atc.createdAt
                        ? new Date(atc.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>{atc.atcCode ?? "—"}</TableCell>
                    <TableCell>{atc.taxCode ?? "—"}</TableCell>
                    <TableCell>{atc.taxRate ?? "—"}%</TableCell>
                    <TableCell>{atc.ewt ?? "—"}</TableCell>
                    <TableCell>{atc.cwt ?? "—"}</TableCell>
                    <TableCell>
                      {atc.status === "ACTIVE" ? (
                        <span className="text-green-600">ACTIVE</span>
                      ) : (
                        <span className="text-red-600">INACTIVE</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(atc._id!)}
                        title="View ATC Code">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(atc)}
                        title="Edit ATC Code">
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete ATC Code"
                            className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete ATC Code</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently delete this ATC code?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(atc._id!)}>
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
              ATC codes per page:
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Create ATC Code
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the ATC code details. Fields marked with{" "}
              <span className="text-red-500">*</span> are required.
            </DialogDescription>
          </DialogHeader>

          {/* ATC Code Form */}
          <div className="space-y-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="atcCode">
                ATC Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="atcCode"
                value={formData.atcCode ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, atcCode: e.target.value }))
                }
                placeholder="e.g. WI010"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="taxCode">
                Tax Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="taxCode"
                value={formData.taxCode ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, taxCode: e.target.value }))
                }
                placeholder="e.g. VAT10"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="taxRate">
                Tax Rate (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="taxRate"
                type="number"
                min={0}
                step={0.01}
                value={formData.taxRate ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    taxRate: parseFloat(e.target.value),
                  }))
                }
                placeholder="e.g. 10"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="e.g. Professional services subject to 10% VAT"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="ewt">EWT (%)</Label>
                <Input
                  id="ewt"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.ewt ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ewt: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="e.g. 2"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="cwt">CWT (%)</Label>
                <Input
                  id="cwt"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.cwt ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cwt: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="e.g. 1"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status ?? "ACTIVE"}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: val as "ACTIVE" | "INACTIVE",
                  }))
                }>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => handleCreate(formData)}
              disabled={
                isCreating ||
                !formData.atcCode?.trim() ||
                !formData.taxCode?.trim() ||
                formData.taxRate === undefined
              }>
              {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isCreating ? "Creating…" : "Create ATC Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Edit ATC Code
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the ATC code details. Fields marked with{" "}
              <span className="text-red-500">*</span> are required.
            </DialogDescription>
          </DialogHeader>

          {/* ATC Code Form */}
          <div className="space-y-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="atcCode">
                ATC Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="atcCode"
                value={formData.atcCode ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, atcCode: e.target.value }))
                }
                placeholder="e.g. WI010"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="taxCode">
                Tax Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="taxCode"
                value={formData.taxCode ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, taxCode: e.target.value }))
                }
                placeholder="e.g. VAT10"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="taxRate">
                Tax Rate (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="taxRate"
                type="number"
                min={0}
                step={0.01}
                value={formData.taxRate ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    taxRate: parseFloat(e.target.value),
                  }))
                }
                placeholder="e.g. 10"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="e.g. Professional services subject to 10% VAT"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="ewt">EWT (%)</Label>
                <Input
                  id="ewt"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.ewt ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ewt: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="e.g. 2"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="cwt">CWT (%)</Label>
                <Input
                  id="cwt"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.cwt ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cwt: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="e.g. 1"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status ?? "active"}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: val as "ACTIVE" | "INACTIVE",
                  }))
                }>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => handleUpdate(formData)}
              disabled={
                isUpdating ||
                !formData.atcCode?.trim() ||
                !formData.taxCode?.trim() ||
                formData.taxRate === undefined
              }>
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isUpdating ? "Updating…" : "Update ATC Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="max-w-2xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              ATC Code Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This dialog shows the full details of the selected ATC code.
            </DialogDescription>
          </DialogHeader>

          {/* Inline ATC Code Details */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 py-6 text-sm">
            <div className="text-muted-foreground">ATC Code</div>
            <div>{formData?.atcCode ?? "—"}</div>

            <div className="text-muted-foreground">Tax Code</div>
            <div>{formData?.taxCode ?? "—"}</div>

            <div className="text-muted-foreground">Tax Rate</div>
            <div>
              {formData?.taxRate !== undefined ? `${formData.taxRate}%` : "—"}
            </div>

            <div className="text-muted-foreground">Description</div>
            <div>{formData?.description ?? "—"}</div>

            <div className="text-muted-foreground">EWT</div>
            <div>{formData?.ewt !== undefined ? `${formData.ewt}%` : "—"}</div>

            <div className="text-muted-foreground">CWT</div>
            <div>{formData?.cwt !== undefined ? `${formData.cwt}%` : "—"}</div>

            <div className="text-muted-foreground">Status</div>
            <div>
              {formData?.status === "ACTIVE" ? (
                <span className="text-green-600">ACTIVE</span>
              ) : formData?.status === "INACTIVE" ? (
                <span className="text-red-600">INACTIVE</span>
              ) : (
                "—"
              )}
            </div>

            <div className="text-muted-foreground">Created At</div>
            <div>
              {formData?.createdAt
                ? new Date(formData.createdAt).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
    </Card>
  );
}
