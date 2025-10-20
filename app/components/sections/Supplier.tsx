"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";

import type { SupplierType } from "./type";
import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { cn } from "../ui/utils";

type Props = {
  onSuccess?: () => void;
};

export default function Supplier({ onSuccess }: Props) {
  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const isFirstFetch = useRef(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierType | null>(
    null
  );
  const [viewingSupplier, setViewingSupplier] = useState<SupplierType | null>(
    null
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const router = useRouter();

  const [formData, setFormData] = useState({
    supplierCode: "",
    supplierName: "",
    contactPerson: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    supplierCode: "",
    supplierName: "",
    contactPerson: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
  });

  // Filter and paginate data
  const filteredSuppliers = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return suppliers.filter((supplier) => {
      const name = supplier.supplierName?.toLowerCase() || "";
      const code = supplier.supplierCode?.toLowerCase() || "";

      return name.includes(query) || code.includes(query);
    });
  }, [suppliers, searchTerm]);

  const totalPages = Math.ceil(filteredSuppliers.length / rowsPerPage);

  const paginatedSuppliers: SupplierType[] = filteredSuppliers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Validation functions
  const validateForm = (isEdit = false) => {
    const errors = {
      supplierCode: "",
      supplierName: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      address: "",
    };

    // Required: supplierCode
    if (!formData.supplierCode.trim()) {
      errors.supplierCode = "Supplier code is required";
    } else {
      const duplicateCode = suppliers.find(
        (s) =>
          s.supplierCode.toLowerCase() ===
            formData.supplierCode.toLowerCase() &&
          (!isEdit || s._id !== editingSupplier?._id)
      );
      if (duplicateCode) {
        errors.supplierCode = "Supplier code already exists";
      }
    }

    // Required: supplierName
    if (!formData.supplierName.trim()) {
      errors.supplierName = "Supplier name is required";
    } else {
      const duplicateName = suppliers.find(
        (s) =>
          s.supplierName.toLowerCase() ===
            formData.supplierName.toLowerCase() &&
          (!isEdit || s._id !== editingSupplier?._id)
      );
      if (duplicateName) {
        errors.supplierName = "Supplier name already exists";
      }
    }

    // Required: contactPerson
    // if (!formData.contactPerson.trim()) {
    //   errors.contactPerson = "Contact person is required";
    // }

    // Required: contactNumber
    // if (!formData.contactNumber.trim()) {
    //   errors.contactNumber = "Contact number is required";
    // }

    // Required: emailAddress
    // if (!formData.emailAddress.trim()) {
    //   errors.emailAddress = "Email address is required";
    // } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
    //   errors.emailAddress = "Invalid email format";
    // }

    // if (!formData.address.trim()) {
    //   errors.address = "Address is required";
    // } else if (formData.address.length < 10) {
    //   errors.address = "Address must be at least 10 characters";
    // }
    setValidationErrors(errors);

    const hasErrors =
      Object.values(errors).some(
        (val) => typeof val === "string" && val !== ""
      ) || Object.values(errors.address).some((val) => val !== "");

    return !hasErrors;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    const payload = {
      supplierCode: formData.supplierCode.toUpperCase().trim(),
      supplierName: formData.supplierName.toUpperCase().trim(),
      contactPerson: formData.contactPerson.toUpperCase().trim(),
      contactNumber: formData.contactNumber.trim(),
      emailAddress: formData.emailAddress.toLowerCase().trim(),
      address: formData.address.toUpperCase().trim(),
    };

    console.log("Creating supplier:", payload);

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("Server response:", result);

      if (!res.ok) {
        console.error("Create failed:", result.message || result);
        alert("Failed to create supplier. Please try again.");
        return;
      }

      toast.success("Supplier created successfully!");

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      setTimeout(() => {
        router.push("/");
      }, 300);
    } catch (error) {
      console.error("Network or unexpected error:", error);
      alert("Something went wrong. Please check your connection or try again.");
    }

    setIsCreateDialogOpen(false);
  };

  const handleEdit = (supplier: SupplierType) => {
    setEditingSupplier(supplier);

    setFormData({
      supplierCode: supplier.supplierCode || "",
      supplierName: supplier.supplierName || "",
      contactPerson: supplier.contactPerson || "",
      contactNumber: supplier.contactNumber || "",
      emailAddress: supplier.emailAddress || "",
      address: supplier.address || "",
    });

    setValidationErrors({
      supplierCode: "",
      supplierName: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      address: "",
    });

    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingSupplier || !validateForm(true)) return;

    const payload = {
      supplierCode: formData.supplierCode.trim().toUpperCase(),
      supplierName: formData.supplierName.trim().toUpperCase(),
      contactPerson: formData.contactPerson.trim().toUpperCase(),
      contactNumber: formData.contactNumber.trim(),
      emailAddress: formData.emailAddress.trim().toLowerCase(),
      address: formData.address.trim().toUpperCase(),
    };

    try {
      const res = await fetch(`/api/suppliers/${editingSupplier._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update supplier");
      }

      const updatedSupplier = await res.json();

      // Update local state
      setSuppliers((prev) =>
        prev.map((s) =>
          s._id === editingSupplier._id ? updatedSupplier.data : s
        )
      );
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update supplier. Please try again.");
      return;
    }

    // Reset form and close dialog
    setEditingSupplier(null);
    setFormData({
      supplierCode: "",
      supplierName: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      address: "",
    });
    setValidationErrors({
      supplierCode: "",
      supplierName: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      address: "",
    });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete supplier");

      // Update local state after successful deletion
      setSuppliers((prev) => prev.filter((s) => s._id !== id));
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  const handleView = (supplier: SupplierType) => {
    setViewingSupplier(supplier);
    setIsViewDialogOpen(true);
  };

  const formatDate = (date: Date | string) => {
    const parsed = typeof date === "string" ? new Date(date) : date;
    return isNaN(parsed.getTime())
      ? "Invalid date"
      : parsed.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const resetForm = () => {
    const emptySupplier = {
      supplierCode: "",
      supplierName: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      address: "",
    };

    setFormData({ ...emptySupplier });
    setValidationErrors({ ...emptySupplier });
  };

  const allSelected =
    paginatedSuppliers.length > 0 &&
    selectedIds.length === paginatedSuppliers.length;

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      // Select all suppliers on current page
      const newSelections = [
        ...selectedIds,
        ...paginatedSuppliers
          .filter((s) => !selectedIds.includes(s._id))
          .map((s) => s._id),
      ];
      setSelectedIds(newSelections);
    } else if (checked === false) {
      // Unselect all suppliers on current page
      const remaining = selectedIds.filter(
        (id) => !paginatedSuppliers.some((s) => s._id === id)
      );
      setSelectedIds(remaining);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteMany = async (_ids: string[]) => {
    try {
      // Optimistically remove from UI
      setSuppliers((prev) => prev.filter((s) => !_ids.includes(s._id)));

      const results = await Promise.all(
        _ids.map(async (_id) => {
          const res = await fetch(`/api/suppliers/${_id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const error = await res.json();
            console.warn(`Failed to delete ${_id}:`, error.message);
          }
          return res;
        })
      );

      const failures = results.filter((res) => !res.ok);
      if (failures.length > 0) {
        alert(
          `Some suppliers could not be deleted (${failures.length} failed).`
        );
      } else {
        toast.success("Selected suppliers deleted.");
      }

      setSelectedIds([]);
      onSuccess?.(); // refresh list
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Failed to delete selected suppliers.");
    }
  };

  const fetchSuppliers = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/suppliers", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch suppliers");

      const data = await res.json();
      const suppliers = Array.isArray(data) ? data : data.items;

      setSuppliers(Array.isArray(suppliers) ? suppliers : []);
    } catch (error) {
      console.error("❌ Error loading suppliers:", error);
      setSuppliers([]);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    fetchSuppliers(); // initial fetch

    const interval = setInterval(() => {
      fetchSuppliers();
    }, 1000); // 1 second = 1000 milliseconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Supplier</CardTitle>
              <CardDescription>Manage suppliers</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                if (open) {
                  resetForm();
                }
                setIsCreateDialogOpen(open);
              }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Supplier
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                </DialogHeader>

                <Card className="p-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="create-supplier-code">
                          Supplier Code
                        </Label>
                        <Input
                          id="create-supplier-code"
                          value={formData.supplierCode}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase(); // 👈 transform to uppercase
                            setFormData((prev) => ({
                              ...prev,
                              supplierCode: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              supplierCode: "",
                            }));
                          }}
                          placeholder="SUP001"
                          className={
                            validationErrors.supplierCode
                              ? "border-destructive text-sm uppercase"
                              : "text-sm uppercase"
                          }
                        />
                        {validationErrors.supplierCode && (
                          <p className="text-sm text-destructive">
                            {validationErrors.supplierCode}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="create-supplier-name">
                          Supplier Name
                        </Label>
                        <Input
                          id="create-supplier-name"
                          value={formData.supplierName}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase(); // 👈 transform to uppercase
                            setFormData((prev) => ({
                              ...prev,
                              supplierName: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              supplierName: "",
                            }));
                          }}
                          placeholder="Retail Suppliers"
                          className={`text-sm uppercase ${
                            validationErrors.supplierName
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        {validationErrors.supplierName && (
                          <p className="text-sm text-destructive">
                            {validationErrors.supplierName}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="create-supplier-contact">
                          Contact Number
                        </Label>
                        <Input
                          id="create-supplier-contact"
                          value={formData.contactNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ""); // 👈 strip non-digits
                            setFormData((prev) => ({
                              ...prev,
                              contactNumber: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              contactNumber: "",
                            }));
                          }}
                          placeholder="09171234567"
                          className={`text-sm ${
                            validationErrors.contactNumber
                              ? "border-destructive"
                              : ""
                          }`}
                          inputMode="numeric"
                          maxLength={11} // optional: enforce PH mobile format
                        />
                        {validationErrors.contactNumber && (
                          <p className="text-sm text-destructive">
                            {validationErrors.contactNumber}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="create-supplier-contact-person">
                          Contact Person
                        </Label>
                        <Input
                          id="create-supplier-contact-person"
                          value={formData.contactPerson}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase(); // 👈 transform to uppercase
                            setFormData((prev) => ({
                              ...prev,
                              contactPerson: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              contactPerson: "",
                            }));
                          }}
                          placeholder="Juan Dela Cruz"
                          className={`text-sm uppercase ${
                            validationErrors.contactPerson
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        {validationErrors.contactPerson && (
                          <p className="text-sm text-destructive">
                            {validationErrors.contactPerson}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="create-supplier-email">
                          Email Address
                        </Label>
                        <Input
                          id="create-supplier-email"
                          type="email"
                          value={formData.emailAddress}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().trim(); // 👈 normalize casing
                            setFormData((prev) => ({
                              ...prev,
                              emailAddress: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              emailAddress: "",
                            }));
                          }}
                          placeholder="supplier@email.com"
                          className={`text-sm lowercase ${
                            validationErrors.emailAddress
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        {validationErrors.emailAddress && (
                          <p className="text-sm text-destructive">
                            {validationErrors.emailAddress}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="create-supplier-address">Address</Label>
                        <Input
                          id="create-supplier-address"
                          value={formData.address}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase(); // 👈 transform to uppercase
                            setFormData((prev) => ({
                              ...prev,
                              address: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              address: "",
                            }));
                          }}
                          placeholder="Zone III, Dasmariñas, Calabarzon, Philippines 4114"
                          className={`text-sm uppercase ${
                            validationErrors.address ? "border-destructive" : ""
                          }`}
                        />
                        {validationErrors.address && (
                          <p className="text-sm text-destructive">
                            {validationErrors.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={
                      [formData.supplierCode, formData.supplierName].some(
                        (field) => !field.trim()
                      ) ||
                      Object.values(validationErrors).some((error) =>
                        typeof error === "string"
                          ? error !== ""
                          : Object.values(error).some((nested) => nested !== "")
                      )
                    }>
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                ✅ {selectedIds.length} supplier
                {selectedIds.length > 1 ? "s" : ""} selected
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

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all suppliers on current page"
                    />
                  </TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Supplier Code</TableHead>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-48 px-4 text-muted-foreground">
                      <div className="flex h-full items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-medium tracking-wide">
                          Loading suppliers…
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground">
                      No suppliers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSuppliers.map((supplier) => (
                    <TableRow
                      key={
                        supplier._id ||
                        `${supplier.supplierCode}-${supplier.supplierName}`
                      }>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(supplier._id)}
                          onCheckedChange={() => toggleSelectOne(supplier._id)}
                        />
                      </TableCell>
                      <TableCell>
                        {supplier.createdAt
                          ? formatDate(supplier.createdAt)
                          : "—"}
                      </TableCell>
                      <TableCell>{supplier.supplierCode}</TableCell>
                      <TableCell>{supplier.supplierName}</TableCell>

                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(supplier)}
                            title="View Supplier Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            title="Edit Supplier">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete Supplier"
                                className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Supplier
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {supplier.supplierName}&quot;? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(supplier._id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
              <span className="text-sm text-gray-600">Suppliers per page:</span>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer Type</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Supplier Code */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-supplier-code">Supplier Code</Label>
                  <Input
                    id="edit-supplier-code"
                    value={formData.supplierCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({ ...prev, supplierCode: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        supplierCode: "",
                      }));
                    }}
                    placeholder="SUP001"
                    className={cn(
                      "text-sm uppercase",
                      validationErrors.supplierCode && "border-destructive"
                    )}
                  />
                  {validationErrors.supplierCode && (
                    <p className="text-sm text-destructive">
                      {validationErrors.supplierCode}
                    </p>
                  )}
                </div>

                {/* Supplier Name */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-supplier-name">Supplier Name</Label>
                  <Input
                    id="edit-supplier-name"
                    value={formData.supplierName}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({ ...prev, supplierName: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        supplierName: "",
                      }));
                    }}
                    placeholder="ABC Trading Corp"
                    className={cn(
                      "text-sm uppercase",
                      validationErrors.supplierName && "border-destructive"
                    )}
                  />
                  {validationErrors.supplierName && (
                    <p className="text-sm text-destructive">
                      {validationErrors.supplierName}
                    </p>
                  )}
                </div>

                {/* Contact Person */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-contact-person">Contact Person</Label>
                  <Input
                    id="edit-contact-person"
                    value={formData.contactPerson}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({
                        ...prev,
                        contactPerson: value,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        contactPerson: "",
                      }));
                    }}
                    placeholder="Juan Dela Cruz"
                    className={cn(
                      "text-sm uppercase",
                      validationErrors.contactPerson && "border-destructive"
                    )}
                  />
                  {validationErrors.contactPerson && (
                    <p className="text-sm text-destructive">
                      {validationErrors.contactPerson}
                    </p>
                  )}
                </div>

                {/* Contact Number */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-contact-number">Contact Number</Label>
                  <Input
                    id="edit-contact-number"
                    inputMode="numeric"
                    maxLength={11}
                    value={formData.contactNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        contactNumber: value,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        contactNumber: "",
                      }));
                    }}
                    placeholder="09171234567"
                    className={cn(
                      "text-sm",
                      validationErrors.contactNumber && "border-destructive"
                    )}
                  />
                  {validationErrors.contactNumber && (
                    <p className="text-sm text-destructive">
                      {validationErrors.contactNumber}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="edit-email-address">Email Address</Label>
                  <Input
                    id="edit-email-address"
                    type="email"
                    value={formData.emailAddress}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().trim(); // 👈 normalize casing
                      setFormData((prev) => ({ ...prev, emailAddress: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        emailAddress: "",
                      }));
                    }}
                    placeholder="supplier@email.com"
                    className={cn(
                      "text-sm lowercase",
                      validationErrors.emailAddress && "border-destructive"
                    )}
                  />
                  {validationErrors.emailAddress && (
                    <p className="text-sm text-destructive">
                      {validationErrors.emailAddress}
                    </p>
                  )}
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().trim(); // 👈 transform to uppercase
                      setFormData((prev) => ({ ...prev, address: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        address: "",
                      }));
                    }}
                    placeholder="Zone III, Dasmariñas, Calabarzon, Philippines 4114"
                    className={cn(
                      "text-sm uppercase",
                      validationErrors.address && "border-destructive"
                    )}
                  />
                  {validationErrors.address && (
                    <p className="text-sm text-destructive">
                      {validationErrors.address}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingSupplier(null);
                resetForm();
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                !formData.supplierCode.trim() || !formData.supplierName.trim()
              }>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto rounded-xl p-6">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
          </DialogHeader>

          {viewingSupplier && (
            <div className="grid gap-6 py-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {/* Supplier Code */}
                  {viewingSupplier.supplierCode && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Supplier Code
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingSupplier.supplierCode}
                      </div>
                    </div>
                  )}

                  {/* Supplier Name */}
                  {viewingSupplier.supplierName && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Supplier Name
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingSupplier.supplierName}
                      </div>
                    </div>
                  )}

                  {/* Contact Person */}
                  {viewingSupplier.contactPerson && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Contact Person
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingSupplier.contactPerson}
                      </div>
                    </div>
                  )}

                  {/* Contact Number */}
                  {viewingSupplier.contactNumber && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Contact Number
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingSupplier.contactNumber}
                      </div>
                    </div>
                  )}

                  {/* Email Address */}
                  {viewingSupplier.emailAddress && (
                    <div className="flex flex-col gap-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">
                        Email Address
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingSupplier.emailAddress}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {viewingSupplier.address && (
                    <div className="flex flex-col gap-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">
                        Address
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingSupplier.address}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
