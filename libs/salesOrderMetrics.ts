import { SalesOrder, SalesOrderItem } from "../app/components/sections/type";

export type SalesOrderInput = Omit<
  SalesOrder,
  "_id" | "soNumber" | "createdAt" | "updatedAt"
>;

// 🧮 Total Quantity
export const computeTotalQuantity = (items: SalesOrderItem[]): number => {
  return items.reduce((sum: number, item) => sum + (item.quantity ?? 0), 0);
};

// ⚖️ Total Weight (formatted)
export const formatWeight = (items: SalesOrderItem[]): string => {
  const totalWeight = items.reduce(
    (sum: number, item) => sum + (item.weight ?? 0),
    0
  );
  return `${totalWeight.toFixed(2)} kg`;
};

// 📦 Total CBM (formatted)
export const formatCBM = (items: SalesOrderItem[]): string => {
  const totalCBM = items.reduce((sum, item) => {
    const cbmPerUnit = item.cbm ?? 0;
    const quantity = item.quantity ?? 0;
    return sum + cbmPerUnit * quantity;
  }, 0);
  return `${totalCBM.toFixed(3)} m³`;
};

// 💰 Subtotal (formatted)
export const computeSubtotal = (items: SalesOrderItem[]): string => {
  const subtotal = items.reduce((sum: number, item) => {
    const quantity = item.quantity ?? 0;
    const price = item.price ?? 0;
    return sum + quantity * price;
  }, 0);
  return subtotal.toFixed(2);
};

// 💸 Peso Discount (formatted)
export const computePesoDiscount = (discounts: string[] = []): string => {
  const totalPercent = discounts
    .map((d: string) => parseFloat(d))
    .filter((v: number) => !isNaN(v))
    .reduce((sum: number, v: number) => sum + v, 0);
  return `${totalPercent.toFixed(2)}%`;
};

// 🧾 Net Total (formatted)
export const computeNetTotal = ({
  total,
  discounts = [],
}: {
  total: number;
  discounts?: string[];
}): string => {
  const discountPercent = discounts
    .map((d) => parseFloat(d))
    .filter((v) => !isNaN(v))
    .reduce((sum, v) => sum + v, 0);

  const net = total * (1 - discountPercent / 100);
  return net.toFixed(2);
};

// 🧠 Inject all computed fields
export const enrichSalesOrderInput = (so: SalesOrderInput): SalesOrderInput => {
  const formattedTotal = computeSubtotal(so.items ?? []);
  const total = parseFloat(formattedTotal);

  return {
    ...so,
    totalQuantity: computeTotalQuantity(so.items ?? []),
    formattedWeight: formatWeight(so.items ?? []),
    formattedCBM: formatCBM(so.items ?? []),
    formattedTotal,
    formattedNetTotal: computeNetTotal({ total, discounts: so.discounts }),
  };
};

export const enrichSalesOrder = (so: SalesOrder): SalesOrder => {
  const formattedTotal = computeSubtotal(so.items ?? []);
  const total = parseFloat(formattedTotal);

  return {
    ...so,
    totalQuantity: computeTotalQuantity(so.items ?? []),
    formattedWeight: formatWeight(so.items ?? []),
    formattedCBM: formatCBM(so.items ?? []),
    formattedTotal,
    formattedNetTotal: computeNetTotal({ total, discounts: so.discounts }),
  };
};
