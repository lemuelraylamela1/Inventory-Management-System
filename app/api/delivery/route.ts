import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import DeliveryModel, { DeliveryItem } from "@/models/delivery";
import SalesOrderModel, { SalesOrderDocument } from "@/models/salesOrder";
import type { SalesOrderItem } from "@/app/components/sections/type";

interface DeliveryItemPayload {
  itemCode: string;
  quantity: number;
  selected?: boolean;
}

interface DeliveryPayload {
  soNumber: string;
  customer: string;
  warehouse: string;
  shippingAddress: string;
  deliveryDate: string;
  remarks?: string;
  status?: string;
  items?: DeliveryItemPayload[];
}

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();
    const body: DeliveryPayload = await req.json();

    // 1️⃣ Find Sales Order
    const so = await SalesOrderModel.findOne({ soNumber: body.soNumber });
    if (!so) {
      return NextResponse.json(
        { error: "Sales Order not found." },
        { status: 404 }
      );
    }

    // 2️⃣ Prepare delivery items and deduct from availableQuantity
    const deliveryItems: DeliveryItem[] = (body.items || []).reduce<
      DeliveryItem[]
    >((acc, item) => {
      const soItem = so.items.find(
        (i: SalesOrderItem) => i.itemCode === item.itemCode
      );
      if (!soItem) return acc;

      const currentAvailable = soItem.availableQuantity ?? soItem.quantity ?? 0;
      if (currentAvailable <= 0) return acc; // nothing left to deliver

      const deliverQty = Math.min(item.quantity, currentAvailable);

      acc.push({
        itemCode: soItem.itemCode!,
        itemName: soItem.itemName,
        unitType: soItem.unitType,
        price: soItem.price,
        amount: soItem.amount,
        weight: soItem.weight,
        cbm: soItem.cbm,
        selected: item.selected ?? true,
        quantity: deliverQty,
      });

      return acc;
    }, []);

    if (deliveryItems.length === 0) {
      return NextResponse.json(
        { error: "No available items to deliver from this Sales Order." },
        { status: 400 }
      );
    }

    // 3️⃣ Create the delivery
    const delivery = await DeliveryModel.create({
      soNumber: body.soNumber,
      customer: body.customer,
      warehouse: body.warehouse,
      shippingAddress: body.shippingAddress,
      deliveryDate: body.deliveryDate,
      remarks: body.remarks || "",
      status: body.status || "PREPARED",
      items: deliveryItems,
    });

    // 4️⃣ Update SO availableQuantity and status
    so.items = so.items.map((i: SalesOrderItem) => {
      const deliveredItem = deliveryItems.find(
        (di) => di.itemCode === i.itemCode
      );
      const remaining =
        (i.availableQuantity ?? i.quantity ?? 0) -
        (deliveredItem?.quantity ?? 0);
      return {
        ...i,
        availableQuantity: remaining >= 0 ? remaining : 0,
      };
    });

    so.status = so.items.some(
      (i: SalesOrderItem) => (i.availableQuantity ?? 0) > 0
    )
      ? "PARTIAL"
      : "PREPARED";

    await so.save(); // save updated availableQuantity

    return NextResponse.json(
      { delivery, soStatus: so.status },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Delivery Error:", error);
    return NextResponse.json(
      { error: "Failed to create delivery." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectMongoDB();

    const deliveries = await DeliveryModel.find()
      .populate("soNumber")
      .sort({ createdAt: -1 });

    return NextResponse.json(deliveries, { status: 200 });
  } catch (error) {
    console.error("GET Deliveries Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliveries." },
      { status: 500 }
    );
  }
}
