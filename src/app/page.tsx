"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacters, saveCharacter, deleteCharacter, type Character } from "@/lib/storage";
import { importCharacterFromPdf } from "@/lib/pdf";
import { Upload, CaretRight, UserPlus, User, Trash } from "phosphor-react";

export default function Home() {
  const characters = getCharacters();
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    try {
      const imported = await importCharacterFromPdf(file);
      saveCharacter(imported);
      setImportSuccess(`Imported "${imported.name || "Unnamed"}" successfully.`);
    } catch (err) {
      setImportError("This PDF doesn't contain DND Wizard character data.");
    } finally {
      e.target.value = "";
    }
  };

  const handleDelete = (char: Character) => {
    if (window.confirm(`Are you sure you want to delete ${char.name || "this character"}? This action cannot be undone.`)) {
      deleteCharacter(char.id);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title="DND Wizard" subtitle="My Characters" showThemeToggle />

      <main className="px-4 py-4 pb-28">
        <div className="mb-5">
          <button
            onClick={handleImportClick}
            className="btn btn-secondary w-full"
          >
            <Upload weight="regular" className="h-4 w-4 mr-2 inline" />
            Import from PDF
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleImportFile}
            className="hidden"
          />
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
            My Characters
          </h2>

          {characters.length === 0 ? (
               <div className="flex flex-col items-center justify-center card border-dashed border-border-muted bg-paper py-10 text-center">
                <UserPlus weight="regular" size={48} color="var(--color-text-muted)" className="mb-2.5 opacity-40" />
              <p className="text-muted">
                No characters yet. Create your first hero to begin your adventure.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {characters.map((char) => (
                <li key={char.id} className="flex items-center gap-2">
                  <Link
                    href={`/character/${char.id}`}
                    className="card block flex-1 p-3.5 transition-all active:scale-[0.98] hover:bg-paper-muted"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink/5">
                          <User weight="regular" size={20} />
                        </div>
                        <div>
                          <h3 className="text-card-title">
                            {char.name || "Unnamed Hero"}
                          </h3>
                          <p className="text-muted">
                            Created {formatDate(char.createdAt)}
                          </p>
                        </div>
                      </div>
                      <CaretRight weight="regular" size={16} className="text-ink-muted" />
                    </div>
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(char); }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-error-600)] transition-all"
                    aria-label={`Delete ${char.name || "character"}`}
                  >
                    <Trash weight="regular" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
    </main>
  </div>
);
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
