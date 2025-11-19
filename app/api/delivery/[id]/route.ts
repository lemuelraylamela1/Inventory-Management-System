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

    // Remove undefined fields
    Object.keys(updatedFields).forEach(
      (key) =>
        updatedFields[key as keyof DeliveryUpdatePayload] === undefined &&
        delete updatedFields[key as keyof DeliveryUpdatePayload]
    );

    // Update delivery
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

    // ✅ Update linked Sales Order if status changed to DELIVERED
    // ✅ Update linked Sales Order only if fully delivered
    if (body.status === "DELIVERED" && updated.soNumber) {
      const so = await SalesOrderModel.findOne({ soNumber: updated.soNumber });
      if (so) {
        let allDelivered = true;

        for (const soItem of so.items) {
          // Calculate total delivered quantity for this item
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
            break;
          }
        }

        // Only set SO to DELIVERED if all items are fully delivered
        if (allDelivered) {
          await SalesOrderModel.findByIdAndUpdate(so._id, {
            status: "DELIVERED",
          });
        } else {
          // Optional: set to PARTIAL if some items delivered but not all
          await SalesOrderModel.findByIdAndUpdate(so._id, {
            status: "PARTIAL",
          });
        }
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
