import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getExpiredItemClassName,
  getExpiredItemStyle,
  isOverOneYearOld,
} from "./dateUtils";

describe("dateUtils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects dates older than one year", () => {
    expect(isOverOneYearOld(new Date("2025-07-15T12:00:00.000Z"))).toBe(true);
    expect(isOverOneYearOld(new Date("2025-07-17T12:00:00.000Z"))).toBe(false);
  });

  it("returns expired styles and class names", () => {
    const expired = new Date("2024-01-01T00:00:00.000Z");
    const recent = new Date("2026-06-01T00:00:00.000Z");

    expect(getExpiredItemStyle(expired)).toEqual({
      color: "gray",
      textDecoration: "line-through",
    });
    expect(getExpiredItemStyle(recent)).toEqual({});
    expect(getExpiredItemClassName(expired)).toBe("text-gray-500 line-through");
    expect(getExpiredItemClassName(recent)).toBe("");
  });
});
