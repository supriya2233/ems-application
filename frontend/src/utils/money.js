/* ₹ amounts in the Indian format: 125000 → "₹1,25,000" */
export const formatMoney = (value) => `₹${Math.round(Number(value || 0)).toLocaleString('en-IN')}`
