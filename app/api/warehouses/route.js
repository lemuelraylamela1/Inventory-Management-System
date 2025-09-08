import connectMongoDB from "../../../libs/mongodb";
import Warehouse from "../../../models/warehouse";
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();
  await connectMongoDB();

  try {
    // Bulk insert if body contains an array of items
    if (Array.isArray(body.warehouses)) {
      await Warehouse.insertMany(body.warehouses);
      return NextResponse.json(
        { message: "Bulk upload successful" },
        { status: 201 }
      );
    }

    const { createdDT, warehouse_code, warehouse_name, warehouse_location } =
      body;

    await Warehouse.create({
      createdDT,
      warehouse_code,
      warehouse_name,
      warehouse_location,
    });

    return NextResponse.json({ message: "Warehouse created" }, { status: 201 });
  } catch (error) {
    console.error("Error creating warehouse(s):", error);
    return NextResponse.json(
      { message: "Failed to create warehouse(s)" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();
  const warehouses = await Warehouse.find();
  return NextResponse.json({ warehouses });
}

// export async function DELETE(request) {
//   const id = request.nextUrl.searchParams.get("id");
//   await connectMongoDB();
//   await Topic.findByIdAndDelete(id);
//   return NextResponse.json({ message: "Topic deleted" }, { status: 200 });
// }
