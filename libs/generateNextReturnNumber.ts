import PurchaseReturn from "@/models/purchaseReturn";

export async function generateNextReturnNumber(): Promise<string> {
  const prefix = "PRTN";
  const padLength = 10;

  const lastReturn = await PurchaseReturn.findOne()
    .sort({ createdAt: -1 })
    .select("returnNumber");

  const lastId = lastReturn?.returnNumber
    ? parseInt(lastReturn.returnNumber.replace(prefix, ""), 10)
    : 0;

  const nextId = lastId + 1;
  const padded = String(nextId).padStart(padLength, "0");

  return `${prefix}${padded}`;
}
