// utils/ExportItem.tsx
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { utils, writeFile } from "xlsx";
import { saveAs } from "file-saver";
import type { ItemType } from "../type";

// ✅ PDF Export
export function exportToPDF(items: ItemType[], title = "Exported Items") {
  if (!items || items.length === 0) return;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Code", "Name", "Category", "Status", "Created"]],
    body: items.map((item) => [
      item.item_code,
      item.item_name,
      item.item_category,
      item.item_status,
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
}

// ✅ CSV Export (.csv)
export function exportToCSV(items: ItemType[], filename = "items-export.csv") {
  if (!items || items.length === 0) return;

  const worksheet = utils.json_to_sheet(items);
  const csv = utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
}
