import { NextResponse } from "next/server";
import { CustomerType } from "@/models/customerType";
import { NextRequest } from "next/server";
import connectMongoDB from "../../../libs/mongodb";

interface CustomerTypePayload {
  groupCode: string;
  groupName: string;
  discounts: number[];
}

interface BulkPayload {
  items: CustomerTypePayload[];
}
// Helper to transform string fields to uppercase
const toUpperCaseFields = (item: CustomerTypePayload): CustomerTypePayload => ({
  groupCode: item.groupCode.toUpperCase(),
  groupName: item.groupName.toUpperCase(),
  discounts: item.discounts
    .map((val) => {
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return isNaN(num) ? null : Math.round(num * 100) / 100;
    })
    .filter((val) => val !== null), // 👈 remove invalid entries
});

export async function POST(request: NextRequest) {
  await connectMongoDB();

  const body: CustomerTypePayload | BulkPayload = await request.json();

  try {
    if ("items" in body && Array.isArray(body.items)) {
      const transformedItems = body.items.map(toUpperCaseFields);
      await CustomerType.insertMany(transformedItems);
      return NextResponse.json(
        { message: "Bulk upload successful" },
        { status: 201 }
      );
    }

    const { groupCode, groupName, discounts } = toUpperCaseFields(
      body as CustomerTypePayload
    );

    await CustomerType.create({
      groupCode,
      groupName,
      discounts,
    });

    return NextResponse.json(
      { message: "Customer type created successfully" },
      { status: 201 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");

    console.error("Error creating customer type:", err);

    return NextResponse.json(
      {
        message: "Failed to create customer type.",
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB(); // ✅ Ensure DB connection is established

  try {
    const items = await CustomerType.find();
    return NextResponse.json({ items });
  } catch (error: unknown) {
    let errorMessage = "Unknown error";
    let errorStack: string | undefined = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack =
        process.env.NODE_ENV === "development" ? error.stack : undefined;
      console.error("Error fetching customer types:", error);
    } else {
      console.error("Non-Error thrown:", error);
    }

    return NextResponse.json(
      {
        message: "Failed to fetch customer types.",
        error: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
