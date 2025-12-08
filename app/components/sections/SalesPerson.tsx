"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Checkbox } from "../ui/checkbox";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Plus, Search, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import type { SalesPersonType } from "./type";
import ViewSalesPerson from "./SalesPersonSub/ViewSalesPerson";

export default function SalesPerson() {
  const [salesPerson, setSalesPerson] = useState<SalesPersonType[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPersonType[]>([]);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof typeof formData, string>>
  >({});
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedSalesPersons, setselectedSalesPersons] = useState<
    SalesPersonType[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFirstFetch = useRef(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectAll, setSelectAll] = useState(false);
  const [viewModalData, setViewModalData] = useState<SalesPersonType | null>(
    null
  );
  const [viewingItem, setViewingItem] = useState<SalesPersonType | null>(null);
  const [isViewItemOpen, setIsViewItemOpen] = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSalesPerson, setEditingSalesPerson] =
    useState<SalesPersonType | null>(null);
  const [formData, setFormData] = useState({
    salesPersonCode: "",
    firstName: "",
    lastName: "",
    emailAddress: "",
    contactNumber: "",
    area: "",
    status: "",
  });

  const initialFormState = {
    salesPersonCode: "",
    firstName: "",
    lastName: "",
    emailAddress: "",
    contactNumber: "",
    area: "",
    status: "ACTIVE",
  };

  const handleDialogToggle = (isOpen: boolean) => {
    setIsCreateDialogOpen(isOpen);

    if (!isOpen) {
      setFormErrors({});
      setFormData(initialFormState); // ← optional: reset to defaults
    }
  };

  const fetchSalesPerson = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("api/salesPersons", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch sales persons");

      const data = await res.json();
      const salesPerson = Array.isArray(data) ? data : data.salesPersons;
      setSalesPerson(Array.isArray(salesPerson) ? salesPerson : []);
    } catch (error) {
      console.error("❌ Error loading sales persons:", error);
      setSalesPerson([]);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    fetchSalesPerson(); // initial fetch

    const interval = setInterval(() => {
      fetchSalesPerson();
    }, 3000); // every 3 seconds

    return () => clearInterval(interval); // cleanup
  }, []);

  // Filter and paginate data
  const filteredItems = salesPerson.filter((salesPerson) => {
    const term = searchTerm.toLowerCase();
    const matchesCode = salesPerson.salesPersonCode
      ?.toLowerCase()
      .includes(term);
    const matchesName = `${salesPerson.firstName ?? ""} ${
      salesPerson.lastName ?? ""
    }`
      .toLowerCase()
      .includes(term);

    return matchesCode || matchesName;
  });

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems: SalesPersonType[] = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const allSelected =
      paginatedItems.length > 0 &&
      paginatedItems.every((item) =>
        selectedSalesPersons.some((i) => i._id === item._id)
      );
    setSelectAll(allSelected);
  }, [selectedSalesPersons, paginatedItems]);

  const handleCreate = async () => {
    const errors: Partial<Record<keyof typeof formData, string>> = {};

    // 🔍 Required field checks
    if (!formData.salesPersonCode.trim()) {
      errors.salesPersonCode = "Sales person code is required.";
    }

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required.";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    // if (!formData.emailAddress.trim()) {
    //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //   if (!emailRegex.test(formData.emailAddress)) {
    //     errors.emailAddress = "Enter a valid email address.";
    //   }
    // }

    // if (!formData.contactNumber.trim()) {
    //   const phoneRegex = /^\+?\d{10,15}$/;
    //   if (!phoneRegex.test(formData.contactNumber)) {
    //     errors.contactNumber = "Enter a valid contact number.";
    //   }
    // }

    if (!formData.area.trim()) {
      errors.area = "Area is required.";
    }

    // ⛔ Block submission if there are errors
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please correct the highlighted fields.");
      return;
    }

    // ✅ Proceed with submission
    const payload = {
      createdDT: new Date(),
      salesPersonCode: formData.salesPersonCode,
      firstName: formData.firstName,
      lastName: formData.lastName,
      emailAddress: formData.emailAddress,
      contactNumber: formData.contactNumber,
      area: formData.area,
      status: formData.status,
    };

    try {
      const res = await fetch("api/salesPersons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("Create result:", result);

      if (!res.ok)
        throw new Error(result.message || "Failed to create sales person");

      setSalesPersons((prev) => [
        ...prev,
        { ...payload, _id: Date.now().toString() },
      ]);

      toast.success("Sales person created successfully");

      // ✅ Reset form only after success
      setFormData({
        salesPersonCode: "",
        firstName: "",
        lastName: "",
        emailAddress: "",
        contactNumber: "",
        area: "",
        status: "active",
      });

      setFormErrors({});
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating sales person:", error);
      toast.error("Failed to create sales person");
    }
  };

  const handleEdit = (person: SalesPersonType) => {
    setEditingSalesPerson(person);
    setFormData({
      salesPersonCode: person.salesPersonCode,
      firstName: person.firstName,
      lastName: person.lastName,
      emailAddress: person.emailAddress,
      contactNumber: person.contactNumber,
      area: person.area,
      status: person.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    const errors: Partial<Record<keyof typeof formData, string>> = {};

    if (!formData.salesPersonCode.trim()) {
      errors.salesPersonCode = "Sales person code is required.";
    }

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required.";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    if (!formData.area.trim()) {
      errors.area = "Area is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please correct the highlighted fields.");
      return;
    }

    if (!editingSalesPerson) return;

    const updatedSalesPerson: SalesPersonType = {
      ...editingSalesPerson,
      salesPersonCode: formData.salesPersonCode,
      firstName: formData.firstName,
      lastName: formData.lastName,
      emailAddress: formData.emailAddress,
      contactNumber: formData.contactNumber,
      area: formData.area,
      status: formData.status,
    };

    try {
      const res = await fetch(`api/salesPersons/${updatedSalesPerson._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSalesPerson),
      });

      if (!res.ok) throw new Error("Failed to update sales person");

      const updated = await res.json();

      // Update local state
      setSalesPersons((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    } catch (error) {
      console.error("Error updating sales person:", error);
    }

    setEditingSalesPerson(null);
    setFormData({
      salesPersonCode: "",
      firstName: "",
      lastName: "",
      emailAddress: "",
      contactNumber: "",
      area: "",
      status: "active",
    });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`api/salesPersons/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete sales person");

      // Update local state after successful deletion
      setSalesPersons((prev) => prev.filter((person) => person._id !== id));
    } catch (error) {
      console.error("Error deleting sales person:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Person</CardTitle>
          <CardDescription>Manage Sales Person</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search sales persons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(isOpen) => {
                setIsCreateDialogOpen(isOpen);
                if (!isOpen) {
                  setFormData(initialFormState); // 🧹 Reset all fields
                  setFormErrors({}); // 🧹 Clear validation errors on close
                }
              }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Sales Person
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Sales Person</DialogTitle>
                </DialogHeader>

                {Object.keys(formErrors).length > 0 && (
                  <div
                    className="flex items-start gap-2 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-sm mb-4"
                    role="alert">
                    <svg
                      className="w-5 h-5 mt-0.5 text-red-500 shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 0114.14 0M4.93 19.07a10 10 0 010-14.14"
                      />
                    </svg>
                    <div className="text-sm leading-relaxed">
                      <strong className="block font-medium mb-1">
                        Fill out the required fields.
                      </strong>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-code">Sales Person Code</Label>
                    <Input
                      id="create-code"
                      value={formData.salesPersonCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salesPersonCode: e.target.value.toUpperCase(), // Force uppercase
                        })
                      }
                      placeholder="SP001"
                      className={`w-full ${
                        formErrors.salesPersonCode
                          ? "border-red-500 ring-red-500"
                          : ""
                      }`}
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="create-first-name">First Name</Label>
                      <Input
                        id="create-first-name"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value.toUpperCase(), // Enforce uppercase
                          })
                        }
                        placeholder="JOHN"
                        className={`w-full ${
                          formErrors.firstName
                            ? "border-red-500 ring-red-500"
                            : ""
                        }`}
                      />
                      {formErrors.firstName && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="create-last-name">Last Name</Label>
                      <Input
                        id="create-last-name"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lastName: e.target.value.toUpperCase(), // Enforce uppercase
                          })
                        }
                        placeholder="SMITH"
                        className={`w-full ${
                          formErrors.lastName
                            ? "border-red-500 ring-red-500"
                            : ""
                        }`}
                      />
                      {formErrors.lastName && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="create-email">Email Address</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase(); // Enforce uppercase
                        setFormData({ ...formData, emailAddress: value });

                        // Conditional validation: only validate if not empty
                        const isValidEmail =
                          value === "" ||
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

                        setFormErrors({
                          ...formErrors,
                          emailAddress: isValidEmail
                            ? ""
                            : "Enter a valid email address.",
                        });
                      }}
                      placeholder="JOHN.SMITH@COMPANY.COM"
                      className={
                        formErrors.emailAddress
                          ? "border-red-500 ring-red-500"
                          : ""
                      }
                    />
                    {formErrors.emailAddress && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.emailAddress}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="create-contact">Contact Number</Label>
                    <Input
                      id="create-contact"
                      value={formData.contactNumber}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const sanitized = raw.replace(/(?!^\+)\D/g, ""); // Allow digits and leading '+'
                        setFormData({ ...formData, contactNumber: sanitized });
                      }}
                      placeholder="+639123456789"
                      className={
                        formErrors.contactNumber
                          ? "border-red-500 ring-red-500"
                          : ""
                      }
                    />
                    {formErrors.contactNumber && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.contactNumber}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="create-area">Area</Label>
                    <Input
                      id="create-area"
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          area: e.target.value.toUpperCase(), // Enforce uppercase
                        })
                      }
                      placeholder="ENTER AREA"
                      className={
                        formErrors.area ? "border-red-500 ring-red-500" : ""
                      }
                    />
                    {formErrors.area && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.area}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="create-status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "active" | "inactive") =>
                          setFormData({ ...formData, status: value })
                        }>
                        <SelectTrigger
                          className={
                            formErrors.status
                              ? "border-red-500 ring-red-500"
                              : ""
                          }>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.status && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors.status}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false); // Close the dialog
                      setFormErrors({}); // Clear all error messages
                      setFormData(initialFormState); // Reset form fields
                    }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            {selectedSalesPersons.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  ✅ {selectedSalesPersons.length} item(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      try {
                        await Promise.all(
                          selectedSalesPersons.map((salesPerson) =>
                            fetch(`api/salesPersons/${salesPerson._id}`, {
                              method: "DELETE",
                            })
                          )
                        );
                        setselectedSalesPersons([]);
                        fetchSalesPerson();
                      } catch (err) {
                        console.error("Bulk delete failed:", err);
                      }
                    }}>
                    Delete Selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setselectedSalesPersons([])}
                    className="text-red-600 hover:text-red-700">
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectAll(checked);

                          if (checked) {
                            const newSelections = [
                              ...selectedSalesPersons,
                              ...paginatedItems.filter(
                                (item) =>
                                  !selectedSalesPersons.some(
                                    (i) => i._id === item._id
                                  )
                              ),
                            ];
                            setselectedSalesPersons(newSelections);
                          } else {
                            const remaining = selectedSalesPersons.filter(
                              (i) =>
                                !paginatedItems.some((p) => p._id === i._id)
                            );
                            setselectedSalesPersons(remaining);
                          }
                        }}
                        className="accent-black"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Creation Date
                      </span>
                    </div>
                  </TableHead>
                  <TableHead>Sales Person Code</TableHead>
                  <TableHead>Sales Person Name</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-48 px-4 text-muted-foreground">
                      <div className="flex h-full items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-medium tracking-wide">
                          Loading salespersons…
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground">
                      No salespersons found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((salesPerson) => (
                    <TableRow
                      key={salesPerson._id}
                      className={
                        selectedSalesPersons.some(
                          (i) => i._id === salesPerson._id
                        )
                          ? "bg-blue-50"
                          : ""
                      }>
                      <TableCell>
                        <Checkbox
                          checked={selectedSalesPersons.some(
                            (i) => i._id === salesPerson._id
                          )}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setselectedSalesPersons((prev) =>
                                prev.some((p) => p._id === salesPerson._id)
                                  ? prev
                                  : [...prev, salesPerson]
                              );
                            } else {
                              setselectedSalesPersons((prev) =>
                                prev.filter((i) => i._id !== salesPerson._id)
                              );
                            }
                          }}
                          className="mr-2"
                        />
                        {new Date(salesPerson.createdDT).toLocaleDateString(
                          "en-PH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </TableCell>

                      <TableCell>{salesPerson.salesPersonCode}</TableCell>
                      <TableCell>
                        {salesPerson.salesPersonName || "—"}
                      </TableCell>
                      <TableCell>{salesPerson.emailAddress}</TableCell>
                      <TableCell
                        className={
                          salesPerson.status === "ACTIVE"
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }>
                        {salesPerson.status}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setViewingItem(salesPerson);
                              setIsViewItemOpen(true);
                            }}
                            className="gap-2">
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditingSalesPerson(salesPerson); // Optional: for tracking ID

                              setFormData({
                                salesPersonCode: salesPerson.salesPersonCode,
                                firstName: salesPerson.firstName,
                                lastName: salesPerson.lastName,
                                emailAddress: salesPerson.emailAddress,
                                contactNumber: salesPerson.contactNumber,
                                area: salesPerson.area,
                                status: salesPerson.status,
                              });

                              setIsEditDialogOpen(true); // Open the dialog
                            }}
                            className="gap-2">
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Sales Person
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{" "}
                                  {salesPerson.firstName && salesPerson.lastName
                                    ? `${salesPerson.firstName} ${salesPerson.lastName}`
                                    : salesPerson.firstName ||
                                      salesPerson.lastName ||
                                      "this sales person"}
                                  ? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(salesPerson._id)}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer">
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);

          if (!isOpen) {
            setFormErrors({});
            setFormData(initialFormState); // Reset form on close
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sales Person</DialogTitle>
          </DialogHeader>
          {Object.keys(formErrors).length > 0 && (
            <div
              className="flex items-start gap-2 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-sm mb-4"
              role="alert">
              <svg
                className="w-5 h-5 mt-0.5 text-red-500 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 0114.14 0M4.93 19.07a10 10 0 010-14.14"
                />
              </svg>
              <div className="text-sm leading-relaxed">
                <strong className="block font-medium mb-1">
                  Fill out the required fields.
                </strong>
              </div>
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Sales Person Code</Label>
              <Input
                id="edit-code"
                value={formData.salesPersonCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salesPersonCode: e.target.value.toUpperCase(),
                  })
                }
                className={formErrors.salesPersonCode ? "border-red-500" : ""}
              />
              {formErrors.salesPersonCode && (
                <p className="text-sm text-red-500">
                  {formErrors.salesPersonCode}
                </p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      firstName: e.target.value.toUpperCase(),
                    })
                  }
                  className={formErrors.firstName ? "border-red-500" : ""}
                  placeholder="Juan"
                />
                {formErrors.firstName && (
                  <p className="text-sm text-red-500">{formErrors.firstName}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lastName: e.target.value.toUpperCase(),
                    })
                  }
                  className={formErrors.lastName ? "border-red-500" : ""}
                  placeholder="Dela Cruz"
                />
                {formErrors.lastName && (
                  <p className="text-sm text-red-500">{formErrors.lastName}</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-contact-number">Contact Number</Label>
              <Input
                id="edit-contact-number"
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => {
                  const raw = e.target.value;
                  const sanitized = raw.replace(/(?!^\+)\D/g, ""); // Allow digits and leading '+'
                  setFormData({ ...formData, contactNumber: sanitized });
                }}
                className={formErrors.contactNumber ? "border-red-500" : ""}
                placeholder="+639123456789"
              />
              {formErrors.contactNumber && (
                <p className="text-sm text-red-500">
                  {formErrors.contactNumber}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.emailAddress}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase(); // Enforce uppercase
                  setFormData({ ...formData, emailAddress: value });

                  // Validate only if not empty
                  const isValidEmail =
                    value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

                  setFormErrors({
                    ...formErrors,
                    emailAddress: isValidEmail
                      ? ""
                      : "Enter a valid email address.",
                  });
                }}
                className={formErrors.emailAddress ? "border-red-500" : ""}
                placeholder="JUAN.DELACRUZ@EXAMPLE.COM"
              />
              {formErrors.emailAddress && (
                <p className="text-sm text-red-500">
                  {formErrors.emailAddress}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-area">Area</Label>
              <Input
                id="edit-area"
                type="text"
                value={formData.area}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    area: e.target.value.toUpperCase(),
                  })
                }
                className={formErrors.area ? "border-red-500" : ""}
                placeholder="area"
              />
              {formErrors.area && (
                <p className="text-sm text-red-500">{formErrors.area}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }>
                <SelectTrigger
                  id="edit-status"
                  className={formErrors.status ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-sm text-red-500">{formErrors.status}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </div>
        </DialogContent>
        <div className="flex items-center justify-between mt-4">
          {/* Rows per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Sales Persons per page:
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
        <ViewSalesPerson
          isOpen={isViewItemOpen}
          onOpenChange={setIsViewItemOpen}
          salesPerson={viewingItem}
          onDelete={handleDelete}
          onEditRequest={handleEdit}
        />
      </Dialog>
    </div>
  );
}
