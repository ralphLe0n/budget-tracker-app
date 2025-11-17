export const formatCurrency = (amount) => {
  // Handle undefined, null, or NaN values
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.00 PLN';
  }

  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (numAmount < 0) {
    return `- ${Math.abs(numAmount).toFixed(2)} PLN`;
  }
  return `${numAmount.toFixed(2)} PLN`;
};
