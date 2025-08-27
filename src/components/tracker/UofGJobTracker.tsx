"use client";
import React, { useMemo, useState, useEffect } from "react";
import { JobRow, JobStatus, STATUS_LABEL } from "@/types/job";
import { useLocalRows } from "@/hooks/useLocalRows";
import AddJobModal from "./AddJobModal";
import EditJobModal from "./EditJobModal";
import JobTable from "./JobTable";
import { exportToCSV, exportToJSON, importFromCSV, importFromJSON } from "@/utils/io";


const mockData: JobRow[] = [
  { id: "1", company: "Rockwell Automation", position: "Manufacturing/Embedded Co-op", dateApplied: "2025-09-20", deadline: "2025-09-25", status: "submitted", details: "Resume v3, Cover v2", portal: "https://careers.rockwellautomation.com/" },
  { id: "2", company: "Linamar", position: "Controls Engineering Intern", dateApplied: "2025-09-18", deadline: "2025-09-28", status: "in_progress", details: "Recruiter reply pending", portal: "https://www.linamar.com/careers" },
  { id: "3", company: "BlackBerry QNX", position: "Software Co-op (C/C++)", dateApplied: "2025-09-15", deadline: "2025-09-30", status: "interview", details: "Phone screen booked 09/24", portal: "https://blackberry.qnx.com/" },
];

export default function UofGJobTracker() {
  const [rows, setRows] = useLocalRows<JobRow[]>("uofg-jobs", mockData);

  const [query, setQuery] = useState(
    (typeof window !== "undefined" && localStorage.getItem("uofg-query")) || ""
  );
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">(
    (typeof window !== "undefined" && (localStorage.getItem("uofg-status") as JobStatus | "all")) || "all"
  );

  useEffect(() => { try { localStorage.setItem("uofg-query", query); } catch {} }, [query]);
  useEffect(() => { try { localStorage.setItem("uofg-status", statusFilter); } catch {} }, [statusFilter]);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<JobRow | null>(null);

  const counts = useMemo(() => {
    const base = { saved: 0, submitted: 0, in_progress: 0, interview: 0, offer: 0, rejected: 0 } as Record<JobStatus, number>;
    rows.forEach(r => { base[r.status]++; });
    return base;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter(r => {
        const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter;
        const hay = `${r.company} ${r.position} ${r.details ?? ""}`.toLowerCase();
        return matchesStatus && hay.includes(query.toLowerCase());
      })
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
  }, [rows, statusFilter, query]);

  function addRow(newRow: JobRow) { setRows(prev => [...prev, newRow]);  }
  function updateRow(patch: JobRow) { setRows(prev => prev.map(r => (r.id === patch.id ? { ...r, ...patch } : r))); }
  function deleteRow(id: string) { setRows(prev => prev.filter(r => r.id !== id)); }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Internship & Job Tracker</h1>
            <p className="text-sm text-gray-600">Client-only tracker with local persistence (modular).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              id="search"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Search company, position, notes"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as JobStatus | "all")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Statuses</option>
              {(Object.keys(STATUS_LABEL) as JobStatus[]).map(k => (
                <option key={k} value={k}>{STATUS_LABEL[k]}</option>
              ))}
            </select>
            <button onClick={() => setAddOpen(true)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add Job
            </button>
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
      // replace entire dataset, or merge — your call:
      setRows(rows);
      alert("Imported JSON successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import JSON.";
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
      const msg = err instanceof Error ? err.message : "Failed to import JSON.";
      alert(msg);
    } finally {
      e.currentTarget.value = "";
    }
  }}
/>

<button
  onClick={() => exportToJSON(rows)}
  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
>
  Export JSON
</button>
<button
  onClick={() => exportToCSV(rows)}
  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
>
  Export CSV
</button>
<button
  onClick={() => document.getElementById("import-json")?.click()}
  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
>
  Import JSON
</button>
<button
  onClick={() => document.getElementById("import-csv")?.click()}
  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
>
  Import CSV
</button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(counts) as JobStatus[]).map(st => (
            <div key={st} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">{STATUS_LABEL[st]}</div>
              <div className="mt-1 text-2xl font-semibold">{counts[st]}</div>
            </div>
          ))}
        </section>

        <JobTable rows={filtered} onEdit={(r) => setEditing(r)} onDelete={deleteRow} />

        <p className="text-[10px] text-gray-400">build modular v1</p>
      </div>

      <AddJobModal open={addOpen} onClose={() => setAddOpen(false)} onCreate={addRow} />
      <EditJobModal open={!!editing} row={editing} onClose={() => setEditing(null)} onUpdate={(r) => { updateRow(r); setEditing(null); }} />
    </div>
  );
}
