// src/utils/io.ts
// Dumb, dependable import/export helpers for Job rows.
// No UI, no state, just pure functions + a couple of browser utilities.

import type { JobRow, JobStatus } from "@/types/job";

/* =========================
   File helpers
   ========================= */

export function downloadBlob(data: BlobPart, filename: string, type = "application/octet-stream") {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(String(fr.result ?? ""));
    fr.readAsText(file);
  });
}

/* =========================
   JSON
   ========================= */

export function exportToJSON(rows: JobRow[]) {
  const pretty = JSON.stringify(rows, null, 2);
  downloadBlob(pretty, `uofg-jobs-${new Date().toISOString().slice(0,10)}.json`, "application/json");
}

export async function importFromJSON(file: File): Promise<JobRow[]> {
  const text = await readFileAsText(file);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file.");
  }
  if (!Array.isArray(parsed)) throw new Error("JSON must be an array of job rows.");
  const rows = parsed.map(validateRow);
  ensureUniqueIds(rows);
  return rows;
}

/* =========================
   CSV
   ========================= */

// CSV columns in fixed order. Keep in sync across parse/serialize.
const CSV_HEADERS = [
  "id",
  "company",
  "position",
  "dateApplied",
  "deadline",
  "status",
  "details",
  "portal",
  "resumeVersion",
] as const;

type CsvHeaders = typeof CSV_HEADERS[number];

export function exportToCSV(rows: JobRow[]) {
  const header = CSV_HEADERS.join(",");
  const lines = rows.map((r) => {
    const record: Record<CsvHeaders, string | undefined> = {
      id: r.id,
      company: r.company,
      position: r.position,
      dateApplied: r.dateApplied,
      deadline: r.deadline,
      status: r.status,
      details: r.details,
      portal: r.portal,
      resumeVersion: r.resumeVersion,
    };
    return CSV_HEADERS.map((k) => csvEscape(record[k] ?? "")).join(",");
  });
  const csv = [header, ...lines].join("\r\n");
  downloadBlob(csv, `uofg-jobs-${new Date().toISOString().slice(0,10)}.csv`, "text/csv;charset=utf-8");
}

export async function importFromCSV(file: File): Promise<JobRow[]> {
  const text = await readFileAsText(file);
  // naive split that still handles quoted fields via regex parse per line
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error("CSV is empty.");
  const header = rows[0];
  // header validation (order-insensitive but we map by name)
  const missing = CSV_HEADERS.filter((h) => !header.includes(h));
  if (missing.length) {
    throw new Error(`CSV missing required column(s): ${missing.join(", ")}`);
  }
  const indices: Record<CsvHeaders, number> = {} as any;
  CSV_HEADERS.forEach((h) => {
    indices[h] = header.indexOf(h);
  });

  const out: JobRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 1 && row[0] === "") continue; // skip blank lines
    const obj: Partial<JobRow> = {
      id: row[indices.id] || crypto.randomUUID(),
      company: row[indices.company],
      position: row[indices.position],
      dateApplied: emptyToUndef(row[indices.dateApplied]),
      deadline: emptyToUndef(row[indices.deadline]),
      status: row[indices.status] as JobStatus,
      details: emptyToUndef(row[indices.details]),
      portal: emptyToUndef(row[indices.portal]),
      resumeVersion: emptyToUndef(row[indices.resumeVersion]),
    };
    out.push(validateRow(obj));
  }
  ensureUniqueIds(out);
  return out;
}

/* =========================
   Validation
   ========================= */

function validateRow(raw: unknown): JobRow {
  if (!raw || typeof raw !== "object") throw new Error("Row is not an object.");
  const r = raw as Partial<JobRow>;
  if (!r.company || !r.position) throw new Error("Row missing required fields: company and position.");
  const id = r.id ?? crypto.randomUUID();
  const status = normalizeStatus(r.status);
  // very light date sanity (YYYY-MM-DD or empty)
  const dateApplied = normalizeDate(r.dateApplied);
  const deadline = normalizeDate(r.deadline);
  return {
    id,
    company: String(r.company).trim(),
    position: String(r.position).trim(),
    dateApplied,
    deadline,
    status,
    details: r.details ? String(r.details) : undefined,
    portal: r.portal ? String(r.portal) : undefined,
    resumeVersion: r.resumeVersion ? String(r.resumeVersion) : undefined,
  };
}

function normalizeStatus(s: unknown): JobStatus {
  const allowed: JobStatus[] = ["saved","submitted","in_progress","interview","offer","rejected"];
  if (typeof s !== "string") return "saved";
  const v = s.trim().toLowerCase().replace(" ", "_") as JobStatus;
  return (allowed as string[]).includes(v) ? (v as JobStatus) : "saved";
}

function normalizeDate(d: unknown): string | undefined {
  if (!d) return undefined;
  const s = String(d).trim();
  if (!s) return undefined;
  // Accept ISO date/time; normalize to YYYY-MM-DD if possible
  try {
    const dt = new Date(s);
    // invalid date yields NaN
    if (isNaN(dt.getTime())) return undefined;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return undefined;
  }
}

function ensureUniqueIds(rows: JobRow[]) {
  const seen = new Set<string>();
  rows.forEach((r) => {
    if (!r.id || seen.has(r.id)) r.id = crypto.randomUUID();
    seen.add(r.id);
  });
}

/* =========================
   CSV parsing/escaping
   ========================= */

// escape per RFC4180-ish: wrap in quotes if contains comma, quote or newline; double quotes inside
function csvEscape(val: string) {
  if (/[",\r\n]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function emptyToUndef(s?: string) {
  if (s == null) return undefined;
  const t = String(s).trim();
  return t === "" ? undefined : t;
}

// Very small CSV parser. Handles quoted fields with commas and newlines.
// Not a full RFC parser because we’re not parsing a novel.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0, cur = "", row: string[] = [];
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"'; // escaped quote
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        cur += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ",") {
        row.push(cur);
        cur = "";
        i++;
        continue;
      }
      if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        i++;
        continue;
      }
      if (ch === "\r") {
        // handle CRLF
        if (text[i + 1] === "\n") i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        i++;
        continue;
      }
      cur += ch;
      i++;
    }
  }
  // flush last cell
  row.push(cur);
  rows.push(row);
  return rows;
}
