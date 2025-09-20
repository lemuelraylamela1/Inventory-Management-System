import PurchaseReceipt from "@/models/purchaseReceipt";

export async function generateNextPRNumber(): Promise<string> {
  const latest = await PurchaseReceipt.findOne().sort({ createdAt: -1 });
  const lastNum = latest?.prNumber?.match(/\d+$/)?.[0] || "0";
  const nextNum = String(Number(lastNum) + 1).padStart(10, "0");
  return `PR${nextNum}`;
}
