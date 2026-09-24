import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRD_STRINGS_ID = path.join(__dirname, "..", "src", "locales", "srd-strings-id.json");
const CLASSES_ID = path.join(__dirname, "..", "src", "data", "id", "2014_classes.json");
const SUBCLASSES_ID = path.join(__dirname, "..", "src", "data", "id", "2014_subclasses.json");

// Load translations
const translations = JSON.parse(fs.readFileSync(SRD_STRINGS_ID, "utf-8"));

// Helper to find and update feature in class data
function updateClassFeatures(classData, translations) {
  if (!classData.levels) return classData;
  
  for (const level of classData.levels) {
    if (!level.features) continue;
    for (const feature of level.features) {
      const featureName = feature.name;
      const className = classData.name;
      const isEGW = feature.book === "EGW";
      
      // Build possible translation keys
      const baseKey = `2014_classes.${className.toLowerCase()}`;
      const prefix = isEGW ? `${baseKey}.egw` : baseKey;
      
      // Try multiple key variations (handle "The ", "A ", "An " prefixes)
      const featKeys = [
        featureName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        featureName.toLowerCase().replace(/^(the|a|an)\s+/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      ];
      
      // Check for description
      let foundDesc = false;
      for (const featKey of featKeys) {
        const descKey = `${prefix}.${featKey}.description`;
        if (translations[descKey]) {
          feature.description = translations[descKey];
          foundDesc = true;
          break;
        }
      }
      
      // Check for summary
      for (const featKey of featKeys) {
        const summaryKey = `${prefix}.${featKey}.summary`;
        if (translations[summaryKey]) {
          feature.summary = translations[summaryKey];
          break;
        }
      }
    }
  }
  
  // Also update class-level features
  if (classData.features) {
    for (const feature of classData.features) {
      const featureName = feature.name;
      const isEGW = feature.book === "EGW";
      const baseKey = `2014_classes.${classData.name.toLowerCase()}`;
      const prefix = isEGW ? `${baseKey}.egw` : baseKey;
      
      const featKeys = [
        featureName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        featureName.toLowerCase().replace(/^(the|a|an)\s+/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      ];
      
      for (const featKey of featKeys) {
        const descKey = `${prefix}.${featKey}.description`;
        if (translations[descKey]) {
          feature.description = translations[descKey];
          break;
        }
      }
      for (const featKey of featKeys) {
        const summaryKey = `${prefix}.${featKey}.summary`;
        if (translations[summaryKey]) {
          feature.summary = translations[summaryKey];
          break;
        }
      }
    }
  }
  
  // Update flavorText
  const flavorKey = `2014_classes.${classData.name.toLowerCase()}.flavorText`;
  const flavorEgwKey = `2014_classes.${classData.name.toLowerCase()}.egw.flavorText`;
  if (translations[flavorKey]) classData.flavorText = translations[flavorKey];
  if (translations[flavorEgwKey]) classData.flavorText = translations[flavorEgwKey];
  
  return classData;
}

// Helper to update subclass features
function updateSubclassFeatures(subclassData, translations) {
  if (!subclassData.features) return subclassData;
  
  for (const feature of subclassData.features) {
    const featureName = feature.name;
    const className = subclassData.class;
    
    const baseKey = `2014_subclasses.${subclassData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    
    const keys = [
      `${baseKey}.${featureName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.description`,
      `${baseKey}.${featureName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.summary`,
    ];
    
    for (const key of keys) {
      if (translations[key] && key.endsWith(".description")) {
        feature.description = translations[key];
        break;
      }
    }
    for (const key of keys) {
      if (translations[key] && key.endsWith(".summary")) {
        feature.summary = translations[key];
        break;
      }
    }
  }
  
  // Update subclass description
  const descKey = `2014_subclasses.${subclassData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.description`;
  if (translations[descKey]) subclassData.description = translations[descKey];
  
  return subclassData;
}

// Update classes
const classesData = JSON.parse(fs.readFileSync(CLASSES_ID, "utf-8"));
for (const classData of classesData.classes) {
  updateClassFeatures(classData, translations);
}
fs.writeFileSync(CLASSES_ID, JSON.stringify(classesData, null, 2));
console.log("Updated 2014_classes.json");

// Update subclasses
const subclassesData = JSON.parse(fs.readFileSync(SUBCLASSES_ID, "utf-8"));
for (const subclassData of subclassesData.subclasses) {
  updateSubclassFeatures(subclassData, translations);
}
fs.writeFileSync(SUBCLASSES_ID, JSON.stringify(subclassesData, null, 2));
console.log("Updated 2014_subclasses.json");

console.log("Done! Translations synced to main data files.");