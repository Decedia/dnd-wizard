"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacters, saveCharacter, type Character } from "@/lib/storage";
import { importCharacterFromPdf } from "@/lib/pdf";
import { Upload, Dices } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-ink">
      <AppHeader title="DND Wizard" subtitle="My Characters" />

      <main className="px-4 py-6 pb-28">
        <div className="mb-4">
          <Link
            href="/dice"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Dices className="h-5 w-5" />
            <span>Dice Roller</span>
          </Link>
        </div>
        <div className="mb-6">
          <button
            onClick={handleImportClick}
            className="btn-secondary w-full"
          >
            <Upload className="h-4 w-4 mr-2 inline" />
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
            <div className="mt-3 surface border-red-500 bg-paper px-4 py-3 text-sm font-bold text-red-500">
              {importError}
            </div>
          )}
          {importSuccess && (
            <div className="mt-3 surface bg-paper px-4 py-3 text-sm font-bold text-ink">
              {importSuccess}
            </div>
          )}
        </div>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">
            My Characters
          </h2>

          {characters.length === 0 ? (
               <div className="flex flex-col items-center justify-center card border-dashed border-paper/20 bg-ink py-12 text-center">
              <div className="mb-3 text-4xl opacity-40">🐉</div>
              <p className="text-sm text-paper-muted">
                No characters yet. Create your first hero to begin your adventure.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {characters.map((char) => (
                <li key={char.id}>
                   <Link
                     href={`/character/${char.id}`}
                      className="card block p-4 transition-all active:scale-[0.98] hover:bg-paper/5"
                   >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-muted text-lg">
                          🧙
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-paper">
                            {char.name || "Unnamed Hero"}
                          </h3>
                          <p className="text-xs text-paper-muted">
                            Created {formatDate(char.createdAt)}
                          </p>
                        </div>
                      </div>
                      <svg
                        className="h-5 w-5 text-paper-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
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

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
