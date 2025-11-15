import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import DeliveryModel from "@/models/delivery";
import { Delivery, DeliveryItem } from "@/app/components/sections/type";

// Define payload type for PATCH
type DeliveryUpdatePayload = Partial<Delivery> & { items?: DeliveryItem[] };

// GET /api/delivery/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  { params }: { params: { id: string } }
) {
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
  { params }: { params: { id: string } }
) {
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
