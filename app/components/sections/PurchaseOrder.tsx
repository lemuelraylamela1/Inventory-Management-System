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
import { Textarea } from "../ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  CalendarDays,
  Filter,
} from "lucide-react";

interface PurchaseOrder {
  id: string;
  creationDate: string;
  transactionDate: string;
  poNo: string;
  referenceNo: string;
  supplier: string;
  amount: number;
  balance: number;
  status: "pending" | "partial" | "completed" | "cancelled";
  description?: string;
  items?: { name: string; quantity: number; unitPrice: number }[];
}

// Mock data
const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "1",
    creationDate: "2024-01-15",
    transactionDate: "2024-01-16",
    poNo: "PO-2024-001",
    referenceNo: "PO-2024-001",
    supplier: "TechCorp Solutions",
    amount: 15750.0,
    balance: 5250.0,
    status: "partial",
    description: "Office equipment and electronics",
    items: [
      { name: "Laptops", quantity: 10, unitPrice: 1200.0 },
      { name: "Monitors", quantity: 15, unitPrice: 250.0 },
    ],
  },
  {
    id: "2",
    creationDate: "2024-01-20",
    transactionDate: "2024-01-22",
    poNo: "PO-2024-002",
    referenceNo: "PO-2024-002",
    supplier: "Office Supplies Inc",
    amount: 2850.0,
    balance: 0.0,
    status: "completed",
    description: "Monthly office supplies order",
    items: [
      { name: "Paper Reams", quantity: 50, unitPrice: 25.0 },
      { name: "Pens", quantity: 100, unitPrice: 2.5 },
      { name: "Folders", quantity: 200, unitPrice: 5.0 },
    ],
  },
  {
    id: "3",
    creationDate: "2024-02-01",
    transactionDate: "2024-02-03",
    poNo: "PO-2024-003",
    referenceNo: "PO-2024-003",
    supplier: "Furniture World",
    amount: 8500.0,
    balance: 8500.0,
    status: "pending",
    description: "New office furniture for expansion",
    items: [
      { name: "Office Chairs", quantity: 20, unitPrice: 250.0 },
      { name: "Desks", quantity: 10, unitPrice: 350.0 },
    ],
  },
  {
    id: "4",
    creationDate: "2024-02-10",
    transactionDate: "2024-02-12",
    poNo: "PO-2024-004",
    referenceNo: "PO-2024-004",
    supplier: "Industrial Equipment Ltd",
    amount: 25000.0,
    balance: 12500.0,
    status: "partial",
    description: "Manufacturing equipment upgrade",
    items: [
      { name: "Assembly Line Parts", quantity: 5, unitPrice: 3000.0 },
      { name: "Quality Control Tools", quantity: 10, unitPrice: 1000.0 },
    ],
  },
  {
    id: "5",
    creationDate: "2024-02-15",
    transactionDate: "2024-02-18",
    poNo: "PO-2024-005",
    referenceNo: "PO-2024-005",
    supplier: "Software Solutions Co",
    amount: 12000.0,
    balance: 0.0,
    status: "completed",
    description: "Annual software licenses",
    items: [
      { name: "Office Suite License", quantity: 50, unitPrice: 120.0 },
      { name: "Design Software License", quantity: 10, unitPrice: 600.0 },
    ],
  },
  {
    id: "6",
    creationDate: "2024-03-01",
    transactionDate: "2024-03-05",
    poNo: "PO-2024-006",
    referenceNo: "PO-2024-006",
    supplier: "TechCorp Solutions",
    amount: 18200.0,
    balance: 18200.0,
    status: "cancelled",
    description: "Server upgrade project - cancelled due to budget constraints",
    items: [
      { name: "Server Hardware", quantity: 2, unitPrice: 8000.0 },
      { name: "Network Equipment", quantity: 1, unitPrice: 2200.0 },
    ],
  },
  {
    id: "7",
    creationDate: "2024-03-05",
    transactionDate: "2024-03-08",
    poNo: "PO-2024-007",
    referenceNo: "PO-2024-007",
    supplier: "Office Supplies Inc",
    amount: 1850.0,
    balance: 925.0,
    status: "partial",
    description: "Cleaning and maintenance supplies",
    items: [
      { name: "Cleaning Supplies", quantity: 25, unitPrice: 35.0 },
      { name: "Maintenance Tools", quantity: 15, unitPrice: 45.0 },
    ],
  },
  {
    id: "8",
    creationDate: "2024-03-10",
    transactionDate: "2024-03-12",
    poNo: "PO-2024-008",
    referenceNo: "PO-2024-008",
    supplier: "Catering Services Ltd",
    amount: 3200.0,
    balance: 3200.0,
    status: "pending",
    description: "Annual company event catering",
    items: [
      { name: "Catering Package A", quantity: 1, unitPrice: 2000.0 },
      { name: "Additional Services", quantity: 1, unitPrice: 1200.0 },
    ],
  },
];

