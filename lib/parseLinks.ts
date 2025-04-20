// lib/parseLinks.ts

/**
 * Extracts wiki-style links ([[Link Target]] or [[Link Target|Display Text]]) from markdown text.
 *
 * @param markdown The markdown string to parse.
 * @returns An array of objects, each containing the full match, target, and display text (if any).
 */
export function extractWikiLinks(markdown: string): { match: string; target: string; display: string }[] {
  // Regex Explanation:
  // \[\[       - Match the opening double square brackets
  // ([^\]|]+) - Capture Group 1 (target): Match one or more characters that are NOT ']' or '|'
  // (?:        - Start non-capturing group for the optional display text part
  //   \|       - Match the pipe separator
  //   ([^\]]+) - Capture Group 2 (display): Match one or more characters that are NOT ']'
  // )?         - End non-capturing group, make it optional (?)
  // \]\]       - Match the closing double square brackets
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const matches = [...markdown.matchAll(regex)];

  return matches.map((m) => ({
    match: m[0], // The full [[link|display]]
    target: m[1].trim(), // The target part, trimmed
    display: m[2] ? m[2].trim() : m[1].trim(), // The display part (trimmed), or the target part if no display text
  }));
}

// Example Usage:
// const text = "This is a link to [[Some Page]]. Here's one with display text [[Another Page|Click Here]].";
// const links = extractWikiLinks(text);
// console.log(links);
// Output:
// [
//   { match: '[[Some Page]]', target: 'Some Page', display: 'Some Page' },
//   { match: '[[Another Page|Click Here]]', target: 'Another Page', display: 'Click Here' }
// ]