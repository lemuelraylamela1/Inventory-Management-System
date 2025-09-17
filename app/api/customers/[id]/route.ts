import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import { Customer } from "@/models/customer";

type Params = {
  params: {
    id: string;
  };
};

// ✅ PUT: Update a customer
export async function PUT(
  req: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.warn("Invalid or missing _id:", id);
    return NextResponse.json(
      { message: "Invalid or missing _id" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { message: "Missing update payload" },
        { status: 400 }
      );
    }

    // ✅ Normalize casing
    const transformedBody = {
      ...body,
      ...(body.customerCode && {
        customerCode: body.customerCode.toUpperCase().trim(),
      }),
      ...(body.customerName && {
        customerName: body.customerName.toUpperCase().trim(),
      }),
      ...(body.address && {
        address: body.address.toUpperCase().trim(),
      }),
      ...(body.contactPerson && {
        contactPerson: body.contactPerson.toUpperCase().trim(),
      }),
      ...(body.contactNumber && {
        contactNumber: body.contactNumber.trim(),
      }),
      ...(body.emailAddress && {
        emailAddress: body.emailAddress.toLowerCase().trim(),
      }),
      ...(body.TIN && {
        TIN: body.TIN.trim(),
      }),
      ...(body.customerGroup && {
        customerGroup: body.customerGroup.toUpperCase().trim(),
      }),
      ...(body.salesAgent && {
        salesAgent: body.salesAgent.toUpperCase().trim(),
      }),
      ...(body.terms && {
        terms: body.terms.toUpperCase().trim(),
      }),
    };

    const updated = await Customer.findByIdAndUpdate(id, transformedBody, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Customer updated", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { message: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Remove a customer
export async function DELETE(
  _: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.warn("Invalid or missing _id:", id);
    return NextResponse.json(
      { message: "Invalid or missing _id" },
      { status: 400 }
    );
  }

  try {
    const deleted = await Customer.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Customer deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { message: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
