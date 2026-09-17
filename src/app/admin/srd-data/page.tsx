"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { useDebug } from "@/lib/debug/DebugContext";
import type { SrdTestReport, SrdTestResult } from "@/lib/srd-data-tests";

export default function AdminSrdDataPage() {
  const debug = useDebug();
  const isAdmin = debug.enabled && debug.unlocked;
  const [report, setReport] = useState<SrdTestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "fail" | "warn" | "pass">("all");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/test/srd-data");
      if (!res.ok) throw new Error(`Failed to load SRD tests: ${res.status}`);
      const data = (await res.json()) as SrdTestReport;
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SRD tests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader title="DND Wizard" subtitle="SRD Data Tests" showThemeToggle />
        <main className="px-4 py-4">
          <div className="flex flex-col items-center justify-center card border-dashed border-border-muted bg-paper py-10 text-center">
            <p className="text-muted">Admin access required.</p>
            <Link href="/admin" className="btn btn-secondary mt-4">
              Back to Admin
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const summary = report
    ? `${report.passed} passed, ${report.failed} failed, ${report.warnings} warnings`
    : "No report loaded";

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title="DND Wizard" subtitle="SRD Data Tests" showThemeToggle />
      <main className="px-4 py-4 pb-32">
        <div className="mb-5 space-y-2">
          <Link href="/admin" className="btn btn-secondary w-full">
            Back to Admin
          </Link>

          <button onClick={loadReport} disabled={loading} className="btn btn-secondary w-full opacity-70 hover:opacity-100">
            {loading ? "Running tests..." : "Refresh SRD Data Tests"}
          </button>
        </div>

        {error && (
          <div className="mt-2.5 surface border-[var(--color-error-200)] bg-[var(--color-error-50)] px-3 py-2.5 text-xs font-medium text-[var(--color-error-600)]">
            {error}
          </div>
        )}

        {report && (
          <div className="mt-2.5 surface bg-paper px-3 py-2.5 text-body">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">
                SRD Data Integrity — {report.totalTests} checks — {summary}
              </div>
            </div>
            <div className="flex gap-1 mb-2">
              {(["all", "pass", "fail", "warn"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    filter === f
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {f === "fail" ? "Failures" : f === "warn" ? "Warnings" : f === "pass" ? "Passing" : "All"}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {report.categories
                .map((cat) => {
                  const items = cat.results.filter((r) => {
                    if (filter === "all") return true;
                    return r.status === filter;
                  });
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.category} className="border border-[var(--color-border)] rounded-lg p-2">
                      <h3 className="text-xs font-semibold mb-1">{cat.category}</h3>
                      <div className="space-y-1">
                        {items.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px]">
                            <span className="shrink-0 mt-0.5">
                              {r.status === "pass" ? (
                                <span className="text-green-600 font-bold">PASS</span>
                              ) : r.status === "fail" ? (
                                <span className="text-red-600 font-bold">FAIL</span>
                              ) : (
                                <span className="text-yellow-600 font-bold">WARN</span>
                              )}
                            </span>
                            <div className="flex-1">
                              <span className="text-[var(--color-text-secondary)]">{r.name}: </span>
                              <span className="text-[var(--color-text-primary)]">{r.message}</span>
                              {r.expected !== undefined && r.actual !== undefined && (
                                <span className="text-[var(--color-text-muted)]"> (Expected: {JSON.stringify(r.expected)}, Got: {JSON.stringify(r.actual)})</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
