import { SalesInvoice } from "../models/salesInvoice";

/**
 * Generates the next sales invoice number in the format SI0000000001, SI0000000002, ...
 */
export async function generateSalesInvoiceNo(): Promise<string> {
  const latest = await SalesInvoice.findOne()
    .sort({ createdAt: -1 })
    .select("invoiceNo");

  const lastNum = latest?.invoiceNo?.match(/\d+$/)?.[0] || "0";
  const nextNum = String(Number(lastNum) + 1).padStart(10, "0");

  return `SI${nextNum}`;
}
