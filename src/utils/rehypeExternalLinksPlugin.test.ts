import { expect, test, describe } from "vitest";
import { isExternalLink } from "./rehypeExternalLinksPlugin";

describe("isExternalLink", () => {
  describe("external links (should return true)", () => {
    test("should detect URLs with protocols", () => {
      expect(isExternalLink("https://google.com")).toBe(true);
      expect(isExternalLink("http://example.org")).toBe(true);
    });

    test("should detect external domains with different origins", () => {
      expect(isExternalLink("https://google.com")).toBe(true);
      expect(isExternalLink("https://api.github.com")).toBe(true);
      expect(isExternalLink("http://example.org")).toBe(true);
    });

    test("should detect external IP addresses", () => {
      expect(isExternalLink("http://192.168.1.1")).toBe(true);
      expect(isExternalLink("https://127.0.0.1:8080")).toBe(true);
    });
  });

  describe("internal/relative links (should return false)", () => {
    test("should not detect relative paths", () => {
      expect(isExternalLink("./page.html")).toBe(false);
      expect(isExternalLink("../parent/file.md")).toBe(false);
      expect(isExternalLink("page.html")).toBe(false);
    });

    test("should not detect absolute paths", () => {
      expect(isExternalLink("/docs/guide")).toBe(false);
      expect(isExternalLink("/path/to/file.html")).toBe(false);
    });

    test("should not detect hash links", () => {
      expect(isExternalLink("#section")).toBe(false);
      expect(isExternalLink("#top")).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("should handle empty string and malformed URLs", () => {
      expect(isExternalLink("")).toBe(false);
      expect(isExternalLink("http://")).toBe(false);
      expect(isExternalLink("not-a-url")).toBe(false);
      expect(isExternalLink("google.com")).toBe(false);
      expect(isExternalLink("192.168.1.1")).toBe(false);
    });

    test("should handle non-http protocols as external", () => {
      expect(isExternalLink("ftp://files.example.com")).toBe(true);
      expect(isExternalLink("mailto:user@example.com")).toBe(true);
    });
  });
});
