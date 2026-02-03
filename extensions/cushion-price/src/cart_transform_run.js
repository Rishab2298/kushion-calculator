// @ts-check

/**
 * @typedef {import("../generated/api").CartTransformRunInput} CartTransformRunInput
 * @typedef {import("../generated/api").CartTransformRunResult} CartTransformRunResult
 */

/**
 * @type {CartTransformRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * Cart Transform Function
 *
 * Reads the _calculated_price attribute from cart lines and updates
 * the cart line price to match. This allows instant variant creation
 * with a placeholder price, while the function ensures the correct
 * calculated price is shown in the cart.
 *
 * @param {CartTransformRunInput} input
 * @returns {CartTransformRunResult}
 */
export function cartTransformRun(input) {
  const operations = [];

  for (const line of input.cart.lines) {
    // Check if this line has a calculated price attribute
    const calculatedPriceAttr = line.calculatedPrice;

    if (!calculatedPriceAttr?.value) {
      // No calculated price attribute, skip this line
      continue;
    }

    const calculatedPrice = parseFloat(calculatedPriceAttr.value);

    if (isNaN(calculatedPrice) || calculatedPrice <= 0) {
      continue;
    }

    // Get the current price
    const currentPrice = parseFloat(line.cost.amountPerQuantity.amount);

    // Only update if the prices don't match (with small tolerance for floating point)
    if (Math.abs(currentPrice - calculatedPrice) > 0.01) {
      operations.push({
        lineUpdate: {
          cartLineId: line.id,
          price: {
            adjustment: {
              fixedPricePerUnit: {
                amount: calculatedPrice.toFixed(2),
              },
            },
          },
        },
      });
    }
  }

  if (operations.length === 0) {
    return NO_CHANGES;
  }

  return { operations };
}
