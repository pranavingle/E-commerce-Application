const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const toNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const validateOrderPayload = (payload = {}) => {
  const { orderItems, shippingAddress, itemsPrice, shippingPrice, taxPrice, totalPrice } = payload;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return 'No order items';
  }

  const hasInvalidItem = orderItems.some((item) => {
    return !item.product || !item.name || toNonNegativeNumber(item.price) === null || toNonNegativeNumber(item.quantity) === null || Number(item.quantity) < 1;
  });

  if (hasInvalidItem) {
    return 'Invalid order items';
  }

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.country) {
    return 'Complete shipping address is required';
  }

  if ([itemsPrice, shippingPrice, taxPrice, totalPrice].some((value) => toNonNegativeNumber(value) === null)) {
    return 'Invalid order pricing';
  }

  return null;
};

const validateProductPayload = (payload = {}) => {
  const { name, description, price, category, stock } = payload;

  if (!String(name || '').trim() || !String(description || '').trim() || !String(category || '').trim()) {
    return 'Name, description and category are required';
  }

  if (toNonNegativeNumber(price) === null || toNonNegativeNumber(stock) === null) {
    return 'Price and stock must be valid non-negative numbers';
  }

  return null;
};

module.exports = {
  normalizeEmail,
  toNonNegativeNumber,
  validateOrderPayload,
  validateProductPayload,
};