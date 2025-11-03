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

import type { Bank } from "./type";
export default function Bank() {
  const [bankAccounts, setBankAccounts] = useState<Bank[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Bank>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredBanks = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return bankAccounts.filter((bank) => {
      const name = bank.bankAccountName?.toLowerCase() || "";
      const code = bank.bankAccountCode?.toLowerCase() || "";
      return name.includes(query) || code.includes(query);
    });
  }, [bankAccounts, searchTerm]);

  const totalPages = Math.ceil(filteredBanks.length / rowsPerPage);

  const paginatedBanks: Bank[] = filteredBanks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // useEffect(() => {
  //   const fetchBanks = async () => {
  //     try {
  //       const res = await fetch("/api/banks");
  //       const data = await res.json();
  //       setBankAccounts(data);
  //     } catch (err) {
  //       console.error("Failed to fetch bank accounts", err);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchBanks();
  // }, []);

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

  const isFirstFetch = useRef(true);

  const refreshBankList = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/banks");
      const data = await res.json();
      setBankAccounts(data);
    } catch (err) {
      console.error("Failed to fetch bank accounts", err);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    refreshBankList(); // Initial fetch

    const interval = setInterval(() => {
      refreshBankList();
    }, 1000); // 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleCreate = async (formData: Partial<Bank>) => {
    const payload: Partial<Bank> = {
      bankAccountName: formData.bankAccountName?.trim() || "",
      bankAccountCode: formData.bankAccountCode?.trim() || "",
      bankAccountNumber: formData.bankAccountNumber?.trim() || "",
      status: formData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    };

    try {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create bank");

      const created = await res.json();
      console.log("Bank created:", created);

      await refreshBankList();
      setIsCreateDialogOpen(false);
      setFormData({});
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleEdit = (bank: Bank) => {
    setFormData({
      _id: bank._id,
      bankAccountName: bank.bankAccountName ?? "",
      bankAccountCode: bank.bankAccountCode ?? "",
      bankAccountNumber: bank.bankAccountNumber ?? "",
      status: bank.status ?? "ACTIVE",
    });

    setIsEditDialogOpen(true);
  };
  const handleUpdate = async (formData: Partial<Bank>) => {
    if (!formData._id) return console.warn("Missing bank ID for update");

    const payload: Partial<Bank> = {
      bankAccountName: formData.bankAccountName?.trim() || "",
      bankAccountCode: formData.bankAccountCode?.trim() || "",
      bankAccountNumber: formData.bankAccountNumber?.trim() || "",
      status: formData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    };

    try {
      const res = await fetch(`/api/banks/${formData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update bank");

      const updated = await res.json();
      console.log("Bank updated:", updated);

      await refreshBankList();
      setIsEditDialogOpen(false);
      setFormData({});
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDelete = async (bankId: string) => {
    if (!bankId) return console.warn("Missing bank ID for deletion");

    try {
      const res = await fetch(`/api/banks/${bankId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete bank");

      console.log("Bank deleted:", bankId);
      await refreshBankList();
      setSelectedIds((prev) => prev.filter((id) => id !== bankId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleView = async (bankId: string) => {
    if (!bankId) return console.warn("Missing bank ID for view");

    try {
      const res = await fetch(`/api/banks/${bankId}`);
      if (!res.ok) throw new Error("Failed to fetch bank details");

      const bank = await res.json();
      console.log("Bank details:", bank);

      setFormData(bank); // or setFormData(bank) if reused
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
            <CardTitle>Banks</CardTitle>
            <CardDescription>Manage bank accounts</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Create */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Bank Name or Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Bank
          </Button>
        </div>

        {/* Table */}
        <ScrollArea className="max-h-[500px] overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-4 px-2">
                  <Checkbox
                    checked={paginatedBanks
                      .map((b) => b._id)
                      .filter((id): id is string => typeof id === "string")
                      .every((id) => selectedIds.includes(id))}
                    onCheckedChange={(checked) => {
                      const visibleIds = paginatedBanks
                        .map((b) => b._id)
                        .filter((id): id is string => typeof id === "string");

                      setSelectedIds((prev) =>
                        checked
                          ? [...new Set([...prev, ...visibleIds])]
                          : prev.filter((id) => !visibleIds.includes(id))
                      );
                    }}
                    aria-label="Select all visible bank accounts"
                    className="ml-1"
                  />
                </TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead>Bank Account Name</TableHead>
                <TableHead>Bank Account Code</TableHead>
                <TableHead>Bank Account Number</TableHead>
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
                      <span className="text-sm">Loading bank accounts…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBanks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-6 w-6" />
                      <span className="text-sm">No bank accounts found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBanks.map((bank) => (
                  <TableRow key={bank._id}>
                    <TableCell className="px-2">
                      <Checkbox
                        checked={selectedIds.includes(bank._id ?? "")}
                        onCheckedChange={(checked) => {
                          const id = bank._id;
                          if (!id) return;

                          setSelectedIds((prev) =>
                            checked
                              ? [...prev, id]
                              : prev.filter((x) => x !== id)
                          );
                        }}
                        aria-label={`Select ${
                          bank.bankAccountName || "Bank Account"
                        }`}
                        className="ml-1"
                      />
                    </TableCell>
                    <TableCell>
                      {bank.createdAt
                        ? new Date(bank.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>{bank.bankAccountName ?? "—"}</TableCell>
                    <TableCell>{bank.bankAccountCode ?? "—"}</TableCell>
                    <TableCell>{bank.bankAccountNumber ?? "—"}</TableCell>
                    <TableCell>
                      {bank.status === "ACTIVE" ? (
                        <span className="text-green-600">ACTIVE</span>
                      ) : (
                        <span className="text-red-600">INACTIVE</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(bank._id!)}
                        title="View Transfer Request">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(bank)}
                        title="Edit Bank Account">
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Bank Account"
                            className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Bank Account
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently delete this bank account?
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(bank._id!)}>
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
              Banks per page:
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
              Create Bank
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the bank details. Fields marked with{" "}
              <span className="text-red-500">* </span>
              are required.
            </DialogDescription>
          </DialogHeader>

          {/* Bank Details Form */}
          <div className="space-y-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="bankAccountName">
                Bank Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankAccountName"
                value={formData.bankAccountName ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bankAccountName: e.target.value,
                  }))
                }
                placeholder="e.g. Metrobank Main Branch"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="bankAccountCode">
                Bank Account Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankAccountCode"
                value={formData.bankAccountCode ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bankAccountCode: e.target.value,
                  }))
                }
                placeholder="e.g. MB-001"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
              <Input
                id="bankAccountNumber"
                value={formData.bankAccountNumber ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bankAccountNumber: e.target.value,
                  }))
                }
                placeholder="e.g. 1234567890"
              />
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
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
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
                !formData.bankAccountName?.trim() ||
                !formData.bankAccountCode?.trim()
              }>
              {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isCreating ? "Creating…" : "Create Bank"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Edit Bank
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the bank details. Fields marked with{" "}
              <span className="text-red-500">* </span>
              are required.
            </DialogDescription>
          </DialogHeader>

          {/* Bank Details Form */}
          <div className="space-y-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="bankAccountName">
                Bank Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankAccountName"
                value={formData.bankAccountName ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bankAccountName: e.target.value,
                  }))
                }
                placeholder="e.g. Metrobank Main Branch"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="bankAccountCode">
                Bank Account Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankAccountCode"
                value={formData.bankAccountCode ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bankAccountCode: e.target.value,
                  }))
                }
                placeholder="e.g. MB-001"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
              <Input
                id="bankAccountNumber"
                value={formData.bankAccountNumber ?? ""}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  setFormData((prev) => ({
                    ...prev,
                    bankAccountNumber: digitsOnly,
                  }));
                }}
                placeholder="e.g. 1234567890"
              />
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
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
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
                !formData.bankAccountName?.trim() ||
                !formData.bankAccountCode?.trim()
              }>
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isUpdating ? "Updating…" : "Update Bank"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="max-w-2xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Bank Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This dialog shows the full details of the selected bank account.
            </DialogDescription>
          </DialogHeader>

          {/* Inline Bank Details */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 py-6 text-sm">
            <div className="text-muted-foreground ">Bank Account Name</div>
            <div>{formData?.bankAccountName ?? "—"}</div>

            <div className="text-muted-foreground ">Bank Account Code</div>
            <div>{formData?.bankAccountCode ?? "—"}</div>

            <div className="text-muted-foreground ">Bank Account Number</div>
            <div>{formData?.bankAccountNumber ?? "—"}</div>

            <div className="text-muted-foreground ">Status</div>
            <div>
              {formData?.status === "ACTIVE" ? (
                <span className="text-green-600">ACTIVE</span>
              ) : formData?.status === "INACTIVE" ? (
                <span className="text-red-600">INACTIVE</span>
              ) : (
                "—"
              )}
            </div>

            <div className="text-muted-foreground ">Created At</div>
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
