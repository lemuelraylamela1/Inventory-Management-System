import connectMongoDB from "@/libs/mongodb";
import Warehouse from "../../../../models/warehouse";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params;

  const { warehouse_code, warehouse_name, warehouse_location } =
    await request.json();

  await connectMongoDB();

  await Warehouse.findByIdAndUpdate(id, {
    warehouse_code,
    warehouse_name,
    warehouse_location,
  });

  return NextResponse.json({ message: "Warehouse updated" }, { status: 200 });
}

export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await connectMongoDB();
    await Warehouse.findByIdAndDelete(id);

    return NextResponse.json({ message: "Warehouse deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete warehouse" },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  const { id } = params;
  await connectMongoDB();
  const warehouse = await Warehouse.findOne({ _id: id });
  return NextResponse.json({ warehouse }, { status: 200 });
}
