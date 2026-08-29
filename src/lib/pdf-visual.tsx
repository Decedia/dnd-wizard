"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Character } from "./storage";

async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });
}

function addCanvasToPdf(pdf: jsPDF, canvas: HTMLCanvasElement, isFirstPage: boolean): boolean {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  if (!isFirstPage) {
    pdf.addPage();
  }

  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    return false;
  }

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
  return false;
}

export async function exportCharacterToPdf(_character: Character): Promise<void> {
  const allSectionElements = Array.from(document.querySelectorAll("[data-pdf-section]")) as HTMLElement[];
  if (allSectionElements.length === 0) {
    throw new Error("No PDF sections found");
  }

  const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]")) as HTMLElement[];
  const sectionsToCapture: HTMLElement[] = [];

  if (tabPanels.length > 0) {
    for (const panel of tabPanels) {
      const originalDisplay = panel.style.display;
      panel.style.display = "block";
      const sections = Array.from(panel.querySelectorAll("[data-pdf-section]")) as HTMLElement[];
      sectionsToCapture.push(...sections);
      panel.style.display = originalDisplay;
    }
  } else {
    const visibleSections = allSectionElements.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    sectionsToCapture.push(...visibleSections);
  }

  if (sectionsToCapture.length === 0) {
    throw new Error("No visible PDF sections found");
  }

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let isFirstPage = true;

  for (const sectionEl of sectionsToCapture) {
    const canvas = await captureElement(sectionEl);
    isFirstPage = addCanvasToPdf(pdf, canvas, isFirstPage);
  }

  const fileName = `${(_character.name || "unnamed").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "")}.pdf`;
  pdf.save(fileName);
}


