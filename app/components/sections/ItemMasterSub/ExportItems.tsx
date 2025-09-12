// utils/ExportItem.tsx
"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { utils, writeFile } from "xlsx";
import { saveAs } from "file-saver";
import { FileDown, FileText, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { Button } from "../../ui/button";
import type { ItemType } from "../type";
import { toast } from "sonner";

// ✅ PDF Export
export default function exportToPDF(
  items: ItemType[],
  title = "Exported Items"
) {
  if (!items || items.length === 0) return;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Code", "Name", "Category", "Status", "Created"]],
    body: items.map((item) => [
      item.itemCode,
      item.itemName,
      item.category,
      item.status,
      new Date(item.createdDT).toLocaleDateString(),
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: 40,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  });

  doc.save("items-export.pdf");
  toast.success("PDF exported successfully");
}

// ✅ Excel Export (.xlsx)
export function exportToExcel(
  items: ItemType[],
  filename = "items-export.xlsx"
) {
  if (!items || items.length === 0) return;

  const worksheet = utils.json_to_sheet(items);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Items");
  writeFile(workbook, filename);
  toast.success("Excel exported successfully");
}

// ✅ CSV Export (.csv)
export function exportToCSV(items: ItemType[], filename = "items-export.csv") {
  if (!items || items.length === 0) return;

  const worksheet = utils.json_to_sheet(items);
  const csv = utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
  toast.success("CSV exported successfully");
}

// ✅ Export Button Component
export function ExportItemButton({ items }: { items: ItemType[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className="inline-flex items-center gap-2">
          <FileDown className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={4}
        className="min-w-[180px] bg-white border rounded-md shadow-lg p-1 z-50">
        <DropdownMenuItem
          onSelect={() => exportToPDF(items, "Item Master Export")}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100">
          <FileText className="w-4 h-4 text-red-500" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => exportToExcel(items)}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => exportToCSV(items)}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100">
          <FileSpreadsheet className="w-4 h-4 text-yellow-500" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
