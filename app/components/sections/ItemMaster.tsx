"use client";
import React, { useState, useEffect } from "react";
import ImportExcel from "./ItemMasterSub/ImportItems";

import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
} from "./ItemMasterSub/ExportItems";

import AddNew from "./ItemMasterSub/AddNew";
import EditItem from "./ItemMasterSub/EditItem";
import ViewItem from "./ItemMasterSub/ViewItem";
import type { ItemType } from "./type";
import { ConfirmDeleteButton } from "./ItemMasterSub/ConfirmDeleteButton";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Plus, Search, Eye } from "lucide-react";

export default function ItemsList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [items, setItems] = useState<ItemType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingItem, setViewingItem] = useState<ItemType | null>(null);
  const [isViewItemOpen, setIsViewItemOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ItemType[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

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
    }, 1000); // 3 seconds = 3000 milliseconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesCode = item.item_code?.toLowerCase().includes(term);
    const matchesName = item.item_name?.toLowerCase().includes(term);
    const matchesCategory = item.item_category?.toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === "all" ||
      item.item_status?.toLowerCase() === statusFilter.toLowerCase();

    return (matchesCode || matchesName || matchesCategory) && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  function handleItemDeleted(id: string) {
    setItems((prev) => prev.filter((item) => item._id !== id));
  }

  function handleEditRequest(item: ItemType) {
    setSelectedItem(item);
    setIsViewItemOpen(false); // close view dialog
    setIsEditOpen(true); // open edit dialog
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Item Master</CardTitle>
              <CardDescription>Manage items</CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <ImportExcel onUploadSuccess={fetchItems} />

              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </Button>
              <AddNew
                isOpen={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={() => {
                  setDialogOpen(false);
                  fetchItems(); // ✅ Refresh list
                }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            {selectedItems.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  ✅ {selectedItems.length} item(s) selected
                </span>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(format) => {
                      if (format === "pdf")
                        exportToPDF(selectedItems, "Selected Items");
                      if (format === "excel") exportToExcel(selectedItems);
                      if (format === "csv") exportToCSV(selectedItems);
                    }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Export as..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      try {
                        await Promise.all(
                          selectedItems.map((item) =>
                            fetch(
                              `http://localhost:3000/api/items/${item._id}`,
                              {
                                method: "DELETE",
                              }
                            )
                          )
                        );
                        setSelectedItems([]);
                        fetchItems();
                      } catch (err) {
                        console.error("Bulk delete failed:", err);
                      }
                    }}>
                    Delete Selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItems([])}
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
                          paginatedItems.every((item) =>
                            selectedItems.some((i) => i._id === item._id)
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSelections = [
                              ...selectedItems,
                              ...paginatedItems.filter(
                                (item) =>
                                  !selectedItems.some((i) => i._id === item._id)
                              ),
                            ];
                            setSelectedItems(newSelections);
                          } else {
                            const remaining = selectedItems.filter(
                              (i) =>
                                !paginatedItems.some((p) => p._id === i._id)
                            );
                            setSelectedItems(remaining);
                          }
                        }}
                        className="accent-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Creation Date
                      </span>
                    </div>
                  </TableHead>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item: ItemType) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedItems.some(
                            (i) => i._id === item._id
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item]);
                            } else {
                              setSelectedItems(
                                selectedItems.filter((i) => i._id !== item._id)
                              );
                            }
                          }}
                          className="mr-2 accent-blue-600"
                        />
                        {new Date(item.createdDT).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{item.item_code.toUpperCase()}</TableCell>
                      <TableCell>{item.item_name.toUpperCase()}</TableCell>
                      <TableCell>{item.item_category.toUpperCase()}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium px-2 py-1 rounded-full ${
                            item.item_status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : item.item_status === "INACTIVE"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                          {item.item_status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setViewingItem(item);
                              setIsViewItemOpen(true);
                            }}
                            className="gap-2">
                            <Eye className="h-4 w-4" />
                          </Button>

                          {
                            <ConfirmDeleteButton
                              item={item}
                              fetchItems={fetchItems}
                            />
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-6">
                      No items found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ✅ Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
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

        {/* {isViewItemOpen && viewingItem && (
          <ViewItem
            item={viewingItem}
            onClose={() => setIsViewItemOpen(false)}
            onEdit={(item) => {
              setViewingItem(null);
              setTimeout(() => {
                setEditingItem(item);
                setIsNewOrderOpen(true);
              }, 0);
            }}
          />
          
        )} */}

        {/* View Dialog */}
        <ViewItem
          isOpen={isViewItemOpen}
          onOpenChange={setIsViewItemOpen}
          item={viewingItem}
          onDelete={handleItemDeleted}
          onEditRequest={handleEditRequest}
        />

        {/* Edit Dialog */}
        <EditItem
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          item={selectedItem}
          onUpdate={() => {
            fetchItems(); // ✅ refetch after edit
          }}
        />
      </Card>
    </div>
  );
}
