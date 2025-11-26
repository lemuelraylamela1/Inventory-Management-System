import { useEffect, useState, useMemo, useRef } from "react";
import { ScrollArea } from "../ui/scroll-area";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Eye,
  Edit,
  Trash2,
  Banknote,
  Loader2,
  Inbox,
  Search,
  Plus,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";

import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogContent,
} from "../ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import type { ItemType, PriceListType } from "./type";

export default function PriceList() {
  const [priceLists, setPriceLists] = useState<PriceListType[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const inputRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [itemSuggestions, setItemSuggestions] = useState<
    Record<
      number,
      { suggestions: { itemCode: string; itemName: string }[]; show: boolean }
    >
  >({});

  // CREATE dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form data for create/edit
  const [formData, setFormData] = useState<
    Partial<PriceListType> & { _id?: string }
  >({
    _id: undefined,
    priceLevelCode: "",
    priceLevelName: "",
    items: [],
  });

  const [isCreating, setIsCreating] = useState(false);

  // VIEW dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // EDIT dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(inputRefs.current).forEach(([key, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setItemSuggestions((prev) => ({
            ...prev,
            [Number(key)]: { ...prev[Number(key)], show: false },
          }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPriceLists = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return priceLists.filter((pl) => {
      const code = pl.priceLevelCode?.toLowerCase() || "";
      const name = pl.priceLevelName?.toLowerCase() || "";

      // Search also inside items
      const itemMatch = pl.items.some((item) => {
        const itemCode = item.itemCode?.toLowerCase() || "";
        const itemName = item.itemName?.toLowerCase() || "";
        return itemCode.includes(query) || itemName.includes(query);
      });

      return code.includes(query) || name.includes(query) || itemMatch;
    });
  }, [priceLists, searchTerm]);

  const totalPages = Math.ceil(filteredPriceLists.length / rowsPerPage);

  const paginatedPriceLists: PriceListType[] = filteredPriceLists.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const resetForm = () => {
    setFormData({});
  };

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setFormData({});
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setFormData({});
    }
  }, [isEditDialogOpen]);

  useEffect(() => {
    if (!isViewDialogOpen) {
      setFormData({});
    }
  }, [isViewDialogOpen]);

  const isFirstFetch = useRef(true);

  const refreshPriceList = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/price-lists");
      const data = await res.json();
      setPriceLists(data);
    } catch (err) {
      console.error("Failed to fetch price lists:", err);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    refreshPriceList(); // Initial fetch

    const interval = setInterval(() => {
      refreshPriceList();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchPriceLists = async () => {
    try {
      const res = await fetch("/api/price-lists");
      const data = await res.json();
      setPriceLists(data);
    } catch (err) {
      console.error("Failed to fetch price lists", err);
    }
  };

  const handleItemNameChange = async (index: number, value: string) => {
    // Update formData
    const updated = [...(formData.items || [])];
    updated[index].itemName = value;
    setFormData((prev) => ({ ...prev, items: updated }));

    // Keep dropdown open while typing
    setItemSuggestions((prev) => ({
      ...prev,
      [index]: {
        suggestions: prev[index]?.suggestions || [],
        show: true,
      },
    }));

    try {
      const res = await fetch(`/api/items?name=${encodeURIComponent(value)}`);
      const data = await res.json();

      const filtered = (data.items || []).filter((item: ItemType) => {
        const name = item.itemName || "";
        const code = item.itemCode || "";
        return (
          name.toLowerCase().includes(value.toLowerCase()) ||
          code.toLowerCase().includes(value.toLowerCase())
        );
      });

      console.log(`[ItemSuggestions] index=${index}`, filtered);

      setItemSuggestions((prev) => ({
        ...prev,
        [index]: { suggestions: filtered, show: true },
      }));
    } catch (err) {
      console.error("Failed to fetch items:", err);
    }
  };

  const handleSelectSuggestion = (
    index: number,
    selectedItem: { itemCode: string; itemName: string }
  ) => {
    console.log(
      `[SelectSuggestion] index: ${index}, selectedItem:`,
      selectedItem
    );

    const updated = [...(formData.items || [])];
    updated[index].itemName = selectedItem.itemName;
    updated[index].itemCode = selectedItem.itemCode;
    setFormData((prev) => ({ ...prev, items: updated }));

    // Clear suggestions for this row
    setItemSuggestions((prev) => ({
      ...prev,
      [index]: { suggestions: [], show: false },
    }));

    console.log(`[SelectSuggestion] Suggestions cleared for index ${index}`);
  };

  const handleCreate = async (formData: Partial<PriceListType>) => {
    const payload: Partial<PriceListType> = {
      priceLevelCode: formData.priceLevelCode?.trim().toUpperCase() || "",
      priceLevelName: formData.priceLevelName?.trim() || "",
      items: (formData.items || []).map((item) => ({
        itemCode: item.itemCode?.trim().toUpperCase() || "",
        itemName: item.itemName?.trim() || "",
        salesPrice: Number(item.salesPrice) || 0,
      })),
    };

    try {
      const res = await fetch("/api/price-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create price list");

      const created = await res.json();
      console.log("Price list created:", created);

      await refreshPriceList();
      setIsCreateDialogOpen(false);
      setFormData({});
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleEdit = (priceList: PriceListType) => {
    setFormData({
      _id: priceList._id,
      priceLevelCode: priceList.priceLevelCode,
      priceLevelName: priceList.priceLevelName,
      items: priceList.items.map((item) => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        salesPrice: item.salesPrice,
      })),
    });

    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (
    formData: Partial<PriceListType> & { _id?: string }
  ) => {
    if (!formData._id) return console.warn("Missing price list ID for update");

    const payload: Partial<PriceListType> = {
      priceLevelCode: formData.priceLevelCode?.trim() || "",
      priceLevelName: formData.priceLevelName?.trim() || "",
      items:
        formData.items?.map((item) => ({
          itemCode: item.itemCode?.trim() || "",
          itemName: item.itemName?.trim() || "",
          salesPrice: item.salesPrice || 0,
        })) || [],
    };

    try {
      const res = await fetch(`/api/price-lists/${formData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update price list");

      const updated = await res.json();
      console.log("Price list updated:", updated);

      await fetchPriceLists(); // refresh the list
      setIsEditDialogOpen(false);
      setFormData({
        _id: undefined,
        priceLevelCode: "",
        priceLevelName: "",
        items: [],
      });
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDelete = async (priceListId?: string) => {
    if (!priceListId) return console.warn("Missing price list ID for deletion");

    try {
      const res = await fetch(`/api/price-lists/${priceListId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete price list");

      console.log("Price list deleted:", priceListId);

      // Refresh the table after deletion
      await fetchPriceLists();

      // Remove from selectedIds if you use multi-select
      setSelectedIds((prev) => prev.filter((id) => id !== priceListId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleView = async (priceListId?: string) => {
    if (!priceListId) return console.warn("Missing price list ID for view");

    try {
      const res = await fetch(`/api/price-lists/${priceListId}`);
      if (!res.ok) throw new Error("Failed to fetch price list details");

      const priceList = await res.json();
      console.log("Price list details:", priceList);

      setFormData(priceList); // populate formData for the view dialog
      setIsViewDialogOpen(true);
    } catch (err) {
      console.error("View error:", err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Price List</CardTitle>
            <CardDescription>Manage product pricing</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Create */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Price Level Name or Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Price List
          </Button>
        </div>

        {/* Table */}
        <ScrollArea className="max-h-[500px] overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-4 px-2">
                  <Checkbox
                    checked={paginatedPriceLists
                      .map((p) => p._id)
                      .filter((id): id is string => !!id)
                      .every((id) => selectedIds.includes(id))}
                    onCheckedChange={(checked) => {
                      const visibleIds = paginatedPriceLists
                        .map((p) => p._id)
                        .filter((id): id is string => !!id);

                      setSelectedIds((prev) =>
                        checked
                          ? [...new Set([...prev, ...visibleIds])]
                          : prev.filter((id) => !visibleIds.includes(id))
                      );
                    }}
                    aria-label="Select all visible price list entries"
                    className="ml-1"
                  />
                </TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead>Price Level Name</TableHead>
                <TableHead>Price Level Code</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading price lists…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPriceLists.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-6 w-6" />
                      <span className="text-sm">No price lists found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPriceLists.map((pl) => (
                  <TableRow key={pl._id}>
                    <TableCell className="px-2">
                      <Checkbox
                        checked={selectedIds.includes(pl._id ?? "")}
                        onCheckedChange={(checked) => {
                          const id = pl._id;
                          if (!id) return;

                          setSelectedIds((prev) =>
                            checked
                              ? [...prev, id]
                              : prev.filter((x) => x !== id)
                          );
                        }}
                        aria-label={`Select ${
                          pl.priceLevelName || "Price List"
                        }`}
                        className="ml-1"
                      />
                    </TableCell>
                    <TableCell>
                      {pl.createdAt
                        ? new Date(pl.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>{pl.priceLevelName ?? "—"}</TableCell>
                    <TableCell>{pl.priceLevelCode ?? "—"}</TableCell>
                    <TableCell>
                      {pl.items?.map((i) => (
                        <div key={i.itemCode}>
                          {i.itemName} ({i.itemCode}):{" "}
                          {i.salesPrice.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      )) || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(pl._id!)}
                        title="View Price List">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(pl)}
                        title="Edit Price List">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Price List"
                            className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Price List
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently delete this price list?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(pl._id!)}>
                                Confirm Delete
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogPanel className="max-w-2xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Create Price List
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the price list details. Fields marked with{" "}
              <span className="text-red-500">*</span> are required.
            </DialogDescription>
          </DialogHeader>

          {/* Price List Form */}
          <div className="space-y-4 py-4">
            {/* Price Level Code + Name in one row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="priceLevelCode">
                  Price Level Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="priceLevelCode"
                  value={formData.priceLevelCode ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priceLevelCode: e.target.value,
                    }))
                  }
                  placeholder="e.g. PL-001"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="priceLevelName">
                  Price Level Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="priceLevelName"
                  value={formData.priceLevelName ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priceLevelName: e.target.value,
                    }))
                  }
                  placeholder="e.g. Retail Price"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-2">
              {/* Header row */}
              <div className="flex gap-2 px-2 py-1 font-semibold text-sm text-muted-foreground items-center">
                <div className="flex-1">Item Code</div>
                <div className="flex-1">Item Name</div>
                <div className="w-28">Sales Price</div>
                <div className="w-10 text-center">Actions</div>
              </div>

              {formData.items?.map((item, index) => {
                const suggestions = itemSuggestions[index]?.suggestions || [];
                const showSuggestions = itemSuggestions[index]?.show || false;

                return (
                  <div
                    key={index}
                    className="flex gap-2 items-center px-2 py-1 border rounded relative">
                    {/* Item Code */}
                    <Input
                      placeholder="Item Code"
                      value={item.itemCode}
                      className="flex-1"
                      readOnly
                    />

                    {/* Item Name with suggestions */}
                    <div
                      ref={(el) => {
                        inputRefs.current[index] = el; // Assign the element
                        // Do NOT return anything
                      }}
                      className="flex-1 relative">
                      <Input
                        placeholder="Item Name"
                        value={item.itemName}
                        onChange={(e) =>
                          handleItemNameChange(index, e.target.value)
                        }
                        onFocus={() =>
                          handleItemNameChange(index, item.itemName || "")
                        } // show suggestions on focus
                      />

                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 top-full left-0 right-0 border bg-white shadow-md rounded mt-1 max-h-60 overflow-y-auto">
                          {suggestions.map((s, i) => {
                            const query = item.itemName?.toLowerCase() || "";

                            const highlight = (text: string) => {
                              const lower = text.toLowerCase();
                              const start = lower.indexOf(query);
                              if (start === -1) return text;
                              const end = start + query.length;
                              return (
                                <>
                                  {text.substring(0, start)}
                                  <span className="font-semibold bg-yellow-200">
                                    {text.substring(start, end)}
                                  </span>
                                  {text.substring(end)}
                                </>
                              );
                            };

                            return (
                              <div
                                key={i}
                                className="p-2 cursor-pointer hover:bg-gray-100"
                                onMouseDown={(e) => e.preventDefault()} // prevent blur
                                onClick={() =>
                                  handleSelectSuggestion(index, s)
                                }>
                                <div className="flex flex-col">
                                  <span>{highlight(s.itemName)}</span>
                                  <span className="text-xs text-gray-500">
                                    {highlight(s.itemCode)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Sales Price */}
                    <Input
                      type="number"
                      placeholder="Sales Price"
                      value={item.salesPrice}
                      onChange={(e) => {
                        const updated = [...(formData.items ?? [])];
                        updated[index].salesPrice = Number(e.target.value);
                        setFormData((prev) => ({ ...prev, items: updated }));
                      }}
                      className="w-28"
                    />

                    {/* Remove Item */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 flex justify-center text-red-600 hover:text-red-700"
                      onClick={() => {
                        const updated = (formData.items ?? []).filter(
                          (_, i) => i !== index
                        );
                        setFormData((prev) => ({ ...prev, items: updated }));
                      }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}

              {/* Add Item Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    items: [
                      ...(prev.items || []),
                      { itemCode: "", itemName: "", salesPrice: 0 },
                    ],
                  }))
                }>
                Add Item
              </Button>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => handleCreate(formData)}
              disabled={
                !formData.priceLevelCode?.trim() ||
                !formData.priceLevelName?.trim()
              }>
              Create Price List
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
    </Card>
  );
}
