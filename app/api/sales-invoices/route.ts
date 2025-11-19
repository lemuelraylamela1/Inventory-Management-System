import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { SalesInvoice } from "@/models/salesInvoice";
import { Customer } from "@/models/customer";
import SalesOrder from "@/models/salesOrder";
import AccountsReceivable from "@/models/accountsReceivable";
import Delivery from "@/models/delivery"; // Delivery model
import type { SalesInvoiceItem } from "../../components/sections/type";

export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();

  try {
    // 1️⃣ Create Invoice
    const invoice = await SalesInvoice.create(body);

    // 2️⃣ Compute invoice total
    const totalAmount = invoice.items?.reduce(
      (sum: number, item: SalesInvoiceItem) => sum + Number(item.amount || 0),
      0
    );

    // 3️⃣ Create Accounts Receivable entry
    await AccountsReceivable.create({
      customer: invoice.customer,
      reference: invoice.invoiceNo,
      amount: totalAmount,
      balance: totalAmount,
      status: "UNPAID",
    });

    // 4️⃣ Update DR status to "COMPLETED"
    if (invoice.drNo) {
      await Delivery.findOneAndUpdate(
        { drNo: invoice.drNo },
        { status: "COMPLETED" },
        { new: true }
      );
    }

    // 5️⃣ Update Sales Order status to "COMPLETED"
    if (invoice.salesOrder) {
      await SalesOrder.findOneAndUpdate(
        { soNumber: invoice.salesOrder },
        { status: "COMPLETED" },
        { new: true }
      );
    }

    return NextResponse.json(
      {
        message: "Invoice created, AR entry added, and DR/SO statuses updated",
        invoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Failed to create invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice", details: error },
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
    console.error("❌ Failed to fetch invoices:", err);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
