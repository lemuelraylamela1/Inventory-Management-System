import React, { useState, useMemo, useEffect } from "react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Search, Download, Package } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";

import { InventoryType, ItemType, PurchaseReceiptType } from "./type";
import { Item } from "@radix-ui/react-select";

export default function InventoryTracker() {
  const [inventoryItems, setInventoryItems] = useState<InventoryType[]>([]);
  const [itemCatalog, setItemCatalog] = useState<ItemType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [receipts, setReceipts] = useState<PurchaseReceiptType[]>([]);

  // ✅ Memoized category lookup map
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    itemCatalog.forEach((item) => {
      const key = item.itemName.trim().toUpperCase();
      map[key] = item.category?.trim().toUpperCase() || "UNCATEGORIZED";
    });
    return map;
  }, [itemCatalog]);

  useEffect(() => {
    async function fetchReceipts() {
      const res = await fetch("/api/purchase-receipts");
      const data = await res.json();

      console.log("Fetched receipts:", data); // ✅ check referenceNumbers
      setReceipts(data);
    }

    fetchReceipts();
  }, []);

  // ✅ Fetch item catalog
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch items");

        const response = await res.json();
        const data = Array.isArray(response)
          ? response
          : Array.isArray(response.items)
          ? response.items
          : [];

        setItemCatalog(data);
      } catch (err) {
        console.error("Failed to fetch item catalog", err);
        setItemCatalog([]);
      }
    };

    fetchItems();
  }, []);

  // ✅ Fetch inventory and enrich with category
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch inventory");

        const response = await res.json();
        const data = Array.isArray(response)
          ? response.flatMap((record) =>
              record.items.map((item: InventoryType) => {
                const key = item.itemName.trim().toUpperCase();
                return {
                  ...item,
                  warehouse: record.warehouse,
                  category: categoryMap[key] ?? "UNCATEGORIZED",
                };
              })
            )
          : [];

        setInventoryItems(data);
      } catch (err) {
        console.error("Failed to fetch inventory", err);
        setInventoryItems([]);
      }
    };

    fetchInventory();
    const interval = setInterval(fetchInventory, 1000);
    return () => clearInterval(interval);
  }, [categoryMap]);

  // ✅ Unique warehouses
  const warehouses = useMemo(() => {
    const uniqueWarehouses = Array.from(
      new Set(inventoryItems.map((item) => item.warehouse))
    );
    return uniqueWarehouses.sort();
  }, [inventoryItems]);

  // ✅ Filtered data
  const filteredData = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesWarehouse =
        selectedWarehouse === "all" ||
        item.warehouse?.trim().toUpperCase() === selectedWarehouse;

      const matchesSearch = searchTerm
        ? item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.warehouse?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      return matchesWarehouse && matchesSearch;
    });
  }, [inventoryItems, selectedWarehouse, searchTerm]);

  const paginatedData = useMemo(() => {
    const sortedByDateDesc = [...filteredData].sort((a, b) => {
      const timeA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const timeB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return timeB - timeA; // Descending: newest first
    });

    const startIndex = Math.max((currentPage - 1) * rowsPerPage, 0);
    const endIndex = startIndex + rowsPerPage;

    return sortedByDateDesc.slice(startIndex, endIndex);
  }, [filteredData, currentPage, rowsPerPage]);

  const sortedPaginatedData = paginatedData.filter(Boolean).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  // ✅ Export CSV
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
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inventory_summary_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
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
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by item name or warehouse..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset page on search
            }}
            className="pl-10"
          />
        </div>
        <select
          value={selectedWarehouse}
          onChange={(e) => {
            setSelectedWarehouse(e.target.value);
            setCurrentPage(1); // reset page on filter
          }}
          className="h-10 rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <option value="all">All Warehouses</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse} value={warehouse}>
              {warehouse}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="px-4 py-2 text-left">Date</TableHead>
              <TableHead className="px-4 py-2 text-left">Item Name</TableHead>
              <TableHead className="px-4 py-2 text-left">Warehouse</TableHead>
              <TableHead className="px-4 py-2 text-left">
                Reference No.
              </TableHead>
              <TableHead className="px-4 py-2 text-left">Particulars</TableHead>
              <TableHead className="px-4 py-2 text-right text-green-600">
                In
              </TableHead>
              <TableHead className="px-4 py-2 text-right text-red-600">
                Out
              </TableHead>
              <TableHead className="px-4 py-2 text-right">
                Current Onhand
              </TableHead>
              <TableHead className="px-4 py-2 text-left">Activity</TableHead>
              <TableHead className="px-4 py-2 text-left">User</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedPaginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-6 text-center text-muted-foreground">
                  No inventory data found
                </TableCell>
              </TableRow>
            ) : (
              sortedPaginatedData.map((item, index) => {
                // Determine row styling
                const rowStyle = index % 2 === 0 ? "bg-muted/10" : "";
                const hoverStyle = "hover:bg-muted/30 transition-colors";

                // Determine activity color
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
                    className={`${rowStyle} ${hoverStyle}`}>
                    <TableCell className="px-4 py-2 whitespace-nowrap">
                      {item.updatedAt || item.createdAt
                        ? new Date(
                            item.updatedAt ?? item.createdAt!
                          ).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </TableCell>

                    <TableCell className="px-4 py-2">
                      {item.itemName ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {item.warehouse ?? "—"}
                    </TableCell>

                    <TableCell
                      className="px-4 py-2 max-w-xs truncate"
                      title={item.referenceNumber}>
                      {item.referenceNumber?.trim() || "—"}
                    </TableCell>

                    <TableCell
                      className="px-4 py-2 max-w-xs truncate"
                      title={item.particulars}>
                      {item.particulars ?? "—"}
                    </TableCell>

                    <TableCell className="px-4 py-2 text-right text-green-600 font-medium">
                      {item.inQty > 0 ? item.inQty : "-"}
                    </TableCell>

                    <TableCell className="px-4 py-2 text-right text-red-600 font-medium">
                      {item.outQty > 0 ? item.outQty : "-"}
                    </TableCell>

                    <TableCell className="px-4 py-2 text-right">
                      {item.currentOnhand ?? "—"}
                    </TableCell>

                    <TableCell className="px-4 py-2">
                      {item.activity ? (
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${activityColor} px-2 py-1 rounded-full bg-muted/20`}>
                          {item.activity}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-2">
                      {item.user ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredData.length > 0 && (
        <div className="flex flex-col gap-4 pt-4">
          {/* Centered entry count */}
          <div className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedData.length} of {filteredData.length} entries
            </p>
          </div>

          {/* Controls: row selector + navigation */}
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
                className="h-8 rounded-md border border-input bg-input-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
