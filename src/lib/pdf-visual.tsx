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
        windowWidth: pageEl.scrollWidth,
        windowHeight: pageEl.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (i > 0) pdf.addPage();

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      } else {
        let remainingHeight = imgHeight;
        let sourceY = 0;
        const sourceHeight = canvas.height;
        const sourceWidth = canvas.width;

        while (remainingHeight > 0) {
          const destHeight = Math.min(remainingHeight, pageHeight);
          const sourceSliceHeight = (destHeight / imgHeight) * sourceHeight;

          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = sourceWidth;
          sliceCanvas.height = sourceSliceHeight;
          const ctx = sliceCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, sourceY, sourceWidth, sourceSliceHeight,
              0, 0, sourceWidth, sourceSliceHeight
            );
            const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
            pdf.addImage(sliceData, "JPEG", 0, 0, imgWidth, destHeight);
          }

          remainingHeight -= destHeight;
          sourceY += sourceSliceHeight;

          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }
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
