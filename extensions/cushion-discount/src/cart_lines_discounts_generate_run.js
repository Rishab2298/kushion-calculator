// @ts-check

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * @type {CartLinesDiscountsGenerateRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * Cushion Price Discount Function - DISABLED
 *
 * Price is now set directly via variant creation in the calculator.
 * This function is disabled to prevent conflicts.
 *
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  // Disabled - variant price is set correctly at creation time
  return NO_CHANGES;
}
