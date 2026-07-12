// Hand-rolled CSV parser — no dependency. Handles quoted fields with embedded
// commas, escaped double quotes (""), CRLF/LF line endings, and skips fully
// empty lines. Good enough for the logbook exports fleets actually produce.

/** Parse raw CSV text into a grid of string cells (headers included as row 0). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRow = () => {
    pushField();
    // Skip fully-empty lines (a blank line parses as a single blank field).
    if (!(row.length === 1 && row[0].trim() === "")) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      pushField();
      continue;
    }

    if (char === "\r") {
      // A \r\n pair is one line break; let the \n do the pushing.
      if (text[i + 1] === "\n") continue;
      pushRow();
      continue;
    }

    if (char === "\n") {
      pushRow();
      continue;
    }

    field += char;
  }

  // Trailing field/row when the text doesn't end with a line break.
  if (field !== "" || row.length > 0) {
    pushRow();
  }

  return rows;
}

/**
 * First row = headers. Returns one object per remaining row, keyed by the
 * original trimmed header text (case preserved) — use `pick()` to read
 * values off these objects by alias, case/format-insensitively.
 */
export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      if (header) obj[header] = (row[i] ?? "").trim();
    });
    return obj;
  });
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_]+/g, "");
}

/**
 * Look up a value on a row object by one or more aliases, matching keys
 * case-insensitively and ignoring spaces/underscores — so "Reg Number",
 * "regNumber" and "reg_number" all match alias "regnumber". Returns
 * undefined if no header matches or the matched cell is blank.
 */
export function pick(obj: Record<string, string>, ...aliases: string[]): string | undefined {
  const wanted = aliases.map(normalizeKey);
  for (const [key, value] of Object.entries(obj)) {
    if (wanted.includes(normalizeKey(key))) {
      return value.trim() === "" ? undefined : value;
    }
  }
  return undefined;
}
