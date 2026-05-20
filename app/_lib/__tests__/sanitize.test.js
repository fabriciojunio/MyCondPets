/** @jest-environment node */
import { sanitizeHtml, truncate, sanitizeObject, safeId, isValidEmail } from "../sanitize";

describe("sanitizeHtml", () => {
  test("encodes HTML angle brackets", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>")).not.toContain("<");
    expect(sanitizeHtml("<script>alert('xss')</script>")).not.toContain(">");
  });

  test("encodes ampersands", () => {
    expect(sanitizeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  test("encodes double quotes", () => {
    expect(sanitizeHtml('say "hello"')).toContain("&quot;");
  });

  test("encodes single quotes", () => {
    expect(sanitizeHtml("it's")).toContain("&#x27;");
  });

  test("encodes forward slashes", () => {
    expect(sanitizeHtml("a/b")).toContain("&#x2F;");
  });

  test("returns non-string values unchanged", () => {
    expect(sanitizeHtml(42)).toBe(42);
    expect(sanitizeHtml(null)).toBeNull();
  });
});

describe("truncate", () => {
  test("truncates long strings", () => {
    expect(truncate("Hello World, this is long", 11)).toBe("Hello World");
  });

  test("returns short strings unchanged", () => {
    expect(truncate("Short", 10)).toBe("Short");
  });

  test("trims whitespace", () => {
    expect(truncate("  hello  ", 100)).toBe("hello");
  });

  test("returns non-string values unchanged", () => {
    expect(truncate(123, 10)).toBe(123);
  });
});

describe("sanitizeObject", () => {
  test("sanitizes string values in objects", () => {
    const result = sanitizeObject({ name: "<b>bold</b>" });
    expect(result.name).not.toContain("<");
  });

  test("sanitizes nested objects", () => {
    const result = sanitizeObject({ inner: { value: "<script>" } });
    expect(result.inner.value).not.toContain("<");
  });

  test("sanitizes arrays", () => {
    const result = sanitizeObject(["<b>", "<i>"]);
    expect(result[0]).not.toContain("<");
    expect(result[1]).not.toContain("<");
  });

  test("handles null and undefined", () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(undefined)).toBeUndefined();
  });

  test("respects max depth", () => {
    const deep = { a: { b: { c: { d: "<script>" } } } };
    const result = sanitizeObject(deep, 2);
    // At depth 2, the innermost values may not be sanitized
    expect(result.a.b).toBeDefined();
  });
});

describe("safeId", () => {
  test("returns valid integer IDs", () => {
    expect(safeId(1)).toBe(1);
    expect(safeId("42")).toBe(42);
    expect(safeId(100)).toBe(100);
  });

  test("rejects invalid IDs", () => {
    expect(safeId(0)).toBeNull();
    expect(safeId(-1)).toBeNull();
    expect(safeId("abc")).toBeNull();
    expect(safeId(1.5)).toBeNull();
    expect(safeId(null)).toBeNull();
    expect(safeId(undefined)).toBeNull();
    expect(safeId(2147483648)).toBeNull(); // exceeds max int
  });
});

describe("isValidEmail", () => {
  test("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user@domain.org")).toBe(true);
  });

  test("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
  });

  test("rejects excessively long emails", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    expect(isValidEmail(longEmail)).toBe(false);
  });
});
