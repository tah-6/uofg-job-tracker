"use client";
import React from "react";
import { JobRow, JobStatus, STATUS_LABEL } from "@/types/job";
import StatusChip from "./StatusChip";
import { formatDate, isDueSoon } from "@/utils/dates";

const JobTable = React.memo(function JobTable({
  rows,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleAll,
}: {
  rows: JobRow[];
  onEdit: (row: JobRow) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = rows.some((r) => selectedIds.has(r.id));

  return (
    <section className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
  <table className="min-w-[760px] md:min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead className="bg-gray-100 dark:bg-slate-700">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !allSelected && someSelected;
                }}
                onChange={(e) => onToggleAll(e.target.checked)}
                aria-label="Select all rows"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
            </th>
            {[
              "Company",
              "Position",
              "Date Applied",
              "Deadline",
              "Application Status",
              "Details",
              "Applicant Portal",
              "Resume",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider
                           text-gray-700 dark:text-slate-200"
              >
                {h}
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-gray-900 dark:text-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <td className="px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={(e) => onToggleSelect(row.id, e.target.checked)}
                  aria-label={`Select ${row.company} ${row.position}`}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
              </td>
              <td className="px-4 py-3 text-sm font-medium">{row.company}</td>
              <td className="px-4 py-3 text-sm">{row.position}</td>
              <td className="px-4 py-3 text-sm">{formatDate(row.dateApplied)}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  {formatDate(row.deadline)}
                  {isDueSoon(row.deadline) && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Due soon
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm">
                <StatusChip status={row.status} />
              </td>
              <td className="px-4 py-3 text-sm">{row.details || "—"}</td>
              <td className="px-4 py-3 text-sm">
                {row.portal ? (
                  <a
                    href={row.portal}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    Portal
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-sm">{row.resumeVersion || "—"}</td>
              <td className="px-4 py-3 text-right space-x-2">
                <button
                  onClick={() => onEdit(row)}
                  className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-700/60"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(row.id)}
                  className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-slate-400">
                No rows match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
});

export default JobTable;


export function StatusPickerOptions() {
  return (["saved","submitted","in_progress","interview","offer","rejected"] as JobStatus[]).map((k) => (
    <option key={k} value={k}>{STATUS_LABEL[k]}</option>
  ));
}
