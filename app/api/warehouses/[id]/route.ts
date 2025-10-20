// import connectMongoDB from "@/libs/mongodb";
// import Warehouse from "../../../../models/warehouse";
// import { NextResponse } from "next/server";

// export async function PUT(request, { params }) {
//   const { id } = params;

//   const { warehouse_code, warehouse_name, warehouse_location } =
//     await request.json();

//   await connectMongoDB();

//   await Warehouse.findByIdAndUpdate(id, {
//     warehouse_code,
//     warehouse_name,
//     warehouse_location,
//   });

//   return NextResponse.json({ message: "Warehouse updated" }, { status: 200 });
// }

// export async function DELETE(request, { params }) {
//   const { id } = params;

//   try {
//     await connectMongoDB();
//     await Warehouse.findByIdAndDelete(id);

//     return NextResponse.json({ message: "Warehouse deleted" }, { status: 200 });
//   } catch (error) {
//     console.error("Delete failed:", error);
//     return NextResponse.json(
//       { error: "Failed to delete warehouse" },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(request, { params }) {
//   const { id } = params;
//   await connectMongoDB();
//   const warehouse = await Warehouse.findOne({ _id: id });
//   return NextResponse.json({ warehouse }, { status: 200 });
// }

import connectMongoDB from "@/libs/mongodb";
import Warehouse from "../../../../models/warehouse";
import { NextResponse, NextRequest } from "next/server";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface WarehousePayload {
  warehouse_code: string;
  warehouse_name: string;
  warehouse_location: string;
}

export async function PUT(request: NextRequest, props: Params) {
  const params = await props.params;
  const { id } = params;
  const body: WarehousePayload = await request.json();

  await connectMongoDB();

  await Warehouse.findByIdAndUpdate(id, {
    warehouse_code: body.warehouse_code,
    warehouse_name: body.warehouse_name,
    warehouse_location: body.warehouse_location,
  });

  return NextResponse.json({ message: "Warehouse updated" }, { status: 200 });
}

export async function DELETE(request: NextRequest, props: Params) {
  const params = await props.params;
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

export async function GET(request: NextRequest, props: Params) {
  const params = await props.params;
  const { id } = params;

  await connectMongoDB();
  const warehouse = await Warehouse.findOne({ _id: id });

  return NextResponse.json({ warehouse }, { status: 200 });
}
