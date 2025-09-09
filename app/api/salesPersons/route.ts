import connectMongoDB from "../../../libs/mongodb";
import SalesPerson from "../../../models/salesPerson";
import { NextResponse, NextRequest } from "next/server";

interface SalesPersonPayload {
  salesPersonCode: string;
  salesPersonName: string;
  emailAddress: string;
  status: string;
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

    const { salesPersonCode, salesPersonName, emailAddress, status } =
      body as SalesPersonPayload;

    await SalesPerson.create({
      salesPersonCode,
      salesPersonName,
      emailAddress,
      status,
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
  return NextResponse.json({ salesPersons: salespersons });
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
