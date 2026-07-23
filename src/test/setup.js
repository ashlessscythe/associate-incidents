import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

process.env.JWT_SECRET ||= "test-secret";
process.env.BACKUP_ENCRYPTION_KEY ||= "0".repeat(64);

afterEach(() => {
  if (typeof document !== "undefined") {
    cleanup();
  }
});

if (typeof window !== "undefined") {
  window.matchMedia ||= (query) => ({
    matches:
      typeof query === "string" &&
      (query.includes("min-width: 1024px") || query.includes("min-width: 640px")),
    media: typeof query === "string" ? query : "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });

  window.URL.createObjectURL ||= () => "blob:test-url";
  window.URL.revokeObjectURL ||= () => {};
}
