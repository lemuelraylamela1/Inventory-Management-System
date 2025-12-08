"use client";
import React, { useState, useEffect, useRef } from "react";

import AddNew from "./WarehouseSub/AddNew";
import EditWarehouseDialog from "./WarehouseSub/EditWarehouseDialog";
import type { WarehouseType } from "./type";
import { ConfirmDeleteButton } from "./WarehouseSub/ConfirmDeleteButton";
import { Checkbox } from "../ui/checkbox";

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
import { Plus, Search, Edit, Loader2 } from "lucide-react";

export default function WarehouseList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [warehouse, setWarehouse] = useState<WarehouseType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const isFirstFetch = useRef(true);

  const [selectedWarehouses, setSelectedWarehouses] = useState<WarehouseType[]>(
    []
  );

  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseType | null>(null);
  const [isEditWarehouseOpen, setIsEditWarehouseOpen] = useState(false);

  const fetchWarehouse = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/warehouses", { cache: "no-store" });

      if (!res.ok) throw new Error("Failed to fetch warehouses");

      const data = await res.json();
      const warehouse = Array.isArray(data) ? data : data.warehouses;
      setWarehouse(Array.isArray(warehouse) ? warehouse : []);
    } catch (error) {
      console.error("❌ Error loading warehouses:", error);
      setWarehouse([]);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    fetchWarehouse(); // initial fetch

    const interval = setInterval(() => {
      fetchWarehouse();
    }, 1000); // 3 seconds = 3000 milliseconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const filteredItems = warehouse.filter((warehouse) => {
    const term = searchTerm.toLowerCase();
    const matchesCode = warehouse.warehouse_code?.toLowerCase().includes(term);
    const matchesName = warehouse.warehouse_name?.toLowerCase().includes(term);

    return matchesCode || matchesName;
  });

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Warehouse</CardTitle>
              <CardDescription>Manage warehouse</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
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
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Warehouse
              </Button>
              <AddNew
                isOpen={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={() => {
                  setDialogOpen(false);
                  fetchWarehouse(); // ✅ Refresh list
                }}
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            {selectedWarehouses.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  ✅ {selectedWarehouses.length} item(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      try {
                        await Promise.all(
                          selectedWarehouses.map((warehouse) =>
                            fetch(`/api/warehouses/${warehouse._id}`, {
                              method: "DELETE",
                            })
                          )
                        );
                        setSelectedWarehouses([]);
                        fetchWarehouse();
                      } catch (err) {
                        console.error("Bulk delete failed:", err);
                      }
                    }}>
                    Delete Selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWarehouses([])}
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
                          paginatedItems.every((warehouse) =>
                            selectedWarehouses.some(
                              (i) => i._id === warehouse._id
                            )
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSelections = [
                              ...selectedWarehouses,
                              ...paginatedItems.filter(
                                (item) =>
                                  !selectedWarehouses.some(
                                    (i) => i._id === item._id
                                  )
                              ),
                            ];
                            setSelectedWarehouses(newSelections);
                          } else {
                            const remaining = selectedWarehouses.filter(
                              (i) =>
                                !paginatedItems.some((p) => p._id === i._id)
                            );
                            setSelectedWarehouses(remaining);
                          }
                        }}
                        className="accent-black"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Creation Date
                      </span>
                    </div>
                  </TableHead>
                  <TableHead>Warehouse Code</TableHead>
                  <TableHead>Warehouse Name</TableHead>
                  <TableHead>Warehouse Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                          Loading warehouses…
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedItems.length > 0 ? (
                  [...paginatedItems]
                    .sort(
                      (a, b) =>
                        new Date(b.createdDT).getTime() -
                        new Date(a.createdDT).getTime()
                    )
                    .map((warehouse: WarehouseType) => (
                      <TableRow key={warehouse._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedWarehouses.some(
                              (i) => i._id === warehouse._id
                            )}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedWarehouses((prev) =>
                                  prev.some((p) => p._id === warehouse._id)
                                    ? prev
                                    : [...prev, warehouse]
                                );
                              } else {
                                setSelectedWarehouses((prev) =>
                                  prev.filter((i) => i._id !== warehouse._id)
                                );
                              }
                            }}
                            className="mr-2"
                          />

                          {new Date(warehouse.createdDT).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          {(warehouse?.warehouse_code || "").toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {(warehouse?.warehouse_name || "").toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {(warehouse?.warehouse_location || "").toUpperCase()}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setEditingWarehouse(warehouse);
                                setIsEditWarehouseOpen(true);
                              }}
                              className="gap-2">
                              <Edit className="h-4 w-4" />
                            </Button>

                            <ConfirmDeleteButton
                              warehouse={warehouse}
                              fetchWarehouse={fetchWarehouse}
                            />
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
        {editingWarehouse && (
          <EditWarehouseDialog
            warehouse={editingWarehouse}
            isOpen={isEditWarehouseOpen}
            onClose={() => setIsEditWarehouseOpen(false)}
            onSuccess={() => {
              // Refresh list or show toast
            }}
          />
        )}
      </Card>
    </div>
  );
}
