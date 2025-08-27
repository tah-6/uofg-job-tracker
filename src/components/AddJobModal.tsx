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


