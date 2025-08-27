"use client";
import React from "react";
import { JobStatus, STATUS_COLOR, STATUS_LABEL } from "@/types/job";

export default function StatusChip({ status }: { status: JobStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
