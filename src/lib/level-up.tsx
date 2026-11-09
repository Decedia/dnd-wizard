export function normalizeDescription(description: any): string {
  if (Array.isArray(description)) {
    return description.filter(Boolean).join("\n");
  }
  return description || "";
}
