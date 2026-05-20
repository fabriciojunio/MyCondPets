/**
 * Input sanitization utilities — prevents XSS, SQL injection indicators,
 * and other malicious input from reaching the application.
 */

/**
 * Sanitize a string by encoding HTML entities.
 * @param {string} input
 * @returns {string}
 */
export function sanitizeHtml(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Trim and limit string length.
 * @param {string} input
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(input, maxLength = 500) {
  if (typeof input !== "string") return input;
  return input.trim().slice(0, maxLength);
}

/**
 * Sanitize an object's string values recursively.
 * @param {object} obj
 * @param {number} maxDepth
 * @returns {object}
 */
export function sanitizeObject(obj, maxDepth = 3) {
  if (maxDepth <= 0 || obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, maxDepth - 1));
  }

  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, maxDepth - 1);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate that a value is a safe integer ID.
 * @param {*} value
 * @returns {number | null}
 */
export function safeId(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 2147483647) return null;
  return num;
}

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
