export type JobFormValues = {
  company: string;
  position: string;
  dateApplied?: string;
  deadline?: string;
  portal?: string;
  resumeVersion?: string;
  details?: string;
};

export type JobFormErrors = Partial<Record<keyof JobFormValues, string>>;

export function validateJobForm(values: JobFormValues): JobFormErrors {
  const errors: JobFormErrors = {};

  if (!values.company?.trim()) {
    errors.company = "Company is required.";
  }
  if (!values.position?.trim()) {
    errors.position = "Position is required.";
  }

  if (values.portal) {
    try {
      // eslint-disable-next-line no-new
      new URL(values.portal);
    } catch {
      errors.portal = "Enter a valid URL (including https://).";
    }
  }

  if (values.dateApplied && values.deadline) {
    const applied = new Date(values.dateApplied).getTime();
    const deadline = new Date(values.deadline).getTime();
    if (!Number.isNaN(applied) && !Number.isNaN(deadline) && deadline < applied) {
      errors.deadline = "Deadline cannot be before date applied.";
    }
  }

  return errors;
}
