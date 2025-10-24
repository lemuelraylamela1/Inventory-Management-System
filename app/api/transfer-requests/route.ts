import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";
import { generateStockTransferNo } from "@/libs/generateStockTransferNo";
import type { TransferRequestItem } from "../../components/sections/type";

export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();

  const {
    requestingWarehouse,
    sourceWarehouse,
    transactionDate,
    transferDate,
    preparedBy,
    reference,
    notes,
    items,
  } = body;

  try {
    // 🧾 Validate required fields
    if (
      !requestingWarehouse ||
      !sourceWarehouse ||
      !transactionDate ||
      !items?.length
    ) {
      console.warn("⚠️ Missing required fields:", {
        requestingWarehouse,
        sourceWarehouse,
        transactionDate,
        items,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔢 Generate request number
    const requestNo = await generateStockTransferNo();
    console.log("🔢 Generated requestNo:", requestNo);

    // 📦 Normalize items
    const normalizedItems = items
      .filter((item: TransferRequestItem) => Number(item.quantity) > 0)
      .map((item: TransferRequestItem) => ({
        itemCode: item.itemCode?.trim().toUpperCase() || "",
        quantity: Math.max(Number(item.quantity) || 1, 1),
        unitType: item.unitType?.trim().toUpperCase() || "",
      }));

    // 🧮 Construct payload
    const payload = {
      requestNo,
      requestingWarehouse: requestingWarehouse.trim().toUpperCase(),
      sourceWarehouse: sourceWarehouse.trim().toUpperCase(),
      transactionDate: new Date(transactionDate),
      transferDate: transferDate ? new Date(transferDate) : undefined,
      preparedBy: preparedBy?.trim() || "system",
      reference: reference?.trim() || "",
      notes: notes?.trim() || "",
      items: normalizedItems,
      status: "pending",
    };

    console.log("📥 TransferRequest payload:", payload);

    // 📝 Create transfer request
    const request = await TransferRequestModel.create(payload);
    console.log("✅ TransferRequest created:", request._id);

    return NextResponse.json({ request }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Failed to create transfer request:", err.message);
      console.error("🧠 Stack trace:", err.stack);
    } else {
      console.error("❌ Unknown error:", err);
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();
  try {
    const requests = await TransferRequestModel.find().sort({ createdAt: -1 });
    return NextResponse.json({ requests });
  } catch (err) {
    console.error("❌ Failed to fetch transfer requests:", err);
    return NextResponse.json(
      { error: "Failed to fetch transfer requests" },
      { status: 500 }
    );
  }
}
