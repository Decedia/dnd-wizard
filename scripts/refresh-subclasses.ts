import https from "https";
import fs from "fs";
import path from "path";

const DND5E_API = "https://www.dnd5eapi.co/api/2014";

function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "DND-Character-Builder/1.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Failed to parse JSON from ${url}`));
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  console.log("Fetching classes from API...");
  const classesList = await fetchJSON(`${DND5E_API}/classes`);
  const classes = await Promise.all(
    classesList.results.map((c: any) => fetchJSON(`https://www.dnd5eapi.co${c.url}`))
  );

  console.log(`Fetched ${classes.length} classes`);

  const classIndexToName = new Map<string, string>();
  const subclassMeta = new Map<string, { classIndex: string; name: string; flavorText: string; desc: string[] }>();
  const subclassLevelUrls = new Map<string, string>();

  for (const cls of classes) {
    classIndexToName.set(cls.index, cls.name);
    for (const sub of cls.subclasses || []) {
      const subRaw = await fetchJSON(`https://www.dnd5eapi.co${sub.url}`);
      subclassMeta.set(sub.index, {
        classIndex: cls.index,
        name: subRaw.name,
        flavorText: subRaw.subclass_flavor || "",
        desc: Array.isArray(subRaw.desc) ? subRaw.desc : [subRaw.desc || ""],
      });
      if (subRaw.subclass_levels) {
        subclassLevelUrls.set(sub.index, `https://www.dnd5eapi.co${subRaw.subclass_levels}`);
      }
    }
  }

  console.log(`Fetching levels for ${subclassLevelUrls.size} subclasses...`);
  const subclassLevelEntries = await Promise.all(
    [...subclassLevelUrls.entries()].map(async ([subIndex, url]) => {
      const levels = await fetchJSON(url);
      return { subIndex, levels };
    })
  );

  const featureUrlsToFetch: { url: string; subIndex: string; level: number }[] = [];
  const subclassFeaturesMap = new Map<string, { level: number; featureUrl: string }[]>();

  for (const { subIndex, levels } of subclassLevelEntries) {
    const features: { level: number; featureUrl: string }[] = [];
    for (const lvl of levels) {
      for (const f of lvl.features || []) {
        if (f.url) {
          features.push({ level: lvl.level, featureUrl: `https://www.dnd5eapi.co${f.url}` });
          featureUrlsToFetch.push({ url: `https://www.dnd5eapi.co${f.url}`, subIndex, level: lvl.level });
        }
      }
    }
    subclassFeaturesMap.set(subIndex, features);
  }

  console.log(`Fetching ${featureUrlsToFetch.length} feature details...`);
  const featureDetailsMap = new Map<string, any>();
  await Promise.all(
    featureUrlsToFetch.map(async ({ url }) => {
      const detail = await fetchJSON(url);
      featureDetailsMap.set(url, detail);
    })
  );

  const subclassMap = new Map<string, any>();
  for (const [subIndex, levels] of subclassFeaturesMap.entries()) {
    const features = levels
      .map(({ level, featureUrl }) => {
        const detail = featureDetailsMap.get(featureUrl);
        if (!detail) return null;
        return {
          name: detail.name,
          description: Array.isArray(detail.desc) ? detail.desc : [detail.desc || ""],
          level,
        };
      })
      .filter(Boolean);

    const meta = subclassMeta.get(subIndex);
    subclassMap.set(subIndex, {
      class: classIndexToName.get(meta?.classIndex || "") || "",
      classIndex: meta?.classIndex || "",
      index: subIndex,
      name: meta?.name || "",
      flavorText: meta?.flavorText || "",
      description: meta?.desc || [],
      features,
    });
  }

  const outputDir = path.join(process.cwd(), "src", "data");
  fs.mkdirSync(outputDir, { recursive: true });

  const existingSubclassesPath = path.join(outputDir, "2014_subclasses.json");
  let existingSubclasses: any = { subclasses: [] };
  if (fs.existsSync(existingSubclassesPath)) {
    try {
      existingSubclasses = JSON.parse(fs.readFileSync(existingSubclassesPath, "utf-8"));
    } catch {}
  }

  const existingSubclassMap = new Map<string, any>();
  for (const sub of existingSubclasses.subclasses || []) {
    existingSubclassMap.set(sub.index, sub);
  }

  const mergedSubclasses = Array.from(existingSubclassMap.entries()).map(([index, existing]) => {
    const apiData = subclassMap.get(index);
    if (apiData && apiData.features.length > 0) {
      return apiData;
    }
    return existing;
  });

  for (const [index, apiData] of subclassMap.entries()) {
    if (!existingSubclassMap.has(index)) {
      mergedSubclasses.push(apiData);
    }
  }

  const subclassesPath = path.join(outputDir, "2014_subclasses.json");
  const subclassesOutput = {
    generated: new Date().toISOString(),
    total: mergedSubclasses.length,
    subclasses: mergedSubclasses,
  };
  fs.writeFileSync(subclassesPath, JSON.stringify(subclassesOutput, null, 2) + "\n");
  console.log(`Wrote ${mergedSubclasses.length} subclasses to ${subclassesPath}`);

  const classesPath = path.join(outputDir, "2014_classes.json");
  const classesRaw = JSON.parse(fs.readFileSync(classesPath, "utf-8"));
  const updatedClasses = classesRaw.classes.map((cls: any) => {
    const subList = (cls.subclasses || []).map((sub: any) => {
      const apiData = subclassMap.get(sub.index);
      if (apiData && apiData.features.length > 0) {
        return {
          name: apiData.name,
          description: apiData.description,
          features: apiData.features,
        };
      }
      return sub;
    });

    return {
      ...cls,
      subclasses: subList,
    };
  });

  const classesOutput = { ...classesRaw, classes: updatedClasses };
  fs.writeFileSync(classesPath, JSON.stringify(classesOutput, null, 2) + "\n");
  console.log(`Updated subclass data in ${classesPath}`);

  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
