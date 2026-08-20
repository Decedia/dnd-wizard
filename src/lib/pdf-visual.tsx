"use client";

import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { CharacterSheetPrint } from "@/components/character-sheet/CharacterSheetPrint";
import type { Character } from "./storage";

export async function exportCharacterToPdf(character: Character): Promise<void> {
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1;pointer-events:none;";
  document.body.appendChild(container);

  let root: ReturnType<typeof createRoot> | null = null;

  try {
    root = createRoot(container);
    root.render(<CharacterSheetPrint character={character} />);

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const pageElements = Array.from(container.querySelectorAll("[data-print-page]")) as HTMLElement[];
    if (pageElements.length === 0) {
      throw new Error("No print pages found");
    }

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    }

    const embeddedJson = JSON.stringify({ version: 1, character });
    pdf.setProperties?.({
      title: character.name || "DND Wizard Character",
      author: "DND Wizard",
      creator: "DND Wizard",
      producer: "DND Wizard",
      keywords: "dnd wizard character",
      subject: "DND Wizard Character Sheet",
      creationDate: new Date(),
      modDate: new Date(),
    } as any);

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(1);
    const hiddenY = pdf.internal.pageSize.getHeight() - 5;
    for (let i = 0; i < embeddedJson.length; i += 80) {
      const chunk = embeddedJson.slice(i, i + 80);
      pdf.text(chunk, 0, hiddenY + (i / 80) * 2);
    }

    const fileName = `${(character.name || "unnamed").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "")}.pdf`;
    pdf.save(fileName);
  } finally {
    if (root) {
      root.unmount();
    }
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}
