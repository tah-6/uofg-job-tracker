"use client";
import React, { useState } from "react";
import { JobRow, JobStatus } from "@/types/job";
import { uuid } from "@/utils/io";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (row: JobRow) => void;
};

const STATUSES: JobStatus[] = ["saved", "submitted", "in_progress", "interview", "offer", "rejected"];

const inputBase =
  "w-full min-w-0 h-10 rounded border px-3 bg-white text-gray-900 border-gray-300 " +
  "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 " +
  "appearance-none [-webkit-appearance:none]";

export default function AddJobModal({ open, onClose, onCreate }: Props) {
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
      id: uuid(),
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
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800 dark:text-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Job</h2>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700">
            Close
          </button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-3">
          <input
            className={inputBase}
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />

          <input
            className={inputBase}
            placeholder="Position"
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
          />

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600 dark:text-slate-300">
              <span className="mb-1 block">Date Applied</span>
              <input
                type="date"
                className={inputBase}
                value={form.dateApplied}
                onChange={(e) => setForm((f) => ({ ...f, dateApplied: e.target.value }))}
              />
            </label>

            <label className="text-sm text-gray-600 dark:text-slate-300">
              <span className="mb-1 block">Deadline</span>
              <input
                type="date"
                className={inputBase}
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </label>
          </div>

          {/* Status + Portal row (kept like your old layout, with fixed heights) */}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600 dark:text-slate-300">
              <span className="mb-1 block">Status</span>
              <select
                className={inputBase}
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

            <label className="text-sm text-gray-600 dark:text-slate-300">
              <span className="mb-1 block">Portal URL</span>
              <input
                className={inputBase}
                placeholder="https://company.com/job/123"
                value={form.portal}
                onChange={(e) => setForm((f) => ({ ...f, portal: e.target.value }))}
              />
            </label>
          </div>

          <textarea
            className="min-h-[96px] rounded border px-3 py-2 bg-white text-gray-900 border-gray-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
            placeholder="Details / notes"
            value={form.details}
            onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
          />

          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700">
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
