import PurchaseReceipt from "@/models/purchaseReceipt";

/**
 * Generates the next supplier invoice number in the format SI000, SI001, SI002...
 */
export async function generateSupplierInvoiceNum(): Promise<string> {
  const latest = await PurchaseReceipt.findOne()
    .sort({ createdAt: -1 })
    .select("supplierInvoiceNum");

  const lastNum = latest?.supplierInvoiceNum?.match(/\d+$/)?.[0] || "0";
  const nextNum = String(Number(lastNum) + 1).padStart(10, "0");

  return `SU${nextNum}`;
}
