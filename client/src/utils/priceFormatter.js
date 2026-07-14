/**
 * Formats a numeric price into the Indian Rupee currency string
 * using the Indian numbering system (e.g. 1,25,000).
 * 
 * @param {number} price - The price to format
 * @returns {string} The formatted price string with Indian Rupee prefix
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null || isNaN(price)) {
    return '0\u00A0₹';
  }
  
  const formatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  
  return `${formatter.format(price)}\u00A0₹`;
};
