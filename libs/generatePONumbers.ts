import PurchaseOrder from "@/models/purchaseOrder";

export async function generateNextPONumber(): Promise<string> {
  const prefix = "PO";
  const padLength = 10;

  const latestPO = await PurchaseOrder.findOne({})
    .sort({ createdAt: -1 })
    .select("poNumber");

  let nextNumber = 1;

  if (latestPO?.poNumber?.startsWith(prefix)) {
    const numericPart = latestPO.poNumber.slice(prefix.length);
    const parsed = parseInt(numericPart, 10);
    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  const padded = String(nextNumber).padStart(padLength, "0");
  return `${prefix}${padded}`;
}
