export const formatCurrency = (amount) => {
  if (amount < 0) {
    return `- ${Math.abs(amount).toFixed(2)} PLN`;
  }
  return `${amount.toFixed(2)} PLN`;
};
