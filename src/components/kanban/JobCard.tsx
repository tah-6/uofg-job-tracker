// src/components/kanban/JobCard.tsx
"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { JobRow } from "@/types/job";
import { formatDate } from "@/utils/dates";

export default function JobCard({
  job,
  onEdit,
  onDelete,
}: {
  job: JobRow;
  onEdit: (row: JobRow) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: job.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm 
                 dark:bg-slate-800 dark:border-slate-700"
    >
      <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
        {job.company}
      </div>
      <div className="text-xs text-gray-600 dark:text-slate-300">{job.position}</div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-slate-400">
        {job.dateApplied && <span>Applied: {formatDate(job.dateApplied)}</span>}
        {job.deadline && <span>Deadline: {formatDate(job.deadline)}</span>}
      </div>

      <div className="mt-2 line-clamp-3 text-xs text-gray-700 dark:text-slate-200">
        {job.details || "—"}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <a
          href={job.portal || "#"}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-700 hover:underline disabled:opacity-50"
          onClick={(e) => !job.portal && e.preventDefault()}
        >
          {job.portal ? "Portal" : "No link"}
        </a>
        <div className="space-x-2">
          <button
            onClick={() => onEdit(job)}
            className="rounded px-2 py-1 text-[11px] text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(job.id)}
            className="rounded px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 dark:hover:bg-slate-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
