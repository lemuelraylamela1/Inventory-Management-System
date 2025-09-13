"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Upload, X, Eye } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { ItemType } from "./type";
import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import ImageUploader from "./ItemMasterSub/ImageUploader";
import { cn } from "../ui/utils";
import ImportItems from "./ItemMasterSub/ImportItems";
import { ExportItemButton } from "./ItemMasterSub/ExportItems";
import AddItemImageUploader from "./ItemMasterSub/AddItemImageUploader";
import EditItemImageUploader from "./ItemMasterSub/EditItemImageUploader";

const categories = ["Jelly", "Chocolate", "Imported Candies"];

type Props = {
  onSuccess?: () => void;
};

export default function ItemMaster({ onSuccess }: Props) {
  const [items, setItems] = useState<ItemType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);
  const [viewingItem, setViewingItem] = useState<ItemType | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    url: string;
    publicId: string;
  } | null>(null);

  const router = useRouter();

  const [formData, setFormData] = useState({
    itemCode: "",
    itemName: "",
    description: "",
    category: "",
    status: "active" as "active" | "inactive",
    purchasePrice: "",
    salesPrice: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    createdDT: new Date().toISOString(),
    imageUrl: null as string | null,
    imageFile: null as File | null,
    imagePublicId: null as string | null,
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState({
    itemCode: "",
    itemName: "",
    description: "",
    category: "",
    status: "active",
    purchasePrice: "",
    salesPrice: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    createdDT: "",
    imageUrl: "",
    imageFile: "",
    imagePublicId: "",
  });

  // Filter and paginate data
  const filteredItems = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return items.filter((item) => {
      const name = item.itemName?.toLowerCase() || "";
      const code = item.itemCode?.toLowerCase() || "";

      return name.includes(query) || code.includes(query);
    });
  }, [items, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Validation functions
  const validateForm = (isEdit = false) => {
    const errors = {
      itemCode: "",
      itemName: "",
      description: "",
      category: "",
      status: "",
      purchasePrice: "",
      salesPrice: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      createdDT: "",
      imageUrl: "",
      imageFile: "",
      imagePublicId: "",
    };

    // Check for required fields
    if (!formData.itemCode.trim()) {
      errors.itemCode = "Item Code is required";
    } else {
      // Check for duplicate code
      const duplicateCode = items.find(
        (item) =>
          item.itemCode.toLowerCase() === formData.itemCode.toLowerCase() &&
          (!isEdit || item._id !== editingItem?._id)
      );
      if (duplicateCode) {
        errors.itemCode = "Item Code already exists";
      }
    }

    if (!formData.itemName.trim()) {
      errors.itemName = "Item Name is required";
    } else {
      // Check for duplicate name
      const duplicateName = items.find(
        (item) =>
          item.itemName.toLowerCase() === formData.itemName.toLowerCase() &&
          (!isEdit || item._id !== editingItem?._id)
      );
      if (duplicateName) {
        errors.itemName = "Item Name already exists";
      }
    }

    if (!formData.itemCode?.trim()) {
      errors.itemCode = "Item code is required";
    }

    if (!formData.itemName?.trim()) {
      errors.itemName = "Item name is required";
    }

    if (!formData.purchasePrice.trim()) {
      errors.purchasePrice = "Purchase price is required";
    } else if (
      isNaN(parseFloat(formData.purchasePrice)) ||
      parseFloat(formData.purchasePrice) <= 0
    ) {
      errors.purchasePrice = "Purchase price must be a positive number";
    }

    if (!formData.salesPrice.trim()) {
      errors.salesPrice = "Sales price is required";
    } else if (
      isNaN(parseFloat(formData.salesPrice)) ||
      parseFloat(formData.salesPrice) <= 0
    ) {
      errors.salesPrice = "Sales price must be a positive number";
    }

    if (!formData.description?.trim()) {
      errors.description = "Description is required";
    }

    if (!formData.category?.trim()) {
      errors.category = "Category is required";
    }

    if (!formData.status?.trim()) {
      errors.status = "Status is required";
    }

    const dimensionFields = ["length", "width", "height", "weight"] as const;

    for (const field of dimensionFields) {
      const rawValue = formData[field]; // likely a string
      const value = parseFloat(rawValue);

      if (!rawValue.trim()) {
        errors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is required`;
      } else if (isNaN(value) || value < 0) {
        errors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } must be a non-negative number`;
      }
    }

    setValidationErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  // Clear validation errors when form data changes
  React.useEffect(() => {
    if (Object.values(validationErrors).some((error) => error !== "")) {
      validateForm(!!editingItem);
    }
  }, [formData, items]);

  const handleCreate = async () => {
    if (!validateForm()) return;

    const payload = {
      createdDT: new Date().toISOString(),
      itemCode: formData.itemCode,
      itemName: formData.itemName,
      description: formData.description,
      purchasePrice: formData.purchasePrice
        ? parseFloat(parseFloat(formData.purchasePrice).toFixed(2))
        : 0.0,
      salesPrice: formData.salesPrice
        ? parseFloat(parseFloat(formData.salesPrice).toFixed(2))
        : 0.0,
      category: formData.category,
      status: formData.status,
      imageUrl: formData.imageUrl || null,
      imagePublicId: formData.imagePublicId || null,

      length: formData.length ? parseFloat(formData.length) : 0,
      width: formData.width ? parseFloat(formData.width) : 0,
      height: formData.height ? parseFloat(formData.height) : 0,
      weight: formData.weight ? parseFloat(formData.weight) : 0,
    };

    console.log("Creating item:", payload);

    try {
      const res = await fetch("http://localhost:3000/api/items", {
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
        alert("Failed to create item. Please try again.");
        return;
      }
      toast.success("Item created successfully!");

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

  const handleEdit = (item: ItemType) => {
    setEditingItem(item);
    setFormData({
      itemCode: item.itemCode || "",
      itemName: item.itemName || "",
      description: item.description || "",
      category: item.category || "",
      status: item.status || "active",
      purchasePrice: item.purchasePrice
        ? parseFloat(item.purchasePrice.toFixed(2)).toString()
        : "0.00",
      salesPrice: item.salesPrice
        ? parseFloat(item.salesPrice.toFixed(2)).toString()
        : "0.00",
      length: item.length?.toString() || "0",
      width: item.width?.toString() || "0",
      height: item.height?.toString() || "0",
      weight: item.weight?.toString() || "0",
      createdDT: item.createdDT || new Date().toISOString().split("T")[0],
      imageUrl: item.imageUrl || null,
      imageFile: item.imageFile || null,
      imagePublicId: item.imagePublicId || null,
    });
    setValidationErrors({
      itemCode: "",
      itemName: "",
      description: "",
      category: "",
      status: "",
      purchasePrice: "",
      salesPrice: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      createdDT: "",
      imageUrl: "",
      imageFile: "",
      imagePublicId: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingItem || !validateForm(true)) {
      return;
    }

    try {
      const res = await fetch(`/api/items/${editingItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemCode: formData.itemCode,
          itemName: formData.itemName,
          description: formData.description,
          category: formData.category,
          status: formData.status,
          purchasePrice: parseFloat(formData.purchasePrice),
          salesPrice: parseFloat(formData.salesPrice),
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          createdDT: formData.createdDT,
          imageUrl: formData.imageUrl,
          imageFile: formData.imageFile,
          imagePublicId: formData.imagePublicId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update item");
      }

      const updatedItem = await res.json();

      // Update local state
      setItems(
        items.map((item) => (item._id === editingItem._id ? updatedItem : item))
      );
    } catch (err) {
      console.error("Update error:", err);
      return;
    }

    // Reset form and close dialog
    setEditingItem(null);
    setFormData({
      itemCode: "",
      itemName: "",
      description: "",
      category: "",
      status: "active",
      purchasePrice: "",
      salesPrice: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      createdDT: new Date().toISOString().split("T")[0],
      imageUrl: null,
      imageFile: null,
      imagePublicId: null,
    });
    setValidationErrors({
      itemCode: "",
      itemName: "",
      description: "",
      category: "",
      status: "",
      purchasePrice: "",
      salesPrice: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      createdDT: "",
      imageUrl: "",
      imageFile: "",
      imagePublicId: "",
    });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/items/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete item");

      // Update local state after successful deletion
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleView = (item: ItemType) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price);
  };

  const resetForm = () => {
    setFormData({
      itemCode: "",
      itemName: "",
      description: "",
      category: "",
      status: "active",
      purchasePrice: "",
      salesPrice: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      createdDT: new Date().toISOString().split("T")[0],
      imageUrl: null,
      imageFile: null,
      imagePublicId: null,
    });
    setValidationErrors({
      itemCode: "",
      itemName: "",
      description: "",
      category: "",
      status: "",
      purchasePrice: "",
      salesPrice: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      createdDT: "",
      imageUrl: "",
      imageFile: "",
      imagePublicId: "",
    });
  };

  const allSelected =
    paginatedItems.length > 0 && selectedIds.length === paginatedItems.length;

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(items.map((item) => item._id));
    } else {
      setSelectedIds([]);
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
      setItems((prev) => prev.filter((item) => !_ids.includes(item._id)));

      const results = await Promise.all(
        _ids.map(async (_id) => {
          const res = await fetch(`/api/items/${_id}`, { method: "DELETE" });
          if (!res.ok) {
            const error = await res.json();
            console.warn(`Failed to delete ${_id}:`, error.message);
          }
          return res;
        })
      );

      const failures = results.filter((res) => !res.ok);
      if (failures.length > 0) {
        alert(`Some items could not be deleted (${failures.length} failed).`);
      } else {
        toast.success("Selected items deleted.");
      }

      setSelectedIds([]);
      onSuccess?.(); // refresh list
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Failed to delete selected items.");
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/items", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch items");

      const data = await res.json();
      const items = Array.isArray(data) ? data : data.items;
      setItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error loading items:", error);
      setItems([]);
    }
  };

  useEffect(() => {
    fetchItems(); // initial fetch

    const interval = setInterval(() => {
      fetchItems();
    }, 1000); // 3 seconds = 1000 milliseconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const handleUploadSuccess = () => {
    // 🔁 Refetch items or trigger a state update
    fetchItems(); // or mutate(), or setItems(), depending on your data flow
  };

  const handleImageUploadComplete = (
    data: { file: File; url: string; publicId: string } | null
  ) => {
    if (data) {
      setFormData((prev) => ({
        ...prev,
        imageUrl: data.url.trim(),
        imagePublicId: data.publicId,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        imageUrl: null,
        imagePublicId: null,
      }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          {/* Left: Title */}
          <CardTitle className="text-lg font-semibold">
            Item Master Management
          </CardTitle>
          <div className="flex items-center gap-2">
            <ExportItemButton items={items} />

            <ImportItems onUploadSuccess={handleUploadSuccess} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search items..."
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
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <AddItemImageUploader
                    onUploadComplete={handleImageUploadComplete}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="create-code">Item Code</Label>
                      <Input
                        id="create-code"
                        value={formData.itemCode}
                        onChange={(e) =>
                          setFormData({ ...formData, itemCode: e.target.value })
                        }
                        placeholder="ITM001"
                        className={
                          validationErrors.itemCode ? "border-destructive" : ""
                        }
                      />
                      {validationErrors.itemCode && (
                        <p className="text-sm text-destructive">
                          {validationErrors.itemCode}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="create-name">Item Name</Label>
                      <Input
                        id="create-name"
                        value={formData.itemName}
                        onChange={(e) =>
                          setFormData({ ...formData, itemName: e.target.value })
                        }
                        placeholder="Wireless Headphones"
                        className={
                          validationErrors.itemName ? "border-destructive" : ""
                        }
                      />
                      {validationErrors.itemName && (
                        <p className="text-sm text-destructive">
                          {validationErrors.itemName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="create-purchase">Purchase Price</Label>
                      <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                        <span className="text-muted-foreground">₱</span>
                        <Input
                          id="create-purchase"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.purchasePrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              purchasePrice: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          className={`flex-1 border-none focus-visible:ring-0 focus-visible:outline-none ${
                            validationErrors.purchasePrice
                              ? "border-destructive"
                              : ""
                          }`}
                          aria-invalid={!!validationErrors.purchasePrice}
                          aria-describedby="purchase-error"
                        />
                      </div>
                      {validationErrors.purchasePrice && (
                        <p
                          id="purchase-error"
                          className="text-destructive text-sm mt-1">
                          {validationErrors.purchasePrice}
                        </p>
                      )}
                    </div>

                    <div className="flex-1 grid gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="create-sales">Sales Price</Label>
                        <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                          <span className="text-muted-foreground">₱</span>
                          <Input
                            id="create-sales"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.salesPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                salesPrice: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            className={`border-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                              validationErrors.salesPrice
                                ? "text-destructive"
                                : ""
                            }`}
                          />
                        </div>
                        {validationErrors.salesPrice && (
                          <p className="text-sm text-destructive">
                            {validationErrors.salesPrice}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-description">Description</Label>
                    <Textarea
                      id="create-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter item description..."
                      className={
                        validationErrors.description ? "border-destructive" : ""
                      }
                      rows={3}
                    />
                    {validationErrors.description && (
                      <p className="text-sm text-destructive">
                        {validationErrors.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="create-category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }>
                        <SelectTrigger
                          className={
                            validationErrors.category
                              ? "border-destructive"
                              : ""
                          }>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.category && (
                        <p className="text-sm text-destructive">
                          {validationErrors.category}
                        </p>
                      )}
                    </div>

                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="create-status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "active" | "inactive") =>
                          setFormData({ ...formData, status: value })
                        }>
                        <SelectTrigger
                          className={
                            validationErrors.status ? "border-destructive" : ""
                          }>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.status && (
                        <p className="text-sm text-destructive">
                          {validationErrors.status}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="create-length">Length</Label>
                      <Input
                        id="create-length"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.length}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            length: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className={
                          validationErrors.length ? "border-destructive" : ""
                        }
                      />
                      {validationErrors.length && (
                        <p className="text-sm text-destructive">
                          {validationErrors.length}
                        </p>
                      )}
                    </div>

                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="create-width">Width</Label>
                      <Input
                        id="create-width"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.width}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            width: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className={
                          validationErrors.width ? "border-destructive" : ""
                        }
                      />
                      {validationErrors.width && (
                        <p className="text-sm text-destructive">
                          {validationErrors.width}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="create-height">Height</Label>
                      <Input
                        id="create-height"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.height}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            height: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className={
                          validationErrors.height ? "border-destructive" : ""
                        }
                      />
                      {validationErrors.height && (
                        <p className="text-sm text-destructive">
                          {validationErrors.height}
                        </p>
                      )}
                    </div>

                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="create-weight">Weight</Label>
                      <Input
                        id="create-weight"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            weight: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className={
                          validationErrors.weight ? "border-destructive" : ""
                        }
                      />
                      {validationErrors.weight && (
                        <p className="text-sm text-destructive">
                          {validationErrors.weight}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={
                      !formData.itemCode.trim() ||
                      !formData.itemName.trim() ||
                      !formData.purchasePrice.trim() ||
                      !formData.salesPrice.trim() ||
                      !formData.description.trim() ||
                      !formData.category.trim() ||
                      !formData.status.trim() ||
                      !formData.height.trim() ||
                      !formData.length.trim() ||
                      !formData.width.trim() ||
                      !formData.weight.trim() ||
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
            <div className="flex justify-end gap-2 mb-4">
              <Button
                variant="destructive"
                onClick={() => handleDeleteMany(selectedIds)}>
                Delete Selected
              </Button>
              <Button variant="outline" onClick={() => setSelectedIds([])}>
                Clear Selection
              </Button>
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
                    />
                  </TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>

                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="text-center py-8 text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => (
                    <TableRow
                      key={item._id || `${item.itemCode}-${item.itemName}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(item._id)}
                          onCheckedChange={() => toggleSelectOne(item._id)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.createdDT)}</TableCell>
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>
                        <div
                          className="text-sm text-muted-foreground truncate max-w-xs"
                          title={item.description}>
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "active" ? "default" : "secondary"
                          }>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(item)}
                            title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            title="Edit Item">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Delete Item">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {item.itemName}&quot;? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item._id)}>
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
          <div className="text-sm text-muted-foreground text-center">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + rowsPerPage, filteredItems.length)} of{" "}
            {filteredItems.length} results
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <EditItemImageUploader onUpdate={setUploadedImage} />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-code">Item Code</Label>
                <Input
                  id="edit-code"
                  value={formData.itemCode}
                  onChange={(e) =>
                    setFormData({ ...formData, itemCode: e.target.value })
                  }
                  placeholder="ITM001"
                  className={cn(
                    "text-sm",
                    validationErrors.itemCode && "border-destructive"
                  )}
                />
                {validationErrors.itemCode && (
                  <p className="text-sm text-destructive">
                    {validationErrors.itemCode}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-name">Item Name</Label>
                <Input
                  id="create-name"
                  value={formData.itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value })
                  }
                  placeholder="Wireless Headphones"
                  className={
                    validationErrors.itemName ? "border-destructive" : ""
                  }
                />
                {validationErrors.itemName && (
                  <p className="text-sm text-destructive">
                    {validationErrors.itemName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex-1 grid gap-2">
                <Label htmlFor="create-purchase">Purchase Price</Label>
                <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                  <span className="text-muted-foreground">₱</span>
                  <Input
                    id="create-purchase"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchasePrice: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    className={`flex-1 border-none focus-visible:ring-0 focus-visible:outline-none ${
                      validationErrors.purchasePrice ? "border-destructive" : ""
                    }`}
                    aria-invalid={!!validationErrors.purchasePrice}
                    aria-describedby="purchase-error"
                  />
                </div>
                {validationErrors.purchasePrice && (
                  <p
                    id="purchase-error"
                    className="text-destructive text-sm mt-1">
                    {validationErrors.purchasePrice}
                  </p>
                )}
              </div>

              <div className="flex-1 grid gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="create-sales">Sales Price</Label>
                  <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                    <span className="text-muted-foreground">₱</span>
                    <Input
                      id="create-sales"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salesPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salesPrice: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      className={`border-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                        validationErrors.salesPrice ? "text-destructive" : ""
                      }`}
                    />
                  </div>
                  {validationErrors.salesPrice && (
                    <p className="text-sm text-destructive">
                      {validationErrors.salesPrice}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter item description..."
                className={
                  validationErrors.description ? "border-destructive" : ""
                }
                rows={3}
              />
              {validationErrors.description && (
                <p className="text-sm text-destructive">
                  {validationErrors.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex-1 grid gap-2">
                <Label htmlFor="create-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }>
                  <SelectTrigger
                    className={
                      validationErrors.category ? "border-destructive" : ""
                    }>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.category && (
                  <p className="text-sm text-destructive">
                    {validationErrors.category}
                  </p>
                )}
              </div>

              <div className="flex-1 grid gap-2">
                <Label htmlFor="create-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData({ ...formData, status: value })
                  }>
                  <SelectTrigger
                    className={
                      validationErrors.status ? "border-destructive" : ""
                    }>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.status && (
                  <p className="text-sm text-destructive">
                    {validationErrors.status}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex-1 grid gap-2">
                <Label htmlFor="create-length">Length</Label>
                <Input
                  id="create-length"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.length}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      length: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className={
                    validationErrors.length ? "border-destructive" : ""
                  }
                />
                {validationErrors.length && (
                  <p className="text-sm text-destructive">
                    {validationErrors.length}
                  </p>
                )}
              </div>

              <div className="flex-1 grid gap-2">
                <Label htmlFor="create-width">Width</Label>
                <Input
                  id="create-width"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.width}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      width: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className={validationErrors.width ? "border-destructive" : ""}
                />
                {validationErrors.width && (
                  <p className="text-sm text-destructive">
                    {validationErrors.width}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex-1 grid gap-2">
                <Label htmlFor="create-height">Height</Label>
                <Input
                  id="create-height"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.height}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      height: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className={
                    validationErrors.height ? "border-destructive" : ""
                  }
                />
                {validationErrors.height && (
                  <p className="text-sm text-destructive">
                    {validationErrors.height}
                  </p>
                )}
              </div>

              <div className="flex-1 grid gap-2">
                <Label htmlFor="create-weight">Weight</Label>
                <Input
                  id="create-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      weight: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className={
                    validationErrors.weight ? "border-destructive" : ""
                  }
                />
                {validationErrors.weight && (
                  <p className="text-sm text-destructive">
                    {validationErrors.weight}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingItem(null);
                resetForm();
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                !formData.itemCode.trim() ||
                !formData.itemName.trim() ||
                !formData.purchasePrice.trim() ||
                !formData.salesPrice.trim() ||
                !formData.description.trim() ||
                !formData.category.trim() ||
                !formData.length.trim() ||
                !formData.width.trim() ||
                !formData.height.trim() ||
                !formData.weight.trim() ||
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
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="grid gap-6 py-4">
              {/* Image Preview */}
              {/* Image Preview */}
              <div className="flex flex-col items-center gap-2">
                {viewingItem.imageUrl?.trim() ? (
                  <div className="relative w-full h-96 rounded-lg overflow-hidden border shadow-sm group">
                    <Image
                      src={viewingItem.imageUrl.trim()}
                      alt={viewingItem.itemName || "Item image"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="100vw"
                      priority
                    />
                    <a
                      href={viewingItem.imageUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-white text-xs px-2 py-1 rounded shadow hover:bg-primary/10 transition">
                      View Full Image
                    </a>
                  </div>
                ) : (
                  <div className="relative w-full h-96 rounded-lg overflow-hidden border shadow-sm flex items-center justify-center bg-muted text-muted-foreground text-sm">
                    No image available
                  </div>
                )}
              </div>

              {/* Item Information */}
              <div className="grid gap-4">
                <h4 className="text-sm font-semibold text-muted-foreground mt-6">
                  General Info
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Item Code
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingItem.itemCode}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Item Name
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingItem.itemName}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Description
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingItem.description}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Category
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingItem.category}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Status
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingItem.status}
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-muted-foreground mt-6">
                  Pricing
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Purchase Price
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {formatPrice(viewingItem.purchasePrice)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Sales Price
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {formatPrice(viewingItem.salesPrice)}
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-muted-foreground mt-6">
                  Dimensions
                </h4>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Length
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingItem.length} cm
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Width
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingItem.width} cm
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Height
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingItem.height} cm
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Weight
                    </Label>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm border">
                      {viewingItem.weight} kg
                    </div>
                  </div>
                </div>
              </div>
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
