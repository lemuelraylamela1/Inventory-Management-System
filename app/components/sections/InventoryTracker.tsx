import React, { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  Warehouse,
  Filter,
  Download,
  Calendar,
} from "lucide-react";

interface InventoryTransaction {
  id: string;
  date: string;
  itemName: string;
  warehouse: string;
  referenceNo: string;
  particulars: string;
  inQty: number;
  outQty: number;
  currentOnhand: number;
  activity: "purchase" | "sale" | "adjustment" | "transfer" | "return";
  user: string;
}

// Mock data
const initialInventoryTransactions: InventoryTransaction[] = [
  {
    id: "1",
    date: "2024-01-15",
    itemName: "Laptop HP EliteBook 840",
    warehouse: "Main Warehouse",
    referenceNo: "PO-2024-001",
    particulars: "Purchase from TechCorp Solutions",
    inQty: 10,
    outQty: 0,
    currentOnhand: 35,
    activity: "purchase",
    user: "John Smith",
  },
  {
    id: "2",
    date: "2024-01-16",
    itemName: "Office Chair Executive",
    warehouse: "Secondary Warehouse",
    referenceNo: "SO-2024-015",
    particulars: "Sale to ABC Corporation",
    inQty: 0,
    outQty: 5,
    currentOnhand: 45,
    activity: "sale",
    user: "Sarah Johnson",
  },
  {
    id: "3",
    date: "2024-01-17",
    itemName: "Printer Canon ImageClass",
    warehouse: "Main Warehouse",
    referenceNo: "ADJ-2024-003",
    particulars: "Stock adjustment - damaged units",
    inQty: 0,
    outQty: 2,
    currentOnhand: 6,
    activity: "adjustment",
    user: "Mike Davis",
  },
  {
    id: "4",
    date: "2024-01-18",
    itemName: 'Monitor Dell 24" 4K',
    warehouse: "Main Warehouse",
    referenceNo: "PO-2024-008",
    particulars: "Purchase from Dell Direct",
    inQty: 15,
    outQty: 0,
    currentOnhand: 45,
    activity: "purchase",
    user: "John Smith",
  },
  {
    id: "5",
    date: "2024-01-19",
    itemName: "Desk Lamp LED",
    warehouse: "Secondary Warehouse",
    referenceNo: "TR-2024-001",
    particulars: "Transfer from Main Warehouse",
    inQty: 25,
    outQty: 0,
    currentOnhand: 100,
    activity: "transfer",
    user: "Emily Wilson",
  },
  {
    id: "6",
    date: "2024-01-20",
    itemName: "Keyboard Mechanical RGB",
    warehouse: "Main Warehouse",
    referenceNo: "SO-2024-022",
    particulars: "Sale to StartupXYZ",
    inQty: 0,
    outQty: 8,
    currentOnhand: 32,
    activity: "sale",
    user: "Sarah Johnson",
  },
  {
    id: "7",
    date: "2024-01-21",
    itemName: "Filing Cabinet 4-Drawer",
    warehouse: "Secondary Warehouse",
    referenceNo: "RT-2024-005",
    particulars: "Customer return - defective",
    inQty: 2,
    outQty: 0,
    currentOnhand: 14,
    activity: "return",
    user: "Mike Davis",
  },
  {
    id: "8",
    date: "2024-01-22",
    itemName: "Webcam Logitech HD",
    warehouse: "Main Warehouse",
    referenceNo: "SO-2024-025",
    particulars: "Bulk sale to Office Solutions Inc",
    inQty: 0,
    outQty: 20,
    currentOnhand: 40,
    activity: "sale",
    user: "Sarah Johnson",
  },
  {
    id: "9",
    date: "2024-01-23",
    itemName: "Laptop HP EliteBook 840",
    warehouse: "Main Warehouse",
    referenceNo: "ADJ-2024-004",
    particulars: "Inventory count adjustment",
    inQty: 0,
    outQty: 3,
    currentOnhand: 32,
    activity: "adjustment",
    user: "Mike Davis",
  },
  {
    id: "10",
    date: "2024-01-24",
    itemName: "Office Chair Executive",
    warehouse: "Secondary Warehouse",
    referenceNo: "PO-2024-012",
    particulars: "Purchase from FurniCorp",
    inQty: 20,
    outQty: 0,
    currentOnhand: 65,
    activity: "purchase",
    user: "John Smith",
  },
];

