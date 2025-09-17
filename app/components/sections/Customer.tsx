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

import type { Customer } from "./type";
import { SalesPersonType } from "./type";
import { CustomerType } from "./type";
import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { cn } from "../ui/utils";

type Props = {
  onSuccess?: () => void;
};

export default function Customer({ onSuccess }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [salesPersons, setSalesPersons] = useState<SalesPersonType[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);

  const getDisplayName = (person: SalesPersonType): string =>
    [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unnamed";

  useEffect(() => {
    console.log("Fetching salesPersons...");

    fetch("/api/salesPersons")
      .then((res) => res.json())
      .then((response) => {
        console.log("Raw response:", response);

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response.salesPersons)
          ? response.salesPersons
          : [];

        console.log("Parsed salesPersons:", data);
        setSalesPersons(data);
      })
      .catch((err) => console.error("Failed to fetch sales persons", err));
  }, []);

  useEffect(() => {
    console.log("Fetching customer types...");

    fetch("/api/customer-types")
      .then((res) => res.json())
      .then((response) => {
        console.log("Raw response:", response);

        const data = Array.isArray(response.items) ? response.items : [];
        console.log("Parsed customerTypes:", data);

        setCustomerTypes(data);
      })
      .catch((err) => console.error("Failed to fetch customer types", err));
  }, []);

  const router = useRouter();

  const [formData, setFormData] = useState({
    customerCode: "",
    customerName: "",
    address: "",
    contactPerson: "",
    contactNumber: "",
    emailAddress: "",
    TIN: "",
    customerGroup: "",
    salesAgent: "",
    terms: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    customerCode: "",
    customerName: "",
    address: "",
    contactPerson: "",
    contactNumber: "",
    emailAddress: "",
    TIN: "",
    customerGroup: "", // ← required for relational validation
    salesAgent: "",
    terms: "",
  });

  // Filter and paginate data
  const filteredCustomers = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return customers.filter((customer) => {
      const name = customer.customerName?.toLowerCase() || "";
      const code = customer.customerCode?.toLowerCase() || "";

      return name.includes(query) || code.includes(query);
    });
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);

  const paginatedCustomers: Customer[] = filteredCustomers.slice(
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
      customerCode: "",
      customerName: "",
      address: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      TIN: "",
      customerGroup: "", // ← added for completeness
      salesAgent: "",
      terms: "",
    };

    // Required: customerCode
    if (!formData.customerCode.trim()) {
      errors.customerCode = "Customer Code is required";
    } else {
      const duplicateCode = customers.find(
        (c) =>
          c.customerCode.toLowerCase() ===
            formData.customerCode.toLowerCase() &&
          (!isEdit || c._id !== editingCustomer?._id)
      );
      if (duplicateCode) {
        errors.customerCode = "Customer Code already exists";
      }
    }

    // Required: customerName
    if (!formData.customerName.trim()) {
      errors.customerName = "Customer Name is required";
    } else {
      const duplicateName = customers.find(
        (c) =>
          c.customerName.toLowerCase() ===
            formData.customerName.toLowerCase() &&
          (!isEdit || c._id !== editingCustomer?._id)
      );
      if (duplicateName) {
        errors.customerName = "Customer Name already exists";
      }
    }

    // Required: address
    // if (!formData.address.trim()) {
    //   errors.address = "Address is required";
    // }

    // Required: contactPerson
    // if (!formData.contactPerson.trim()) {
    //   errors.contactPerson = "Contact Person is required";
    // }

    // Required: contactNumber
    // if (!formData.contactNumber.trim()) {
    //   errors.contactNumber = "Contact Number is required";
    // }

    // Required: emailAddress
    // if (!formData.emailAddress.trim()) {
    //   errors.emailAddress = "Email Address is required";
    // } else if (
    //   !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress.trim())
    // ) {
    //   errors.emailAddress = "Invalid email format";
    // }

    // Required: TIN
    // if (!formData.TIN.trim()) {
    //   errors.TIN = "TIN is required";
    // }

    // Required: customerGroup
    // if (!formData.customerGroup.trim()) {
    //   errors.customerGroup = "Customer Group is required";
    // }

    // Required: salesAgent
    // if (!formData.salesAgent.trim()) {
    //   errors.salesAgent = "Sales Agent is required";
    // }

    // Required: terms
    // if (!formData.terms.trim()) {
    //   errors.terms = "Terms is required";
    // }

    setValidationErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    const payload = {
      customerCode: formData.customerCode.toUpperCase().trim(),
      customerName: formData.customerName.toUpperCase().trim(),
      address: formData.address.toUpperCase().trim(),
      contactPerson: formData.contactPerson.toUpperCase().trim(),
      contactNumber: formData.contactNumber.trim(),
      emailAddress: formData.emailAddress.toLowerCase().trim(),
      TIN: formData.TIN.trim(),
      customerGroup: formData.customerGroup.toUpperCase().trim(), // ← added
      salesAgent: formData.salesAgent.toUpperCase().trim(),
      terms: formData.terms.toUpperCase().trim(),
    };

    console.log("Creating customer:", payload);

    try {
      const res = await fetch("/api/customers", {
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
        alert("Failed to create customer. Please try again.");
        return;
      }

      toast.success("Customer created successfully!");

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

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);

    setFormData({
      customerCode: customer.customerCode || "",
      customerName: customer.customerName || "",
      address: customer.address || "",
      contactPerson: customer.contactPerson || "",
      contactNumber: customer.contactNumber || "",
      emailAddress: customer.emailAddress || "",
      TIN: customer.TIN || "",
      customerGroup: customer.customerGroup || "", // ← added
      salesAgent: customer.salesAgent || "",
      terms: customer.terms || "",
    });

    setValidationErrors({
      customerCode: "",
      customerName: "",
      address: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      TIN: "",
      customerGroup: "", // ← required for validation completeness
      salesAgent: "",
      terms: "",
    });

    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingCustomer || !validateForm(true)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${editingCustomer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerCode: formData.customerCode.trim().toUpperCase(),
          customerName: formData.customerName.trim().toUpperCase(),
          address: formData.address.trim().toUpperCase(),
          contactPerson: formData.contactPerson.trim().toUpperCase(),
          contactNumber: formData.contactNumber.trim(),
          emailAddress: formData.emailAddress.trim().toLowerCase(),
          TIN: formData.TIN.trim(),
          salesAgent: formData.salesAgent.trim().toUpperCase(),
          terms: formData.terms.trim().toUpperCase(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update customer");
      }

      const updatedCustomer = await res.json();

      // Update local state
      setCustomers((prev) =>
        prev.map((c) => (c._id === editingCustomer._id ? updatedCustomer : c))
      );
    } catch (err) {
      console.error("Update error:", err);
      return;
    }

    // Reset form and close dialog
    setEditingCustomer(null);
    setFormData({
      customerCode: "",
      customerName: "",
      address: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      TIN: "",
      customerGroup: "", // ← required field
      salesAgent: "",
      terms: "",
    });
    setValidationErrors({
      customerCode: "",
      customerName: "",
      address: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      TIN: "",
      customerGroup: "", // ← required for completeness
      salesAgent: "",
      terms: "",
    });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete customer");

      // Update local state after successful deletion
      setCustomers((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer);
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
    setFormData({
      customerCode: "",
      customerName: "",
      address: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      TIN: "",
      customerGroup: "", // ← required field
      salesAgent: "",
      terms: "",
    });

    setValidationErrors({
      customerCode: "",
      customerName: "",
      address: "",
      contactPerson: "",
      contactNumber: "",
      emailAddress: "",
      TIN: "",
      customerGroup: "", // ← required for completeness
      salesAgent: "",
      terms: "",
    });
  };

  const allSelected =
    paginatedCustomers.length > 0 &&
    selectedIds.length === paginatedCustomers.length;

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      // Select all customers on current page
      const newSelections = [
        ...selectedIds,
        ...paginatedCustomers
          .filter((c) => !selectedIds.includes(c._id))
          .map((c) => c._id),
      ];
      setSelectedIds(newSelections);
    } else if (checked === false) {
      // Unselect all customers on current page
      const remaining = selectedIds.filter(
        (id) => !paginatedCustomers.some((c) => c._id === id)
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
      setCustomers((prev) => prev.filter((c) => !_ids.includes(c._id)));

      const results = await Promise.all(
        _ids.map(async (_id) => {
          const res = await fetch(`/api/customers/${_id}`, {
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
          `Some customers could not be deleted (${failures.length} failed).`
        );
      } else {
        toast.success("Selected customers deleted.");
      }

      setSelectedIds([]);
      onSuccess?.(); // refresh list
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Failed to delete selected customers.");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch customers");

      const data = await res.json();
      const customers = Array.isArray(data) ? data : data.items;

      setCustomers(Array.isArray(customers) ? customers : []);
    } catch (error) {
      console.error("Error loading customers:", error);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers(); // initial fetch

    const interval = setInterval(() => {
      fetchCustomers();
    }, 1000); // 1 second polling

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Manage customers</CardDescription>
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
                  Add Customer
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>

                <Card className="p-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Customer Code */}
                      <div className="grid gap-2">
                        <Label htmlFor="create-customer-code">
                          Customer Code
                        </Label>
                        <Input
                          id="create-customer-code"
                          value={formData.customerCode}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            setFormData((prev) => ({
                              ...prev,
                              customerCode: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              customerCode: "",
                            }));
                          }}
                          placeholder="CUST001"
                          className={
                            validationErrors.customerCode
                              ? "border-destructive text-sm uppercase"
                              : "text-sm uppercase"
                          }
                        />
                        {validationErrors.customerCode && (
                          <p className="text-sm text-destructive">
                            {validationErrors.customerCode}
                          </p>
                        )}
                      </div>

                      {/* Customer Name */}
                      <div className="grid gap-2">
                        <Label htmlFor="create-customer-name">
                          Customer Name
                        </Label>
                        <Input
                          id="create-customer-name"
                          value={formData.customerName}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            setFormData((prev) => ({
                              ...prev,
                              customerName: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              customerName: "",
                            }));
                          }}
                          placeholder="Juan Dela Cruz Enterprises"
                          className={`text-sm uppercase ${
                            validationErrors.customerName
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        {validationErrors.customerName && (
                          <p className="text-sm text-destructive">
                            {validationErrors.customerName}
                          </p>
                        )}
                      </div>

                      {/* Address */}
                      <div className="grid gap-2 col-span-2">
                        <Label htmlFor="create-address">Address</Label>
                        <Input
                          id="create-address"
                          value={formData.address}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
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

                      {/* Contact Person */}
                      <div className="grid gap-2">
                        <Label htmlFor="create-contact-person">
                          Contact Person
                        </Label>
                        <Input
                          id="create-contact-person"
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
                          placeholder="Maria Santos"
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

                      {/* Contact Number */}
                      <div className="grid gap-2">
                        <Label htmlFor="create-contact-number">
                          Contact Number
                        </Label>
                        <Input
                          id="create-contact-number"
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.contactNumber}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const numeric = raw.replace(/[^0-9]/g, ""); // strip non-numeric characters
                            setFormData((prev) => ({
                              ...prev,
                              contactNumber: numeric,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              contactNumber: "",
                            }));
                          }}
                          placeholder="09123456789"
                          className={`text-sm ${
                            validationErrors.contactNumber
                              ? "border-destructive"
                              : ""
                          }`}
                          maxLength={11}
                        />
                        {validationErrors.contactNumber && (
                          <p className="text-sm text-destructive">
                            {validationErrors.contactNumber}
                          </p>
                        )}
                      </div>

                      {/* Email Address */}
                      <div className="grid gap-2 col-span-2">
                        <Label htmlFor="create-email-address">
                          Email Address
                        </Label>
                        <Input
                          id="create-email-address"
                          type="email"
                          value={formData.emailAddress}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().trim();
                            setFormData((prev) => ({
                              ...prev,
                              emailAddress: value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              emailAddress: "",
                            }));
                          }}
                          placeholder="customer@email.com"
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

                      {/* TIN */}
                      <div className="grid gap-2">
                        <Label htmlFor="create-tin">TIN</Label>
                        <Input
                          id="create-tin"
                          value={formData.TIN}
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            setFormData((prev) => ({ ...prev, TIN: value }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              TIN: "",
                            }));
                          }}
                          placeholder="123-456-789-000"
                          className={`text-sm ${
                            validationErrors.TIN ? "border-destructive" : ""
                          }`}
                        />
                        {validationErrors.TIN && (
                          <p className="text-sm text-destructive">
                            {validationErrors.TIN}
                          </p>
                        )}
                      </div>

                      {/* Sales Agent */}
                      <div className="grid gap-2">
                        <Label htmlFor="create-sales-agent">Sales Agent</Label>
                        <Select
                          value={formData.salesAgent}
                          onValueChange={(value) => {
                            const normalized = value.toUpperCase().trim();
                            setFormData((prev) => ({
                              ...prev,
                              salesAgent: normalized,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              salesAgent: "",
                            }));
                          }}>
                          <SelectTrigger
                            className={`text-sm uppercase w-full ${
                              validationErrors.salesAgent
                                ? "border-destructive"
                                : ""
                            }`}>
                            {formData.salesAgent || "Select Sales Agent"}
                          </SelectTrigger>

                          <SelectContent>
                            {Array.isArray(salesPersons) &&
                              salesPersons.map((person) => {
                                const label = getDisplayName(person); // e.g. "John Doe" or "Unnamed"
                                return (
                                  <SelectItem
                                    key={person._id}
                                    value={label.toUpperCase()}>
                                    {label}
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>

                        {validationErrors.salesAgent && (
                          <p className="text-sm text-destructive">
                            {validationErrors.salesAgent}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="create-customer-group">
                          Customer Group
                        </Label>
                        <Select
                          value={formData.customerGroup}
                          onValueChange={(value) => {
                            const normalized = value.toUpperCase().trim();
                            setFormData((prev) => ({
                              ...prev,
                              customerGroup: normalized,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              customerGroup: "",
                            }));
                          }}>
                          <SelectTrigger
                            className={`text-sm uppercase w-full ${
                              validationErrors.customerGroup
                                ? "border-destructive"
                                : ""
                            }`}>
                            {formData.customerGroup || "Select Customer Group"}
                          </SelectTrigger>

                          <SelectContent>
                            {Array.isArray(customerTypes) &&
                              customerTypes.map((group) => {
                                const label =
                                  group.groupName || "Unnamed Group";
                                return (
                                  <SelectItem
                                    key={group._id}
                                    value={label.toUpperCase()}>
                                    {label}
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>

                        {validationErrors.customerGroup && (
                          <p className="text-sm text-destructive">
                            {validationErrors.customerGroup}
                          </p>
                        )}
                      </div>

                      {/* Terms */}
                      <div className="grid gap-2 col-span-2">
                        <Label htmlFor="create-terms">Terms</Label>
                        <Input
                          id="create-terms"
                          value={formData.terms}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().trim();
                            setFormData((prev) => ({ ...prev, terms: value }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              terms: "",
                            }));
                          }}
                          placeholder="COD / 30 DAYS"
                          className={`text-sm uppercase ${
                            validationErrors.terms ? "border-destructive" : ""
                          }`}
                        />
                        {validationErrors.terms && (
                          <p className="text-sm text-destructive">
                            {validationErrors.terms}
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
                    // disabled={
                    //   !formData.customerCode.trim() ||
                    //   !formData.customerName.trim() ||
                    //   Object.values(validationErrors).some(
                    //     (error) => error !== ""
                    //   )
                    // }>
                  >
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
                  <TableHead>Customer Code</TableHead>
                  <TableHead>Customer Name</TableHead>

                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <TableRow
                      key={
                        customer._id ||
                        `${customer.customerCode}-${customer.customerName}`
                      }>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(customer._id)}
                          onCheckedChange={() => toggleSelectOne(customer._id)}
                        />
                      </TableCell>
                      <TableCell>
                        {customer.createdAt
                          ? formatDate(customer.createdAt)
                          : "—"}
                      </TableCell>
                      <TableCell>{customer.customerCode}</TableCell>
                      <TableCell>{customer.customerName}</TableCell>

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
                            title="Edit Customer">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete Customer"
                                className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Customer
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {customer.customerName}&quot;? This action
                                  cannot be undone.
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
              <span className="text-sm text-gray-600">Customers per page:</span>
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
                {/* Customer Code */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-customer-code">Customer Code</Label>
                  <Input
                    id="edit-customer-code"
                    value={formData.customerCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({ ...prev, customerCode: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        customerCode: "",
                      }));
                    }}
                    placeholder="CUST001"
                    className={cn(
                      "text-sm uppercase",
                      validationErrors.customerCode && "border-destructive"
                    )}
                  />
                  {validationErrors.customerCode && (
                    <p className="text-sm text-destructive">
                      {validationErrors.customerCode}
                    </p>
                  )}
                </div>

                {/* Customer Name */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-customer-name">Customer Name</Label>
                  <Input
                    id="edit-customer-name"
                    value={formData.customerName}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({ ...prev, customerName: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        customerName: "",
                      }));
                    }}
                    placeholder="Retail Client Inc."
                    className={cn(
                      "text-sm uppercase",
                      validationErrors.customerName && "border-destructive"
                    )}
                  />
                  {validationErrors.customerName && (
                    <p className="text-sm text-destructive">
                      {validationErrors.customerName}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({ ...prev, address: value }));
                      setValidationErrors((prev) => ({ ...prev, address: "" }));
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
                    placeholder="Maria Santos"
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
                    value={formData.contactNumber}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setFormData((prev) => ({
                        ...prev,
                        contactNumber: value,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        contactNumber: "",
                      }));
                    }}
                    placeholder="09123456789"
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
                      const value = e.target.value.toLowerCase().trim();
                      setFormData((prev) => ({ ...prev, emailAddress: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        emailAddress: "",
                      }));
                    }}
                    placeholder="customer@email.com"
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

                {/* TIN */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-tin">TIN</Label>
                  <Input
                    id="edit-tin"
                    value={formData.TIN}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setFormData((prev) => ({ ...prev, TIN: value }));
                      setValidationErrors((prev) => ({ ...prev, TIN: "" }));
                    }}
                    placeholder="123-456-789-000"
                    className={cn(
                      "text-sm",
                      validationErrors.TIN && "border-destructive"
                    )}
                  />
                  {validationErrors.TIN && (
                    <p className="text-sm text-destructive">
                      {validationErrors.TIN}
                    </p>
                  )}
                </div>

                {/* Sales Agent */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-sales-agent">Sales Agent</Label>
                  <Input
                    id="edit-sales-agent"
                    value={formData.salesAgent}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().trim();
                      setFormData((prev) => ({ ...prev, salesAgent: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        salesAgent: "",
                      }));
                    }}
                    placeholder="AGENT001"
                    className={cn(
                      "text-sm uppercase",
                      validationErrors.salesAgent && "border-destructive"
                    )}
                  />
                  {validationErrors.salesAgent && (
                    <p className="text-sm text-destructive">
                      {validationErrors.salesAgent}
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="edit-terms">Terms</Label>
                  <Input
                    id="edit-terms"
                    value={formData.terms}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().trim();
                      setFormData((prev) => ({ ...prev, terms: value }));
                      setValidationErrors((prev) => ({ ...prev, terms: "" }));
                    }}
                    placeholder="COD / 30 DAYS"
                    className={cn(
                      "text-sm uppercase",
                      validationErrors.terms && "border-destructive"
                    )}
                  />
                  {validationErrors.terms && (
                    <p className="text-sm text-destructive">
                      {validationErrors.terms}
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
                setEditingCustomer(null);
                resetForm();
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                !formData.customerCode.trim() ||
                !formData.customerName.trim() ||
                !formData.address.trim() ||
                !formData.contactPerson.trim() ||
                !formData.contactNumber.trim() ||
                !formData.emailAddress.trim() ||
                !formData.TIN.trim() ||
                !formData.salesAgent.trim() ||
                !formData.terms.trim() ||
                Object.values(validationErrors).some((error) => error !== "")
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
            <DialogTitle>Customer Type Details</DialogTitle>
          </DialogHeader>
          {viewingCustomer && (
            <div className="grid gap-6 py-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {/* Customer Code */}
                  {viewingCustomer.customerCode && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Customer Code
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.customerCode}
                      </div>
                    </div>
                  )}

                  {/* Customer Name */}
                  {viewingCustomer.customerName && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Customer Name
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.customerName}
                      </div>
                    </div>
                  )}

                  {/* Contact Person */}
                  {viewingCustomer.contactPerson && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Contact Person
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.contactPerson}
                      </div>
                    </div>
                  )}

                  {/* Contact Number */}
                  {viewingCustomer.contactNumber && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Contact Number
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.contactNumber}
                      </div>
                    </div>
                  )}

                  {/* Email Address */}
                  {viewingCustomer.emailAddress && (
                    <div className="flex flex-col gap-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">
                        Email Address
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.emailAddress}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {viewingCustomer.address && (
                    <div className="flex flex-col gap-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">
                        Address
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.address}
                      </div>
                    </div>
                  )}

                  {/* TIN */}
                  {viewingCustomer.TIN && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        TIN
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.TIN}
                      </div>
                    </div>
                  )}

                  {/* Customer Group */}
                  {viewingCustomer.customerGroup && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Customer Group
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.customerGroup}
                      </div>
                    </div>
                  )}

                  {/* Sales Agent */}
                  {viewingCustomer.salesAgent && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Sales Agent
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.salesAgent}
                      </div>
                    </div>
                  )}

                  {/* Terms */}
                  {viewingCustomer.terms && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Terms
                      </Label>
                      <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                        {viewingCustomer.terms}
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
