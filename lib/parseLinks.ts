// lib/parseLinks.ts
export function extractWikiLinks(markdown: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches = [...markdown.matchAll(regex)];
  return matches.map((m) => m[1]);
}
