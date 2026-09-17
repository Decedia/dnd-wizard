// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, it, expect } from "bun:test";
import { runSrdDataIntegrityTests } from "@/lib/srd-data-tests";

describe("SRD data integrity", () => {
  it("runs all data integrity checks", () => {
    const report = runSrdDataIntegrityTests();
    expect(report.totalTests).toBeGreaterThan(0);
    expect(report.categories.length).toBeGreaterThan(0);
    console.log(`SRD tests: ${report.passed} pass, ${report.failed} fail, ${report.warnings} warn`);
  });

  it("has no failures", () => {
    const report = runSrdDataIntegrityTests();
    const failures = report.categories.flatMap((c) => c.results.filter((r) => r.status === "fail"));
    if (failures.length > 0) {
      console.log("Failures:", failures.map((f) => `${f.name}: ${f.message}`).join("\n"));
    }
    expect(failures.length).toBe(0);
  });
});
