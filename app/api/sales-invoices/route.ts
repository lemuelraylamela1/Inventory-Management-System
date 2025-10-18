import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { SalesInvoice } from "@/models/salesInvoice";
import { Customer } from "@/models/customer";
import SalesOrder from "@/models/salesOrder";

export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();

  const {
    invoiceDate,
    customer,
    amount,
    status,
    reference,
    salesOrder,
    dueDate,
    notes,
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
      ? await SalesOrder.findById(salesOrder)
      : null;

    const normalizedInvoice = {
      invoiceDate,
      customer: customer?.trim().toUpperCase(),
      amount,
      balance: amount, // ✅ Explicitly set balance for audit clarity
      status: status?.trim().toUpperCase() || "UNPAID",
      reference,
      salesOrder: salesOrderDoc?._id,
      TIN: customerDoc.TIN,
      terms: customerDoc.terms,
      salesPerson: customerDoc.salesPerson,
      address: customerDoc.address,
      dueDate,
      notes,
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
