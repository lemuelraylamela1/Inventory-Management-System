import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import DeliveryModel from "@/models/delivery";
import { Delivery, DeliveryItem } from "@/app/components/sections/type";
import SalesOrderModel from "@/models/salesOrder";
import InventoryMain from "@/models/inventoryMain";
import Inventory from "@/models/inventory";
import { InventoryItem } from "../../../components/sections/type";

// Define payload type for PATCH
type DeliveryUpdatePayload = Partial<Delivery> & { items?: DeliveryItem[] };

// GET /api/delivery/:id
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await connectMongoDB();
    const delivery = await DeliveryModel.findById(params.id);

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(delivery, { status: 200 });
  } catch (error) {
    console.error("GET DeliveryByID Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery." },
      { status: 500 }
    );
  }
}

// PATCH /api/delivery/:id
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;

  try {
    await connectMongoDB();
    const body: DeliveryUpdatePayload = await req.json();

    const updatedFields: DeliveryUpdatePayload = {
      soNumber: body.soNumber,
      customer: body.customer,
      warehouse: body.warehouse,
      shippingAddress: body.shippingAddress,
      deliveryDate: body.deliveryDate,
      remarks: body.remarks,
      status: body.status,
      items: body.items,
    };

    Object.keys(updatedFields).forEach(
      (key) =>
        updatedFields[key as keyof DeliveryUpdatePayload] === undefined &&
        delete updatedFields[key as keyof DeliveryUpdatePayload]
    );

    /** ---------------------------------------------------------------------
     * 1. GET OLD DELIVERY BEFORE updating (to compare the status)
     * --------------------------------------------------------------------- */
    const oldDelivery = await DeliveryModel.findById(params.id);
    if (!oldDelivery)
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );

    const statusChangedToDelivered =
      oldDelivery.status === "PREPARED" && body.status === "DELIVERED";

    /** ---------------------------------------------------------------------
     * 2. UPDATE DELIVERY
     * --------------------------------------------------------------------- */
    const updated = await DeliveryModel.findByIdAndUpdate(
      params.id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    /** ---------------------------------------------------------------------
     * 3. ONLY PERFORM INVENTORY ACTION IF STATUS MOVED PREPARED → DELIVERED
     * --------------------------------------------------------------------- */
    if (statusChangedToDelivered) {
      console.log(
        "Status changed PREPARED → DELIVERED. Updating InventoryMain..."
      );

      for (const dItem of updated.items || []) {
        const { itemCode, quantity } = dItem;
        if (!itemCode || quantity <= 0) continue;

        // 1️⃣ Fetch InventoryMain record
        const invMain = await InventoryMain.findOne({ itemCode });
        if (!invMain) continue;

        // 2️⃣ Deduct delivered quantity from quantityOnHold
        invMain.quantityOnHold = Math.max(
          0,
          (invMain.quantityOnHold ?? 0) - quantity
        );

        // 3️⃣ Optionally, also deduct from total stock if needed
        invMain.quantity = Math.max(0, (invMain.quantity ?? 0) - quantity);

        // 4️⃣ Pre-save hook will recalc availableQuantity automatically
        await invMain.save();

        // 5️⃣ Add Inventory log/tracker
        await Inventory.create({
          warehouse: updated.warehouse,
          items: [
            {
              itemCode,
              itemName: dItem.itemName,
              category: invMain.category ?? "UNCATEGORIZED",
              quantity,
              unitType: invMain.unitType,
              activity: "DELIVERED",
              outQty: quantity,
              currentOnhand: invMain.quantity, // optional
              quantityOnHold: invMain.quantityOnHold,
              availableQuantity: invMain.availableQuantity,
              referenceNumber: updated.drNo,
              particulars: `Delivered to ${updated.customer}`,
              date: new Date(),
            },
          ],
        });
      }
    }

    /** ---------------------------------------------------------------------
     * 4. UPDATE SALES ORDER STATUS (PARTIAL / DELIVERED)
     * --------------------------------------------------------------------- */
    if (body.status === "DELIVERED" && updated.soNumber) {
      const so = await SalesOrderModel.findOne({ soNumber: updated.soNumber });

      if (so) {
        let allDelivered = true;

        for (const soItem of so.items) {
          const deliveredQty = await DeliveryModel.aggregate([
            { $match: { soNumber: so.soNumber, status: "DELIVERED" } },
            { $unwind: "$items" },
            { $match: { "items.itemCode": soItem.itemCode } },
            {
              $group: {
                _id: "$items.itemCode",
                totalDelivered: { $sum: "$items.quantity" },
              },
            },
          ]);

          const totalDelivered = deliveredQty[0]?.totalDelivered || 0;

          if (totalDelivered < soItem.quantity) {
            allDelivered = false;
          }
        }

        await SalesOrderModel.findByIdAndUpdate(so._id, {
          status: allDelivered ? "DELIVERED" : "PARTIAL",
        });
      }
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH Delivery Error:", error);
    return NextResponse.json(
      { error: "Failed to update delivery." },
      { status: 500 }
    );
  }
}

// DELETE /api/delivery/:id
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await connectMongoDB();
    const deleted = await DeliveryModel.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Delivery deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Delivery Error:", error);
    return NextResponse.json(
      { error: "Failed to delete delivery." },
      { status: 500 }
    );
  }
}
