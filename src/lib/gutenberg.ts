export type ParsedBook = {
  gutenbergId: number;
  title: string;
  author: string;
  language: string;
  chapters: Chapter[];
};

export type Chapter = {
  index: number;    // 0-based
  title: string;
  passages: string[];  // paragraph-level passages (~200–600 chars)
};

const GUTENBERG_BASE = "https://www.gutenberg.org/cache/epub";

// Fetch raw .txt from Project Gutenberg
export async function fetchGutenbergText(gutenbergId: number): Promise<string> {
  const url = `${GUTENBERG_BASE}/${gutenbergId}/pg${gutenbergId}.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gutenberg fetch failed: ${res.status} — ${url}`);
  return res.text();
}

// Strip the standard Gutenberg header/footer boilerplate
function stripBoilerplate(raw: string): string {
  const startMarker = /\*{3}\s*START OF (THIS|THE) PROJECT GUTENBERG/i;
  const endMarker = /\*{3}\s*END OF (THIS|THE) PROJECT GUTENBERG/i;

  const startMatch = startMarker.exec(raw);
  const endMatch = endMarker.exec(raw);

  const body = raw.slice(
    startMatch ? startMatch.index + startMatch[0].length : 0,
    endMatch ? endMatch.index : raw.length
  );
  return body.trim();
}

// Extract metadata from the header block (before START marker)
function extractMeta(raw: string): { title: string; author: string; language: string } {
  const header = raw.slice(0, 3000);

  const title =
    /^Title:\s*(.+)$/im.exec(header)?.[1]?.trim() ?? "Unknown Title";
  const author =
    /^Author:\s*(.+)$/im.exec(header)?.[1]?.trim() ?? "Unknown Author";
  const language =
    /^Language:\s*(.+)$/im.exec(header)?.[1]?.trim().toLowerCase() ?? "en";

  return { title, author, language };
}

// Split body into chapters by common heading patterns
function splitIntoChapters(body: string): { title: string; text: string }[] {
  // Matches: CHAPTER I, Chapter 1, PART ONE, I., II., etc.
  const chapterRe = /^(chapter\s+[\divxlc]+[^\n]*|part\s+[\divxlc\w]+[^\n]*|[ivxlc]{1,5}\.\s*[^\n]*)/im;

  const lines = body.split(/\r?\n/);
  const chapters: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (chapterRe.test(line.trim()) && line.trim().length < 80) {
      if (current) chapters.push(current);
      current = { title: line.trim(), lines: [] };
    } else {
      if (!current) current = { title: "Preface", lines: [] };
      current.lines.push(line);
    }
  }
  if (current) chapters.push(current);

  // If no chapter headings found, treat whole book as one chapter
  if (chapters.length === 0) {
    return [{ title: "Full Text", text: body }];
  }

  return chapters.map((c) => ({ title: c.title, text: c.lines.join("\n") }));
}

// Split chapter text into ~300-char passages (split at paragraph boundaries)
function splitIntoPassages(text: string, minLen = 100, maxLen = 600): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= minLen);

  const passages: string[] = [];
  let buffer = "";

  for (const para of paragraphs) {
    if (buffer.length + para.length > maxLen && buffer.length > 0) {
      passages.push(buffer.trim());
      buffer = "";
    }
    buffer += (buffer ? " " : "") + para;
    if (buffer.length >= maxLen) {
      passages.push(buffer.trim());
      buffer = "";
    }
  }
  if (buffer.trim().length >= minLen) passages.push(buffer.trim());

  return passages;
}

export function parseGutenbergText(raw: string, gutenbergId: number): ParsedBook {
  const meta = extractMeta(raw);
  const body = stripBoilerplate(raw);
  const rawChapters = splitIntoChapters(body);

  const chapters: Chapter[] = rawChapters.map((c, i) => ({
    index: i,
    title: c.title,
    passages: splitIntoPassages(c.text),
  }));

  return {
    gutenbergId,
    ...meta,
    chapters,
  };
}

// Convenience: fetch + parse in one call
export async function loadGutenbergBook(gutenbergId: number): Promise<ParsedBook> {
  const raw = await fetchGutenbergText(gutenbergId);
  return parseGutenbergText(raw, gutenbergId);
}
