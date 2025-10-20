import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { SalesInvoice } from "@/models/salesInvoice";
import { Customer } from "@/models/customer";
import SalesOrder from "@/models/salesOrder";
import { generateSalesInvoiceNo } from "@/libs/generateSalesInvoiceNo";

export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();

  const {
    invoiceDate,
    customer,
    amount,
    status,
    reference,
    salesPerson,
    salesOrder,
    dueDate,
    notes,
    items, // ✅ include items from frontend
  } = body;

  try {
    const customerDoc = await Customer.findOne({
      customerName: customer?.trim().toUpperCase(),
    });

    if (!customerDoc) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const salesOrderDoc = salesOrder
      ? await SalesOrder.findOne({ soNumber: salesOrder })
      : null;

    const invoiceNo = await generateSalesInvoiceNo(); // ✅ Generate invoice number

    const normalizedItems = Array.isArray(items)
      ? items
          .filter((item) => Number(item.quantity) > 0)
          .map((item) => ({
            itemCode: item.itemCode?.trim().toUpperCase() || "",
            itemName: item.itemName?.trim().toUpperCase() || "",
            description: item.description?.trim() || "",
            quantity: Math.max(Number(item.quantity) || 1, 1),
            unitType: item.unitType?.trim().toUpperCase() || "",
            price: Number(item.price) || 0,
            amount: Number(item.quantity) * Number(item.price),
          }))
      : [];

    const normalizedInvoice = {
      invoiceNo,
      invoiceDate: new Date(invoiceDate).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),

      customer: customer?.trim().toUpperCase(),
      amount,
      balance: amount,
      status: status?.trim().toUpperCase() || "UNPAID",
      reference,
      salesOrder: salesOrderDoc?.soNumber || "",
      TIN: customerDoc.TIN,
      terms: customerDoc.terms,
      salesPerson: salesPerson?.trim() || customerDoc.salesPerson || "",
      address: customerDoc.address,
      dueDate,
      notes,
      items: normalizedItems, // ✅ embed normalized items
    };

    const invoice = await SalesInvoice.create(normalizedInvoice);

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err) {
    console.error("❌ Failed to create invoice:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();
  try {
    const invoices = await SalesInvoice.find().sort({ createdAt: -1 });
    return NextResponse.json({ invoices });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
