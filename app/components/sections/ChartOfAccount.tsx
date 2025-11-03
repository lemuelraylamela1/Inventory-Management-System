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
import { Separator } from "../ui/separator";
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

import type { ChartOfAccount } from "./type";

export default function ChartOfAccount() {
  const [chartAccounts, setChartAccounts] = useState<ChartOfAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ChartOfAccount>>({});
  const [isCreating, setIsCreating] = useState(false);

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredChartAccounts = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return chartAccounts.filter((account) => {
      const name = account.accountName?.toLowerCase() || "";
      const code = account.accountCode?.toLowerCase() || "";
      return name.includes(query) || code.includes(query);
    });
  }, [chartAccounts, searchTerm]);

  const totalPages = Math.ceil(filteredChartAccounts.length / rowsPerPage);

  const paginatedChartAccounts: ChartOfAccount[] = filteredChartAccounts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const resetForm = () => {
    setFormData({});
  };

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setFormData({});
      setFormErrors({});
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setFormData({});
      setFormErrors({});
    }
  }, [isEditDialogOpen]);

  useEffect(() => {
    if (!isViewDialogOpen) {
      setFormData({});
    }
  }, [isViewDialogOpen]);

  const isFirstFetch = useRef(true);

  const refreshChartAccounts = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/chart-of-accounts");
      const data = await res.json();
      setChartAccounts(data);
    } catch (err) {
      console.error("Failed to fetch chart of accounts", err);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    refreshChartAccounts(); // Initial fetch

    const interval = setInterval(() => {
      refreshChartAccounts();
    }, 1000); // 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function validateForm(data: typeof formData) {
    const errors: Record<string, string> = {};
    if (!data.accountName?.trim())
      errors.accountName = "Account name is required.";
    if (!data.accountCode?.trim())
      errors.accountCode = "Account code is required.";
    if (!data.accountClass?.trim())
      errors.accountClass = "Account class is required.";
    if (!data.accountType?.trim())
      errors.accountType = "Account type is required.";
    if (!data.fsPresentation?.trim())
      errors.fsPresentation = "FS presentation is required.";
    if (!data.accountNature)
      errors.accountNature = "Account nature must be selected.";
    return errors;
  }

  const handleCreate = async (formData: Partial<ChartOfAccount>) => {
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: Partial<ChartOfAccount> = {
      accountCode: formData.accountCode?.trim() || "",
      accountName: formData.accountName?.trim() || "",
      accountClass: formData.accountClass?.trim() || "",
      status: formData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      accountType: formData.accountType?.trim() || "",
      fsPresentation: formData.fsPresentation?.trim() || "",
      parentAccountTitle: formData.parentAccountTitle?.trim() || undefined,
      accountNature: (formData.accountNature = "DEBIT"),
    };

    try {
      const res = await fetch("/api/chart-of-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create chart of account");

      const created = await res.json();
      console.log("Chart of Account created:", created);

      await refreshChartAccounts();
      setIsCreateDialogOpen(false);
      setFormData({});
      setFormErrors({});
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleEdit = (account: ChartOfAccount) => {
    setFormData({
      _id: account._id,
      accountCode: account.accountCode ?? "",
      accountName: account.accountName ?? "",
      accountClass: account.accountClass ?? "",
      status: account.status ?? "ACTIVE",
      accountType: account.accountType ?? "",
      fsPresentation: account.fsPresentation ?? "",
      parentAccountTitle: account.parentAccountTitle ?? "",
      accountNature: account.accountNature ?? "DEBIT",
    });

    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (formData: Partial<ChartOfAccount>) => {
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!formData._id)
      return console.warn("Missing Chart of Account ID for update");

    const payload: Partial<ChartOfAccount> = {
      accountCode: formData.accountCode?.trim() || "",
      accountName: formData.accountName?.trim() || "",
      accountClass: formData.accountClass?.trim() || "",
      status: formData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      accountType: formData.accountType?.trim() || "",
      fsPresentation: formData.fsPresentation?.trim() || "",
      parentAccountTitle: formData.parentAccountTitle?.trim() || undefined,

      accountNature: formData.accountNature === "CREDIT" ? "CREDIT" : "DEBIT",
    };

    try {
      const res = await fetch(`/api/chart-of-accounts/${formData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update Chart of Account");

      const updated = await res.json();
      console.log("Chart of Account updated:", updated);

      await refreshChartAccounts();
      setIsEditDialogOpen(false);
      setFormData({});
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!accountId)
      return console.warn("Missing Chart of Account ID for deletion");

    try {
      const res = await fetch(`/api/chart-of-accounts/${accountId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete Chart of Account");

      console.log("Chart of Account deleted:", accountId);
      await refreshChartAccounts();
      setSelectedIds((prev) => prev.filter((id) => id !== accountId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleView = async (accountId: string) => {
    if (!accountId) return console.warn("Missing Chart of Account ID for view");

    try {
      const res = await fetch(`/api/chart-of-accounts/${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch Chart of Account details");

      const account = await res.json();
      console.log("Chart of Account details:", account);

      setFormData(account);
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
            <CardTitle>Chart of Accounts</CardTitle>
            <CardDescription>
              Manage financial account structure and classifications
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Create */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Account Name or Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        </div>

        {/* Table */}
        <ScrollArea className="max-h-[500px] overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-4 px-2">
                  <Checkbox
                    checked={paginatedChartAccounts
                      .map((a) => a._id)
                      .filter((id): id is string => typeof id === "string")
                      .every((id) => selectedIds.includes(id))}
                    onCheckedChange={(checked) => {
                      const visibleIds = paginatedChartAccounts
                        .map((a) => a._id)
                        .filter((id): id is string => typeof id === "string");

                      setSelectedIds((prev) =>
                        checked
                          ? [...new Set([...prev, ...visibleIds])]
                          : prev.filter((id) => !visibleIds.includes(id))
                      );
                    }}
                    aria-label="Select all visible accounts"
                    className="ml-1"
                  />
                </TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Class</TableHead>
                <TableHead>Account Type</TableHead>
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
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">
                        Loading chart of accounts…
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredChartAccounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-6 w-6" />
                      <span className="text-sm">
                        No chart of accounts found
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedChartAccounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell className="px-2">
                      <Checkbox
                        checked={selectedIds.includes(account._id ?? "")}
                        onCheckedChange={(checked) => {
                          const id = account._id;
                          if (!id) return;

                          setSelectedIds((prev) =>
                            checked
                              ? [...prev, id]
                              : prev.filter((x) => x !== id)
                          );
                        }}
                        aria-label={`Select ${
                          account.accountName || "Account"
                        }`}
                        className="ml-1"
                      />
                    </TableCell>
                    <TableCell>
                      {account.createdAt
                        ? new Date(account.createdAt).toLocaleDateString(
                            "en-PH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>{account.accountName ?? "—"}</TableCell>
                    <TableCell>{account.accountCode ?? "—"}</TableCell>
                    <TableCell>{account.accountClass ?? "—"}</TableCell>
                    <TableCell>{account.accountType ?? "—"}</TableCell>
                    <TableCell>
                      {account.status === "ACTIVE" ? (
                        <span className="text-green-600">ACTIVE</span>
                      ) : (
                        <span className="text-red-600">INACTIVE</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(account._id!)}
                        title="View Account">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                        title="Edit Account">
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Account"
                            className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently delete this account?
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(account._id!)}>
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
              Accounts per page:
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
        <DialogPanel className="max-w-2xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Create Chart of Account
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the account details. Fields marked with{" "}
              <span className="text-red-500 font-semibold">*</span> are
              required.
            </DialogDescription>
          </DialogHeader>

          {/* Chart of Account Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
            <div className="grid gap-1.5">
              <Label htmlFor="accountName">
                Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountName"
                value={formData.accountName ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountName: e.target.value,
                  }));
                  setFormErrors((prev) => ({ ...prev, accountName: "" }));
                }}
                placeholder="e.g. Cash on Hand"
                className={formErrors.accountName ? "border-red-500" : ""}
              />
              {formErrors.accountName && (
                <p className="text-xs text-red-500">{formErrors.accountName}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="accountCode">
                Account Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountCode"
                value={formData.accountCode ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountCode: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    accountCode: "",
                  }));
                }}
                placeholder="e.g. 101-001"
                className={formErrors.accountCode ? "border-red-500" : ""}
              />
              {formErrors.accountCode && (
                <p className="text-xs text-red-500">{formErrors.accountCode}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="accountClass">
                Account Class <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountClass"
                value={formData.accountClass ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountClass: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    accountClass: "",
                  }));
                }}
                placeholder="e.g. Asset"
                className={formErrors.accountClass ? "border-red-500" : ""}
              />
              {formErrors.accountClass && (
                <p className="text-xs text-red-500">
                  {formErrors.accountClass}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="accountType">
                Account Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountType"
                value={formData.accountType ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountType: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    accountType: "",
                  }));
                }}
                placeholder="e.g. Current Asset"
                className={formErrors.accountType ? "border-red-500" : ""}
              />
              {formErrors.accountType && (
                <p className="text-xs text-red-500">{formErrors.accountType}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="fsPresentation">
                FS Presentation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fsPresentation"
                value={formData.fsPresentation ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    fsPresentation: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    fsPresentation: "",
                  }));
                }}
                placeholder="e.g. Statement of Financial Position"
                className={formErrors.fsPresentation ? "border-red-500" : ""}
              />
              {formErrors.fsPresentation && (
                <p className="text-xs text-red-500">
                  {formErrors.fsPresentation}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="parentAccountTitle">Parent Account Title</Label>
              <Input
                id="parentAccountTitle"
                value={formData.parentAccountTitle ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    parentAccountTitle: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    parentAccountTitle: "",
                  }));
                }}
                placeholder="e.g. Cash"
                className={
                  formErrors.parentAccountTitle ? "border-red-500" : ""
                }
              />
              {formErrors.parentAccountTitle && (
                <p className="text-xs text-red-500">
                  {formErrors.parentAccountTitle}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="accountNature">
                Account Nature <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.accountNature ?? "Debit"}
                onValueChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountNature: val as "Debit" | "Credit",
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    accountNature: "",
                  }));
                }}>
                <SelectTrigger
                  id="accountNature"
                  className={
                    formErrors.accountNature ? "border-red-500" : "w-full"
                  }>
                  <SelectValue placeholder="Select nature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Debit">Debit</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.accountNature && (
                <p className="text-xs text-red-500">
                  {formErrors.accountNature}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status ?? "ACTIVE"}
                onValueChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    status: val as "ACTIVE" | "INACTIVE",
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    status: "",
                  }));
                }}>
                <SelectTrigger
                  id="status"
                  className={formErrors.status ? "border-red-500" : "w-full"}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-xs text-red-500">{formErrors.status}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => handleCreate(formData)}
              disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isCreating ? "Creating…" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogPanel className="max-w-2xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Edit Chart of Account
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the account details. Fields marked with{" "}
              <span className="text-red-500 font-semibold">*</span> are
              required.
            </DialogDescription>
          </DialogHeader>

          {/* Chart of Account Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-6">
            <div className="grid gap-1.5">
              <Label htmlFor="accountName">
                Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountName"
                value={formData.accountName ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountName: e.target.value,
                  }));
                  setFormErrors((prev) => ({ ...prev, accountName: "" }));
                }}
                className={formErrors.accountName ? "border-red-500" : ""}
                placeholder="e.g. Cash on Hand"
              />
              {formErrors.accountName && (
                <p className="text-xs text-red-500">{formErrors.accountName}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="accountCode">
                Account Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountCode"
                value={formData.accountCode ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountCode: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    accountCode: "",
                  }));
                }}
                placeholder="e.g. 101-001"
                className={formErrors.accountCode ? "border-red-500" : ""}
              />
              {formErrors.accountCode && (
                <p className="text-xs text-red-500">{formErrors.accountCode}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="accountClass">
                Account Class <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountClass"
                value={formData.accountClass ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountClass: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    accountClass: "",
                  }));
                }}
                placeholder="e.g. Asset"
                className={formErrors.accountClass ? "border-red-500" : ""}
              />
              {formErrors.accountClass && (
                <p className="text-xs text-red-500">
                  {formErrors.accountClass}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="accountType">
                Account Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountType"
                value={formData.accountType ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountType: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    accountType: "",
                  }));
                }}
                placeholder="e.g. Current Asset"
                className={formErrors.accountType ? "border-red-500" : ""}
              />
              {formErrors.accountType && (
                <p className="text-xs text-red-500">{formErrors.accountType}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="fsPresentation">
                FS Presentation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fsPresentation"
                value={formData.fsPresentation ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    fsPresentation: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    fsPresentation: "",
                  }));
                }}
                placeholder="e.g. Statement of Financial Position"
                className={formErrors.fsPresentation ? "border-red-500" : ""}
              />
              {formErrors.fsPresentation && (
                <p className="text-xs text-red-500">
                  {formErrors.fsPresentation}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="parentAccountTitle">Parent Account Title</Label>
              <Input
                id="parentAccountTitle"
                value={formData.parentAccountTitle ?? ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    parentAccountTitle: e.target.value,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    parentAccountTitle: "",
                  }));
                }}
                placeholder="e.g. Cash"
                className={
                  formErrors.parentAccountTitle ? "border-red-500" : ""
                }
              />
              {formErrors.parentAccountTitle && (
                <p className="text-xs text-red-500">
                  {formErrors.parentAccountTitle}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="accountNature">
                Account Nature <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.accountNature ?? "Debit"}
                onValueChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    accountNature: val as "Debit" | "Credit",
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    accountNature: "",
                  }));
                }}>
                <SelectTrigger
                  id="accountNature"
                  className={
                    formErrors.accountNature ? "border-red-500" : "w-full"
                  }>
                  <SelectValue>{formData.accountNature ?? "Debit"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Debit">Debit</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.accountNature && (
                <p className="text-xs text-red-500">
                  {formErrors.accountNature}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status ?? "ACTIVE"}
                onValueChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    status: val as "ACTIVE" | "INACTIVE",
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    status: "",
                  }));
                }}>
                <SelectTrigger
                  id="status"
                  className={formErrors.status ? "border-red-500" : "w-full"}>
                  <SelectValue>{formData.status ?? "ACTIVE"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-xs text-red-500">{formErrors.status}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => handleUpdate(formData)}
              disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isUpdating ? "Updating…" : "Update Account"}
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="max-w-2xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Account Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This dialog shows the full details of the selected chart of
              account.
            </DialogDescription>
          </DialogHeader>

          {/* Inline Account Details */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 py-6 text-sm">
            <div className="text-muted-foreground">Account Name</div>
            <div>{formData?.accountName ?? "—"}</div>

            <div className="text-muted-foreground">Account Code</div>
            <div>{formData?.accountCode ?? "—"}</div>

            <div className="text-muted-foreground">Account Class</div>
            <div>{formData?.accountClass ?? "—"}</div>

            <div className="text-muted-foreground">Account Type</div>
            <div>{formData?.accountType ?? "—"}</div>

            <div className="text-muted-foreground">FS Presentation</div>
            <div>{formData?.fsPresentation ?? "—"}</div>

            <div className="text-muted-foreground">Parent Account Title</div>
            <div>{formData?.parentAccountTitle ?? "—"}</div>

            <div className="text-muted-foreground">Account Nature</div>
            <div>{formData?.accountNature ?? "—"}</div>

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
