"use client";
import React from "react";

type Props = {
  open: boolean;
  count?: number;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  open,
  count = 1,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800 dark:text-slate-100">
        <h2 className="text-lg font-semibold">
          Delete {count} job{count === 1 ? "" : "s"}?
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
          This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
