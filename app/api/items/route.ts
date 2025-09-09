// import connectMongoDB from "../../../libs/mongodb";
// import Item from "../../../models/item";
// import { NextResponse } from "next/server";

// export async function POST(request) {
//   const body = await request.json();
//   await connectMongoDB();

//   try {
//     // Bulk insert if body contains an array of items
//     if (Array.isArray(body.items)) {
//       await Item.insertMany(body.items);
//       return NextResponse.json(
//         { message: "Bulk upload successful" },
//         { status: 201 }
//       );
//     }

//     // Single item insert
//     const {
//       createdDT,
//       item_code,
//       item_name,
//       item_description,
//       item_category,
//       item_status,
//       imageUrl,
//       height,
//       weight,
//       length,
//       width,
//     } = body;

//     await Item.create({
//       createdDT,
//       item_code,
//       item_name,
//       item_description,
//       item_category,
//       item_status,
//       imageUrl,
//       height,
//       weight,
//       length,
//       width,
//     });

//     return NextResponse.json({ message: "Item created" }, { status: 201 });
//   } catch (error) {
//     console.error("Error creating item(s):", error);
//     return NextResponse.json(
//       { message: "Failed to create item(s)" },
//       { status: 500 }
//     );
//   }
// }

// export async function GET() {
//   await connectMongoDB();
//   const items = await Item.find();
//   return NextResponse.json({ items });
// }

// export async function DELETE(request) {
//   const id = request.nextUrl.searchParams.get("id");
//   await connectMongoDB();
//   await Topic.findByIdAndDelete(id);
//   return NextResponse.json({ message: "Topic deleted" }, { status: 200 });
// }
import connectMongoDB from "../../../libs/mongodb";
import Item from "../../../models/item";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

interface ItemPayload {
  createdDT: string;
  item_code: string;
  item_name: string;
  item_description: string;
  item_category: string;
  item_status: string;
  imageUrl?: string;
  height?: number;
  weight?: number;
  length?: number;
  width?: number;
}

interface BulkPayload {
  items: ItemPayload[];
}

export async function POST(request: NextRequest) {
  const body: ItemPayload | BulkPayload = await request.json();
  await connectMongoDB();

  try {
    if ("items" in body && Array.isArray(body.items)) {
      await Item.insertMany(body.items);
      return NextResponse.json(
        { message: "Bulk upload successful" },
        { status: 201 }
      );
    }

    const {
      createdDT,
      item_code,
      item_name,
      item_description,
      item_category,
      item_status,
      imageUrl,
      height,
      weight,
      length,
      width,
    } = body as ItemPayload;

    await Item.create({
      createdDT,
      item_code,
      item_name,
      item_description,
      item_category,
      item_status,
      imageUrl,
      height,
      weight,
      length,
      width,
    });

    return NextResponse.json({ message: "Item created" }, { status: 201 });
  } catch (error) {
    console.error("Error creating item(s):", error);
    return NextResponse.json(
      { message: "Failed to create item(s)" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();
  const items = await Item.find();
  return NextResponse.json({ items });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing item ID" }, { status: 400 });
  }

  await connectMongoDB();
  await Item.findByIdAndDelete(id);
  return NextResponse.json({ message: "Item deleted" }, { status: 200 });
}