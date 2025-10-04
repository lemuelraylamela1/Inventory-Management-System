import PurchaseReceipt from "@/models/purchaseReceipt";
import PurchaseOrder from "@/models/purchaseOrder";
import { NextResponse } from "next/server";
import { PurchaseOrderItem } from "@/app/components/sections/type";

export type ReceiptItem = PurchaseOrderItem & { amount: number };

function normalizePoNumbers(poList: unknown): string[] {
  return Array.isArray(poList)
    ? poList.map((po) => String(po).trim().toUpperCase())
    : [];
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeStatus(status: unknown): string {
  const valid = ["OPEN", "RECEIVED"];
  const normalized = normalizeText(status);
  return valid.includes(normalized) ? normalized : "OPEN";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractEditableItems(purchaseOrders: any[]): PurchaseOrderItem[] {
  return purchaseOrders.flatMap((po) =>
    po.items
      .filter((item: PurchaseOrderItem) => Number(item.quantity) > 0)
      .map((item: PurchaseOrderItem) => ({
        itemCode: normalizeText(item.itemCode),
        itemName: normalizeText(item.itemName),
        quantity: Math.max(Number(item.quantity) || 1, 1),
        unitType: normalizeText(item.unitType),
        purchasePrice: Number(item.purchasePrice) || 0,
      }))
  );
}

function calculateTotalAmount(items: PurchaseOrderItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * item.purchasePrice,
    0
  );
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function handleServerError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`❌ Error ${context}:`, error.message, error.stack);
    return errorResponse(error.message || `Failed ${context}`, 500);
  }

  console.error(`❌ Unknown error ${context}:`, error);
  return errorResponse("Unexpected error occurred", 500);
}

// ─── PUT: Update Purchase Receipt ─────────────────────────────────────────────
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id || typeof id !== "string") {
      return errorResponse("Missing or invalid ID", 400);
    }

    const body = await request.json();

    // Normalize PO numbers
    const poNumbers = normalizePoNumbers(body.poNumber);

    // Optional PO lookup for supplier/warehouse fallback
    let supplierName = "UNKNOWN";
    let warehouse = "UNKNOWN";

    if (poNumbers.length > 0) {
      const purchaseOrders = await PurchaseOrder.find({
        poNumber: { $in: poNumbers },
      });

      if (purchaseOrders.length > 0) {
        supplierName =
          normalizeText(purchaseOrders[0]?.supplierName) || "UNKNOWN";
        warehouse = normalizeText(purchaseOrders[0]?.warehouse) || "UNKNOWN";
      }
    }

    // Normalize items from payload
    const normalizedItems = Array.isArray(body.items)
      ? body.items.map((item: PurchaseOrderItem) => ({
          itemCode: normalizeText(item.itemCode),
          itemName: normalizeText(item.itemName),
          quantity: Math.max(Number(item.quantity) || 1, 1),
          unitType: normalizeText(item.unitType),
          purchasePrice: Number(item.purchasePrice) || 0,
          amount: Number(item.amount) || 0,
        }))
      : [];

    if (normalizedItems.length === 0) {
      return errorResponse("No items provided", 400);
    }

    const amount = calculateTotalAmount(normalizedItems);

    // Update receipt
    const updated = await PurchaseReceipt.findByIdAndUpdate(
      id,
      {
        supplierInvoiceNum: normalizeText(body.supplierInvoiceNum),
        poNumber: poNumbers,
        supplierName,
        warehouse,
        amount,
        remarks: body.remarks?.trim() || "",
        status: normalizeStatus(body.status),
        items: normalizedItems,
      },
      { new: true }
    );

    if (!updated) {
      return errorResponse("Receipt not found", 404);
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    return handleServerError("updating receipt", error);
  }
}

// ─── DELETE: Remove Purchase Receipt ──────────────────────────────────────────
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id || typeof id !== "string") {
      return errorResponse("Missing or invalid ID", 400);
    }

    const deleted = await PurchaseReceipt.findByIdAndDelete(id);
    if (!deleted) {
      return errorResponse("Receipt not found", 404);
    }

    return NextResponse.json(
      { message: "Receipt deleted successfully", id },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleServerError("deleting receipt", error);
  }
}
