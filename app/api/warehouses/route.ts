import connectMongoDB from "../../../libs/mongodb";
import Warehouse from "../../../models/warehouse";
import { NextResponse, NextRequest } from "next/server";

interface WarehousePayload {
  createdDT: string;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_location: string;
}

interface BulkPayload {
  warehouses: WarehousePayload[];
}

export async function POST(request: NextRequest) {
  const body: WarehousePayload | BulkPayload = await request.json();
  await connectMongoDB();

  try {
    if ("warehouses" in body && Array.isArray(body.warehouses)) {
      await Warehouse.insertMany(body.warehouses);
      return NextResponse.json(
        { message: "Bulk upload successful" },
        { status: 201 }
      );
    }

    const { createdDT, warehouse_code, warehouse_name, warehouse_location } =
      body as WarehousePayload;

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

// Optional DELETE handler — uncomment and use if needed
/*
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing warehouse ID" }, { status: 400 });
  }

  await connectMongoDB();
  await Warehouse.findByIdAndDelete(id);
  return NextResponse.json({ message: "Warehouse deleted" }, { status: 200 });
}
*/
