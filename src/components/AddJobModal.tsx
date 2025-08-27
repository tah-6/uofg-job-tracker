"use client";
import React, { useState } from "react";
import type { JobRow, JobStatus } from "@/components/UofGJobTracker";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (row: JobRow) => void;
};

const STATUSES: (JobStatus | "saved")[] = ["saved", "submitted", "in_progress", "interview", "offer", "rejected"];

export default function AddJobModal({ open, onClose, onCreate }: Props) {
  const [form, setForm] = useState({
    company: "",
    position: "",
    dateApplied: "",
    deadline: "",
    status: "saved" as JobStatus | "saved",
    details: "",
    portal: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.position) return;
    onCreate({
      id: crypto.randomUUID(),
      company: form.company.trim(),
      position: form.position.trim(),
      dateApplied: form.dateApplied || undefined,
      deadline: form.deadline || undefined,
      status: form.status as JobStatus,
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

  if (!open) return null;

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
                {STATUSES.map((s) => (
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

