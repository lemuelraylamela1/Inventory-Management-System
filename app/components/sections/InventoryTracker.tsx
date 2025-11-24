"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card } from "../ui/card";
import { Search, Download } from "lucide-react";
import { InventoryType, ItemType, PurchaseReceiptType } from "./type";

interface InventoryTrackerProps {
  selectedWarehouse?: string;
}

export default function InventoryTracker({
  selectedWarehouse,
}: InventoryTrackerProps) {
  const searchParams = useSearchParams();
  const warehouseQuery = searchParams.get("warehouse") || "all";

  // Use selectedWarehouse prop or query param, fallback to 'all'
  const [warehouse, setWarehouse] = useState(
    selectedWarehouse || warehouseQuery || "all"
  );
  const [inventoryItems, setInventoryItems] = useState<InventoryType[]>([]);
  const [itemCatalog, setItemCatalog] = useState<ItemType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [receipts, setReceipts] = useState<PurchaseReceiptType[]>([]);

  // Update warehouse if selectedWarehouse prop changes
  useEffect(() => {
    if (selectedWarehouse) {
      setWarehouse(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  // Memoized category map
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    itemCatalog.forEach((item) => {
      const key = item.itemName.trim().toUpperCase();
      map[key] = item.category?.trim().toUpperCase() || "UNCATEGORIZED";
    });
    return map;
  }, [itemCatalog]);

  // Fetch item catalog
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch items");
        const data = (await res.json())?.items || [];
        setItemCatalog(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setItemCatalog([]);
      }
    };
    fetchItems();
  }, []);

  // Fetch inventory
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch inventory");
        const response = await res.json();
        const data = Array.isArray(response)
          ? response.flatMap((record) =>
              record.items.map((item: InventoryType) => ({
                ...item,
                warehouse: record.warehouse,
                category:
                  categoryMap[item.itemName.trim().toUpperCase()] ??
                  "UNCATEGORIZED",
              }))
            )
          : [];
        setInventoryItems(data);
      } catch (err) {
        console.error(err);
        setInventoryItems([]);
      }
    };
    fetchInventory();

    // Optional: adjust polling interval
    const interval = setInterval(fetchInventory, 5000);
    return () => clearInterval(interval);
  }, [categoryMap]);

  // Unique warehouses
  const warehouses = useMemo(
    () => Array.from(new Set(inventoryItems.map((i) => i.warehouse))).sort(),
    [inventoryItems]
  );

  // Filtered data
  const filteredData = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesWarehouse =
        warehouse === "all" || item.warehouse === warehouse;
      const matchesSearch = searchTerm
        ? item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.warehouse.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesWarehouse && matchesSearch;
    });
  }, [inventoryItems, warehouse, searchTerm]);

  // Pagination
  const paginatedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const aDate = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bDate = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return bDate - aDate;
    });
    const start = (currentPage - 1) * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Item Name", "Category", "Warehouse", "Quantity"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((item) =>
        [
          `"${item.itemName}"`,
          `"${item.category}"`,
          `"${item.warehouse}"`,
          item.quantity,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_summary_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-semibold tracking-tight">
          📦 Inventory Tracker
        </h2>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Search + Warehouse Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by item name or warehouse..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <select
          value={warehouse}
          onChange={(e) => {
            setWarehouse(e.target.value);
            setCurrentPage(1);
          }}
          className="h-10 rounded-md border border-input bg-input-background px-3 py-2 text-sm">
          <option value="all">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Reference No.</TableHead>
              <TableHead>Particulars</TableHead>
              <TableHead className="text-right text-green-600">In</TableHead>
              <TableHead className="text-right text-red-600">Out</TableHead>
              <TableHead className="text-right">Current Onhand</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-6 text-center text-muted-foreground">
                  No inventory data found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => {
                const activityColor =
                  item.activity === "PURCHASE"
                    ? "text-green-600"
                    : item.activity === "SALE"
                    ? "text-red-600"
                    : item.activity === "RETURNED"
                    ? "text-blue-600"
                    : "text-yellow-600";

                return (
                  <TableRow
                    key={`${item.itemCode}-${item.warehouse}-${index}`}
                    className={index % 2 === 0 ? "bg-muted/10" : ""}>
                    <TableCell>
                      {item.updatedAt || item.createdAt
                        ? new Date(
                            item.updatedAt ?? item.createdAt!
                          ).toLocaleDateString("en-PH")
                        : "—"}
                    </TableCell>
                    <TableCell>{item.itemName ?? "—"}</TableCell>
                    <TableCell>{item.warehouse ?? "—"}</TableCell>
                    <TableCell title={item.referenceNumber}>
                      {item.referenceNumber ?? "—"}
                    </TableCell>
                    <TableCell title={item.particulars}>
                      {item.particulars ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {item.inQty > 0 ? item.inQty : "-"}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {item.outQty > 0 ? item.outQty : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.currentOnhand ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${activityColor} px-2 py-1 rounded-full bg-muted/20`}>
                        {item.activity ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>{item.user ?? "—"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="flex flex-col gap-4 pt-4">
          <div className="flex justify-center text-sm text-muted-foreground">
            Showing {paginatedData.length} of {filteredData.length} entries
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="rowsPerPage"
                className="text-sm text-muted-foreground">
                Rows per page:
              </label>
              <select
                id="rowsPerPage"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-input bg-input-background px-2 py-1 text-sm">
                {[10, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}>
                Previous
              </Button>
              <Button
                variant="ghost"
                disabled={currentPage * rowsPerPage >= filteredData.length}
                onClick={() => setCurrentPage((prev) => prev + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