const warehouses = [
  "All",
  "Main Warehouse",
  "Secondary Warehouse",
  "Regional Warehouse",
];
const activities = [
  "All",
  "purchase",
  "sale",
  "adjustment",
  "transfer",
  "return",
];
const users = [
  "All",
  "John Smith",
  "Sarah Johnson",
  "Mike Davis",
  "Emily Wilson",
];

export default function InventoryTracker() {
  const [inventoryTransactions, setInventoryTransactions] = useState<
    InventoryTransaction[]
  >(initialInventoryTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("All");
  const [selectedActivity, setSelectedActivity] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<InventoryTransaction | null>(null);
  const [newTransaction, setNewTransaction] = useState<
    Partial<InventoryTransaction>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter and search logic
  const filteredTransactions = useMemo(() => {
    return inventoryTransactions.filter((transaction) => {
      const matchesSearch =
        transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.referenceNo
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.particulars
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.user.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesWarehouse =
        selectedWarehouse === "All" ||
        transaction.warehouse === selectedWarehouse;
      const matchesActivity =
        selectedActivity === "All" || transaction.activity === selectedActivity;
      const matchesUser =
        selectedUser === "All" || transaction.user === selectedUser;

      const matchesDateRange =
        (!startDate || transaction.date >= startDate) &&
        (!endDate || transaction.date <= endDate);

      return (
        matchesSearch &&
        matchesWarehouse &&
        matchesActivity &&
        matchesUser &&
        matchesDateRange
      );
    });
  }, [
    inventoryTransactions,
    searchTerm,
    selectedWarehouse,
    selectedActivity,
    selectedUser,
    startDate,
    endDate,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setNewTransaction({});
    setErrors({});
  };

  const validateForm = (transaction: Partial<InventoryTransaction>) => {
    const newErrors: Record<string, string> = {};

    if (!transaction.date?.trim()) {
      newErrors.date = "Date is required";
    }

    if (!transaction.itemName?.trim()) {
      newErrors.itemName = "Item name is required";
    }

    if (!transaction.warehouse?.trim()) {
      newErrors.warehouse = "Warehouse is required";
    }

    if (!transaction.referenceNo?.trim()) {
      newErrors.referenceNo = "Reference number is required";
    }

    if (!transaction.particulars?.trim()) {
      newErrors.particulars = "Particulars are required";
    }

    if (!transaction.activity?.trim()) {
      newErrors.activity = "Activity is required";
    }

    if (!transaction.user?.trim()) {
      newErrors.user = "User is required";
    }

    if (
      (transaction.inQty === undefined || transaction.inQty < 0) &&
      (transaction.outQty === undefined || transaction.outQty < 0)
    ) {
      newErrors.quantity = "Either In or Out quantity must be specified";
    }

    if (
      transaction.currentOnhand === undefined ||
      transaction.currentOnhand < 0
    ) {
      newErrors.currentOnhand = "Valid current on-hand quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm(newTransaction)) return;

    const transactionToAdd: InventoryTransaction = {
      id: Date.now().toString(),
      date: newTransaction.date || "",
      itemName: newTransaction.itemName || "",
      warehouse: newTransaction.warehouse || "",
      referenceNo: newTransaction.referenceNo || "",
      particulars: newTransaction.particulars || "",
      inQty: newTransaction.inQty || 0,
      outQty: newTransaction.outQty || 0,
      currentOnhand: newTransaction.currentOnhand || 0,
      activity:
        (newTransaction.activity as
          | "purchase"
          | "sale"
          | "adjustment"
          | "transfer"
          | "return") || "purchase",
      user: newTransaction.user || "",
    };

    setInventoryTransactions([transactionToAdd, ...inventoryTransactions]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedTransaction || !validateForm(newTransaction)) return;

    const updatedTransactions = inventoryTransactions.map((transaction) =>
      transaction.id === selectedTransaction.id
        ? {
            ...transaction,
            date: newTransaction.date || transaction.date,
            itemName: newTransaction.itemName || transaction.itemName,
            warehouse: newTransaction.warehouse || transaction.warehouse,
            referenceNo: newTransaction.referenceNo || transaction.referenceNo,
            particulars: newTransaction.particulars || transaction.particulars,
            inQty: newTransaction.inQty ?? transaction.inQty,
            outQty: newTransaction.outQty ?? transaction.outQty,
            currentOnhand:
              newTransaction.currentOnhand ?? transaction.currentOnhand,
            activity:
              (newTransaction.activity as
                | "purchase"
                | "sale"
                | "adjustment"
                | "transfer"
                | "return") || transaction.activity,
            user: newTransaction.user || transaction.user,
          }
        : transaction
    );

    setInventoryTransactions(updatedTransactions);
    setIsEditDialogOpen(false);
    setSelectedTransaction(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setInventoryTransactions(
      inventoryTransactions.filter((transaction) => transaction.id !== id)
    );
  };

  const openEditDialog = (transaction: InventoryTransaction) => {
    setSelectedTransaction(transaction);
    setNewTransaction({
      date: transaction.date,
      itemName: transaction.itemName,
      warehouse: transaction.warehouse,
      referenceNo: transaction.referenceNo,
      particulars: transaction.particulars,
      inQty: transaction.inQty,
      outQty: transaction.outQty,
      currentOnhand: transaction.currentOnhand,
      activity: transaction.activity,
      user: transaction.user,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (transaction: InventoryTransaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  const getActivityBadge = (activity: string) => {
    switch (activity) {
      case "purchase":
        return <Badge variant="default">Purchase</Badge>;
      case "sale":
        return <Badge variant="secondary">Sale</Badge>;
      case "adjustment":
        return <Badge variant="outline">Adjustment</Badge>;
      case "transfer":
        return <Badge className="bg-blue-100 text-blue-800">Transfer</Badge>;
      case "return":
        return <Badge className="bg-orange-100 text-orange-800">Return</Badge>;
      default:
        return <Badge variant="outline">{activity}</Badge>;
    }
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Date",
        "Item Name",
        "Warehouse",
        "Reference No.",
        "Particulars",
        "In",
        "Out",
        "Current Onhand",
        "Activity",
        "User",
      ],
      ...filteredTransactions.map((transaction) => [
        transaction.date,
        transaction.itemName,
        transaction.warehouse,
        transaction.referenceNo,
        transaction.particulars,
        transaction.inQty.toString(),
        transaction.outQty.toString(),
        transaction.currentOnhand.toString(),
        transaction.activity,
        transaction.user,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inventory_transactions_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Tracking List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search items, reference, particulars, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleExport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Date Filters */}
              <div className="flex gap-2 items-center">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[150px]"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[150px]"
                />
              </div>

              <Select
                value={selectedWarehouse}
                onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-[180px]">
                  <Warehouse className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse} value={warehouse}>
                      {warehouse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedActivity}
                onValueChange={setSelectedActivity}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by Activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity} value={activity}>
                      {activity === "All"
                        ? "All Activities"
                        : activity.charAt(0).toUpperCase() + activity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary and Pagination Controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredTransactions.length
                )}{" "}
                of {filteredTransactions.length} transactions
              </p>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Inventory Transactions Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Reference No.</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                  <TableHead>Current Onhand</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{transaction.itemName}</div>
                    </TableCell>
                    <TableCell>{transaction.warehouse}</TableCell>
                    <TableCell>{transaction.referenceNo}</TableCell>
                    <TableCell>
                      <div
                        className="max-w-xs truncate"
                        title={transaction.particulars}>
                        {transaction.particulars}
                      </div>
                    </TableCell>
                    <TableCell className="text-green-600">
                      {transaction.inQty > 0 ? transaction.inQty : "-"}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {transaction.outQty > 0 ? transaction.outQty : "-"}
                    </TableCell>
                    <TableCell>{transaction.currentOnhand}</TableCell>
                    <TableCell>
                      {getActivityBadge(transaction.activity)}
                    </TableCell>
                    <TableCell>{transaction.user}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                      isActive={currentPage === i + 1}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages)
                        setCurrentPage(currentPage + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Inventory Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={newTransaction.date || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      date: e.target.value,
                    })
                  }
                  className={errors.date ? "border-destructive" : ""}
                />
                {errors.date && (
                  <p className="text-sm text-destructive mt-1">{errors.date}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-itemName">Item Name</Label>
                <Input
                  id="edit-itemName"
                  value={newTransaction.itemName || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      itemName: e.target.value,
                    })
                  }
                  className={errors.itemName ? "border-destructive" : ""}
                />
                {errors.itemName && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.itemName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-warehouse">Warehouse</Label>
                <Select
                  value={newTransaction.warehouse || ""}
                  onValueChange={(value) =>
                    setNewTransaction({ ...newTransaction, warehouse: value })
                  }>
                  <SelectTrigger
                    className={errors.warehouse ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter((warehouse) => warehouse !== "All")
                      .map((warehouse) => (
                        <SelectItem key={warehouse} value={warehouse}>
                          {warehouse}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.warehouse && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.warehouse}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-referenceNo">Reference No.</Label>
                <Input
                  id="edit-referenceNo"
                  value={newTransaction.referenceNo || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      referenceNo: e.target.value,
                    })
                  }
                  className={errors.referenceNo ? "border-destructive" : ""}
                />
                {errors.referenceNo && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.referenceNo}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-particulars">Particulars</Label>
              <Input
                id="edit-particulars"
                value={newTransaction.particulars || ""}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    particulars: e.target.value,
                  })
                }
                className={errors.particulars ? "border-destructive" : ""}
              />
              {errors.particulars && (
                <p className="text-sm text-destructive mt-1">
                  {errors.particulars}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-inQty">In Qty</Label>
                <Input
                  id="edit-inQty"
                  type="number"
                  min="0"
                  value={newTransaction.inQty || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      inQty: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-outQty">Out Qty</Label>
                <Input
                  id="edit-outQty"
                  type="number"
                  min="0"
                  value={newTransaction.outQty || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      outQty: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-currentOnhand">Current Onhand</Label>
                <Input
                  id="edit-currentOnhand"
                  type="number"
                  min="0"
                  value={newTransaction.currentOnhand || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      currentOnhand: parseInt(e.target.value) || 0,
                    })
                  }
                  className={errors.currentOnhand ? "border-destructive" : ""}
                />
                {errors.currentOnhand && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.currentOnhand}
                  </p>
                )}
              </div>
            </div>
            {errors.quantity && (
              <p className="text-sm text-destructive mt-1">{errors.quantity}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-activity">Activity</Label>
                <Select
                  value={newTransaction.activity || ""}
                  onValueChange={(value) =>
                    setNewTransaction({ ...newTransaction, activity: value })
                  }>
                  <SelectTrigger
                    className={errors.activity ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities
                      .filter((activity) => activity !== "All")
                      .map((activity) => (
                        <SelectItem key={activity} value={activity}>
                          {activity.charAt(0).toUpperCase() + activity.slice(1)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.activity && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.activity}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-user">User</Label>
                <Select
                  value={newTransaction.user || ""}
                  onValueChange={(value) =>
                    setNewTransaction({ ...newTransaction, user: value })
                  }>
                  <SelectTrigger
                    className={errors.user ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => user !== "All")
                      .map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.user && (
                  <p className="text-sm text-destructive mt-1">{errors.user}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEdit} className="flex-1">
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedTransaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>Item Name</Label>
                  <p className="text-sm font-medium">
                    {selectedTransaction.itemName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Warehouse</Label>
                  <p className="text-sm">{selectedTransaction.warehouse}</p>
                </div>
                <div>
                  <Label>Reference No.</Label>
                  <p className="text-sm">{selectedTransaction.referenceNo}</p>
                </div>
              </div>

              <div>
                <Label>Particulars</Label>
                <p className="text-sm">{selectedTransaction.particulars}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>In Quantity</Label>
                  <p className="text-sm text-green-600">
                    {selectedTransaction.inQty > 0
                      ? selectedTransaction.inQty
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label>Out Quantity</Label>
                  <p className="text-sm text-red-600">
                    {selectedTransaction.outQty > 0
                      ? selectedTransaction.outQty
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label>Current Onhand</Label>
                  <p className="text-sm">{selectedTransaction.currentOnhand}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Activity</Label>
                  <div className="mt-1">
                    {getActivityBadge(selectedTransaction.activity)}
                  </div>
                </div>
                <div>
                  <Label>User</Label>
                  <p className="text-sm">{selectedTransaction.user}</p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
                className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
