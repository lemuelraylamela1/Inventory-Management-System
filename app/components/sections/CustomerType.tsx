"use client";

import React, { useState, useMemo, useEffect } from "react";
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

import { Plus, Search, Edit, Trash2 } from "lucide-react";

import type { CustomerType } from "./type";
import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { cn } from "../ui/utils";

type Props = {
  onSuccess?: () => void;
};

export default function CustomerType({ onSuccess }: Props) {
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCustomerType, setEditingCustomerType] =
    useState<CustomerType | null>(null);
  const [viewingCustomerType, setViewingCustomerType] =
    useState<CustomerType | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const router = useRouter();

  const [formData, setFormData] = useState({
    groupCode: "",
    groupName: "",
    discount1: "",
    discount2: "",
    discount3: "",
    discount4: "",
    discount5: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    groupCode: "",
    groupName: "",
    discount1: "",
    discount2: "",
    discount3: "",
    discount4: "",
    discount5: "",
  });

  // Filter and paginate data
  const filteredCustomerTypes = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return customerTypes.filter((customer) => {
      const name = customer.groupName?.toLowerCase() || "";
      const code = customer.groupCode?.toLowerCase() || "";

      return name.includes(query) || code.includes(query);
    });
  }, [customerTypes, searchTerm]);

  const totalPages = Math.ceil(filteredCustomerTypes.length / rowsPerPage);

  const paginatedCustomerTypes: CustomerType[] = filteredCustomerTypes.slice(
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
      groupCode: "",
      groupName: "",
      discount1: "",
      discount2: "",
      discount3: "",
      discount4: "",
      discount5: "",
    };

    // Required: groupCode
    if (!formData.groupCode.trim()) {
      errors.groupCode = "Group Code is required";
    } else {
      const duplicateCode = customerTypes.find(
        (ct) =>
          ct.groupCode.toLowerCase() === formData.groupCode.toLowerCase() &&
          (!isEdit || ct._id !== editingCustomerType?._id)
      );
      if (duplicateCode) {
        errors.groupCode = "Group Code already exists";
      }
    }

    // Required: groupName
    if (!formData.groupName.trim()) {
      errors.groupName = "Group Name is required";
    } else {
      const duplicateName = customerTypes.find(
        (ct) =>
          ct.groupName.toLowerCase() === formData.groupName.toLowerCase() &&
          (!isEdit || ct._id !== editingCustomerType?._id)
      );
      if (duplicateName) {
        errors.groupName = "Group Name already exists";
      }
    }

    // Validate discounts
    const discountFields = [
      "discount1",
      "discount2",
      "discount3",
      "discount4",
      "discount5",
    ] as const;

    for (const field of discountFields) {
      const rawValue = formData[field];
      const value = parseFloat(rawValue);

      if (!rawValue.trim()) {
        errors[field] = `${field} is required`;
      } else if (isNaN(value) || value < 0 || value > 100) {
        errors[field] = `${field} must be a percentage between 0 and 100`;
      }
    }

    setValidationErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    const payload = {
      ...formData,
      discount1: Number(formData.discount1),
      discount2: Number(formData.discount2),
      discount3: Number(formData.discount3),
      discount4: Number(formData.discount4),
      discount5: Number(formData.discount5),
    };

    console.log("Creating customer type:", payload);

    try {
      const res = await fetch("/api/customer-types", {
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
        alert("Failed to create customer type. Please try again.");
        return;
      }

      toast.success("Customer type created successfully!");

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

  const handleEdit = (customer: CustomerType) => {
    setEditingCustomerType(customer);

    setFormData({
      groupCode: customer.groupCode || "",
      groupName: customer.groupName || "",
      discount1: customer.discount1?.toString() || "0",
      discount2: customer.discount2?.toString() || "0",
      discount3: customer.discount3?.toString() || "0",
      discount4: customer.discount4?.toString() || "0",
      discount5: customer.discount5?.toString() || "0",
    });

    setValidationErrors({
      groupCode: "",
      groupName: "",
      discount1: "",
      discount2: "",
      discount3: "",
      discount4: "",
      discount5: "",
    });

    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingCustomerType || !validateForm(true)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/customer-types/${editingCustomerType._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupCode: formData.groupCode.trim(),
            groupName: formData.groupName.trim(),
            discount1: parseFloat(formData.discount1) || 0,
            discount2: parseFloat(formData.discount2) || 0,
            discount3: parseFloat(formData.discount3) || 0,
            discount4: parseFloat(formData.discount4) || 0,
            discount5: parseFloat(formData.discount5) || 0,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update customer type");
      }

      const updatedCustomer = await res.json();

      // Update local state
      setCustomerTypes((prev) =>
        prev.map((ct) =>
          ct._id === editingCustomerType._id ? updatedCustomer : ct
        )
      );
    } catch (err) {
      console.error("Update error:", err);
      return;
    }

    // Reset form and close dialog
    setEditingCustomerType(null);
    setFormData({
      groupCode: "",
      groupName: "",
      discount1: "",
      discount2: "",
      discount3: "",
      discount4: "",
      discount5: "",
    });
    setValidationErrors({
      groupCode: "",
      groupName: "",
      discount1: "",
      discount2: "",
      discount3: "",
      discount4: "",
      discount5: "",
    });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/customer-types/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete customer type");

      // Update local state after successful deletion
      setCustomerTypes((prev) => prev.filter((ct) => ct._id !== id));
    } catch (error) {
      console.error("Error deleting customer type:", error);
    }
  };

  const handleView = (customer: CustomerType) => {
    setViewingCustomerType(customer);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const resetForm = () => {
    setFormData({
      groupCode: "",
      groupName: "",
      discount1: "",
      discount2: "",
      discount3: "",
      discount4: "",
      discount5: "",
    });

    setValidationErrors({
      groupCode: "",
      groupName: "",
      discount1: "",
      discount2: "",
      discount3: "",
      discount4: "",
      discount5: "",
    });
  };

  const allSelected =
    paginatedCustomerTypes.length > 0 &&
    selectedIds.length === paginatedCustomerTypes.length;

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      // Select all customer types on current page
      const newSelections = [
        ...selectedIds,
        ...paginatedCustomerTypes
          .filter((ct) => !selectedIds.includes(ct._id))
          .map((ct) => ct._id),
      ];
      setSelectedIds(newSelections);
    } else if (checked === false) {
      // Unselect all customer types on current page
      const remaining = selectedIds.filter(
        (id) => !paginatedCustomerTypes.some((ct) => ct._id === id)
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
      setCustomerTypes((prev) => prev.filter((ct) => !_ids.includes(ct._id)));

      const results = await Promise.all(
        _ids.map(async (_id) => {
          const res = await fetch(`/api/customer-types/${_id}`, {
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
          `Some customer types could not be deleted (${failures.length} failed).`
        );
      } else {
        toast.success("Selected customer types deleted.");
      }

      setSelectedIds([]);
      onSuccess?.(); // refresh list
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Failed to delete selected customer types.");
    }
  };

  const fetchCustomerTypes = async () => {
    try {
      const res = await fetch("/api/customer-types", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch customer types");

      const data = await res.json();
      const customerTypes = Array.isArray(data) ? data : data.items;

      setCustomerTypes(Array.isArray(customerTypes) ? customerTypes : []);
    } catch (error) {
      console.error("Error loading customer types:", error);
      setCustomerTypes([]);
    }
  };

  useEffect(() => {
    fetchCustomerTypes(); // initial fetch

    const interval = setInterval(() => {
      fetchCustomerTypes();
    }, 1000); // 1 second = 1000 milliseconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Customer Type</CardTitle>
              <CardDescription>Manage customer type</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customer types..."
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
                  Add Customer Type
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Customer Type</DialogTitle>
                </DialogHeader>

                <Card className="p-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="create-group-code">Group Code</Label>
                        <Input
                          id="create-group-code"
                          value={formData.groupCode}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              groupCode: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              groupCode: "",
                            }));
                          }}
                          placeholder="GRP001"
                          className={
                            validationErrors.groupCode
                              ? "border-destructive text-sm"
                              : "text-sm"
                          }
                        />
                        {validationErrors.groupCode && (
                          <p className="text-sm text-destructive">
                            {validationErrors.groupCode}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="create-group-name">Group Name</Label>
                        <Input
                          id="create-group-name"
                          value={formData.groupName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              groupName: e.target.value,
                            })
                          }
                          placeholder="Retail Customers"
                          className={
                            validationErrors.groupName
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {validationErrors.groupName && (
                          <p className="text-sm text-destructive">
                            {validationErrors.groupName}
                          </p>
                        )}
                      </div>
                      {/* Discount Fields */}
                      {Array.from({ length: 5 }, (_, i) => {
                        const key = `discount${i + 1}` as keyof typeof formData;
                        return (
                          <div className="grid gap-2" key={key}>
                            <Label htmlFor={`create-${key}`}>{`Discount ${
                              i + 1
                            }`}</Label>
                            <Input
                              id={`create-${key}`}
                              type="number"
                              value={formData[key]}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  [key]: value,
                                }));
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  [key]: "",
                                }));
                              }}
                              placeholder={`0`}
                              className={
                                validationErrors[key]
                                  ? "border-destructive text-sm"
                                  : "text-sm"
                              }
                            />
                            {validationErrors[key] && (
                              <p className="text-sm text-destructive">
                                {validationErrors[key]}
                              </p>
                            )}
                          </div>
                        );
                      })}
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
                      !`${formData.groupCode}`.trim() ||
                      !`${formData.groupName}`.trim() ||
                      !`${formData.discount1}`.trim() ||
                      !`${formData.discount2}`.trim() ||
                      !`${formData.discount3}`.trim() ||
                      !`${formData.discount4}`.trim() ||
                      !`${formData.discount5}`.trim() ||
                      Object.values(validationErrors).some(
                        (error) => error !== ""
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
                ✅ {selectedIds.length} customer type(s) selected
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
                      aria-label="Select all customer types on current page"
                    />
                  </TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Group Code</TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Discount 1</TableHead>
                  <TableHead>Discount 2</TableHead>
                  <TableHead>Discount 3</TableHead>
                  <TableHead>Discount 4</TableHead>
                  <TableHead>Discount 5</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedCustomerTypes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground">
                      No customer types found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomerTypes.map((customer) => (
                    <TableRow
                      key={
                        customer._id ||
                        `${customer.groupCode}-${customer.groupName}`
                      }>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(customer._id)}
                          onCheckedChange={() => toggleSelectOne(customer._id)}
                        />
                      </TableCell>
                      <TableCell>
                        {customer.createdAt
                          ? new Date(customer.createdAt).toISOString()
                          : "—"}
                      </TableCell>
                      <TableCell>{customer.groupCode}</TableCell>
                      <TableCell>{customer.groupName}</TableCell>
                      <TableCell>{customer.discount1}</TableCell>
                      <TableCell>{customer.discount2}</TableCell>
                      <TableCell>{customer.discount3}</TableCell>
                      <TableCell>{customer.discount4}</TableCell>
                      <TableCell>{customer.discount5}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(customer)}
                            title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                            title="Edit Customer Type">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete Customer Type"
                                className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Customer Type
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {customer.groupName}&quot;? This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(customer._id)}>
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
              <span className="text-sm text-gray-600">
                Customer types per page:
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer Type</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Card className="p-4">
              <h4 className="text-m font-bold text-muted-foreground mt-1 text-center">
                General Info
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-group-code">Group Code</Label>
                  <Input
                    id="edit-group-code"
                    value={formData.groupCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({ ...prev, groupCode: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        groupCode: "",
                      }));
                    }}
                    placeholder="GRP001"
                    className={cn(
                      "text-sm",
                      validationErrors.groupCode && "border-destructive"
                    )}
                  />
                  {validationErrors.groupCode && (
                    <p className="text-sm text-destructive">
                      {validationErrors.groupCode}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-group-name">Group Name</Label>
                  <Input
                    id="edit-group-name"
                    value={formData.groupName}
                    onChange={(e) =>
                      setFormData({ ...formData, groupName: e.target.value })
                    }
                    placeholder="Retail Customers"
                    className={cn(
                      "text-sm",
                      validationErrors.groupName && "border-destructive"
                    )}
                  />
                  {validationErrors.groupName && (
                    <p className="text-sm text-destructive">
                      {validationErrors.groupName}
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
                setEditingCustomerType(null);
                resetForm();
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                !formData.groupCode.trim() ||
                !formData.groupName.trim() ||
                !formData.discount1.trim() ||
                !formData.discount2.trim() ||
                !formData.discount3.trim() ||
                !formData.discount4.trim() ||
                !formData.discount5.trim() ||
                Object.values(validationErrors).some((error) => error !== "")
              }>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto rounded-xl p-6">
          <DialogHeader>
            <DialogTitle>Customer Type Details</DialogTitle>
          </DialogHeader>
          {viewingCustomerType && (
            <div className="grid gap-6 py-4">
              <Card className="p-4">
                <h4 className="text-m font-bold text-muted-foreground mt-1 text-center">
                  General Info
                </h4>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Group Code
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingCustomerType.groupCode}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Group Name
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingCustomerType.groupName}
                    </div>
                  </div>
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
