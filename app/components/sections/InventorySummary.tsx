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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Search, Download, Package } from "lucide-react";

import { InventoryType, ItemType } from "./type";

export default function InventorySummary() {
  const [inventoryItems, setInventoryItems] = useState<InventoryType[]>([]);
  const [itemCatalog, setItemCatalog] = useState<ItemType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  // ✅ Memoized category lookup map
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    itemCatalog.forEach((item) => {
      const key = item.itemName.trim().toUpperCase();
      map[key] = item.category?.trim().toUpperCase() || "UNCATEGORIZED";
    });
    return map;
  }, [itemCatalog]);

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
    let filtered = inventoryItems;

    if (selectedWarehouse !== "all") {
      filtered = filtered.filter(
        (item) => item.warehouse === selectedWarehouse
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.warehouse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [inventoryItems, selectedWarehouse, searchTerm]);

  // ✅ Summary stats
  const summaryStats = useMemo(() => {
    const uniqueItems = new Set(filteredData.map((item) => item.itemName)).size;
    const totalQuantity = filteredData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const warehouseCount = new Set(filteredData.map((item) => item.warehouse))
      .size;

    return {
      uniqueItems,
      totalQuantity,
      warehouseCount,
    };
  }, [filteredData]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Inventory Summary</h2>
          <p className="text-muted-foreground">
            View aggregated inventory quantities by item and warehouse
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.uniqueItems}</div>
            <p className="text-xs text-muted-foreground">
              Unique items in inventory
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.totalQuantity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Units in stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Warehouses</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.warehouseCount}
            </div>
            <p className="text-xs text-muted-foreground">Storage locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by item name or warehouse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="h-10 rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="all">All Warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground">
                      No inventory data found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow
                      key={`${item.itemCode}-${item.warehouse}-${index}`}>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.warehouse}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      {filteredData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredData.length}{" "}
                {filteredData.length === 1 ? "entry" : "entries"}
              </p>
              <div className="text-right">
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    Total Quantity:{" "}
                  </span>
                  <span className="font-semibold">
                    {summaryStats.totalQuantity.toLocaleString()} units
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
