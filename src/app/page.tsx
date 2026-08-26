"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacters, saveCharacter, type Character } from "@/lib/storage";
import { importCharacterFromPdf } from "@/lib/pdf";
import { Upload, CaretRight, UserPlus, User } from "phosphor-react";

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
    <div className="min-h-screen bg-paper">
      <AppHeader title="DND Wizard" subtitle="My Characters" />

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
            <div className="mt-2.5 surface border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
              {importError}
            </div>
          )}
          {importSuccess && (
            <div className="mt-2.5 surface bg-paper px-3 py-2.5 text-xs font-medium text-ink">
              {importSuccess}
            </div>
          )}
        </div>

        <section>
          <h2 className="font-display text-sm font-semibold text-ink mb-3">
            My Characters
          </h2>

          {characters.length === 0 ? (
               <div className="flex flex-col items-center justify-center card border-dashed border-border-muted bg-paper py-10 text-center">
               <UserPlus weight="regular" size={48} color="#cccccc" className="mb-2.5 opacity-40" />
              <p className="text-xs text-ink-muted">
                No characters yet. Create your first hero to begin your adventure.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {characters.map((char) => (
                <li key={char.id}>
                   <Link
                     href={`/character/${char.id}`}
                      className="card block p-3.5 transition-all active:scale-[0.98] hover:bg-paper-muted"
                   >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink/5">
                         <User weight="regular" size={20} />
                       </div>
                      <div>
                        <h3 className="font-display font-semibold text-ink text-sm">
                          {char.name || "Unnamed Hero"}
                        </h3>
                        <p className="text-[11px] text-ink-muted">
                          Created {formatDate(char.createdAt)}
                        </p>
                      </div>
                    </div>
                    <CaretRight weight="regular" size={16} className="text-ink-muted" />
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
