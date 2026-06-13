import { describe, expect, it } from "vitest";
import { jsonSafe } from "./accountPrivacy.js";

describe("jsonSafe", () => {
  it("serializes bigint fields for Express JSON responses", () => {
    const payload = {
      favorites: [{ userId: 42n, name: "Oats" }],
      nested: { count: 1n },
    };
    const safe = jsonSafe(payload);
    expect(() => JSON.stringify(safe)).not.toThrow();
    expect(safe.favorites[0].userId).toBe("42");
    expect(safe.nested.count).toBe("1");
  });
});
