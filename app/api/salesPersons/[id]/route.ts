import connectMongoDB from "@/libs/mongodb";
import SalesPerson from "../../../../models/salesPerson";
import { NextResponse, NextRequest } from "next/server";

interface Params {
  params: {
    id: string;
  };
}

interface SalesPersonPayload {
  salesperson_code: string;
  salesperson_name: string;
  salesperson_email: string;
  salesperson_status: string;
  salesperson_region: string;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = params;
  const body: SalesPersonPayload = await request.json();

  await connectMongoDB();

  await SalesPerson.findByIdAndUpdate(id, {
    ...body,
  });

  return NextResponse.json({ message: "SalesPerson updated" }, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = params;

  try {
    await connectMongoDB();
    await SalesPerson.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "SalesPerson deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete SalesPerson" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params;

  await connectMongoDB();
  const salesperson = await SalesPerson.findOne({ _id: id });

  return NextResponse.json({ salesperson }, { status: 200 });
}
