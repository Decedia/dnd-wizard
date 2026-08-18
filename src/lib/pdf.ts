import { jsPDF } from "jspdf";
import type { Character } from "./storage";

const DND_WIZARD_MARKER = "DND_WIZARD_CHARACTER_DATA";

export function exportCharacterToPdf(character: Character): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(114, 47, 55);
  doc.text(character.name || "Unnamed Character", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`${character.race} • ${character.class} • Level ${character.level}`, margin, y);
  y += 6;
  doc.text(`Background: ${character.background || "—"}  |  Alignment: ${character.alignment || "—"}  |  XP: ${character.experiencePoints}`, margin, y);
  y += 8;

  const divider = () => {
    checkPageBreak(6);
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  divider();

  const abilityLabels = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
  const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("Ability Scores", margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  abilityLabels.forEach((label, idx) => {
    const key = abilityKeys[idx];
    const value = character[key];
    const mod = Math.floor((value - 10) / 2);
    const modText = mod >= 0 ? `+${mod}` : `${mod}`;
    const x = margin + (idx % 3) * (contentWidth / 3);
    const rowY = y + Math.floor(idx / 3) * 14;
    checkPageBreak(14);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.rect(x, rowY, contentWidth / 3 - 4, 12, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(114, 47, 55);
    doc.text(label, x + 3, rowY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(`${value}`, x + 3, rowY + 10);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(modText, x + 15, rowY + 10);
  });
  y += 22;
  divider();

  const statsBlock = [
    ["Proficiency Bonus", `+${character.proficiencyBonus}`],
    ["Initiative", `${character.initiative}`],
    ["Inspiration", character.inspiration ? "Yes" : "No"],
    ["AC", `${character.ac}`],
    ["Current HP", `${character.currentHp}`],
    ["Max HP", `${character.maxHp}`],
    ["Temporary HP", `${character.temporaryHp}`],
    ["Speed", `${character.speed} ft`],
    ["Hit Dice", `${character.hitDiceTotal || "—"} (${character.hitDiceRemaining} remaining)`],
    ["Passive Perception", `${character.passivePerception}`],
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("Combat & Stats", margin, y);
  y += 5;

  doc.setFontSize(9);
  const colWidth = contentWidth / 2;
  statsBlock.forEach(([label, value], idx) => {
    const x = idx % 2 === 0 ? margin : margin + colWidth;
    const rowY = y + Math.floor(idx / 2) * 6;
    checkPageBreak(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(`${label}:`, x, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(value, x + 45, rowY);
  });
  y += Math.ceil(statsBlock.length / 2) * 6 + 3;
  divider();

  const savingThrows = Object.entries(character.savingThrows);
  if (savingThrows.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text("Saving Throws", margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    savingThrows.forEach(([key, st]) => {
      checkPageBreak(6);
      const mod = st.value >= 0 ? `+${st.value}` : `${st.value}`;
      const prof = st.proficient ? " [P]" : "";
      doc.text(`${key.toUpperCase()}: ${mod}${prof}`, margin + 4, y);
      y += 5;
    });
    y += 3;
    divider();
  }

  const features = character.features.filter((f) => f.name);
  if (features.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text("Features & Traits", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    features.forEach((feature) => {
      checkPageBreak(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(114, 47, 55);
      doc.text(`• ${feature.name}`, margin + 4, y);
      y += 5;
      if (feature.description) {
        const lines = doc.splitTextToSize(feature.description, contentWidth - 10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        lines.forEach((line: string) => {
          checkPageBreak(5);
          doc.text(line, margin + 8, y);
          y += 5;
        });
      }
      y += 2;
    });
    divider();
  }

  const inventory = character.inventory.filter((item) => item.name);
  if (inventory.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text("Inventory", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    inventory.forEach((item) => {
      checkPageBreak(6);
      doc.text(`• ${item.name} x${item.quantity}`, margin + 4, y);
      y += 5;
    });
    y += 3;
    divider();
  }

  const currency = character.currency;
  const currencyLines: string[] = [];
  if (currency.platinum) currencyLines.push(`PP: ${currency.platinum}`);
  if (currency.gold) currencyLines.push(`GP: ${currency.gold}`);
  if (currency.electrum) currencyLines.push(`EP: ${currency.electrum}`);
  if (currency.silver) currencyLines.push(`SP: ${currency.silver}`);
  if (currency.copper) currencyLines.push(`CP: ${currency.copper}`);
  if (currencyLines.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text("Currency", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    currencyLines.forEach((line) => {
      checkPageBreak(6);
      doc.text(`• ${line}`, margin + 4, y);
      y += 5;
    });
    y += 3;
    divider();
  }

  const spells = character.spells.filter((s) => s.name);
  if (spells.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text("Spells", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    spells.forEach((spell) => {
      checkPageBreak(6);
      const levelLabel = spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
      doc.text(`• ${spell.name} (${levelLabel})`, margin + 4, y);
      y += 5;
    });
    y += 3;
    divider();
  }

  const appearanceFields: { label: string; value: string }[] = [
    { label: "Character Appearance", value: character.appearance.characterAppearance },
    { label: "Personality", value: character.appearance.personality },
    { label: "Backstory", value: character.appearance.backstory },
    { label: "Allies & Organizations", value: character.appearance.alliesOrganizations },
    { label: "Additional Features & Traits", value: character.appearance.additionalFeaturesTraits },
    { label: "Treasure", value: character.appearance.treasure },
  ];

  const hasAppearance = appearanceFields.some((f) => f.value.trim());
  if (hasAppearance) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text("Appearance & Bio", margin, y);
    y += 5;
    doc.setFontSize(9);
    appearanceFields.forEach(({ label, value }) => {
      if (!value.trim()) return;
      checkPageBreak(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(`${label}:`, margin + 4, y);
      y += 5;
      const lines = doc.splitTextToSize(value, contentWidth - 10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      lines.forEach((line: string) => {
        checkPageBreak(5);
        doc.text(line, margin + 8, y);
        y += 5;
      });
      y += 2;
    });
  }

  const embeddedJson = JSON.stringify({ version: 1, character });
  doc.setProperties?.({
    title: character.name || "DND Wizard Character",
    author: "DND Wizard",
    creator: "DND Wizard",
    producer: "DND Wizard",
    keywords: "dnd wizard character",
    subject: "DND Wizard Character Sheet",
    creationDate: new Date(),
    modDate: new Date(),
  } as any);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(1);
  const hiddenY = doc.internal.pageSize.getHeight() - 5;
  for (let i = 0; i < embeddedJson.length; i += 80) {
    const chunk = embeddedJson.slice(i, i + 80);
    doc.text(chunk, 0, hiddenY + (i / 80) * 2);
  }

  const fileName = `${(character.name || "unnamed").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "")}.pdf`;
  doc.save(fileName);
}

export async function importCharacterFromPdf(file: File): Promise<Character> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import("pdfjs-dist");
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let embeddedJson: string | null = null;

  try {
    const metadata = await pdf.getMetadata();
    const info = (metadata as any)?.info ?? {};
    const candidate =
      info?.[DND_WIZARD_MARKER] ??
      info?.["dnd-wizard-character"] ??
      null;
    if (typeof candidate === "string") {
      embeddedJson = candidate;
    }
  } catch {
    // ignore metadata read errors
  }

  if (!embeddedJson) {
    try {
      const firstPage = await pdf.getPage(1);
      const textContent = await firstPage.getTextContent();
      const fullText = textContent.items.map((item: any) => item.str).join("\n");
      const markerIndex = fullText.indexOf(DND_WIZARD_MARKER);
      if (markerIndex !== -1) {
        const afterMarker = fullText.slice(markerIndex + DND_WIZARD_MARKER.length);
        embeddedJson = afterMarker.replace(/[^\x20-\x7e]/g, "").trim();
      }
    } catch {
      // ignore text extraction errors
    }
  }

  if (!embeddedJson) {
    throw new Error("NO_DND_WIZARD_DATA");
  }

  const parsed = JSON.parse(embeddedJson) as { version: number; character: Character };
  if (!parsed.character) {
    throw new Error("NO_DND_WIZARD_DATA");
  }

  return parsed.character;
}
