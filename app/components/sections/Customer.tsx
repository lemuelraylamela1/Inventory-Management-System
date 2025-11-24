"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Eye, Loader2 } from "lucide-react";
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
  DialogPanel,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
  const [isLoading, setIsLoading] = useState(true);
  const isFirstFetch = useRef(true);
  const [salesAgentSuggestions, setSalesAgentSuggestions] = useState<
    SalesPersonType[]
  >([]);
  const [isSalesAgentFocused, setIsSalesAgentFocused] = useState(false);
  const [customerGroupSuggestions, setCustomerGroupSuggestions] = useState<
    CustomerType[]
  >([]);
  const [isCustomerGroupFocused, setIsCustomerGroupFocused] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CustomerType | null>(null);
  // At the top of your component

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

  const handleSalesAgentSearch = (keyword: string) => {
    if (!keyword.trim()) {
      setSalesAgentSuggestions(salesPersons);
      return;
    }

    const filtered = salesPersons.filter((p) =>
      getDisplayName(p).toLowerCase().includes(keyword.toLowerCase())
    );

    setSalesAgentSuggestions(filtered);
  };

  const handleSalesAgentSelect = (agent: string) => {
    setFormData((prev) => ({
      ...prev,
      salesAgent: agent,
    }));

    setSalesAgentSuggestions([]);
    setIsSalesAgentFocused(false);
  };

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

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setFormData({
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
      setSelectedGroup(null); // remove discounts when dialog closes
      setIsCustomerGroupFocused(false); // Reset focus when create dialog closes
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setFormData({
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
      setSelectedGroup(null); // remove discounts when dialog closes
      setIsCustomerGroupFocused(false); // Reset focus when create dialog closes
    }
  }, [isEditDialogOpen]);

  useEffect(() => {
    if (!isViewDialogOpen) {
      setFormData({
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
      setSelectedGroup(null); // remove discounts when dialog closes
      setIsCustomerGroupFocused(false); // Reset focus when create dialog closes
    }
  }, [isViewDialogOpen]);

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
      customerGroup: customer.customerGroup || "",
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
      customerGroup: "",
      salesAgent: "",
      terms: "",
    });

    // ✅ Set selectedGroup to match the customer's group for showing discounts
    const group = customerTypes.find(
      (g) =>
        g.groupName.toUpperCase() ===
        (customer.customerGroup || "").toUpperCase()
    );
    setSelectedGroup(group || null);

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
          customerGroup: formData.customerGroup.trim().toUpperCase(),
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

  // Customer Group handlers for Edit Dialog
  const handleCustomerGroupChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value.toUpperCase();
    setFormData((prev) => ({ ...prev, customerGroup: val }));

    if (!val.trim()) {
      setCustomerGroupSuggestions(customerTypes || []);
      setSelectedGroup(null); // remove discounts if empty
      return;
    }

    const filtered = customerTypes.filter((group) =>
      group.groupName.toUpperCase().includes(val)
    );
    setCustomerGroupSuggestions(filtered);
    setSelectedGroup(null); // reset selected group until user picks
  };

  const handleCustomerGroupFocus = () => {
    setCustomerGroupSuggestions(customerTypes || []);
    setIsCustomerGroupFocused(true);
  };

  const handleCustomerGroupBlur = () => {
    setTimeout(() => setIsCustomerGroupFocused(false), 150);
  };

  const handleSelectCustomerGroup = (group: (typeof customerTypes)[0]) => {
    setFormData((prev) => ({
      ...prev,
      customerGroup: group.groupName.toUpperCase(),
    }));
    setSelectedGroup(group); // show discounts
    setCustomerGroupSuggestions([]);
    setIsCustomerGroupFocused(false);
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

    // Find the customer group details including discounts
    const group = customerTypes.find(
      (g) =>
        g.groupName?.toUpperCase().trim() ===
        customer.customerGroup?.toUpperCase().trim()
    );
    setSelectedGroup(group || null); // selectedGroup holds the discounts

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
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch customers");

      const data = await res.json();
      const customers = Array.isArray(data) ? data : data.items;

      setCustomers(Array.isArray(customers) ? customers : []);
    } catch (error) {
      console.error("❌ Error loading customers:", error);
      setCustomers([]);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
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
                placeholder="Search customers..."
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

              <DialogPanel className="max-w-3xl" autoFocus={false}>
                <DialogHeader className="border-b pb-2">
                  <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
                    Create Customer
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Fill in the customer details. Fields marked with
                    <span className="text-red-500"> * </span> are required.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                  {/* Customer Code */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="customer-code">
                      Customer Code <span className="text-red-500">*</span>
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
                      className={`text-sm uppercase ${
                        validationErrors.customerCode
                          ? "border-destructive"
                          : ""
                      }`}
                    />
                    {validationErrors.customerCode && (
                      <p className="text-sm text-destructive">
                        {validationErrors.customerCode}
                      </p>
                    )}
                  </div>

                  {/* Customer Name */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="customer-name">
                      Customer Name <span className="text-red-500">*</span>
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

                  {/* Contact Person */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="create-contact-person">
                      Contact Person <span className="text-red-500">*</span>
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
                  <div className="grid gap-1.5 relative">
                    <Label htmlFor="create-contact-number">
                      Contact Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-contact-number"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.contactNumber}
                      onChange={(e) => {
                        const numeric = e.target.value.replace(/[^0-9]/g, "");
                        setFormData((prev) => ({
                          ...prev,
                          contactNumber: numeric,
                        }));
                        setValidationErrors((prev) => ({
                          ...prev,
                          contactNumber: "",
                        }));
                      }}
                      maxLength={11}
                      className={`text-sm ${
                        validationErrors.contactNumber
                          ? "border-destructive"
                          : ""
                      }`}
                    />
                    {validationErrors.contactNumber && (
                      <p className="text-sm text-destructive">
                        {validationErrors.contactNumber}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="create-email-address">
                      Email Address <span className="text-red-500">*</span>
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
                  <div className="grid gap-1.5 relative">
                    <Label htmlFor="create-tin">
                      TIN <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-tin"
                      value={formData.TIN}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        setFormData((prev) => ({ ...prev, TIN: value }));
                        setValidationErrors((prev) => ({ ...prev, TIN: "" }));
                      }}
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

                  {/* Address */}
                  <div className="grid gap-1">
                    <Label htmlFor="create-address">
                      Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-address"
                      value={formData.address}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setFormData((prev) => ({ ...prev, address: value }));
                        setValidationErrors((prev) => ({
                          ...prev,
                          address: "",
                        }));
                      }}
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

                  {/* Terms */}
                  <div className="grid gap-2">
                    <Label htmlFor="create-terms">Terms</Label>
                    <Input
                      id="create-terms"
                      value={formData.terms}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().trim();
                        setFormData((prev) => ({ ...prev, terms: value }));
                        setValidationErrors((prev) => ({ ...prev, terms: "" }));
                      }}
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

                  {/* Sales Agent */}
                  <div className="grid gap-2">
                    <Label htmlFor="create-sales-agent">
                      Sales Agent <span className="text-red-500">*</span>
                    </Label>

                    <div className="relative">
                      <Input
                        id="create-sales-agent"
                        autoComplete="off"
                        value={formData.salesAgent ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setFormData((prev) => ({ ...prev, salesAgent: val }));

                          if (!val.trim()) {
                            setSalesAgentSuggestions([]);
                            return;
                          }

                          const filtered = salesPersons.filter((p) => {
                            const label = getDisplayName(p).toUpperCase();
                            return label.includes(val);
                          });

                          setSalesAgentSuggestions(filtered);
                        }}
                        onFocus={() => {
                          setSalesAgentSuggestions(salesPersons);
                          setIsSalesAgentFocused(true);
                        }}
                        onBlur={() =>
                          setTimeout(() => setIsSalesAgentFocused(false), 150)
                        }
                        placeholder=""
                        className={`text-sm uppercase ${
                          validationErrors.salesAgent
                            ? "border-destructive"
                            : ""
                        }`}
                      />

                      {/* Suggestions */}
                      {isSalesAgentFocused &&
                        salesAgentSuggestions.length > 0 && (
                          <ul className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded z-50">
                            {salesAgentSuggestions.map((person) => {
                              const label = getDisplayName(person);
                              return (
                                <li
                                  key={person._id}
                                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                                  onMouseDown={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      salesAgent: label.toUpperCase(),
                                    }));
                                    setSalesAgentSuggestions([]);
                                    setIsSalesAgentFocused(false);
                                  }}>
                                  {label}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                    </div>

                    {validationErrors.salesAgent && (
                      <p className="text-sm text-destructive">
                        {validationErrors.salesAgent}
                      </p>
                    )}
                  </div>

                  {/* Customer Group */}
                  <div className="grid gap-2 relative">
                    <Label htmlFor="create-customer-group">
                      Customer Group
                    </Label>

                    <Input
                      id="create-customer-group"
                      autoComplete="off"
                      value={formData.customerGroup ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData((prev) => ({
                          ...prev,
                          customerGroup: val,
                        }));

                        if (!val) {
                          setCustomerGroupSuggestions(customerTypes || []);
                          setSelectedGroup(null); // remove discounts if empty
                          return;
                        }

                        const filtered = customerTypes.filter((group) =>
                          group.groupName.toUpperCase().includes(val)
                        );
                        setCustomerGroupSuggestions(filtered);
                        setSelectedGroup(null); // reset selected group until user picks
                      }}
                      onFocus={() => {
                        setCustomerGroupSuggestions(customerTypes || []);
                        setIsCustomerGroupFocused(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setIsCustomerGroupFocused(false), 150)
                      }
                      placeholder=""
                      className={`text-sm uppercase ${
                        validationErrors.customerGroup
                          ? "border-destructive"
                          : ""
                      }`}
                    />

                    {/* Suggestions */}
                    {isCustomerGroupFocused &&
                      customerGroupSuggestions.length > 0 && (
                        <ul className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded z-50">
                          {customerGroupSuggestions.map((group) => (
                            <li
                              key={group._id}
                              className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                              onMouseDown={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  customerGroup: group.groupName.toUpperCase(),
                                }));
                                setSelectedGroup(group); // show discounts
                                setCustomerGroupSuggestions([]);
                                setIsCustomerGroupFocused(false);
                              }}>
                              {group.groupName}
                            </li>
                          ))}
                        </ul>
                      )}

                    {validationErrors.customerGroup && (
                      <p className="text-sm text-destructive">
                        {validationErrors.customerGroup}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2"></div>
                  <div className="grid gap-2">
                    {/* Discount Summary Box */}
                    {selectedGroup?.discounts?.length && (
                      <div className="self-start md:self-end border rounded-lg bg-white dark:bg-gray-800 shadow-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Discounts Summary
                        </h3>
                        <div className="flex flex-col gap-1">
                          {selectedGroup.discounts.map((discount, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Discount {index + 1}:
                              </span>
                              <span className="text-sm font-medium text-primary">
                                {Number(discount).toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t bg-muted/40 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create</Button>
                </div>
              </DialogPanel>
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

                  <TableHead className="w-32 text-right">Actions</TableHead>
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
                          Loading customers…
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  // Sort descending by createdAt
                  [...paginatedCustomers]
                    .sort((a, b) => {
                      const dateA = a.createdAt
                        ? new Date(a.createdAt).getTime()
                        : 0;
                      const dateB = b.createdAt
                        ? new Date(b.createdAt).getTime()
                        : 0;
                      return dateB - dateA; // descending
                    })
                    .map((customer) => (
                      <TableRow
                        key={
                          customer._id ||
                          `${customer.customerCode}-${customer.customerName}`
                        }>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(customer._id)}
                            onCheckedChange={() =>
                              toggleSelectOne(customer._id)
                            }
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
        <DialogPanel className="max-w-3xl" autoFocus={false}>
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Edit Customer
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the customer details. Fields marked with
              <span className="text-red-500"> * </span> are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Customer Code */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-customer-code">
                Customer Code <span className="text-red-500">*</span>
              </Label>
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
                className={`text-sm uppercase ${
                  validationErrors.customerCode ? "border-destructive" : ""
                }`}
              />
              {validationErrors.customerCode && (
                <p className="text-sm text-destructive">
                  {validationErrors.customerCode}
                </p>
              )}
            </div>

            {/* Customer Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-customer-name">
                Customer Name <span className="text-red-500">*</span>
              </Label>
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
                className={`text-sm uppercase ${
                  validationErrors.customerName ? "border-destructive" : ""
                }`}
              />
              {validationErrors.customerName && (
                <p className="text-sm text-destructive">
                  {validationErrors.customerName}
                </p>
              )}
            </div>

            {/* Contact Person */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-contact-person">
                Contact Person <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-contact-person"
                value={formData.contactPerson}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setFormData((prev) => ({ ...prev, contactPerson: value }));
                  setValidationErrors((prev) => ({
                    ...prev,
                    contactPerson: "",
                  }));
                }}
                className={`text-sm uppercase ${
                  validationErrors.contactPerson ? "border-destructive" : ""
                }`}
              />
              {validationErrors.contactPerson && (
                <p className="text-sm text-destructive">
                  {validationErrors.contactPerson}
                </p>
              )}
            </div>

            {/* Contact Number */}
            <div className="grid gap-1.5 relative">
              <Label htmlFor="edit-contact-number">
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-contact-number"
                value={formData.contactNumber}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/[^0-9]/g, "");
                  setFormData((prev) => ({ ...prev, contactNumber: numeric }));
                  setValidationErrors((prev) => ({
                    ...prev,
                    contactNumber: "",
                  }));
                }}
                maxLength={11}
                className={`text-sm ${
                  validationErrors.contactNumber ? "border-destructive" : ""
                }`}
              />
              {validationErrors.contactNumber && (
                <p className="text-sm text-destructive">
                  {validationErrors.contactNumber}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-email-address">
                Email Address <span className="text-red-500">*</span>
              </Label>
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
                className={`text-sm lowercase ${
                  validationErrors.emailAddress ? "border-destructive" : ""
                }`}
              />
              {validationErrors.emailAddress && (
                <p className="text-sm text-destructive">
                  {validationErrors.emailAddress}
                </p>
              )}
            </div>

            {/* TIN */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-tin">
                TIN <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-tin"
                value={formData.TIN}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setFormData((prev) => ({ ...prev, TIN: value }));
                  setValidationErrors((prev) => ({ ...prev, TIN: "" }));
                }}
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

            {/* Address */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setFormData((prev) => ({ ...prev, address: value }));
                  setValidationErrors((prev) => ({ ...prev, address: "" }));
                }}
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

            {/* Terms */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-terms">Terms</Label>
              <Input
                id="edit-terms"
                value={formData.terms}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().trim();
                  setFormData((prev) => ({ ...prev, terms: value }));
                  setValidationErrors((prev) => ({ ...prev, terms: "" }));
                }}
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

            {/* Sales Agent - live search */}
            <div className="grid gap-2 relative">
              <Label htmlFor="edit-sales-agent">
                Sales Agent <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-sales-agent"
                autoComplete="off"
                value={formData.salesAgent ?? ""}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setFormData((prev) => ({ ...prev, salesAgent: val }));

                  if (!val.trim()) {
                    setSalesAgentSuggestions([]);
                    return;
                  }

                  const filtered = salesPersons.filter((p) =>
                    getDisplayName(p).toUpperCase().includes(val)
                  );
                  setSalesAgentSuggestions(filtered);
                }}
                onFocus={() => {
                  setSalesAgentSuggestions(salesPersons);
                  setIsSalesAgentFocused(true);
                }}
                onBlur={() =>
                  setTimeout(() => setIsSalesAgentFocused(false), 150)
                }
                className={`text-sm uppercase ${
                  validationErrors.salesAgent ? "border-destructive" : ""
                }`}
              />
              {isSalesAgentFocused && salesAgentSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded z-50">
                  {salesAgentSuggestions.map((person) => {
                    const label = getDisplayName(person);
                    return (
                      <li
                        key={person._id}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        onMouseDown={() => {
                          setFormData((prev) => ({
                            ...prev,
                            salesAgent: label.toUpperCase(),
                          }));
                          setSalesAgentSuggestions([]);
                          setIsSalesAgentFocused(false);
                        }}>
                        {label}
                      </li>
                    );
                  })}
                </ul>
              )}
              {validationErrors.salesAgent && (
                <p className="text-sm text-destructive">
                  {validationErrors.salesAgent}
                </p>
              )}
            </div>

            {/* Customer Group - live search */}
            <div className="grid gap-2 relative">
              <Label htmlFor="edit-customer-group">Customer Group</Label>
              <Input
                id="edit-customer-group"
                autoComplete="off"
                value={formData.customerGroup ?? ""}
                onChange={handleCustomerGroupChange}
                onFocus={handleCustomerGroupFocus}
                onBlur={handleCustomerGroupBlur}
                className={`text-sm uppercase ${
                  validationErrors.customerGroup ? "border-destructive" : ""
                }`}
              />
              {isCustomerGroupFocused &&
                customerGroupSuggestions.length > 0 && (
                  <ul className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-auto border bg-white shadow-sm rounded z-50">
                    {customerGroupSuggestions.map((group) => (
                      <li
                        key={group._id}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        onMouseDown={() => handleSelectCustomerGroup(group)}>
                        {group.groupName}
                      </li>
                    ))}
                  </ul>
                )}
              {validationErrors.customerGroup && (
                <p className="text-sm text-destructive">
                  {validationErrors.customerGroup}
                </p>
              )}
            </div>

            <div className="grid gap-2"></div>
            <div className="grid gap-2">
              {/* Discounts Summary Box */}
              {selectedGroup?.discounts?.length && (
                <div className="self-start md:self-end border rounded-lg bg-white dark:bg-gray-800 shadow-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Discounts Summary
                  </h3>
                  <div className="flex flex-col gap-1">
                    {selectedGroup.discounts.map((discount, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Discount {index + 1}:
                        </span>
                        <span className="text-sm font-medium text-primary">
                          {parseFloat(Number(discount).toFixed(2))}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-t bg-muted/40 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingCustomer(null);
                resetForm();
              }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </div>
        </DialogPanel>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogPanel className="max-w-3xl">
          {/* Header */}
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Customer Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This dialog shows the full details of the selected customer.
            </DialogDescription>
          </DialogHeader>

          {/* Inline Customer Details */}
          {viewingCustomer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 py-6 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Customer Code</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.customerCode ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Customer Name</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.customerName ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Contact Person</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.contactPerson ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Contact Number</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.contactNumber ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Email Address</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.emailAddress ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">TIN</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.TIN ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Address</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.address ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Terms</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.terms ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Customer Group</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.customerGroup ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Sales Agent</span>
                <span className="text-foreground font-semibold">
                  {viewingCustomer.salesAgent ?? "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground font-semibold">
                  Discounts
                </span>
                {selectedGroup?.discounts?.length && (
                  <>
                    <div className="flex flex-col gap-1 py-2">
                      {selectedGroup.discounts.map((discount, index) => (
                        <span key={index} className="flex items-center">
                          <span className="text-sm text-muted-foreground">
                            Discount {index + 1}:
                          </span>
                          <span className="text-sm font-semibold text-primary px-4">
                            {parseFloat(Number(discount).toFixed(2))}%
                          </span>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
