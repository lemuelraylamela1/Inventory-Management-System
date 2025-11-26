import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import PriceList from "@/models/priceList";
import { PriceListType } from "@/app/components/sections/type";

// ======================
// GET /price-lists/:id
// ======================
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectMongoDB();

    const priceList = await PriceList.findById(id);

    if (!priceList) {
      return NextResponse.json(
        { message: "Price list not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(priceList);
  } catch (error) {
    console.error("GET /price-lists/:id error:", error);
    return NextResponse.json(
      { message: "Failed to fetch price list" },
      { status: 500 }
    );
  }
}

// ======================
// PATCH /price-lists/:id
// ======================
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectMongoDB();

    const body = (await req.json()) as Partial<PriceListType>;

    const updatedFields: Partial<PriceListType> = {};

    if (body.priceLevelCode !== undefined) {
      updatedFields.priceLevelCode = body.priceLevelCode.trim().toUpperCase();
    }

    if (body.priceLevelName !== undefined) {
      updatedFields.priceLevelName = body.priceLevelName.trim();
    }

    if (body.items !== undefined) {
      updatedFields.items = body.items.map((item) => ({
        itemCode: item.itemCode.trim().toUpperCase(),
        itemName: item.itemName.trim(),
        salesPrice: Number(item.salesPrice),
      }));
    }

    const updated = await PriceList.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Price list not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /price-lists/:id error:", error);
    return NextResponse.json(
      { message: "Failed to update price list" },
      { status: 500 }
    );
  }
}

// ======================
// DELETE /price-lists/:id
// ======================
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectMongoDB();

    const deleted = await PriceList.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Price list not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Price list deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /price-lists/:id error:", error);
    return NextResponse.json(
      { message: "Failed to delete price list" },
      { status: 500 }
    );
  }
}
