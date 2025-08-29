"use client";
import React, { useMemo, useState, useEffect } from "react";
import { JobRow, JobStatus, STATUS_LABEL } from "@/types/job";
import { useLocalRows } from "@/hooks/useLocalRows";
import AddJobModal from "./AddJobModal";
import EditJobModal from "./EditJobModal";
import JobTable from "./JobTable";
import KanbanBoard from "../kanban/KanbanBoard";
import { exportToCSV, exportToJSON, importFromCSV, importFromJSON } from "@/utils/io";

/* -------------------- Loading Splash -------------------- */
function Splash() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        <p className="text-sm text-gray-600 dark:text-slate-300">Syncing your data…</p>
      </div>
    </div>
  );
}

/* -------------------- Mock (only for first boot) -------------------- */
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

const STORAGE_KEY = "uofg-jobs";

export default function UofGJobTracker() {
  const [rows, setRows] = useLocalRows<JobRow[]>(STORAGE_KEY, mockData);

  // Persisted UI state
  const [query, setQuery] = useState(
    (typeof window !== "undefined" && localStorage.getItem("uofg-query")) || ""
  );
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">(
    (typeof window !== "undefined" &&
      (localStorage.getItem("uofg-status") as JobStatus | "all")) || "all"
  );
  const [view, setView] = useState<"table" | "kanban">("kanban");

  useEffect(() => {
    try {
      localStorage.setItem("uofg-query", query);
    } catch {}
  }, [query]);
  useEffect(() => {
    try {
      localStorage.setItem("uofg-status", statusFilter);
    } catch {}
  }, [statusFilter]);

  // Loading splash logic: avoid flashing mockData if saved data exists
  const [showSplash, setShowSplash] = useState(true);

  // When the app mounts, decide if we need a splash at all
  useEffect(() => {
    const hasSaved =
      typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEY);
    if (!hasSaved) {
      // Nothing to load, show the UI immediately
      setShowSplash(false);
    }
  }, []);

  // If there IS saved data, hide splash once rows have hydrated
  useEffect(() => {
    const hasSaved =
      typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEY);
    if (!hasSaved) return;

    // If rows now differ from mock or are simply loaded, hide splash.
    // Also add a safety timeout so we never get stuck.
    const timeout = setTimeout(() => setShowSplash(false), 1200);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedRows: JobRow[] = JSON.parse(saved);
        if (savedRows.length === rows.length) {
          setShowSplash(false);
          clearTimeout(timeout);
        }
      } else {
        // key disappeared? just hide
        setShowSplash(false);
        clearTimeout(timeout);
      }
    } catch {
      setShowSplash(false);
      clearTimeout(timeout);
    }
    return () => clearTimeout(timeout);
  }, [rows]);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<JobRow | null>(null);

  const counts = useMemo(() => {
    const base = {
      saved: 0,
      submitted: 0,
      in_progress: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    } as Record<JobStatus, number>;
    rows.forEach((r) => {
      base[r.status]++;
    });
    return base;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        const matchesStatus =
          statusFilter === "all" ? true : r.status === statusFilter;
        const hay = `${r.company} ${r.position} ${r.details ?? ""}`.toLowerCase();
        return matchesStatus && hay.includes(query.toLowerCase());
      })
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
  }, [rows, statusFilter, query]);

  function addRow(newRow: JobRow) {
    setRows((prev) => [...prev, newRow]);
  }
  function updateRow(patch: JobRow) {
    setRows((prev) =>
      prev.map((r) => (r.id === patch.id ? { ...r, ...patch } : r))
    );
  }
  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }
  function moveJobTo(jobId: string, toStatus: JobStatus) {
    setRows((prev) =>
      prev.map((r) => (r.id === jobId ? { ...r, status: toStatus } : r))
    );
  }

  return (
    <>
      {showSplash && <Splash />}

      <div
        className={`min-h-screen bg-gray-50 text-gray-900 p-6 dark:bg-slate-900 dark:text-slate-100 ${
          showSplash ? "invisible" : "visible"
        }`}
        aria-hidden={showSplash}
      >
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Internship & Job Tracker</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Client-only tracker with local persistence (modular).
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Search + Filter */}
              <div className="flex gap-2">
                <input
                  id="search"
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setQuery(e.target.value)
                  }
                  placeholder="Search company, position, notes"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                    text-gray-900 placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-blue-400
                    dark:bg-slate-800 dark:border-slate-700
                    dark:text-slate-100 dark:placeholder-slate-400"
                />
                <select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(e.target.value as JobStatus | "all")
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                    text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400
                    dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="all">All Statuses</option>
                  {(Object.keys(STATUS_LABEL) as JobStatus[]).map((k) => (
                    <option key={k} value={k}>
                      {STATUS_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setView("table")}
                  className={`rounded-lg px-3 py-2 text-sm border dark:border-slate-700 ${
                    view === "table"
                      ? "bg-gray-900 text-white dark:bg-slate-200 dark:text-slate-900"
                      : ""
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setView("kanban")}
                  className={`rounded-lg px-3 py-2 text-sm border dark:border-slate-700 ${
                    view === "kanban"
                      ? "bg-gray-900 text-white dark:bg-slate-200 dark:text-slate-900"
                      : ""
                  }`}
                >
                  Kanban
                </button>
              </div>
            </div>
          </header>

          {/* Buttons row (scrollable on mobile) */}
          <div className="relative -mx-4 sm:mx-0">
            <div className="flex gap-2 flex-nowrap overflow-x-auto no-scrollbar px-4">
              <button
                onClick={() => setAddOpen(true)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Job
              </button>
              <button
                onClick={() => exportToJSON(rows)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50
                  dark:border-slate-700 dark:hover:bg-slate-700"
              >
                Export JSON
              </button>
              <button
                onClick={() => exportToCSV(rows)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50
                  dark:border-slate-700 dark:hover:bg-slate-700"
              >
                Export CSV
              </button>
              <button
                onClick={() => document.getElementById("import-json")?.click()}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50
                  dark:border-slate-700 dark:hover:bg-slate-700"
              >
                Import JSON
              </button>
              <button
                onClick={() => document.getElementById("import-csv")?.click()}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50
                  dark:border-slate-700 dark:hover:bg-slate-700"
              >
                Import CSV
              </button>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            id="import-json"
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const rows = await importFromJSON(f);
                setRows(rows);
                alert("Imported JSON successfully.");
              } catch (err: unknown) {
                const msg =
                  err instanceof Error ? err.message : "Failed to import JSON.";
                alert(msg);
              } finally {
                e.currentTarget.value = "";
              }
            }}
          />
          <input
            id="import-csv"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const rows = await importFromCSV(f);
                setRows(rows);
                alert("Imported CSV successfully.");
              } catch (err: unknown) {
                const msg =
                  err instanceof Error ? err.message : "Failed to import CSV.";
                alert(msg);
              } finally {
                e.currentTarget.value = "";
              }
            }}
          />

          {/* Counts */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(Object.keys(counts) as JobStatus[]).map((st) => (
              <div
                key={st}
                className="rounded-2xl border p-4 shadow-sm
                  bg-white text-gray-900 border-gray-200
                  dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
              >
                <div className="text-xs text-gray-600 dark:text-slate-300">
                  {STATUS_LABEL[st]}
                </div>
                <div className="mt-1 text-2xl font-semibold">{counts[st]}</div>
              </div>
            ))}
          </section>

          {/* Table or Kanban */}
          {view === "table" ? (
            <JobTable
              rows={filtered}
              onEdit={(r) => setEditing(r)}
              onDelete={deleteRow}
            />
          ) : (
            <KanbanBoard
              rows={filtered}
              onMove={moveJobTo}
              onEdit={(r) => setEditing(r)}
              onDelete={deleteRow}
            />
          )}

          <p className="text-[10px] text-gray-400">build modular v3 (kanban + splash)</p>
        </div>

        {/* Modals */}
        <AddJobModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreate={addRow}
        />
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
    </>
  );
}
