import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(headers?: Record<string, string>) {
  return new Headers({ "content-type": "application/json; charset=utf-8", ...(headers || {}) });
}

function assertHttpUrl(input: string): string {
  try {
    const u = new URL(input);
    if (!/^https?:$/.test(u.protocol)) throw new Error("Invalid protocol");
    return u.toString();
  } catch {
    throw new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400, headers: json() });
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response(JSON.stringify({ error: "Missing url" }), { status: 400, headers: json() });

  let target: string;
  try {
    target = assertHttpUrl(url);
  } catch (resp) {
    return resp as Response;
  }

  const res = await fetch(target, {
    redirect: "follow",
    headers: {
      // Some sites return nicer OG tags with a desktop UA
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Safari/537.36 UofGJobTracker/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: `Upstream ${res.status}` }), { status: 502, headers: json() });
  }

  const html = await res.text();

  const take = (re: RegExp) => (html.match(re)?.[1] || "").trim();
  const stripTags = (s: string) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  // Open Graph / meta fallbacks
  const ogTitle = take(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const ogSite = take(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const title = take(/<title[^>]*>([^<]+)<\/title>/i);
  const metaDesc = take(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);

  // Try to find a JSON-LD JobPosting block (most ATS pages have one)
  let jobld: Record<string, unknown> | null = null;
  const ldBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of ldBlocks) {
    const jsonText = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(jsonText);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of arr) {
        const t = (node as Record<string, unknown>)["@type"] ?? (node as Record<string, unknown>).type;
        const types = Array.isArray(t) ? t.map(String) : [String(t || "")];
        if (types.some((x) => x.toLowerCase().includes("jobposting"))) {
          jobld = node as Record<string, unknown>;
          break;
        }
      }
      if (jobld) break;
    } catch {
      // ignore bad JSON-LD blocks
    }
  }

  // Heuristic company from hostname if nothing better
  const hostname = new URL(target).hostname.replace(/^www\./, "");
  const companyFromHost = hostname
    .split(".")
    .slice(0, -1)
    .join(" ")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Build best-guess output
  const hiringOrg = jobld?.["hiringOrganization"] as Record<string, unknown> | undefined;
const company =
  typeof hiringOrg?.name === "string"
    ? hiringOrg.name
    : typeof ogSite === "string"
    ? ogSite
    : companyFromHost;

const out = {
  portal: target,
  position: String(jobld?.["title"] ?? ogTitle ?? title ?? "").trim(),
  company: String(company ?? "").trim(),
  details: stripTags(String(jobld?.["description"] ?? metaDesc ?? "")),
  deadline: String(jobld?.["validThrough"] ?? jobld?.["datePosted"] ?? "").slice(0, 10) || null,
};

  return new Response(JSON.stringify(out), { status: 200, headers: json() });
}
