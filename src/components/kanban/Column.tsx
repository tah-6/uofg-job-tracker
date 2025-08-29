// src/components/kanban/Column.tsx
"use client";
import React, { PropsWithChildren } from "react";
import { useDroppable } from "@dnd-kit/core";

export default function Column({
  id,
  title,
  children,
}: PropsWithChildren<{ id: string; title: string }>) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="w-[280px] shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">{title}</h3>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[80px] space-y-3 rounded-2xl border p-3
                    ${isOver ? "bg-blue-50/60 dark:bg-slate-700/40" : "bg-gray-50 dark:bg-slate-900"}
                    border-gray-200 dark:border-slate-700`}
      >
        {children}
      </div>
    </div>
  );
}
