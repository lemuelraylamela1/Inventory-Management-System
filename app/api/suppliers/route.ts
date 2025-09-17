import { NextResponse, NextRequest } from "next/server";
import connectMongoDB from "../../../libs/mongodb";
import Supplier from "@/models/supplier"; // ✅ Your Supplier model

interface SupplierPayload {
  supplierCode: string;
  supplierName: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
}

interface BulkPayload {
  items: SupplierPayload[];
}

// 🔧 Normalize casing and trim whitespace
const normalizeSupplier = (item: SupplierPayload): SupplierPayload => ({
  supplierCode: item.supplierCode.toUpperCase().trim(),
  supplierName: item.supplierName.toUpperCase().trim(),
  contactPerson: item.contactPerson.toUpperCase().trim(),
  contactNumber: item.contactNumber.trim(),
  emailAddress: item.emailAddress.toLowerCase().trim(),
  address: item.address.toUpperCase().trim(),
});

export async function POST(request: NextRequest) {
  await connectMongoDB();
  const body: SupplierPayload | BulkPayload = await request.json();

  try {
    // 🧩 Bulk upload
    if ("items" in body && Array.isArray(body.items)) {
      const transformedItems = body.items.map(normalizeSupplier);
      await Supplier.insertMany(transformedItems);
      return NextResponse.json(
        { message: "Bulk upload successful" },
        { status: 201 }
      );
    }

    // 🧩 Single supplier creation
    const {
      supplierCode,
      supplierName,
      contactPerson,
      contactNumber,
      emailAddress,
      address,
    } = normalizeSupplier(body as SupplierPayload);

    // 🔍 Check for composite uniqueness
    const existing = await Supplier.findOne({
      $or: [{ supplierCode }, { supplierName }],
    });

    if (existing) {
      return NextResponse.json(
        {
          message: "Duplicate supplierCode or supplierName",
          conflict: {
            supplierCode: existing.supplierCode,
            supplierName: existing.supplierName,
          },
        },
        { status: 409 }
      );
    }

    await Supplier.create({
      supplierCode,
      supplierName,
      contactPerson,
      contactNumber,
      emailAddress,
      address,
    });

    return NextResponse.json(
      { message: "Supplier created successfully" },
      { status: 201 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("Error creating supplier:", err);

    return NextResponse.json(
      {
        message: "Failed to create supplier.",
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();

  try {
    const items = await Supplier.find();
    return NextResponse.json({ items });
  } catch (error: unknown) {
    let errorMessage = "Unknown error";
    let errorStack: string | undefined = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack =
        process.env.NODE_ENV === "development" ? error.stack : undefined;
      console.error("Error fetching suppliers:", error);
    } else {
      console.error("Non-Error thrown:", error);
    }

    return NextResponse.json(
      {
        message: "Failed to fetch suppliers.",
        error: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
