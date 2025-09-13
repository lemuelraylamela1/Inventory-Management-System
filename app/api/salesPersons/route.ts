import connectMongoDB from "../../../libs/mongodb";
import SalesPerson from "../../../models/salesPerson";
import { NextResponse, NextRequest } from "next/server";

interface SalesPersonPayload {
  salesPersonCode: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  contactNumber: string;
  area: string;
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

    const {
      salesPersonCode,
      firstName,
      lastName,
      emailAddress,
      contactNumber,
      area,
      status,
    } = body as SalesPersonPayload;

    await SalesPerson.create({
      salesPersonCode,
      firstName,
      lastName,
      emailAddress,
      contactNumber,
      area,
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
