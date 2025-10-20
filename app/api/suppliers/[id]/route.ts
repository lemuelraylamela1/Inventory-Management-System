import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import Supplier from "@/models/supplier";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

interface SupplierPayload {
  supplierCode: string;
  supplierName: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
}

// 🔧 DeepPartial utility for nested optional updates
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 🔧 Normalize casing and trim whitespace
const normalizeUpdate = (
  body: DeepPartial<SupplierPayload>
): DeepPartial<SupplierPayload> => ({
  ...body,
  ...(body.supplierCode && {
    supplierCode: body.supplierCode.toUpperCase().trim(),
  }),
  ...(body.supplierName && {
    supplierName: body.supplierName.toUpperCase().trim(),
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
  ...(body.address && {
    address: body.address.toUpperCase().trim(), // 👈 flatten and normalize
  }),
});

export async function PUT(req: NextRequest, props: Params): Promise<NextResponse> {
  const params = await props.params;
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

    const transformedBody = normalizeUpdate(body);

    const updated = await Supplier.findByIdAndUpdate(id, transformedBody, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Supplier updated", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { message: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, props: Params): Promise<NextResponse> {
  const params = await props.params;
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.warn("Invalid or missing _id:", id);
    return NextResponse.json(
      { message: "Invalid or missing _id" },
      { status: 400 }
    );
  }

  try {
    const deleted = await Supplier.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Supplier deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { message: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
