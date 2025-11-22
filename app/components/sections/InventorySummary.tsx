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
  SearchIcon,
} from "lucide-react";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";

import { InventoryType, ItemType } from "./type";

export default function InventorySummary() {
  const [inventoryItems, setInventoryItems] = useState<InventoryType[]>([]);
  const [itemCatalog, setItemCatalog] = useState<ItemType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const isFirstFetch = useRef(true);
  const [selectedGroupedWarehouse, setSelectedGroupedWarehouse] =
    useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  // Flatten all warehouse entries
  const allEntries = Object.entries(warehouseItemSummary).flatMap(
    ([warehouse, items]) =>
      items.map((item) => ({
        warehouse,
        itemName: item.itemName,
        category: item.category,
        quantity: item.quantity,
      }))
  );

  // Unique warehouse list (dynamic columns)
  const warehouseList = Array.from(new Set(allEntries.map((e) => e.warehouse)));

  // Group by itemName
  const groupedByItemName = allEntries.reduce((acc, entry) => {
    const itemKey = entry.itemName?.toUpperCase().trim();
    if (!itemKey) return acc;

    if (!acc[itemKey]) {
      acc[itemKey] = {
        category: entry.category,
        warehouses: {} as Record<string, number>,
        total: 0,
      };
    }

    // Sum quantities per warehouse and overall
    acc[itemKey].warehouses[entry.warehouse] =
      (acc[itemKey].warehouses[entry.warehouse] ?? 0) + entry.quantity;
    acc[itemKey].total += entry.quantity;

    return acc;
  }, {} as Record<string, { category: string; warehouses: Record<string, number>; total: number }>);

  // Filter items by selected warehouse
  const filteredGroupedItems = Object.entries(groupedByItemName)
    .filter(([itemName, { warehouses }]) => {
      if (selectedGroupedWarehouse === "all") return true;
      return (warehouses[selectedGroupedWarehouse] ?? 0) > 0;
    })
    // Optional: sort alphabetically
    .sort(([aName], [bName]) => aName.localeCompare(bName));

  const paginatedGroupedItems = useMemo(() => {
    // Determine displayed warehouses
    const displayedWarehouses =
      selectedGroupedWarehouse === "all"
        ? warehouseList
        : [selectedGroupedWarehouse];

    // Filter by search term
    const searchedItems = filteredGroupedItems
      .filter(([itemName]) =>
        itemName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort(([a], [b]) => a.localeCompare(b));

    // Pagination
    const totalPages = Math.ceil(searchedItems.length / ITEMS_PER_PAGE);
    const currentPageSafe = Math.min(currentPage, totalPages || 1); // handle empty list
    const paginatedItems = searchedItems.slice(
      (currentPageSafe - 1) * ITEMS_PER_PAGE,
      currentPageSafe * ITEMS_PER_PAGE
    );

    return {
      paginatedItems,
      displayedWarehouses,
      totalPages,
    };
  }, [
    filteredGroupedItems,
    selectedGroupedWarehouse,
    searchTerm,
    currentPage,
    warehouseList,
  ]);

  return (
    <Tabs defaultValue="summary" className="space-y-8">
      <TabsList className="flex w-full gap-2 border-b border-gray-200 pb-1 bg-gray-50 rounded-lg shadow-sm">
        <TabsTrigger
          value="summary"
          className="px-5 py-2 font-semibold rounded-lg text-gray-700 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 hover:bg-gray-100 transition-colors">
          📦 Summary View
        </TabsTrigger>
        <TabsTrigger
          value="warehouse"
          className="px-5 py-2 font-semibold rounded-lg text-gray-700 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 hover:bg-gray-100 transition-colors">
          🏬 Grouped by Item
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Inventory Summary */}
      <TabsContent value="summary" className="space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              📦 Inventory Summary
            </h2>
            <p className="text-sm text-muted-foreground">
              Aggregated quantities by item and warehouse
            </p>
          </div>
        </div>

        {/* Summary Stats Cards */}
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
                className="bg-background shadow-md hover:shadow-lg transition-shadow border border-muted rounded-xl">
                <CardHeader className="flex justify-between items-center pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" />
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

        {/* Filters */}
        <fieldset className="border rounded-lg p-4 bg-muted/10">
          <legend className="text-sm font-semibold text-muted-foreground px-2">
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
                className="h-10 rounded-md border border-input bg-input-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                <option value="all">All Warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
        </fieldset>

        {/* Inventory Table */}
        <Card className="shadow-lg rounded-2xl border border-gray-200 overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-background z-10 border-b shadow-sm">
              <TableRow>
                {[
                  "Item Name",
                  "Category",
                  "Warehouse",
                  "Total Quantity",
                  "Quantity on Hold",
                  "Available Quantity",
                ].map((head, idx) => (
                  <TableHead
                    key={idx}
                    className={`px-4 py-2 ${
                      idx > 2 ? "text-right" : "text-left"
                    }`}>
                    {head}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2 justify-center">
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
                    colSpan={6}
                    className="py-4 text-center text-muted-foreground">
                    No inventory data found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => {
                  const available = item.availableQuantity ?? 0;
                  const availableClass =
                    available === 0
                      ? "text-red-600 font-semibold"
                      : available < 10
                      ? "text-orange-500 font-medium"
                      : "text-green-600 font-medium";

                  return (
                    <TableRow
                      key={`${item.itemCode}-${item.warehouse}-${index}`}
                      className={`transition-colors hover:bg-muted/30 ${
                        index % 2 === 0 ? "bg-muted/10" : ""
                      }`}>
                      <TableCell className="px-4 py-2 uppercase font-medium">
                        {item.itemName}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        {item.category}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        {item.warehouse}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-right text-blue-600 font-medium">
                        {item.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-right text-yellow-600 font-medium">
                        {(item.quantityOnHold ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`px-4 py-2 text-right ${availableClass}`}>
                        {available.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {filteredData.length > 0 && (
          <Card className="bg-muted/50 border border-dashed rounded-lg">
            <CardContent className="pt-4 flex justify-between text-sm text-muted-foreground">
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
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Tab 2: Warehouse Breakdown */}
      <TabsContent value="warehouse" className="space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              🏬 Warehouse Breakdown
            </h2>
            <p className="text-sm text-muted-foreground">
              Grouped item quantities by item name across warehouses
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          {/* Search by Item Name */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by item name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // reset page when search changes
              }}
              className="pl-10 w-full"
            />
          </div>

          {/* Warehouse Filter */}
          <Select.Root
            value={selectedGroupedWarehouse}
            onValueChange={(value) => {
              setSelectedGroupedWarehouse(value);
              setCurrentPage(1); // reset page when warehouse changes
            }}>
            <Select.Trigger className="inline-flex items-center justify-between w-64 h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors">
              <Select.Value placeholder="Select Warehouse" />
              <Select.Icon>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </Select.Icon>
            </Select.Trigger>

            <Select.Content className="overflow-hidden rounded-md bg-white shadow-lg">
              <Select.Viewport className="p-1">
                <Select.Item
                  value="all"
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-blue-50 cursor-pointer">
                  <Select.ItemText>All Warehouses</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check className="w-4 h-4 text-blue-500" />
                  </Select.ItemIndicator>
                </Select.Item>

                {warehouseList.map((wh) => (
                  <Select.Item
                    key={wh}
                    value={wh}
                    className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-blue-50 cursor-pointer">
                    <Select.ItemText>{wh}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check className="w-4 h-4 text-blue-500" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Root>

          {/* Export CSV */}
          <Button onClick={handleExportCSV} variant="outline" className="h-10">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Table with pagination */}
        {(() => {
          // Pagination and filtered items
          const displayedWarehouses =
            selectedGroupedWarehouse === "all"
              ? warehouseList
              : [selectedGroupedWarehouse];

          // Filter by search term
          const searchedItems = filteredGroupedItems
            .filter(([itemName]) =>
              itemName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort(([a], [b]) => a.localeCompare(b)); // alphabetical

          const totalPages = Math.ceil(searchedItems.length / ITEMS_PER_PAGE);
          const currentPageSafe = Math.min(currentPage, totalPages || 1);
          const paginatedItems = searchedItems.slice(
            (currentPageSafe - 1) * ITEMS_PER_PAGE,
            currentPageSafe * ITEMS_PER_PAGE
          );

          return (
            <>
              <Card className="shadow-lg rounded-2xl border border-gray-200 overflow-x-auto">
                <CardContent>
                  <div className="text-right text-sm font-medium text-muted-foreground mb-4">
                    Total Quantity of All Items:{" "}
                    <span className="font-bold">
                      {allEntries
                        .reduce((sum, e) => sum + e.quantity, 0)
                        .toLocaleString()}{" "}
                      units
                    </span>
                  </div>

                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">
                          Item Name
                        </TableHead>
                        <TableHead className="min-w-[130px]">
                          Category
                        </TableHead>

                        {displayedWarehouses.map((warehouse) => (
                          <TableHead
                            key={warehouse}
                            className="text-right min-w-[120px]">
                            {warehouse}
                          </TableHead>
                        ))}

                        <TableHead className="text-right min-w-[120px]">
                          Total
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map(
                        (
                          [itemName, { category, warehouses, total }],
                          rowIndex
                        ) => (
                          <TableRow
                            key={itemName}
                            className={rowIndex % 2 === 0 ? "bg-muted/20" : ""}>
                            <TableCell className="font-medium">
                              {itemName}
                            </TableCell>
                            <TableCell>{category}</TableCell>

                            {displayedWarehouses.map((warehouse) => {
                              const qty = warehouses[warehouse] ?? 0;
                              const qtyClass =
                                qty === 0
                                  ? "text-red-600 font-bold"
                                  : qty < 10
                                  ? "text-orange-500 font-medium"
                                  : "text-green-600 font-medium";

                              return (
                                <TableCell
                                  key={warehouse}
                                  className={`text-right ${qtyClass}`}>
                                  {qty.toLocaleString()}
                                </TableCell>
                              );
                            })}

                            <TableCell className="text-right font-bold">
                              {total.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <Button
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }>
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }>
                    Next
                  </Button>
                </div>
              )}
            </>
          );
        })()}
      </TabsContent>
    </Tabs>
  );
}
