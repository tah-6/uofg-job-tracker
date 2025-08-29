// src/components/kanban/KanbanBoard.tsx
"use client";
import React, { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "./Column";
import JobCard from "./JobCard";
import { JobRow, JobStatus } from "@/types/job";
import { KANBAN_COLUMNS } from "@/types/kanban";

export default function KanbanBoard({
  rows,
  onMove,
  onEdit,
  onDelete,
}: {
  rows: JobRow[];
  onMove: (id: string, toStatus: JobStatus) => void;
  onEdit: (row: JobRow) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map: Record<string, JobRow[]> = {};
    for (const c of KANBAN_COLUMNS) map[c.id] = [];
    rows.forEach((r) => {
      const key = r.status;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    // optional: sort by deadline asc inside columns
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
    });
    return map;
  }, [rows]);

  function onDragStart(_e: DragStartEvent) {
    // noop for now, could highlight source
  }

  function onDragEnd(e: DragEndEvent) {
    const jobId = String(e.active.id);
    const overCol = e.over?.id ? String(e.over.id) : "";
    if (!jobId || !overCol) return;
    if (
      overCol === "saved" ||
      overCol === "submitted" ||
      overCol === "in_progress" ||
      overCol === "interview" ||
      overCol === "offer" ||
      overCol === "rejected"
    ) {
      onMove(jobId, overCol as JobStatus);
    }
  }

  return (
    <div className="relative -mx-4 sm:mx-0">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
          {KANBAN_COLUMNS.map((col) => (
            <Column key={col.id} id={col.id} title={col.title}>
              <SortableContext
                items={(grouped[col.id] || []).map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {(grouped[col.id] || []).map((r) => (
                    <JobCard key={r.id} job={r} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              </SortableContext>
            </Column>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
