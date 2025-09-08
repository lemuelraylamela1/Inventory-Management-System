"use client";
import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../../ui/button";
import { ItemType } from "../type";

type Props = {
  onUploadSuccess: () => void;
};

const templateHeaders = [
  ["item_code", "item_name", "item_category", "item_status", "createdDT"],
];

export default function ImportItems({ onUploadSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ItemType[]>([]);
  const [invalidRows, setInvalidRows] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  // ⏱ Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => setValidationError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [validationError]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    // const worksheet = XLSX.utils.aoa_to_sheet(templateHeaders);
    const sampleRow = [
      [
        "ITEM001",
        "Sample Item",
        "CATEGORY",
        "ACTIVE",
        new Date().toISOString(),
      ],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([
      ...templateHeaders,
      ...sampleRow,
    ]);

    const createdDTCellRef = XLSX.utils.encode_cell({ r: 1, c: 4 }); // row 1, column 4
    worksheet[createdDTCellRef].t = "d"; // 'd' = date type

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "ItemTemplate.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const validExtensions = [".xlsx", ".xls"];
    const isValidType = validTypes.includes(file.type);
    const isValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValidType || !isValidExtension) {
      setValidationError(
        "❌ Unsupported file type. Please upload a .xlsx or .xls file."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const expectedHeaders = templateHeaders[0];
      const actualHeaders = raw[0] as string[];
      const missingHeaders = expectedHeaders.filter(
        (header) => !actualHeaders.includes(header)
      );

      if (missingHeaders.length > 0) {
        setValidationError(
          `❌ Missing required columns: ${missingHeaders.join(
            ", "
          )}. Please use the template or match the expected format.`
        );
        return;
      }

      // const json: ItemType[] = XLSX.utils.sheet_to_json(sheet);
      // setParsedRows(json);
      // validateRows(json);
      const rawJson: ItemType[] = XLSX.utils.sheet_to_json(sheet);
      const json = rawJson.map((row) => {
        let parsedDate: string;

        // Handle Excel serial numbers (e.g. 45200)
        if (typeof row.createdDT === "number") {
          const excelDate = XLSX.SSF.parse_date_code(row.createdDT);
          if (excelDate) {
            const jsDate = new Date(
              excelDate.y,
              excelDate.m - 1,
              excelDate.d,
              excelDate.H,
              excelDate.M,
              excelDate.S
            );
            parsedDate = jsDate.toISOString();
          } else {
            parsedDate = new Date().toISOString(); // fallback
          }
        } else {
          const jsDate = new Date(row.createdDT);
          parsedDate = isNaN(jsDate.getTime())
            ? new Date().toISOString()
            : jsDate.toISOString();
        }

        return {
          ...row,
          createdDT: parsedDate,
        };
      });

      setParsedRows(json);
      validateRows(json);
      setIsDialogOpen(true);
      setIsDialogOpen(true);
    };

    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const validateRows = (rows: ItemType[]) => {
    const invalids = rows
      .map((row, i) => {
        const isValid =
          row.item_code &&
          row.item_name &&
          row.item_category &&
          ["ACTIVE", "INACTIVE"].includes(row.item_status?.toUpperCase()) &&
          !isNaN(Date.parse(row.createdDT));
        return isValid ? null : i;
      })
      .filter((i) => i !== null) as number[];
    setInvalidRows(invalids);

    if (invalids.length > 0) {
      setValidationError(
        `⚠️ Found ${invalids.length} invalid row(s). Please check for missing fields, incorrect status values, or invalid dates.`
      );
    }
  };

  const handleUpload = async () => {
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedRows }),
      });

      if (!res.ok) throw new Error("Bulk upload failed");
      onUploadSuccess();
      setParsedRows([]);
      setInvalidRows([]);
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* ✅ Floating error toast */}
      {validationError && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[90vw] max-w-xl bg-red-100 text-red-800 border border-red-300 px-6 py-4 rounded-lg shadow-md text-base font-medium transition-opacity duration-300 animate-fade-in">
          {validationError}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleButtonClick}>
          Import Data
        </Button>
        <Button variant="ghost" onClick={handleDownloadTemplate}>
          Download Template
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleImportExcel}
          className="hidden"
        />
      </div>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-6 shadow-xl overflow-auto max-h-[80vh]">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Preview Imported Items
            </Dialog.Title>

            <table className="min-w-full text-base border">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left">Code</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => {
                  const isInvalid = invalidRows.includes(i);
                  return (
                    <tr
                      key={i}
                      className={`${
                        isInvalid ? "bg-red-50 text-red-700" : ""
                      } ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      title={
                        isInvalid
                          ? "Invalid row: check required fields and formats"
                          : ""
                      }>
                      <td className="px-6 py-3">{row.item_code}</td>
                      <td className="px-6 py-3">{row.item_name}</td>
                      <td className="px-6 py-3">{row.item_category}</td>
                      <td className="px-6 py-3">{row.item_status}</td>
                      <td className="px-6 py-3">{formatDate(row.createdDT)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 text-sm text-gray-600">
              {invalidRows.length > 0 ? (
                <span className="text-red-600">
                  ⚠️ {invalidRows.length} row(s) need fixing before upload.
                </span>
              ) : (
                <span className="text-green-600">✅ All rows are valid.</span>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button disabled={invalidRows.length > 0} onClick={handleUpload}>
                Upload Validated Items
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
