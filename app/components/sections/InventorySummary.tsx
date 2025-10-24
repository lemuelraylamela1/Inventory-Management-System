import React, { useState, useMemo, useEffect, useRef } from "react";
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
import {
  Search,
  Download,
  Package,
  BarChart,
  Building2,
  Loader2,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";

import { InventoryType, ItemType } from "./type";

export default function InventorySummary() {
  const [inventoryItems, setInventoryItems] = useState<InventoryType[]>([]);
  const [itemCatalog, setItemCatalog] = useState<ItemType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const isFirstFetch = useRef(true);

  // ✅ Grouped totals by warehouse
  const warehouseItemSummary = useMemo(() => {
    const summary: Record<
      string,
      { itemName: string; category: string; quantity: number }[]
    > = {};

    inventoryItems.forEach((item) => {
      const warehouse = item.warehouse?.trim().toUpperCase() || "UNKNOWN";
      const itemName = item.itemName?.trim() || "";
      const normalizedName = itemName.toUpperCase();
      const category = item.category?.trim().toUpperCase() || "UNCATEGORIZED";
      const quantity = Number(item.quantity) || 0;

      if (!itemName) {
        console.warn("⚠️ Skipped item with missing itemName:", item);
        return;
      }

      if (!summary[warehouse]) summary[warehouse] = [];

      const existing = summary[warehouse].find(
        (entry) => entry.itemName.trim().toUpperCase() === normalizedName
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        summary[warehouse].push({
          itemName,
          category,
          quantity,
        });
      }
    });

    return summary;
  }, [inventoryItems]);

  // ✅ Memoized category lookup map
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};

    itemCatalog.forEach((item) => {
      const itemName = item.itemName?.trim().toUpperCase() || "";
      const category = item.category?.trim().toUpperCase() || "UNCATEGORIZED";

      if (itemName) {
        map[itemName] = category;
      } else {
        console.warn("⚠️ Skipped item with missing itemName:", item);
      }
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
    const fetchInventoryMain = async () => {
      if (isFirstFetch.current) setIsLoading(true);

      try {
        const res = await fetch("/api/inventory-main", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch inventory-main");

        const response = await res.json();

        const data = Array.isArray(response)
          ? response.map((item: InventoryType) => {
              const itemName = item.itemName?.trim().toUpperCase() || "";
              const category = categoryMap[itemName] ?? "";

              return {
                ...item,
                category,
              };
            })
          : [];

        setInventoryItems(data);
      } catch (err) {
        console.error("❌ Failed to fetch inventory_main", err);
        setInventoryItems([]);
      } finally {
        if (isFirstFetch.current) {
          setIsLoading(false);
          isFirstFetch.current = false;
        }
      }
    };

    fetchInventoryMain();
    const interval = setInterval(fetchInventoryMain, 1000);
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
    <Tabs defaultValue="summary" className="space-y-8">
      <TabsList className="w-full justify-start gap-2">
        <TabsTrigger value="summary">📦 Summary View</TabsTrigger>
        <TabsTrigger value="warehouse">🏬 Grouped by Warehouse</TabsTrigger>
      </TabsList>

      {/* Tab 1: Inventory Summary */}
      <TabsContent value="summary" className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              📦 Inventory Summary
            </h2>
            <p className="text-sm text-muted-foreground">
              Aggregated quantities by item and warehouse
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Total Items",
              value: summaryStats.uniqueItems,
              subtitle: "Unique items in inventory",
              icon: Package,
            },
            {
              title: "Total Quantity",
              value: summaryStats.totalQuantity.toLocaleString(),
              subtitle: "Units in stock",
              icon: BarChart,
            },
            {
              title: "Warehouses",
              value: summaryStats.warehouseCount,
              subtitle: "Storage locations",
              icon: Building2,
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card
                key={i}
                className="bg-background shadow-sm hover:shadow-md transition-shadow border border-muted">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <fieldset className="border rounded-md p-4 bg-muted/30">
          <legend className="text-sm font-medium text-muted-foreground px-2">
            Filter Options
          </legend>
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
        </fieldset>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 border-b">
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-6 text-center text-muted-foreground">
                        <div className="inline-flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-sm font-medium tracking-wide">
                            Loading inventory data…
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
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
                        key={`${item.itemCode}-${item.warehouse}-${index}`}
                        className={index % 2 === 0 ? "bg-muted/20" : ""}>
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

        {filteredData.length > 0 && (
          <Card className="bg-muted/50 border border-dashed">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Showing <strong>{filteredData.length}</strong>{" "}
                  {filteredData.length === 1 ? "entry" : "entries"}
                </span>
                <span>
                  Total Quantity:{" "}
                  <strong>
                    {summaryStats.totalQuantity.toLocaleString()} units
                  </strong>
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Tab 2: Warehouse Breakdown */}
      <TabsContent value="warehouse" className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              🏬 Warehouse Breakdown
            </h2>
            <p className="text-sm text-muted-foreground">
              Grouped item quantities per warehouse
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📍 Warehouse Totals</CardTitle>
            <CardDescription>Item breakdown by warehouse</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto space-y-8">
            <div className="text-right text-sm font-medium text-muted-foreground">
              Total Quantity of All Items:{" "}
              <span className="font-bold">
                {Object.values(warehouseItemSummary)
                  .flat()
                  .reduce((sum, item) => sum + item.quantity, 0)
                  .toLocaleString()}{" "}
                units
              </span>
            </div>

            {Object.entries(warehouseItemSummary).map(
              ([warehouse, items], idx) => {
                const warehouseTotal = items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );
                return (
                  <div key={warehouse}>
                    {idx > 0 && <hr className="my-6 border-muted" />}
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      {warehouse}
                    </h4>
                    <Table aria-label={`Inventory for ${warehouse}`}>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/4">Item Name</TableHead>
                          <TableHead className="w-1/4">Category</TableHead>
                          <TableHead className="w-1/4 text-right">
                            Quantity
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow
                            key={`${warehouse}-${item.itemName}-${index}`}
                            className={index % 2 === 0 ? "bg-muted/20" : ""}>
                            <TableCell className="w-1/4">
                              {item.itemName}
                            </TableCell>
                            <TableCell className="w-1/4">
                              {item.category}
                            </TableCell>
                            <TableCell className="w-1/4 text-right">
                              {item.quantity.toLocaleString()} units
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/40 font-semibold">
                          <TableCell colSpan={2}>
                            Subtotal for {warehouse}
                          </TableCell>
                          <TableCell className="text-right" colSpan={2}>
                            {warehouseTotal.toLocaleString()} units
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                );
              }
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
