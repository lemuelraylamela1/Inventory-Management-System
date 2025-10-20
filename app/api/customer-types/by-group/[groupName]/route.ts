import { NextResponse } from "next/server";
import connectMongoDB from "../../../../../libs/mongodb";

import CustomerType from "../../../../../models/customerType";

type Params = {
  params: Promise<{
    groupName: string;
  }>;
};

export async function GET(_: Request, props: Params): Promise<NextResponse> {
  const params = await props.params;
  await connectMongoDB();

  const rawGroupName = params.groupName;
  const groupName = rawGroupName?.trim().toUpperCase();

  if (!groupName) {
    console.warn("Missing or invalid groupName:", rawGroupName);
    return NextResponse.json(
      { message: "Missing or invalid groupName" },
      { status: 400 }
    );
  }

  try {
    const customerType = await CustomerType.findOne({ groupName });

    if (!customerType) {
      console.info(`Customer group '${groupName}' not found.`);
      return NextResponse.json(
        { message: `Customer group '${groupName}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(customerType, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.stack
        : undefined;

    console.error("❌ Error fetching customer type:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch customer type.",
        error: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
