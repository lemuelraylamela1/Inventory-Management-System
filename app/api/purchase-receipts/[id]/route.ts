// import PurchaseReceipt from "@/models/purchaseReceipt";
// import PurchaseOrder from "@/models/purchaseOrder";
// import { NextResponse } from "next/server";

// export async function PUT(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const body = await request.json();
//     const { id } = params;

//     if (!id || typeof id !== "string") {
//       return NextResponse.json(
//         { error: "Missing or invalid ID" },
//         { status: 400 }
//       );
//     }

//     const poNumbers = Array.isArray(body.poNumber)
//       ? body.poNumber.map((po: string) => po.trim().toUpperCase())
//       : [];

//     const purchaseOrders = await PurchaseOrder.find({
//       poNumber: { $in: poNumbers },
//     });

//     if (purchaseOrders.length === 0) {
//       return NextResponse.json(
//         { error: "No matching purchase orders found" },
//         { status: 404 }
//       );
//     }

//     const supplierName =
//       purchaseOrders[0]?.supplierName?.trim().toUpperCase() || "UNKNOWN";
//     const warehouse =
//       purchaseOrders[0]?.warehouse?.trim().toUpperCase() || "UNKNOWN";
//     const amount = purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);

//     const updated = await PurchaseReceipt.findByIdAndUpdate(
//       id,
//       {
//         supplierInvoiceNum: body.supplierInvoiceNum?.trim().toUpperCase(),
//         poNumber: poNumbers,
//         supplierName,
//         warehouse,
//         amount,
//       },
//       { new: true }
//     );

//     if (!updated) {
//       return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
//     }

//     return NextResponse.json(updated, { status: 200 });
//   } catch (error: unknown) {
//     if (error instanceof Error) {
//       console.error("❌ Error updating receipt:", error.message, error.stack);
//       return NextResponse.json(
//         { error: error.message || "Failed to update receipt" },
//         { status: 500 }
//       );
//     }

//     console.error("❌ Unknown error:", error);
//     return NextResponse.json(
//       { error: "Unexpected error occurred" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   _: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params;

//     if (!id || typeof id !== "string") {
//       return NextResponse.json(
//         { error: "Missing or invalid ID" },
//         { status: 400 }
//       );
//     }

//     const deleted = await PurchaseReceipt.findByIdAndDelete(id);

//     if (!deleted) {
//       return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
//     }

//     return NextResponse.json(
//       { message: "Receipt deleted successfully", id },
//       { status: 200 }
//     );
//   } catch (error: unknown) {
//     if (error instanceof Error) {
//       console.error("❌ Error deleting receipt:", error.message);
//       return NextResponse.json(
//         { error: error.message || "Failed to delete receipt" },
//         { status: 500 }
//       );
//     }

//     console.error("❌ Unknown error:", error);
//     return NextResponse.json(
//       { error: "Unexpected error occurred" },
//       { status: 500 }
//     );
//   }
// }
