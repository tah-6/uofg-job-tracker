export function formatDate(d?: string) {
    if (!d) return "—";
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(new Date(d));
    } catch {
      return d;
    }
  }
  
  export function isDueSoon(date?: string, days = 3) {
    if (!date) return false;
    const ms = new Date(date).getTime() - Date.now();
    return ms >= 0 && ms <= days * 24 * 60 * 60 * 1000;
  }
  