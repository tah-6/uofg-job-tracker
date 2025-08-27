"use client";

import React, { useMemo, useState, useEffect } from "react";

/* =========================
   Types
   ========================= */

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
  dateApplied?: string; // YYYY-MM-DD
  deadline?: string; // YYYY-MM-DD
  status: JobStatus;
  details?: string;
  portal?: string;
  resumeVersion?: string;
}

/* =========================
   Local persistence hook
   ========================= */

function useLocalRows<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);

  // hydrate on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // persist on change
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch {
      /* ignore */
    }
  }, [key, state]);

  return [state, setState] as const;
}

/* =========================
   Seed data (first run only)
   ========================= */

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
];

/* =========================
   UI helpers
   ========================= */

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
    const intl = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    return intl.format(new Date(d));
  } catch {
    return d;
  }
}

function isDueSoon(date?: string) {
  if (!date) return false;
  const ms = new Date(date).getTime() - Date.now();
  return ms >= 0 && ms <= 3 * 24 * 60 * 60 * 1000; // within 3 days
}

/* =========================
   Add Job Modal
   ========================= */

function AddJobModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (row: JobRow) => void;
}) {
  const [form, setForm] = useState({
    company: "",
    position: "",
    dateApplied: "",
    deadline: "",
    status: "saved" as JobStatus,
    details: "",
    portal: "",
  });

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim() || !form.position.trim()) return;
    onCreate({
      id: crypto.randomUUID(),
      company: form.company.trim(),
      position: form.position.trim(),
      dateApplied: form.dateApplied || undefined,
      deadline: form.deadline || undefined,
      status: form.status,
      details: form.details || undefined,
      portal: form.portal || undefined,
    });
    onClose();
    setForm({
      company: "",
      position: "",
      dateApplied: "",
      deadline: "",
      status: "saved",
      details: "",
      portal: "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Job</h2>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
            Close
          </button>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3">
          <input
            className="rounded border px-3 py-2"
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Position"
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              <span className="mb-1 block">Date Applied</span>
              <input
                type="date"
                className="w-full rounded border px-3 py-2"
                value={form.dateApplied}
                onChange={(e) => setForm((f) => ({ ...f, dateApplied: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              <span className="mb-1 block">Deadline</span>
              <input
                type="date"
                className="w-full rounded border px-3 py-2"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              <span className="mb-1 block">Status</span>
              <select
                className="w-full rounded border px-3 py-2"
                value={form.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm((f) => ({ ...f, status: e.target.value as JobStatus }))
                }
              >
                {(["saved", "submitted", "in_progress", "interview", "offer", "rejected"] as JobStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="rounded border px-3 py-2"
              placeholder="Portal URL"
              value={form.portal}
              onChange={(e) => setForm((f) => ({ ...f, portal: e.target.value }))}
            />
          </div>
          <textarea
            className="min-h-[80px] rounded border px-3 py-2"
            placeholder="Details / notes"
            value={form.details}
            onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
          />
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border px-3 py-2">
              Cancel
            </button>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================
   Edit Job Modal
   ========================= */

function EditJobModal({
  open,
  row,
  onClose,
  onUpdate,
}: {
  open: boolean;
  row: JobRow | null;
  onClose: () => void;
  onUpdate: (row: JobRow) => void;
}) {
  const [form, setForm] = useState({
    id: "",
    company: "",
    position: "",
    dateApplied: "",
    deadline: "",
    status: "saved" as JobStatus,
    details: "",
    portal: "",
  });

  useEffect(() => {
    if (!row) return;
    setForm({
      id: row.id,
      company: row.company ?? "",
      position: row.position ?? "",
      dateApplied: row.dateApplied ?? "",
      deadline: row.deadline ?? "",
      status: row.status,
      details: row.details ?? "",
      portal: row.portal ?? "",
    });
  }, [row]);

  if (!open || !row) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim() || !form.position.trim()) return;
    onUpdate({
      id: form.id,
      company: form.company.trim(),
      position: form.position.trim(),
      dateApplied: form.dateApplied || undefined,
      deadline: form.deadline || undefined,
      status: form.status,
      details: form.details || undefined,
      portal: form.portal || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Job</h2>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
            Close
          </button>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3">
          <input
            className="rounded border px-3 py-2"
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Position"
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              <span className="mb-1 block">Date Applied</span>
              <input
                type="date"
                className="w-full rounded border px-3 py-2"
                value={form.dateApplied}
                onChange={(e) => setForm((f) => ({ ...f, dateApplied: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-600">
              <span className="mb-1 block">Deadline</span>
              <input
                type="date"
                className="w-full rounded border px-3 py-2"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              <span className="mb-1 block">Status</span>
              <select
                className="w-full rounded border px-3 py-2"
                value={form.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm((f) => ({ ...f, status: e.target.value as JobStatus }))
                }
              >
                {(["saved", "submitted", "in_progress", "interview", "offer", "rejected"] as JobStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="rounded border px-3 py-2"
              placeholder="Portal URL"
              value={form.portal}
              onChange={(e) => setForm((f) => ({ ...f, portal: e.target.value }))}
            />
          </div>
          <textarea
            className="min-h-[80px] rounded border px-3 py-2"
            placeholder="Details / notes"
            value={form.details}
            onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
          />
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border px-3 py-2">
              Cancel
            </button>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================
   Main component
   ========================= */

export default function UofGJobTracker() {
  // Persist rows locally; seed from mockData first time
  const [rows, setRows] = useLocalRows<JobRow[]>("uofg-jobs", mockData);

  // UI state
  const [query, setQuery] = useState(
    (typeof window !== "undefined" && localStorage.getItem("uofg-query")) || ""
  );
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">(
    (typeof window !== "undefined" &&
      (localStorage.getItem("uofg-status") as JobStatus | "all")) || "all"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobRow | null>(null);

  // Persist filters
  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("uofg-query", query);
    } catch {}
  }, [query]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("uofg-status", statusFilter);
    } catch {}
  }, [statusFilter]);

  // Derived counts
  const counts = useMemo(() => {
    const base: Record<JobStatus, number> = {
      saved: 0,
      submitted: 0,
      in_progress: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    rows.forEach((r) => {
      base[r.status]++;
    });
    return base;
  }, [rows]);

  // Filtering + sorting by deadline
  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter;
        const hay = `${r.company} ${r.position} ${r.details ?? ""}`.toLowerCase();
        const matchesQuery = hay.includes(query.toLowerCase());
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
  }, [rows, statusFilter, query]);

  // Handlers
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value);
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setStatusFilter(e.target.value as JobStatus | "all");

  function addRow(newRow: JobRow) {
    setRows((prev) => [...prev, newRow]);
  }

  function updateRow(patch: JobRow) {
    setRows((prev) => prev.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)));
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  // Keyboard shortcuts: A = Add, / = focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "a") setModalOpen(true);
      if (key === "/") {
        e.preventDefault();
        (document.getElementById("search") as HTMLInputElement | null)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ===== Render ===== */

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Title + Intro */}
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Internship & Job Tracker</h1>
            <p className="text-sm text-gray-600">Client-only tracker with local persistence (v0.3).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              id="search"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search company, position, notes"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Statuses</option>
              {(Object.keys(STATUS_LABEL) as JobStatus[]).map((k) => (
                <option key={k} value={k}>
                  {STATUS_LABEL[k]}
                </option>
              ))}
            </select>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Job
            </button>
          </div>
        </header>

        {/* Key / Counts */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(STATUS_LABEL) as JobStatus[]).map((st) => (
            <div key={st} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">{STATUS_LABEL[st]}</div>
              <div className="mt-1 text-2xl font-semibold">{counts[st]}</div>
            </div>
          ))}
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
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
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
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      {formatDate(row.deadline)}
                      {isDueSoon(row.deadline) && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                          Due soon
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusChip status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.details || "—"}</td>
                  <td className="px-4 py-3 text-sm text-blue-700 underline">
                    {row.portal ? (
                      <a href={row.portal} target="_blank" rel="noreferrer">
                        Portal
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => setEditing(row)}
                      className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      aria-label={`Delete ${row.company} ${row.position}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                    No rows match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="text-[10px] text-gray-400">build v0.3</p>
      </div>

      {/* Modals */}
      <AddJobModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={addRow} />
      <EditJobModal
        open={!!editing}
        row={editing}
        onClose={() => setEditing(null)}
        onUpdate={(r) => {
          updateRow(r);
          setEditing(null);
        }}
      />
    </div>
  );
}
