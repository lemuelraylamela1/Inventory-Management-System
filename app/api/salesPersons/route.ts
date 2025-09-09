import connectMongoDB from "../../../libs/mongodb";
import SalesPerson from "../../../models/salesperson";
import { NextResponse, NextRequest } from "next/server";

interface SalesPersonPayload {
  createdDT: string;
  salesperson_code: string;
  salesperson_name: string;
  salesperson_region: string;
}

interface BulkPayload {
  salespersons: SalesPersonPayload[];
}

export async function POST(request: NextRequest) {
  const body: SalesPersonPayload | BulkPayload = await request.json();
  await connectMongoDB();

  try {
    if ("salespersons" in body && Array.isArray(body.salespersons)) {
      await SalesPerson.insertMany(body.salespersons);
      return NextResponse.json(
        { message: "Bulk upload successful" },
        { status: 201 }
      );
    }

    const {
      createdDT,
      salesperson_code,
      salesperson_name,
      salesperson_region,
    } = body as SalesPersonPayload;

    await SalesPerson.create({
      createdDT,
      salesperson_code,
      salesperson_name,
      salesperson_region,
    });

    return NextResponse.json(
      { message: "SalesPerson created" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating salesperson(s):", error);
    return NextResponse.json(
      { message: "Failed to create salesperson(s)" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();
  const salespersons = await SalesPerson.find();
  return NextResponse.json({ salespersons });
}

// Optional DELETE handler — uncomment and use if needed
/*
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing salesperson ID" }, { status: 400 });
  }

  await connectMongoDB();
  await SalesPerson.findByIdAndDelete(id);
  return NextResponse.json({ message: "SalesPerson deleted" }, { status: 200 });
}
*/
