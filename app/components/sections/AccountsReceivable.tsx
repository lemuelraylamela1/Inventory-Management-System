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

import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { Loader2, Inbox, Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import type { AccountsReceivable } from "./type";

export default function AccountsReceivable() {
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredReceivables = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return receivables.filter((ar) => {
      const customer = ar.customer?.toLowerCase() || "";
      const reference = ar.reference?.toLowerCase() || "";
      return customer.includes(query) || reference.includes(query);
    });
  }, [receivables, searchTerm]);

  const totalPages = Math.ceil(filteredReceivables.length / rowsPerPage);

  const paginatedReceivables: AccountsReceivable[] = filteredReceivables.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const isFirstFetch = useRef(true);

  const refreshReceivables = async () => {
    if (isFirstFetch.current) setIsLoading(true);

    try {
      const res = await fetch("/api/accounts-receivables");
      const data = await res.json();
      setReceivables(data);
    } catch (err) {
      console.error("Failed to fetch accounts receivable", err);
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false);
        isFirstFetch.current = false;
      }
    }
  };

  useEffect(() => {
    refreshReceivables(); // Initial fetch

    const interval = setInterval(() => {
      refreshReceivables();
    }, 1000); // 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Accounts Receivable</CardTitle>
            <CardDescription>
              Track incoming payments and customer balances
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Create */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Customer or Reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="max-h-[500px] overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creation Date</TableHead>
                <TableHead>Imported</TableHead>
                <TableHead>Voucher No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading receivables…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReceivables.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-6 w-6" />
                      <span className="text-sm">No receivables found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReceivables.map((ar) => (
                  <TableRow key={ar._id}>
                    <TableCell>
                      {ar.createdAt
                        ? new Date(ar.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>{ar.imported ?? "—"}</TableCell>
                    <TableCell>{ar.voucherNo ?? "—"}</TableCell>
                    <TableCell>{ar.customer ?? "—"}</TableCell>
                    <TableCell>{ar.reference ?? "—"}</TableCell>
                    <TableCell>
                      ₱{ar.amount?.toLocaleString("en-PH") ?? "—"}
                    </TableCell>
                    <TableCell>
                      ₱{ar.balance?.toLocaleString("en-PH") ?? "—"}
                    </TableCell>
                    <TableCell>
                      {ar.status === "PAID" ? (
                        <span className="text-green-600">PAID</span>
                      ) : ar.status === "PARTIAL" ? (
                        <span className="text-yellow-600">PARTIAL</span>
                      ) : (
                        <span className="text-red-600">UNPAID</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Receivables per page:
            </span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(val) => {
                setRowsPerPage(Number(val));
                setCurrentPage(1);
              }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => prev + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
