"use client";
import React, { useMemo, useState, useEffect } from "react";
import { JobRow, JobStatus, STATUS_LABEL } from "@/types/job";
import { useLocalRows } from "@/hooks/useLocalRows";
import AddJobModal from "./AddJobModal";
import EditJobModal from "./EditJobModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import JobTable from "./JobTable";
import KanbanBoard from "../kanban/KanbanBoard";
import ToastHost from "../ui/ToastHost";
import { exportToCSV, exportToJSON, importFromCSV, importFromJSON } from "@/utils/io";
import { toast } from "@/utils/toast";

/* -------------------- Loading Splash -------------------- */
function Splash() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white dark:bg-slate-900">
      <div className="w-full max-w-md space-y-4 px-6">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        <div className="space-y-3">
          <div className="h-20 rounded-xl bg-gray-100 animate-pulse dark:bg-slate-800" />
          <div className="h-20 rounded-xl bg-gray-100 animate-pulse dark:bg-slate-800" />
          <div className="h-20 rounded-xl bg-gray-100 animate-pulse dark:bg-slate-800" />
        </div>
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
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("uofg-theme") as "light" | "dark" | null;
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

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
  useEffect(() => {
    try {
      localStorage.setItem("uofg-theme", theme);
    } catch {}
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

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
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set<string>();
      rows.forEach((r) => {
        if (prev.has(r.id)) valid.add(r.id);
      });
      return valid;
    });
  }, [rows]);
  useEffect(() => {
    if (view !== "table") setSelectedIds(new Set());
  }, [view]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("search") as HTMLInputElement | null;
        el?.focus();
      }
      if (isMod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setAddOpen(true);
      }
      if (e.key === "Escape") {
        setAddOpen(false);
        setEditing(null);
        setPendingDeleteIds(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const hasRows = rows.length > 0;
  const hasFiltered = filtered.length > 0;

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
  function deleteRows(ids: string[]) {
    const toDelete = new Set(ids);
    setRows((prev) => prev.filter((r) => !toDelete.has(r.id)));
  }
  function requestDelete(id: string) {
    setPendingDeleteIds([id]);
  }
  function requestBulkDelete() {
    if (selectedIds.size === 0) return;
    setPendingDeleteIds(Array.from(selectedIds));
  }
  function toggleSelect(id: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function toggleSelectAll(selected: boolean) {
    setSelectedIds(selected ? new Set(filtered.map((r) => r.id)) : new Set());
  }
  function applyBulkStatus(status: JobStatus) {
    if (selectedIds.size === 0) return;
    const targets = new Set(selectedIds);
    setRows((prev) =>
      prev.map((r) => (targets.has(r.id) ? { ...r, status } : r))
    );
  }
  function moveJobTo(jobId: string, toStatus: JobStatus) {
    setRows((prev) =>
      prev.map((r) => (r.id === jobId ? { ...r, status: toStatus } : r))
    );
  }

  return (
    <>
      <ToastHost />
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
                  aria-label="Search jobs"
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
                  aria-label="Filter by status"
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
                  aria-pressed={view === "table"}
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
                  aria-pressed={view === "kanban"}
                  className={`rounded-lg px-3 py-2 text-sm border dark:border-slate-700 ${
                    view === "kanban"
                      ? "bg-gray-900 text-white dark:bg-slate-200 dark:text-slate-900"
                      : ""
                  }`}
                >
                  Kanban
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>
          </header>

          {/* Buttons row (scrollable on mobile) */}
          <div className="relative -mx-4 sm:mx-0">
            <div className="flex gap-2 flex-nowrap overflow-x-auto no-scrollbar px-4">
              <button
                onClick={() => setAddOpen(true)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                aria-label="Add a new job"
              >
                Add Job
              </button>
              <button
                onClick={() => exportToJSON(rows)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50
                  dark:border-slate-700 dark:hover:bg-slate-700"
                aria-label="Export jobs to JSON"
              >
                Export JSON
              </button>
              <button
                onClick={() => exportToCSV(rows)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50
                  dark:border-slate-700 dark:hover:bg-slate-700"
                aria-label="Export jobs to CSV"
              >
                Export CSV
              </button>
              <button
                onClick={() => document.getElementById("import-json")?.click()}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50
                  dark:border-slate-700 dark:hover:bg-slate-700"
                aria-label="Import jobs from JSON"
              >
                Import JSON
              </button>
              <button
                onClick={() => document.getElementById("import-csv")?.click()}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50
                  dark:border-slate-700 dark:hover:bg-slate-700"
                aria-label="Import jobs from CSV"
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
                toast("Imported JSON successfully.", "success");
              } catch (err: unknown) {
                const msg =
                  err instanceof Error ? err.message : "Failed to import JSON.";
                toast(msg, "error");
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
                toast("Imported CSV successfully.", "success");
              } catch (err: unknown) {
                const msg =
                  err instanceof Error ? err.message : "Failed to import CSV.";
                toast(msg, "error");
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
          {!hasRows && (
            <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:bg-slate-800 dark:border-slate-700">
              <h2 className="text-lg font-semibold">No jobs yet</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                Start by adding your first application or importing a CSV.
              </p>
              <button
                onClick={() => setAddOpen(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add your first job
              </button>
            </section>
          )}
          {hasRows && !hasFiltered && (
            <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center dark:bg-slate-800 dark:border-slate-700">
              <h2 className="text-sm font-semibold">No results</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                Try clearing your search or filter.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <button
                  onClick={() => setQuery("")}
                  className="rounded border px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Clear search
                </button>
                <button
                  onClick={() => setStatusFilter("all")}
                  className="rounded border px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Clear filter
                </button>
              </div>
            </section>
          )}
          {hasFiltered &&
            (view === "table" ? (
              <>
                {selectedIds.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700">
                    <span className="text-sm text-gray-700 dark:text-slate-200">
                      {selectedIds.size} selected
                    </span>
                    <select
                      className="rounded border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value as JobStatus | "";
                        if (val) {
                          applyBulkStatus(val);
                          toast("Status updated.", "success");
                          e.currentTarget.value = "";
                        }
                      }}
                    >
                      <option value="" disabled>
                        Change status…
                      </option>
                      {(Object.keys(STATUS_LABEL) as JobStatus[]).map((k) => (
                        <option key={k} value={k}>
                          {STATUS_LABEL[k]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={requestBulkDelete}
                      className="rounded border px-2 py-1 text-sm text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20"
                    >
                      Delete selected
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      Clear selection
                    </button>
                  </div>
                )}
                <JobTable
                  rows={filtered}
                  onEdit={(r) => setEditing(r)}
                  onDelete={requestDelete}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleAll={toggleSelectAll}
                />
              </>
            ) : (
              <KanbanBoard
                rows={filtered}
                onMove={moveJobTo}
                onEdit={(r) => setEditing(r)}
                onDelete={requestDelete}
              />
            ))}

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
        <DeleteConfirmModal
          open={!!pendingDeleteIds?.length}
          count={pendingDeleteIds?.length ?? 1}
          onClose={() => setPendingDeleteIds(null)}
          onConfirm={() => {
            if (pendingDeleteIds && pendingDeleteIds.length > 0) {
              if (pendingDeleteIds.length === 1) {
                deleteRow(pendingDeleteIds[0]);
              } else {
                deleteRows(pendingDeleteIds);
              }
              toast(
                pendingDeleteIds.length === 1 ? "Job deleted." : "Jobs deleted.",
                "success"
              );
              setSelectedIds(new Set());
            }
            setPendingDeleteIds(null);
          }}
        />
      </div>
    </>
  );
}
