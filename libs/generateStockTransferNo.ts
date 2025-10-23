import { TransferRequestModel } from "@/models/transferRequest";

export async function generateStockTransferNo(): Promise<string> {
  const prefix = "ST";
  const padLength = 10;

  const latest = await TransferRequestModel.findOne()
    .sort({ createdAt: -1 })
    .select("requestNo");

  if (!latest || !latest.requestNo) {
    return `${prefix}${"1".padStart(padLength, "0")}`;
  }

  const current = parseInt(latest.requestNo.slice(prefix.length), 10);
  const next = current + 1;

  return `${prefix}${next.toString().padStart(padLength, "0")}`;
}
