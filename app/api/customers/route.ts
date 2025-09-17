import { NextResponse, NextRequest } from "next/server";
import { Customer } from "@/models/customer";
import connectMongoDB from "../../../libs/mongodb";

// ✅ Interfaces
interface CustomerPayload {
  customerCode: string;
  customerName: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress?: string;
  TIN: string;
  customerGroup: string; // now plain string
  salesAgent: string; // now plain string
  terms: string;
}

interface BulkCustomerPayload {
  items: CustomerPayload[];
}

// ✅ Normalize casing and trim
const normalizeCustomer = (
  item: CustomerPayload
): Partial<CustomerPayload> => ({
  customerCode: item.customerCode.toUpperCase().trim(),
  customerName: item.customerName.toUpperCase().trim(),
  address: item.address.toUpperCase().trim(),
  contactPerson: item.contactPerson.toUpperCase().trim(),
  contactNumber: item.contactNumber.trim(),
  emailAddress: item.emailAddress?.toLowerCase().trim(),
  TIN: item.TIN.trim(),
  customerGroup: item.customerGroup.trim().toUpperCase(),
  salesAgent: item.salesAgent.trim().toUpperCase(),
  terms: item.terms.toUpperCase().trim(),
});

// ✅ POST: Create single or bulk customers
export async function POST(request: NextRequest) {
  await connectMongoDB();

  const body: CustomerPayload | BulkCustomerPayload = await request.json();

  try {
    if ("items" in body && Array.isArray(body.items)) {
      const transformedItems = body.items.map(normalizeCustomer);
      await Customer.insertMany(transformedItems);

      return NextResponse.json(
        { message: "Bulk customer upload successful" },
        { status: 201 }
      );
    }

    const customer = normalizeCustomer(body as CustomerPayload);
    await Customer.create(customer);

    return NextResponse.json(
      { message: "Customer created successfully" },
      { status: 201 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("Error creating customer:", err);

    return NextResponse.json(
      {
        message: "Failed to create customer.",
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ GET: Fetch all customers (no population needed)
export async function GET() {
  await connectMongoDB();

  try {
    const items = await Customer.find(); // no .populate() needed
    return NextResponse.json({ items });
  } catch (error: unknown) {
    let errorMessage = "Unknown error";
    let errorStack: string | undefined = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack =
        process.env.NODE_ENV === "development" ? error.stack : undefined;
      console.error("Error fetching customers:", error);
    } else {
      console.error("Non-Error thrown:", error);
    }

    return NextResponse.json(
      {
        message: "Failed to fetch customers.",
        error: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
