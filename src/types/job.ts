export type JobStatus =
  | "submitted"
  | "in_progress"
  | "interview"
  | "offer"
  | "rejected"
  | "saved";

export interface JobRow {
  id: string;
  company: string;
  position: string;
  dateApplied?: string; // YYYY-MM-DD
  deadline?: string;    // YYYY-MM-DD
  status: JobStatus;
  details?: string;
  portal?: string;
  resumeVersion?: string;
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  saved: "Saved",
  submitted: "Submitted",
  in_progress: "In Progress",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export const STATUS_COLOR: Record<JobStatus, string> = {
  saved: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  interview: "bg-purple-100 text-purple-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};
