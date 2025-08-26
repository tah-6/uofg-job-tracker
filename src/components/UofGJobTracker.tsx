"use client";

import React, { useMemo, useState } from "react";

/**main
 * UofG Job Tracker – Spreadsheet-style UI
 * - Mirrors your sheet: header counts + simple table with filters
 * - Pure React + Tailwind (drop into Next.js / CRA and it runs)
 * - Replace mockData with your DB results when ready
 */

// ----- Types -----
export type JobStatus =
  | "submitted"
  | "in_progress"
  | "interview"
  | "offer"
  | "rejected"
  | "saved";

export interface JobRow {
  id: string;
  company: string;
  position: string;
  dateApplied?: string; // ISO or YYYY-MM-DD
  deadline?: string; // YYYY-MM-DD for sorting/highlighting
  status: JobStatus;
  details?: string; // notes
  portal?: string; // URL
  resumeVersion?: string; // e.g., resume_v3.pdf
}

// ----- Mock Data (swap out later) -----
const mockData: JobRow[] = [
  {
    id: "1",
    company: "Rockwell Automation",
    position: "Manufacturing/Embedded Co-op",
    dateApplied: "2025-09-20",
    deadline: "2025-09-25",
    status: "submitted",
    details: "Resume v3, Cover v2",
    portal: "https://careers.rockwellautomation.com/",
  },
  {
    id: "2",
    company: "Linamar",
    position: "Controls Engineering Intern",
    dateApplied: "2025-09-18",
    deadline: "2025-09-28",
    status: "in_progress",
    details: "Recruiter reply pending",
    portal: "https://www.linamar.com/careers",
  },
  {
    id: "3",
    company: "BlackBerry QNX",
    position: "Software Co-op (C/C++)",
    dateApplied: "2025-09-15",
    deadline: "2025-09-30",
    status: "interview",
    details: "Phone screen booked 09/24",
    portal: "https://blackberry.qnx.com/",
  },
  {
    id: "4",
    company: "Waterloo Startup Inc.",
    position: "Full-stack Intern",
    dateApplied: "2025-09-10",
    deadline: "2025-09-22",
    status: "rejected",
    details: "Generic rejection (ghosted)",
    portal: "https://example.com",
  },
  {
    id: "5",
    company: "Magna",
    position: "Automation Co-op",
    dateApplied: "2025-09-12",
    deadline: "2025-09-27",
    status: "offer",
    details: "Offer pending signature",
    portal: "https://www.magna.com/careers",
  },
  {
    id: "6",
    company: "Shopify",
    position: "Backend Developer Intern",
    dateApplied: "2025-09-11",
    deadline: "2025-09-29",
    status: "saved",
    details: "Needs custom resume v4",
    portal: "https://www.shopify.com/careers",
  },
];

const STATUS_LABEL: Record<JobStatus, string> = {
  saved: "Saved",
  submitted: "Submitted",
  in_progress: "In Progress",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<JobStatus, string> = {
  saved: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  interview: "bg-purple-100 text-purple-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function StatusChip({ status }: { status: JobStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function formatDate(d?: string) {
  if (!d) return "—";
  try {
    const intl = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" });
    return intl.format(new Date(d));
  } catch {
    return d;
  }
}

export default function UofGJobTracker() {
  const [rows] = useState<JobRow[]>(mockData);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");

  const counts = useMemo(() => {
    const base: Record<JobStatus, number> = {
      saved: 0,
      submitted: 0,
      in_progress: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    rows.forEach(r => { base[r.status]++; });
    return base;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter;
      const hay = `${r.company} ${r.position} ${r.details ?? ""}`.toLowerCase();
      const matchesQuery = hay.includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    }).sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
  }, [rows, statusFilter, query]);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Title + Intro */}
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Internship & Job Tracker</h1>
            <p className="text-sm text-gray-600">
              Mirror of your spreadsheet: header counts + table, but interactive.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuery(e.target.value)
              }
              placeholder="Search company, position, notes"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value as JobStatus | "all")
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Statuses</option>
              {Object.keys(STATUS_LABEL).map((k) => (
                <option key={k} value={k}>
                  {STATUS_LABEL[k as JobStatus]}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Key / Counts */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.keys(STATUS_LABEL).map((k) => {
            const st = k as JobStatus;
            return (
              <div key={k} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-xs text-gray-500">{STATUS_LABEL[st]}</div>
                <div className="mt-1 text-2xl font-semibold">{counts[st]}</div>
              </div>
            );
          })}
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "Company",
                  "Position",
                  "Date Applied",
                  "Deadline",
                  "Application Status",
                  "Details",
                  "Applicant Portal",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.company}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.position}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(row.dateApplied)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(row.deadline)}</td>
                  <td className="px-4 py-3 text-sm"><StatusChip status={row.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.details || "—"}</td>
                  <td className="px-4 py-3 text-sm text-blue-700 underline">
                    {row.portal ? (
                      <a href={row.portal} target="_blank" rel="noreferrer">Portal</a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    No rows match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Footer note */}
        <p className="text-xs text-gray-500">
          Tip: add a <span className="font-medium">Resume Version</span> column or keep it in Details to mirror your sheet exactly.
        </p>
      </div>
    </div>
  );
}
