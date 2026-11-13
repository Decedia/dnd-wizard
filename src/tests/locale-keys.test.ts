// @ts-ignore - bun:test is provided by the Bun runtime
import { expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

// A key written twice in a locale file silently keeps only the last value,
// so an edit to the first copy never shows. Each key must appear once.
for (const file of ["en.js", "id.js"]) {
  test(`${file} has no key written twice`, () => {
    const text = readFileSync(join(process.cwd(), "src/locales", file), "utf8");
    const keys = [...text.matchAll(/^ {2}"((?:[^"\\]|\\.)+)":/gm)].map((m) => m[1]);
    const seen = new Set<string>();
    const twice = keys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
    expect(twice).toEqual([]);
  });
}
