export const money = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
