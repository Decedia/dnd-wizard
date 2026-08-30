"use client";

import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { CharacterSheetPrint } from "@/components/character-sheet/CharacterSheetPrint";
import type { Character } from "./storage";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 12;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;

export async function exportCharacterToPdf(character: Character): Promise<void> {
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-99999px;top:0;pointer-events:none;opacity:0;";
  document.body.appendChild(container);

  let root: ReturnType<typeof createRoot> | null = null;

  try {
    root = createRoot(container);
    root.render(<CharacterSheetPrint character={character} />);

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 500))));

    const pages = Array.from(container.querySelectorAll("[data-pdf-page]")) as HTMLElement[];
    if (pages.length === 0) {
      throw new Error("No print pages found");
    }

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: pageEl.scrollWidth,
        windowHeight: pageEl.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const imgWidth = CONTENT_WIDTH_MM;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "PNG", MARGIN_MM, MARGIN_MM, imgWidth, imgHeight);
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
