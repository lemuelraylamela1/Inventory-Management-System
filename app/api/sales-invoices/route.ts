import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { SalesInvoice } from "@/models/salesInvoice";
import SalesOrder from "@/models/salesOrder";
import AccountsReceivable from "@/models/accountsReceivable";
import Delivery from "@/models/delivery"; // Delivery model
import type {
  SalesInvoiceItem,
  DiscountStep,
} from "../../components/sections/type";

export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();

  try {
    // 1️⃣ Create initial invoice document
    const invoice = await SalesInvoice.create(body);

    // 2️⃣ Fetch linked Sales Order discounts (if any)
    let discountBreakdown = [];
    let pesoDiscounts = 0;

    if (body.salesOrder) {
      const so = await SalesOrder.findOne({ soNumber: body.salesOrder });
      if (so) {
        discountBreakdown = so.discountBreakdown || [];
        pesoDiscounts = so.pesoDiscounts || 0;
      }
    }

    // 3️⃣ Compute total amount of items
    const totalAmount =
      invoice.items?.reduce(
        (sum: number, item: SalesInvoiceItem) => sum + Number(item.amount || 0),
        0
      ) || 0;

    // 4️⃣ Compute total discount and net total
    const totalDiscount =
      (discountBreakdown?.reduce(
        (sum: number, step: DiscountStep) => sum + (step.amount || 0),
        0
      ) || 0) + (pesoDiscounts || 0);

    const netTotal = totalAmount - totalDiscount;

    // 5️⃣ Update invoice with discounts and net total
    invoice.discountBreakdown = discountBreakdown;
    invoice.pesoDiscounts = pesoDiscounts;
    invoice.amount = netTotal;
    await invoice.save();

    // 6️⃣ Create Accounts Receivable entry using net total
    await AccountsReceivable.create({
      customer: invoice.customer,
      reference: invoice.invoiceNo,
      amount: netTotal,
      balance: netTotal,
      status: "UNPAID",
    });

    // 7️⃣ Update Delivery Receipt status to "WITH SALES INVOICE"
    if (invoice.drNo) {
      const dr = await Delivery.findOneAndUpdate(
        { drNo: invoice.drNo },
        { status: "WITH SALES INVOICE" },
        { new: true }
      );

      if (!dr) console.warn(`⚠️ DR ${invoice.drNo} not found`);
    }

    // 8️⃣ Update Sales Order status to "COMPLETED"
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
