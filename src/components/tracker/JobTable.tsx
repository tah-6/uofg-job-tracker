"use client";
import React from "react";
import { JobRow, JobStatus, STATUS_LABEL } from "@/types/job";
import StatusChip from "./StatusChip";
import { formatDate, isDueSoon } from "@/utils/dates";

export default function JobTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: JobRow[];
  onEdit: (row: JobRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider 
               text-gray-700 bg-gray-100 
               dark:text-slate-200 dark:bg-slate-800">
          <tr>
            {["Company","Position","Date Applied","Deadline","Application Status","Details","Applicant Portal",""].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-gray-900 dark:text-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.company}</td>
              <td className="px-4 py-3 text-sm text-gray-800">{row.position}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{formatDate(row.dateApplied)}</td>
              <td className="px-4 py-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  {formatDate(row.deadline)}
                  {isDueSoon(row.deadline) && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Due soon</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm"><StatusChip status={row.status} /></td>
              <td className="px-4 py-3 text-sm text-gray-700">{row.details || "—"}</td>
              <td className="px-4 py-3 text-sm text-blue-700 underline">
                {row.portal ? <a href={row.portal} target="_blank" rel="noreferrer">Portal</a> : "—"}
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button onClick={() => onEdit(row)} className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">Edit</button>
                <button onClick={() => onDelete(row.id)} className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50">Delete</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">No rows match your filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export function StatusPickerOptions() {
  return (["saved","submitted","in_progress","interview","offer","rejected"] as JobStatus[]).map((k) => (
    <option key={k} value={k}>{STATUS_LABEL[k]}</option>
  ));
}
