"use client";
import React, { useState, useEffect, useMemo } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "@radix-ui/react-checkbox";
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
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import type { SalesPersonType } from "./type";

export default function SalesPerson() {
  const [salesPerson, setSalesPerson] = useState<SalesPersonType[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPersonType[]>([]);

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedSalesPersons, setselectedSalesPersons] = useState<
    SalesPersonType[]
  >([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSalesPerson, setEditingSalesPerson] =
    useState<SalesPersonType | null>(null);
  const [formData, setFormData] = useState({
    salesPersonCode: "",
    salesPersonName: "",
    emailAddress: "",
    status: "",
  });

  const fetchSalesPerson = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/salesPersons", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch items");

      const data = await res.json();
      const salesPerson = Array.isArray(data) ? data : data.salesPersons;
      setSalesPerson(Array.isArray(salesPerson) ? salesPerson : []);
    } catch (error) {
      console.error("Error loading salesPerson:", error);
      setSalesPerson([]);
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
    const matchesName = salesPerson.salesPersonName
      ?.toLowerCase()
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

  const handleCreate = async () => {
    const payload = {
      createdDT: new Date(),
      salesPersonCode: formData.salesPersonCode,
      salesPersonName: formData.salesPersonName,
      emailAddress: formData.emailAddress,
      status: formData.status,
    };

    try {
      const res = await fetch("http://localhost:3000/api/salesPersons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("Create result:", result);

      if (!res.ok)
        throw new Error(result.message || "Failed to create sales person");

      // Update local state with optimistic UI
      setSalesPersons((prev) => [
        ...prev,
        { ...payload, _id: Date.now().toString() },
      ]);
    } catch (error) {
      console.error("Error creating sales person:", error);
    }

    setFormData({
      salesPersonCode: "",
      salesPersonName: "",
      emailAddress: "",
      status: "active",
    });
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (person: SalesPersonType) => {
    setEditingSalesPerson(person);
    setFormData({
      salesPersonCode: person.salesPersonCode,
      salesPersonName: person.salesPersonName,
      emailAddress: person.emailAddress,
      status: person.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingSalesPerson) return;

    const updatedSalesPerson: SalesPersonType = {
      ...editingSalesPerson,
      salesPersonCode: formData.salesPersonCode,
      salesPersonName: formData.salesPersonName,
      emailAddress: formData.emailAddress,
      status: formData.status,
    };

    try {
      const res = await fetch(
        `http://localhost:3000/api/salesPersons/${updatedSalesPerson._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSalesPerson),
        }
      );

      if (!res.ok) throw new Error("Failed to update sales person");

      const updated = await res.json();

      // Update local state
      setSalesPersons((prev) =>
        prev.map((p) => (p._id === updated.id ? updated : p))
      );
    } catch (error) {
      console.error("Error updating sales person:", error);
    }

    setEditingSalesPerson(null);
    setFormData({
      salesPersonCode: "",
      salesPersonName: "",
      emailAddress: "",
      status: "active",
    });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/salesPersons/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete sales person");

      // Update local state after successful deletion
      setSalesPersons((prev) => prev.filter((person) => person._id !== id));
    } catch (error) {
      console.error("Error deleting sales person:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
              onOpenChange={setIsCreateDialogOpen}>
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
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-code">Sales Person Code</Label>
                    <Input
                      id="create-code"
                      value={formData.salesPersonCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salesPersonCode: e.target.value,
                        })
                      }
                      placeholder="SP001"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-name">Sales Person Name</Label>
                    <Input
                      id="create-name"
                      value={formData.salesPersonName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salesPersonName: e.target.value,
                        })
                      }
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-email">Email Address</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emailAddress: e.target.value,
                        })
                      }
                      placeholder="john.smith@company.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") =>
                        setFormData({ ...formData, status: value })
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}>
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
                            fetch(
                              `http://localhost:3000/api/salesPersons/${salesPerson._id}`,
                              {
                                method: "DELETE",
                              }
                            )
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
                        checked={
                          paginatedItems.length > 0 &&
                          paginatedItems.every((salesPerson) =>
                            selectedSalesPersons.some(
                              (i) => i._id === salesPerson._id
                            )
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
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
                        className="accent-blue-600"
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
                {paginatedItems.length === 0 ? (
                  <TableRow
                    key={salesPerson._id}
                    className={
                      selectedSalesPersons.includes(salesPerson._id)
                        ? "bg-blue-50"
                        : ""
                    }>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={
                          paginatedItems.length > 0 &&
                          paginatedItems.every((salesPerson) =>
                            selectedSalesPersons.some(
                              (i) => i._id === salesPerson._id
                            )
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
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
                        className="accent-blue-600"
                      />

                      <span className="text-sm font-medium text-gray-700">
                        Creation Date
                      </span>
                    </TableCell>
                    <TableCell>Sales Person Code</TableCell>
                    <TableCell>Sales Person Name</TableCell>
                    <TableCell>Email Address</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((person) => (
                    <TableRow key={person._id}>
                      <TableCell>
                        {new Date(person.createdDT).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell>{person.salesPersonCode}</TableCell>
                      <TableCell>{person.salesPersonName}</TableCell>
                      <TableCell>{person.emailAddress}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            person.status === "active" ? "default" : "secondary"
                          }>
                          {person.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(person)}>
                            <Edit className="w-4 h-4" />
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
                                  {person.salesPersonName}? This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(person._id)}>
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

          {/* Results count */}
          {/* <div className="text-xs text-muted-foreground text-right px-4 py-2">
            Page {currentPage} of {totalPages} — Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredSalesPersons.length)}{" "}
            of {filteredSalesPersons.length} results
          </div> */}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sales Person</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Sales Person Code</Label>
              <Input
                id="edit-code"
                value={formData.salesPersonCode}
                onChange={(e) =>
                  setFormData({ ...formData, salesPersonCode: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Sales Person Name</Label>
              <Input
                id="edit-name"
                value={formData.salesPersonName}
                onChange={(e) =>
                  setFormData({ ...formData, salesPersonName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.emailAddress}
                onChange={(e) =>
                  setFormData({ ...formData, emailAddress: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
              SalesPersons per page:
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
      </Dialog>
    </div>
  );
}
