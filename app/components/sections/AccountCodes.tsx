import { useEffect, useState } from "react";

import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

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

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "../ui/card";
import {
  Plus,
  Trash2,
  Loader2,
  Inbox,
  Search,
  CalendarDays,
  Filter,
  Edit,
  Eye,
} from "lucide-react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";

import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { FileSpreadsheet } from "lucide-react";
import { AccountCode } from "./type";

export default function AccountCodes() {
  const [accountCodes, setAccountCodes] = useState<AccountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  {
    /* Date and Search Filters */
  }
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/account-codes");
        const data = await res.json();
        setAccountCodes(data);
      } catch (err) {
        console.error("Failed to fetch account codes", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Account Codes</CardTitle>
            <CardDescription>Manage account codes</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Request Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Transfer Request
          </Button> */}
        </div>

        <ScrollArea className="border rounded-lg max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Sales Account</TableHead>
                <TableHead>Purchase Account</TableHead>
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
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-sm">Loading account codes…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : accountCodes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm">
                        {searchTerm
                          ? "No matching results"
                          : "No account codes found"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                accountCodes.map((code) => (
                  <TableRow key={code._id}>
                    <TableCell>{code.accountCode ?? "—"}</TableCell>
                    <TableCell>{code.accountName ?? "—"}</TableCell>
                    <TableCell>{code.salesAccount ?? "—"}</TableCell>
                    <TableCell>{code.purchaseAccount ?? "—"}</TableCell>

                    {/* <TableCell className="text-right flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(code._id!)}
                        title="View Account Code">
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(code)}
                        title="Edit Account Code">
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Account Code"
                            className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Account Code
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently delete this account code?
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(code._id!)}>
                                Confirm Delete
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
