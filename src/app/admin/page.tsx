"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { useDebug } from "@/lib/debug/DebugContext";
import { generateTestCharacters, getTestCharacterCount, removeTestCharacters, type GenerationResult, type TestGenerationOutput } from "@/lib/test-character-generator";
import { validateAllTestCharacters, getValidationSummary, generateAISummary, type CharacterValidationReport } from "@/lib/test-character-validator";
import { getCharacters } from "@/lib/storage";
import { UploadIcon as Upload, CaretRightIcon as CaretRight, UserPlusIcon as UserPlus, UserIcon as User, TrashIcon as Trash, FileJsonIcon as FileJson, DownloadIcon as Download, GearIcon as Gear, HomeIcon as Home } from "@/components/icons";

export default function AdminPage() {
  const debug = useDebug();
  const isAdmin = debug.enabled && debug.unlocked;
  const [characters, setCharacters] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);
  const [generationResults, setGenerationResults] = useState<GenerationResult[] | null>(null);
  const [validationReports, setValidationReports] = useState<CharacterValidationReport[] | null>(null);
  const [validationFilter, setValidationFilter] = useState<"all" | "failures" | "warnings" | "passing">("all");
  const [expandedCharacters, setExpandedCharacters] = useState<Set<string>>(new Set());
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const loadCharacters = useCallback(async () => {
    const chars = await getCharacters();
    setCharacters(chars);
  }, []);

  useState(() => {
    loadCharacters();
  });

  const handleGenerateClick = useCallback(() => {
    setShowGenerateConfirm(true);
  }, []);

  const handleGenerateConfirm = useCallback(async () => {
    setShowGenerateConfirm(false);
    setIsGenerating(true);
    setGenerationResults(null);
    setValidationReports(null);
    setGenerationProgress(null);
    try {
      const output = await generateTestCharacters((current, total, currentName) => {
        setGenerationProgress({ current, total, currentName });
      });
      setGenerationResults(output.results);
      const allChars = await getCharacters();
      const testChars = allChars.filter((c: any) => (c.name || "").endsWith("Test"));
      const reports = validateAllTestCharacters(testChars);
      setValidationReports(reports);
      await loadCharacters();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to generate test characters.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [loadCharacters]);

  const handleRemoveClick = useCallback(async () => {
    setShowRemoveConfirm(true);
  }, []);

  const handleRemoveConfirm = useCallback(async () => {
    setShowRemoveConfirm(false);
    try {
      const removed = await removeTestCharacters();
      setImportSuccess(`Removed ${removed} test character${removed !== 1 ? "s" : ""}.`);
      await loadCharacters();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to remove test characters.");
    }
  }, [loadCharacters]);

  const handleCopyAISummary = useCallback(() => {
    if (!validationReports) return;
    const summary = generateAISummary(validationReports);
    navigator.clipboard.writeText(summary);
  }, [validationReports]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader title="DND Wizard" subtitle="Admin" showThemeToggle />
        <main className="px-4 py-4">
          <div className="flex flex-col items-center justify-center card border-dashed border-border-muted bg-paper py-10 text-center">
            <p className="text-muted">Admin access required.</p>
            <Link href="/" className="btn btn-secondary mt-4">
              <Home className="h-4 w-4 mr-2 inline" />
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const summary = validationReports ? getValidationSummary(validationReports) : null;

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title="DND Wizard" subtitle="Admin Test Lab" showThemeToggle />
      <main className="px-4 py-4 pb-32">
        <div className="mb-5 space-y-2">
          <Link href="/" className="btn btn-secondary w-full">
            <Home className="h-4 w-4 mr-2 inline" />
            Back to Home
          </Link>

          <div className="flex gap-2 -mt-[10px]">
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="btn btn-secondary flex-1 opacity-70 hover:opacity-100"
            >
              <Gear className="h-4 w-4 mr-2 inline" />
              {isGenerating ? "Generating..." : "Generate Test Characters"}
            </button>
            <button
              onClick={handleRemoveClick}
              disabled={isGenerating}
              className="btn btn-secondary flex-1 opacity-70 hover:opacity-100"
            >
              <Trash className="h-4 w-4 mr-2 inline" />
              Remove Test Characters
            </button>
          </div>

          {isGenerating && generationProgress && (
            <div className="mt-2.5 surface bg-paper px-3 py-2.5 text-body">
              <div className="flex items-center justify-between mb-1">
                <span>Generating test characters...</span>
                <span className="text-xs text-[var(--color-text-muted)]">{generationProgress.current} / {generationProgress.total}</span>
              </div>
              <div className="w-full bg-[var(--color-border)] rounded-full h-2 mb-1">
                <div
                  className="bg-[var(--color-ink)] h-2 rounded-full transition-all"
                  style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{generationProgress.currentName}</p>
            </div>
          )}

          {generationResults && (
            <div className="mt-2.5 surface bg-paper px-3 py-2.5 text-body">
              <div className="font-semibold mb-1">
                Generated {generationResults.length} characters — {generationResults.filter((r) => r.success).length} succeeded, {generationResults.filter((r) => !r.success).length} failed
              </div>
              {generationResults.filter((r) => !r.success).length > 0 && (
                <div className="mt-2 space-y-1">
                  {generationResults.filter((r) => !r.success).map((r, i) => (
                    <div key={i} className="text-xs text-[var(--color-error-600)]">
                      {r.name} — {r.error}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setGenerationResults(null)}
                className="mt-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                Dismiss generation results
              </button>
            </div>
          )}

          {validationReports && validationReports.length > 0 && (
            <div className="mt-2.5 surface bg-paper px-3 py-2.5 text-body">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">
                  Validation Report — {summary?.passed} passed, {summary?.failed} failed, {summary?.warnings} warnings
                </div>
                <button
                  onClick={handleCopyAISummary}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  Copy AI Summary
                </button>
              </div>
              <div className="flex gap-1 mb-2">
                {(["all", "failures", "warnings", "passing"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setValidationFilter(filter)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      validationFilter === filter
                        ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {filter === "failures" ? "Failures" : filter === "warnings" ? "Warnings" : filter === "passing" ? "Passing" : "All"}
                  </button>
                ))}
              </div>
              <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                {validationReports
                  .filter((report) => {
                    if (validationFilter === "all") return true;
                    if (validationFilter === "failures") return report.failed > 0;
                    if (validationFilter === "warnings") return report.warnings > 0 && report.failed === 0;
                    if (validationFilter === "passing") return report.failed === 0 && report.warnings === 0;
                    return true;
                  })
                  .map((report) => {
                    const isExpanded = expandedCharacters.has(report.characterName);
                    const statusColor = report.failed > 0 ? "bg-red-500" : report.warnings > 0 ? "bg-yellow-500" : "bg-green-500";
                    return (
                      <div key={report.characterName} className="border border-[var(--color-border)] rounded-lg">
                        <button
                          onClick={() => {
                            const next = new Set(expandedCharacters);
                            if (next.has(report.characterName)) next.delete(report.characterName);
                            else next.add(report.characterName);
                            setExpandedCharacters(next);
                          }}
                          className="w-full flex items-center justify-between p-2 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                            <span className="text-xs font-medium">{report.characterName}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)]">
                              {report.passed} pass, {report.failed} fail, {report.warnings} warn
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--color-text-muted)]">{isExpanded ? "Collapse" : "Expand"}</span>
                        </button>
                        {isExpanded && (
                          <div className="px-2 pb-2 space-y-1">
                            {report.results
                              .filter((r) => {
                                if (validationFilter === "all") return true;
                                if (validationFilter === "failures") return r.status === "fail";
                                if (validationFilter === "warnings") return r.status === "warning";
                                if (validationFilter === "passing") return r.status === "pass";
                                return true;
                              })
                              .map((r, i) => (
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
                                    <span className="text-[var(--color-text-secondary)]">{r.category}: </span>
                                    <span className="text-[var(--color-text-primary)]">{r.check}</span>
                                    <span className="text-[var(--color-text-muted)]"> — {r.message}</span>
                                    {r.expected !== undefined && r.actual !== undefined && (
                                      <span className="text-[var(--color-text-muted)]"> (Expected: {JSON.stringify(r.expected)}, Got: {JSON.stringify(r.actual)})</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              <button
                onClick={() => setValidationReports(null)}
                className="mt-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                Dismiss validation report
              </button>
            </div>
          )}

          {showGenerateConfirm && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50" onClick={() => setShowGenerateConfirm(false)}>
              <div className="mx-auto w-full max-w-sm bg-[var(--color-surface)] rounded-t-[20px] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Generate Test Characters</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  This will generate {getTestCharacterCount()} test characters covering all class/subclass combinations. Continue?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowGenerateConfirm(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateConfirm}
                    className="btn btn-primary flex-1"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
          {showRemoveConfirm && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50" onClick={() => setShowRemoveConfirm(false)}>
              <div className="mx-auto w-full max-w-sm bg-[var(--color-surface)] rounded-t-[20px] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Remove Test Characters</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  This will permanently delete all test characters. Continue?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRemoveConfirm(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemoveConfirm}
                    className="btn btn-primary flex-1"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {importError && (
            <div className="mt-2.5 surface border-[var(--color-error-200)] bg-[var(--color-error-50)] px-3 py-2.5 text-xs font-medium text-[var(--color-error-600)]">
              {importError}
            </div>
          )}
          {importSuccess && (
            <div className="mt-2.5 surface bg-paper px-3 py-2.5 text-body">
              {importSuccess}
            </div>
          )}
        </div>

        <section>
          <h2 className="text-card-title mb-3">
            Test Characters ({characters.filter((c: any) => (c.name || "").endsWith("Test")).length})
          </h2>
          {characters.filter((c: any) => (c.name || "").endsWith("Test")).length === 0 ? (
            <div className="flex flex-col items-center justify-center card border-dashed border-border-muted bg-paper py-10 text-center">
              <User size={48} color="var(--color-text-muted)" className="mb-2.5 opacity-40" />
              <p className="text-muted">No test characters yet. Generate them from the admin panel.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {characters.filter((c: any) => (c.name || "").endsWith("Test")).map((char: any) => (
                <li key={char.id} className="flex items-center gap-2">
                  <Link
                    href={`/character/${char.id}`}
                    className="card block flex-1 p-3.5 transition-all active:scale-[0.98] hover:bg-paper-muted"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink/5">
                          <User size={20} />
                        </div>
                        <div>
                          <h3 className="text-card-title">
                            {char.name || "Unnamed Hero"}
                          </h3>
                          <p className="text-muted">
                            Level {char.level} {char.class} — {char.subclass || "No subclass"}
                          </p>
                        </div>
                      </div>
                      <CaretRight size={16} className="text-ink-muted" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
