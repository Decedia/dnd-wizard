import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRD_STRINGS_ID = path.join(__dirname, "..", "src", "locales", "srd-strings-id.json");
const CLASSES_ID = path.join(__dirname, "..", "src", "data", "id", "2014_classes.json");

// Load translations
const translations = JSON.parse(fs.readFileSync(SRD_STRINGS_ID, "utf-8"));

// Load classes
const classesData = JSON.parse(fs.readFileSync(CLASSES_ID, "utf-8"));

// Find Artificer
const artificer = classesData.classes.find(c => c.name === "Artificer");
if (!artificer) {
  console.log("Artificer not found!");
  process.exit(1);
}

// Find the feature
for (const level of artificer.levels) {
  if (!level.features) continue;
  for (const feature of level.features) {
    if (feature.name === "The Right Tool for the Job") {
      console.log("Feature found:", feature.name);
      console.log("book:", feature.book);
      console.log("isEGW:", feature.book === "EGW");
      
      const className = artificer.name;
      const isEGW = feature.book === "EGW";
      const baseKey = `2014_classes.${className.toLowerCase()}`;
      const prefix = isEGW ? `${baseKey}.egw` : baseKey;
      
      // Try multiple key variations (handle "The ", "A ", "An " prefixes)
      const featKeys = [
        feature.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        feature.name.toLowerCase().replace(/^(the|a|an)\s+/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      ];
      
      // Check for description
      let foundDesc = false;
      for (const featKey of featKeys) {
        const descKey = `${prefix}.${featKey}.description`;
        console.log("Trying:", descKey, "->", !!translations[descKey]);
        if (translations[descKey]) {
          console.log("FOUND translation:", translations[descKey].substring(0, 100));
          foundDesc = true;
          break;
        }
      }
      
      // Check for summary
      for (const featKey of featKeys) {
        const summaryKey = `${prefix}.${featKey}.summary`;
        console.log("Trying summary:", summaryKey, "->", !!translations[summaryKey]);
        if (translations[summaryKey]) {
          console.log("FOUND summary:", translations[summaryKey].substring(0, 100));
          break;
        }
      }
    }
  }
}