const statusOptions = [
  "all",
  "pending",
  "partial",
  "completed",
  "cancelled",
] as const;
const itemsPerPageOptions = [10, 50, 100];

const suppliers = [
  ...new Set(initialPurchaseOrders.map((po) => po.supplier)),
].sort();

const getStatusVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "partial":
      return "secondary";
    case "pending":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function PurchaseOrder() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(
    initialPurchaseOrders
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "partial" | "completed" | "cancelled"
  >("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState({
    poNo: "",
    referenceNo: "",
    supplier: "",
    transactionDate: "",
    amount: "",
    balance: "",
    status: "pending" as "pending" | "partial" | "completed" | "cancelled",
    description: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    poNo: "",
    referenceNo: "",
    supplier: "",
    transactionDate: "",
    amount: "",
    balance: "",
  });

  // Filter and paginate data
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        po.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        "";

      const matchesDate = !dateFilter || po.transactionDate === dateFilter;
      const matchesSupplier =
        supplierFilter === "all" || po.supplier === supplierFilter;
      const matchesStatus =
        statusFilter === "all" || po.status === statusFilter;

      return matchesSearch && matchesDate && matchesSupplier && matchesStatus;
    });
  }, [purchaseOrders, searchTerm, dateFilter, supplierFilter, statusFilter]);

  const totalPages = Math.ceil(filteredPurchaseOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPurchaseOrders = filteredPurchaseOrders.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, supplierFilter, statusFilter, itemsPerPage]);

  // Validation functions
  const validateForm = (isEdit = false) => {
    const errors = {
      poNo: "",
      referenceNo: "",
      supplier: "",
      transactionDate: "",
      amount: "",
      balance: "",
    };

    // Check for required fields
    if (!formData.poNo.trim()) {
      errors.poNo = "PO No is required";
    } else {
      // Check for duplicate PO reference
      const duplicateRef = purchaseOrders.find(
        (po) =>
          po.poNo.toLowerCase() === formData.poNo.toLowerCase() &&
          (!isEdit || po.id !== editingPO?.id)
      );
      if (duplicateRef) {
        errors.poNo = "PO No already exists";
      }
    }

    if (!formData.referenceNo.trim()) {
      errors.referenceNo = "Reference No is required";
    } else {
      // Check for duplicate Reference No
      const duplicateRef = purchaseOrders.find(
        (po) =>
          po.referenceNo.toLowerCase() === formData.referenceNo.toLowerCase() &&
          (!isEdit || po.id !== editingPO?.id)
      );
      if (duplicateRef) {
        errors.referenceNo = "Reference No already exists";
      }
    }

    if (!formData.supplier.trim()) {
      errors.supplier = "Supplier is required";
    }

    if (!formData.transactionDate.trim()) {
      errors.transactionDate = "Transaction Date is required";
    }

    if (!formData.amount.trim()) {
      errors.amount = "Amount is required";
    } else if (
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      errors.amount = "Amount must be a positive number";
    }

    if (!formData.balance.trim()) {
      errors.balance = "Balance is required";
    } else if (
      isNaN(parseFloat(formData.balance)) ||
      parseFloat(formData.balance) < 0
    ) {
      errors.balance = "Balance must be a non-negative number";
    } else if (
      parseFloat(formData.balance) > parseFloat(formData.amount || "0")
    ) {
      errors.balance = "Balance cannot exceed the total amount";
    }

    setValidationErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  // Clear validation errors when form data changes
  React.useEffect(() => {
    if (Object.values(validationErrors).some((error) => error !== "")) {
      validateForm(!!editingPO);
    }
  }, [formData, purchaseOrders]);

  const handleCreate = () => {
    if (!validateForm()) {
      return;
    }

    const newPO: PurchaseOrder = {
      id: Date.now().toString(),
      creationDate: new Date().toISOString().split("T")[0],
      poNo: formData.poNo,
      referenceNo: formData.referenceNo,
      supplier: formData.supplier,
      transactionDate: formData.transactionDate,
      amount: parseFloat(formData.amount),
      balance: parseFloat(formData.balance),
      status: formData.status,
      description: formData.description || undefined,
    };
    setPurchaseOrders([...purchaseOrders, newPO]);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    setFormData({
      poNo: po.poNo,
      referenceNo: po.referenceNo,
      supplier: po.supplier,
      transactionDate: po.transactionDate,
      amount: po.amount.toString(),
      balance: po.balance.toString(),
      status: po.status,
      description: po.description || "",
    });
    setValidationErrors({
      poNo: "",
      referenceNo: "",
      supplier: "",
      transactionDate: "",
      amount: "",
      balance: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingPO || !validateForm(true)) {
      return;
    }

    setPurchaseOrders(
      purchaseOrders.map((po) =>
        po.id === editingPO.id
          ? {
              ...po,
              poNo: formData.poNo,
              referenceNo: formData.referenceNo,
              supplier: formData.supplier,
              transactionDate: formData.transactionDate,
              amount: parseFloat(formData.amount),
              balance: parseFloat(formData.balance),
              status: formData.status,
              description: formData.description || undefined,
            }
          : po
      )
    );
    setEditingPO(null);
    resetForm();
    setIsEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setPurchaseOrders(purchaseOrders.filter((po) => po.id !== id));
  };

  const handleView = (po: PurchaseOrder) => {
    setViewingPO(po);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const resetForm = () => {
    setFormData({
      poNo: "",
      referenceNo: "",
      supplier: "",
      transactionDate: "",
      amount: "",
      balance: "",
      status: "pending",
      description: "",
    });
    setValidationErrors({
      poNo: "",
      referenceNo: "",
      supplier: "",
      transactionDate: "",
      amount: "",
      balance: "",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setSupplierFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Purchase Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search purchase orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Purchase Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Purchase Order</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="create-po-no">PO No</Label>
                        <Input
                          id="create-po-no"
                          value={formData.poNo}
                          onChange={(e) =>
                            setFormData({ ...formData, poNo: e.target.value })
                          }
                          placeholder="PO-2024-001"
                          className={
                            validationErrors.poNo ? "border-destructive" : ""
                          }
                        />
                        {validationErrors.poNo && (
                          <p className="text-sm text-destructive">
                            {validationErrors.poNo}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="create-reference-no">
                          Reference No
                        </Label>
                        <Input
                          id="create-reference-no"
                          value={formData.referenceNo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              referenceNo: e.target.value,
                            })
                          }
                          placeholder="PO-2024-001"
                          className={
                            validationErrors.referenceNo
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {validationErrors.referenceNo && (
                          <p className="text-sm text-destructive">
                            {validationErrors.referenceNo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="create-supplier">Supplier</Label>
                        <Input
                          id="create-supplier"
                          value={formData.supplier}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              supplier: e.target.value,
                            })
                          }
                          placeholder="Supplier Name"
                          className={
                            validationErrors.supplier
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {validationErrors.supplier && (
                          <p className="text-sm text-destructive">
                            {validationErrors.supplier}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="create-transaction-date">
                          Transaction Date
                        </Label>
                        <Input
                          id="create-transaction-date"
                          type="date"
                          value={formData.transactionDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              transactionDate: e.target.value,
                            })
                          }
                          className={
                            validationErrors.transactionDate
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {validationErrors.transactionDate && (
                          <p className="text-sm text-destructive">
                            {validationErrors.transactionDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="create-amount">Amount ($)</Label>
                        <Input
                          id="create-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) =>
                            setFormData({ ...formData, amount: e.target.value })
                          }
                          placeholder="1000.00"
                          className={
                            validationErrors.amount ? "border-destructive" : ""
                          }
                        />
                        {validationErrors.amount && (
                          <p className="text-sm text-destructive">
                            {validationErrors.amount}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="create-balance">Balance ($)</Label>
                        <Input
                          id="create-balance"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.balance}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              balance: e.target.value,
                            })
                          }
                          placeholder="500.00"
                          className={
                            validationErrors.balance ? "border-destructive" : ""
                          }
                        />
                        {validationErrors.balance && (
                          <p className="text-sm text-destructive">
                            {validationErrors.balance}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="create-status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(
                          value:
                            | "pending"
                            | "partial"
                            | "completed"
                            | "cancelled"
                        ) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
                        placeholder="Enter purchase order description..."
                        rows={3}
                      />
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
                        !formData.poNo.trim() ||
                        !formData.referenceNo.trim() ||
                        !formData.supplier.trim() ||
                        !formData.transactionDate.trim() ||
                        !formData.amount.trim() ||
                        !formData.balance.trim() ||
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

            {/* Advanced Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm">Filters:</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="date-filter" className="text-sm">
                      Date:
                    </Label>
                    <Input
                      id="date-filter"
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-40"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="supplier-filter" className="text-sm">
                      Supplier:
                    </Label>
                    <Select
                      value={supplierFilter}
                      onValueChange={setSupplierFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="status-filter" className="text-sm">
                      Status:
                    </Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value: any) => setStatusFilter(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items per page selector */}
          <div className="flex justify-between items-center"></div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>PO No</TableHead>
                  <TableHead>Reference No</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPurchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>{formatDate(po.creationDate)}</TableCell>
                      <TableCell>{formatDate(po.transactionDate)}</TableCell>
                      <TableCell>
                        <div>
                          <div>{po.poNo}</div>
                          {po.description && (
                            <div
                              className="text-sm text-muted-foreground truncate max-w-xs"
                              title={po.description}>
                              {po.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{po.referenceNo}</TableCell>
                      <TableCell>{po.supplier}</TableCell>
                      <TableCell>{formatCurrency(po.amount)}</TableCell>
                      <TableCell>{formatCurrency(po.balance)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(po.status) as any}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(po)}
                            title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(po)}
                            title="Edit Purchase Order">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Delete Purchase Order">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Purchase Order
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{po.poNo}"?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(po.id)}>
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
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Show:</Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsPerPageOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">rows</span>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{" "}
              {Math.min(
                startIndex + itemsPerPage,
                filteredPurchaseOrders.length
              )}{" "}
              of {filteredPurchaseOrders.length} results
            </div>
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-po-no">PO No</Label>
                <Input
                  id="edit-po-no"
                  value={formData.poNo}
                  onChange={(e) =>
                    setFormData({ ...formData, poNo: e.target.value })
                  }
                  className={validationErrors.poNo ? "border-destructive" : ""}
                />
                {validationErrors.poNo && (
                  <p className="text-sm text-destructive">
                    {validationErrors.poNo}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-reference-no">Reference No</Label>
                <Input
                  id="edit-reference-no"
                  value={formData.referenceNo}
                  onChange={(e) =>
                    setFormData({ ...formData, referenceNo: e.target.value })
                  }
                  className={
                    validationErrors.referenceNo ? "border-destructive" : ""
                  }
                />
                {validationErrors.referenceNo && (
                  <p className="text-sm text-destructive">
                    {validationErrors.referenceNo}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Input
                  id="edit-supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  className={
                    validationErrors.supplier ? "border-destructive" : ""
                  }
                />
                {validationErrors.supplier && (
                  <p className="text-sm text-destructive">
                    {validationErrors.supplier}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-transaction-date">Transaction Date</Label>
                <Input
                  id="edit-transaction-date"
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionDate: e.target.value,
                    })
                  }
                  className={
                    validationErrors.transactionDate ? "border-destructive" : ""
                  }
                />
                {validationErrors.transactionDate && (
                  <p className="text-sm text-destructive">
                    {validationErrors.transactionDate}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount ($)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className={
                    validationErrors.amount ? "border-destructive" : ""
                  }
                />
                {validationErrors.amount && (
                  <p className="text-sm text-destructive">
                    {validationErrors.amount}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-balance">Balance ($)</Label>
                <Input
                  id="edit-balance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData({ ...formData, balance: e.target.value })
                  }
                  className={
                    validationErrors.balance ? "border-destructive" : ""
                  }
                />
                {validationErrors.balance && (
                  <p className="text-sm text-destructive">
                    {validationErrors.balance}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(
                  value: "pending" | "partial" | "completed" | "cancelled"
                ) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingPO(null);
                resetForm();
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                !formData.poNo.trim() ||
                !formData.referenceNo.trim() ||
                !formData.supplier.trim() ||
                !formData.transactionDate.trim() ||
                !formData.amount.trim() ||
                !formData.balance.trim() ||
                Object.values(validationErrors).some((error) => error !== "")
              }>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          {viewingPO && (
            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Creation Date</Label>
                    <p className="mt-1 p-2 bg-muted rounded border">
                      {formatDate(viewingPO.creationDate)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">Transaction Date</Label>
                    <p className="mt-1 p-2 bg-muted rounded border">
                      {formatDate(viewingPO.transactionDate)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">PO No</Label>
                    <p className="mt-1 p-2 bg-muted rounded border">
                      {viewingPO.poNo}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">Reference No</Label>
                    <p className="mt-1 p-2 bg-muted rounded border">
                      {viewingPO.referenceNo}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Status</Label>
                    <div className="mt-1 p-2">
                      <Badge
                        variant={getStatusVariant(viewingPO.status) as any}>
                        {viewingPO.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Supplier</Label>
                    <p className="mt-1 p-2 bg-muted rounded border">
                      {viewingPO.supplier}
                    </p>
                  </div>
                </div>

                {viewingPO.description && (
                  <div>
                    <Label className="text-sm">Description</Label>
                    <p className="mt-1 p-2 bg-muted rounded border min-h-[80px]">
                      {viewingPO.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Total Amount</Label>
                    <p className="mt-1 p-2 bg-muted rounded border">
                      {formatCurrency(viewingPO.amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">Balance</Label>
                    <p className="mt-1 p-2 bg-muted rounded border">
                      {formatCurrency(viewingPO.balance)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Payment Progress</Label>
                  <div className="mt-1 p-2 bg-muted rounded border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">
                        Paid:{" "}
                        {formatCurrency(viewingPO.amount - viewingPO.balance)}
                      </span>
                      <span className="text-sm">
                        Remaining: {formatCurrency(viewingPO.balance)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            ((viewingPO.amount - viewingPO.balance) /
                              viewingPO.amount) *
                            100
                          }%`,
                        }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {Math.round(
                        ((viewingPO.amount - viewingPO.balance) /
                          viewingPO.amount) *
                          100
                      )}
                      % Complete
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              {viewingPO.items && viewingPO.items.length > 0 && (
                <div>
                  <Label className="text-sm">Order Items</Label>
                  <div className="mt-2 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingPO.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
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
