import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { SalesInvoice } from "@/models/salesInvoice";
import { Customer } from "@/models/customer";
import SalesOrder from "@/models/salesOrder";
import { generateSalesInvoiceNo } from "@/libs/generateSalesInvoiceNo";
import InventoryMain from "@/models/inventoryMain";
import Inventory from "@/models/inventory";
import { InventoryItem } from "../../components/sections/type";

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
    items,
  } = body;

  try {
    // 🧾 Validate customer
    const customerDoc = await Customer.findOne({
      customerName: customer?.trim().toUpperCase(),
    });

    if (!customerDoc) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // 🔗 Resolve sales order
    const salesOrderDoc = salesOrder
      ? await SalesOrder.findOne({ soNumber: salesOrder })
      : null;

    // 🔢 Generate invoice number
    const invoiceNo = await generateSalesInvoiceNo();

    // 📦 Normalize items
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

    // 🧮 Construct invoice payload
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
      items: normalizedItems,
    };

    // 🧾 Create invoice
    const invoice = await SalesInvoice.create(normalizedInvoice);

    // 📉 Deduct quantities from InventoryMain
    const warehouse = salesOrderDoc?.warehouse?.trim().toUpperCase();
    if (!warehouse) {
      console.warn(
        `⚠️ No warehouse found in sales order ${salesOrderDoc?.soNumber}`
      );
    } else {
      for (const item of normalizedItems) {
        try {
          await InventoryMain.updateOne(
            {
              itemCode: item.itemCode,
              warehouse,
            },
            {
              $inc: { quantity: -item.quantity },
            },
            { upsert: false }
          );

          console.log(
            `📉 InventoryMain reduced for ${item.itemCode} in ${warehouse}: -${item.quantity}`
          );
        } catch (err) {
          console.error(
            `❌ InventoryMain update failed for ${item.itemCode}:`,
            err
          );
        }
      }
    }

    for (const item of normalizedItems) {
      try {
        const now = new Date();
        const warehouse = salesOrderDoc?.warehouse?.trim().toUpperCase();
        const inventoryDoc = await Inventory.findOne({ warehouse });

        const newEntry = {
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: "SOLD",
          quantity: -item.quantity,
          unitType: item.unitType,
          source: invoiceNo,
          referenceNumber: reference || invoiceNo,
          activity: "SALE",
          user: "SYSTEM", // or pass from frontend
          inQty: 0,
          outQty: item.quantity,
          currentOnhand: 0,
          particulars: `Sold via ${reference || invoiceNo}`,
          date: now.toISOString(),
          receivedAt: now,
          createdAt: now,
          updatedAt: now,
        };

        if (!inventoryDoc) {
          newEntry.currentOnhand = -item.quantity;

          await Inventory.create({
            warehouse,
            items: [newEntry],
            remarks: `Auto-created from invoice ${invoiceNo}`,
          });

          console.log(`🆕 Created inventory tracker for ${warehouse}`);
        } else {
          inventoryDoc.items.push(newEntry);

          const totalOnhand = inventoryDoc.items
            .filter((i: InventoryItem) => i.itemCode === item.itemCode)
            .reduce((sum: number, i: InventoryItem) => sum + i.quantity, 0);

          inventoryDoc.items[inventoryDoc.items.length - 1].currentOnhand =
            totalOnhand;

          await inventoryDoc.save();
          console.log(`📤 Logged sale for ${item.itemCode} in ${warehouse}`);
        }
      } catch (err) {
        console.error(
          `❌ Failed to log inventory tracker for ${item.itemCode}:`,
          err
        );
      }
    }

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
