export type DiscountStep = {
  rate: number; // e.g. 0.10 for 10%
  amount: number; // deduction amount
  remaining: number; // total after deduction
};

export type DiscountResult = {
  breakdown: DiscountStep[];
  netTotal: number;
  formattedNetTotal: string;
  formattedPesoDiscount: string;
};

/**
 * Computes sequential discount deductions from a total amount.
 * @param total - original total before discounts
 * @param discounts - array of percentage strings (e.g. ["10", "5"])
 * @returns breakdown steps and formatted totals
 */
export function computeDiscountBreakdown(
  total: number,
  discounts: string[] = []
): DiscountResult {
  const breakdown: DiscountStep[] = [];
  let runningTotal = total;

  for (const rateStr of discounts) {
    const rate = parseFloat(rateStr) / 100;
    if (isNaN(rate) || rate <= 0 || rate >= 1) continue;

    const amount = runningTotal * rate;
    runningTotal -= amount;

    breakdown.push({
      rate,
      amount,
      remaining: runningTotal,
    });
  }

  return {
    breakdown,
    netTotal: runningTotal,
    formattedNetTotal: runningTotal.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    }),
    formattedPesoDiscount: `₱${(total - runningTotal).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  };
}
