import PurchaseOrder from "@/models/purchaseOrder";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Incoming body:", body);

    const newPO = await PurchaseOrder.create({
      referenceNumber: body.referenceNumber,
      supplierName: body.supplierName?.trim().toUpperCase(),
      warehouse: body.warehouse?.trim().toUpperCase(),
      amount: body.amount ?? 0,
      balance: body.balance ?? body.amount ?? 0,
      remarks: body.remarks,
      status: body.status ?? "Pending",
    });

    console.log("Created PO:", newPO);
    return NextResponse.json(newPO, { status: 201 });
  } catch (error) {
    console.error("Error creating PO:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const purchaseOrders = await PurchaseOrder.find().sort({ createdAt: -1 });
    return NextResponse.json(purchaseOrders, { status: 200 });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to retrieve purchase orders" },
      { status: 500 }
    );
  }
}
