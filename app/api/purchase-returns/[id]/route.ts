import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import PurchaseReturn from "@/models/purchaseReturn";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await connectMongoDB();

  try {
    const ret = await PurchaseReturn.findById(params.id);

    if (!ret) {
      return NextResponse.json(
        { error: `Purchase return not found for ID ${params.id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(ret, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching purchase return:", error);
    return NextResponse.json(
      { error: "Failed to retrieve purchase return." },
      { status: 500 }
    );
  }
}

// export async function PATCH(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   await connectToDatabase();

//   try {
//     const body = await request.json();
//     const updates: Partial<typeof PurchaseReturn> = {
//       reason: body.reason?.trim(),
//       notes: body.notes?.trim(),
//       status: body.status?.trim().toUpperCase(),
//       updatedAt: new Date().toISOString(),
//     };

//     const allowedStatuses = ["RETURNED", "APPROVED", "REJECTED", "CLOSED"];
//     if (!allowedStatuses.includes(updates.status ?? "")) {
//       updates.status = "RETURNED";
//     }

//     const updated = await PurchaseReturn.findByIdAndUpdate(
//       params.id,
//       { $set: updates },
//       { new: true }
//     );

//     if (!updated) {
//       return NextResponse.json(
//         { error: `Purchase return not found for ID ${params.id}` },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(updated, { status: 200 });
//   } catch (error) {
//     console.error("❌ Error updating purchase return:", error);
//     return NextResponse.json(
//       { error: "Failed to update purchase return." },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   await connectToDatabase();

//   try {
//     const deleted = await PurchaseReturn.findByIdAndDelete(params.id);
//     if (!deleted) {
//       return NextResponse.json(
//         { error: `Purchase return not found for ID ${params.id}` },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(
//       { message: "✅ Purchase return deleted successfully." },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("❌ Error deleting purchase return:", error);
//     return NextResponse.json(
//       { error: "Failed to delete purchase return." },
//       { status: 500 }
//     );
//   }
// }
