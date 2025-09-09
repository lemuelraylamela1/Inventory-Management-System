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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

interface SalesPerson {
  id: string;
  creationDate: string;
  salesPersonCode: string;
  salesPersonName: string;
  emailAddress: string;
  status: "active" | "inactive";
}

// Mock data
const initialSalesPersons: SalesPerson[] = [
  {
    id: "1",
    creationDate: "2024-01-15",
    salesPersonCode: "SP001",
    salesPersonName: "John Smith",
    emailAddress: "john.smith@company.com",
    status: "active",
  },
  {
    id: "2",
    creationDate: "2024-01-20",
    salesPersonCode: "SP002",
    salesPersonName: "Sarah Johnson",
    emailAddress: "sarah.johnson@company.com",
    status: "active",
  },
  {
    id: "3",
    creationDate: "2024-02-01",
    salesPersonCode: "SP003",
    salesPersonName: "Mike Davis",
    emailAddress: "mike.davis@company.com",
    status: "inactive",
  },
  {
    id: "4",
    creationDate: "2024-02-10",
    salesPersonCode: "SP004",
    salesPersonName: "Emily Wilson",
    emailAddress: "emily.wilson@company.com",
    status: "active",
  },
  {
    id: "5",
    creationDate: "2024-02-15",
    salesPersonCode: "SP005",
    salesPersonName: "Robert Brown",
    emailAddress: "robert.brown@company.com",
    status: "active",
  },
  {
    id: "6",
    creationDate: "2024-03-01",
    salesPersonCode: "SP006",
    salesPersonName: "Lisa Anderson",
    emailAddress: "lisa.anderson@company.com",
    status: "inactive",
  },
  {
    id: "7",
    creationDate: "2024-03-05",
    salesPersonCode: "SP007",
    salesPersonName: "David Miller",
    emailAddress: "david.miller@company.com",
    status: "active",
  },
  {
    id: "8",
    creationDate: "2024-03-10",
    salesPersonCode: "SP008",
    salesPersonName: "Jennifer Taylor",
    emailAddress: "jennifer.taylor@company.com",
    status: "active",
  },
];

const ITEMS_PER_PAGE = 5;

export default function SalesPerson() {
  const [salesPersons, setSalesPersons] =
    useState<SalesPerson[]>(initialSalesPersons);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSalesPerson, setEditingSalesPerson] =
    useState<SalesPerson | null>(null);
  const [formData, setFormData] = useState({
    salesPersonCode: "",
    salesPersonName: "",
    emailAddress: "",
    status: "active" as "active" | "inactive",
  });

  // Filter and paginate data
  const filteredSalesPersons = useMemo(() => {
    return salesPersons.filter(
      (person) =>
        person.salesPersonName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        person.salesPersonCode
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        person.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [salesPersons, searchTerm]);

  const totalPages = Math.ceil(filteredSalesPersons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSalesPersons = filteredSalesPersons.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleCreate = () => {
    const newSalesPerson: SalesPerson = {
      id: Date.now().toString(),
      creationDate: new Date().toISOString().split("T")[0],
      ...formData,
    };
    setSalesPersons([...salesPersons, newSalesPerson]);
    setFormData({
      salesPersonCode: "",
      salesPersonName: "",
      emailAddress: "",
      status: "active",
    });
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (person: SalesPerson) => {
    setEditingSalesPerson(person);
    setFormData({
      salesPersonCode: person.salesPersonCode,
      salesPersonName: person.salesPersonName,
      emailAddress: person.emailAddress,
      status: person.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingSalesPerson) return;

    setSalesPersons(
      salesPersons.map((person) =>
        person.id === editingSalesPerson.id
          ? { ...person, ...formData }
          : person
      )
    );
    setEditingSalesPerson(null);
    setFormData({
      salesPersonCode: "",
      salesPersonName: "",
      emailAddress: "",
      status: "active",
    });
    setIsEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setSalesPersons(salesPersons.filter((person) => person.id !== id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Person</CardTitle>
          <CardDescription>Manage Sales Person</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search sales persons..."
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
                  Add Sales Person
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Sales Person</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-code">Sales Person Code</Label>
                    <Input
                      id="create-code"
                      value={formData.salesPersonCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salesPersonCode: e.target.value,
                        })
                      }
                      placeholder="SP001"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-name">Sales Person Name</Label>
                    <Input
                      id="create-name"
                      value={formData.salesPersonName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salesPersonName: e.target.value,
                        })
                      }
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-email">Email Address</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emailAddress: e.target.value,
                        })
                      }
                      placeholder="john.smith@company.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") =>
                        setFormData({ ...formData, status: value })
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Sales Person Code</TableHead>
                  <TableHead>Sales Person Name</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSalesPersons.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground">
                      No sales persons found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSalesPersons.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>{formatDate(person.creationDate)}</TableCell>
                      <TableCell>{person.salesPersonCode}</TableCell>
                      <TableCell>{person.salesPersonName}</TableCell>
                      <TableCell>{person.emailAddress}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            person.status === "active" ? "default" : "secondary"
                          }>
                          {person.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(person)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Sales Person
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{" "}
                                  {person.salesPersonName}? This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(person.id)}>
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

          {/* Results count */}
          <div className="text-sm text-muted-foreground text-center">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredSalesPersons.length)}{" "}
            of {filteredSalesPersons.length} results
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sales Person</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Sales Person Code</Label>
              <Input
                id="edit-code"
                value={formData.salesPersonCode}
                onChange={(e) =>
                  setFormData({ ...formData, salesPersonCode: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Sales Person Name</Label>
              <Input
                id="edit-name"
                value={formData.salesPersonName}
                onChange={(e) =>
                  setFormData({ ...formData, salesPersonName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.emailAddress}
                onChange={(e) =>
                  setFormData({ ...formData, emailAddress: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
