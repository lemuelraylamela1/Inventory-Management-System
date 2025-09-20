import PurchaseReceipt from "@/models/purchaseReceipt";
import PurchaseOrder from "@/models/purchaseOrder";
import { generateNextPRNumber } from "../../../libs/generateNextPRNumbers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const poNumbers = Array.isArray(body.poNumber)
      ? body.poNumber.map((po: string) => po.trim().toUpperCase())
      : [];

    if (poNumbers.length === 0) {
      return NextResponse.json(
        { error: "At least one PO number is required" },
        { status: 400 }
      );
    }

    const purchaseOrders = await PurchaseOrder.find({
      poNumber: { $in: poNumbers },
    });

    if (purchaseOrders.length === 0) {
      return NextResponse.json(
        { error: "No matching purchase orders found" },
        { status: 404 }
      );
    }

    const supplierName =
      purchaseOrders[0]?.supplierName?.trim().toUpperCase() || "UNKNOWN";
    const warehouse =
      purchaseOrders[0]?.warehouse?.trim().toUpperCase() || "UNKNOWN";
    const amount = purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);

    const newReceipt = await PurchaseReceipt.create({
      prNumber: await generateNextPRNumber(),
      supplierInvoiceNum: body.supplierInvoiceNum?.trim().toUpperCase(),
      poNumber: poNumbers,
      supplierName,
      warehouse,
      amount,
      status: body.status?.trim().toLowerCase() || "draft",
      remarks: body.remarks?.trim() || "", // ✅ Add this line
    });

    return NextResponse.json(newReceipt, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ Error creating receipt:", error);
    return NextResponse.json(
      { error: "Failed to create receipt" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const receipts = await PurchaseReceipt.find().sort({ createdAt: -1 });
    return NextResponse.json(receipts, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to retrieve receipts" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const deleted = await PurchaseReceipt.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Receipt deleted", id },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ Error deleting receipt:", error);
    return NextResponse.json(
      { error: "Failed to delete receipt" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;

    const poNumbers = Array.isArray(body.poNumber)
      ? body.poNumber.map((po: string) => po.trim().toUpperCase())
      : [];

    const purchaseOrders = await PurchaseOrder.find({
      poNumber: { $in: poNumbers },
    });

    if (purchaseOrders.length === 0) {
      return NextResponse.json(
        { error: "No matching purchase orders found" },
        { status: 404 }
      );
    }

    const supplierName =
      purchaseOrders[0]?.supplierName?.trim().toUpperCase() || "UNKNOWN";
    const warehouse =
      purchaseOrders[0]?.warehouse?.trim().toUpperCase() || "UNKNOWN";
    const amount = purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);

    const updated = await PurchaseReceipt.findByIdAndUpdate(
      id,
      {
        supplierInvoiceNum: body.supplierInvoiceNum?.trim().toUpperCase(),
        poNumber: poNumbers,
        supplierName,
        warehouse,
        amount,
        status: body.status?.trim().toLowerCase() || "draft",
        remarks: body.remarks?.trim() || "", // ✅ Add this line
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ Error updating receipt:", error);
    return NextResponse.json(
      { error: "Failed to update receipt" },
      { status: 500 }
    );
  }
}
