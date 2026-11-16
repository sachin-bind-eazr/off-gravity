export type GstMode = "INCLUSIVE" | "EXCLUSIVE";
export const GST_RATE_PERCENT = 18;
export type Quote = { subtotalPaise: number; taxPaise: number; feesPaise: number; totalPaise: number };
/** All amounts are integer paise. Fees are 0 until configured. */
export function computeQuote(pricePaise: number, quantity: number, gstMode: GstMode, feesPaise = 0): Quote {
  const gross = pricePaise * quantity;
  if (gstMode === "INCLUSIVE") {
    const tax = Math.round(gross - gross / (1 + GST_RATE_PERCENT / 100));
    return { subtotalPaise: gross - tax, taxPaise: tax, feesPaise, totalPaise: gross + feesPaise };
  }
  const tax = Math.round((gross * GST_RATE_PERCENT) / 100);
  return { subtotalPaise: gross, taxPaise: tax, feesPaise, totalPaise: gross + tax + feesPaise };
}
