// import PurchaseOrder from "@/models/purchaseOrder";
// import mongoose from "mongoose";
// import { NextRequest, NextResponse } from "next/server";
// import { PurchaseOrderType } from "@/app/components/sections/type";

// const allowedStatuses = [
//   "Pending",
//   "Approved",
//   "Rejected",
//   "Completed",
// ] as const;

// function normalizeUpdateFields(fields: PurchaseOrderType) {
//   const allowedStatuses = [
//     "Pending",
//     "Approved",
//     "Rejected",
//     "Completed",
//   ] as const;

//   return {
//     poNumber: fields.poNumber?.trim() || "",
//     referenceNumber: fields.referenceNumber?.trim() || "",
//     supplierName: fields.supplierName?.trim().toUpperCase() || "",
//     warehouse: fields.warehouse?.trim().toUpperCase() || "",
//     itemName: fields.itemName?.trim().toUpperCase() || "",
//     total: Number(fields.total) || 0,
//     totalQuantity: Number(fields.totalQuantity) || 0,
//     balance: Number(fields.balance ?? fields.total) || 0,
//     remarks: fields.remarks?.trim() || "",
//     status: allowedStatuses.includes(
//       fields.status?.trim() as (typeof allowedStatuses)[number]
//     )
//       ? fields.status!.trim()
//       : "Pending",
//   };
// }

// // PUT: Update a purchase order
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const body = await request.json();
//     const id = params.id;
//     const rawFields = body;

//     if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//       return NextResponse.json(
//         { error: "Invalid or missing purchase order ID" },
//         { status: 400 }
//       );
//     }

//     const updateFields = normalizeUpdateFields(rawFields);

//     const updatedPO = await PurchaseOrder.findByIdAndUpdate(id, updateFields, {
//       new: true,
//       runValidators: true,
//     });

//     if (!updatedPO) {
//       return NextResponse.json(
//         { error: "Purchase order not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(updatedPO, { status: 200 });
//   } catch (error) {
//     console.error("Error updating PO:", error);
//     return NextResponse.json(
//       { error: "Failed to update purchase order" },
//       { status: 500 }
//     );
//   }
// }

// // DELETE: Remove a purchase order by ID
// export async function DELETE(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const id = searchParams.get("id");

//     if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//       console.warn("Invalid or missing purchase order ID:", id);
//       return NextResponse.json(
//         { error: "Invalid or missing purchase order ID" },
//         { status: 400 }
//       );
//     }

//     const deletedPO = await PurchaseOrder.findByIdAndDelete(id);

//     if (!deletedPO) {
//       return NextResponse.json(
//         { error: "Purchase order not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(
//       { message: "Purchase order deleted successfully", id },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error deleting PO:", error);
//     return NextResponse.json(
//       { error: "Failed to delete purchase order" },
//       { status: 500 }
//     );
//   }
// }
