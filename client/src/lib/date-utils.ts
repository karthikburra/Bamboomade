import { format, parseISO } from "date-fns";

// Format date to Indian Standard Time (IST)
export function formatInIST(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, hh:mm a");
}

// Format session date in a friendly format
export function formatSessionDate(date: string | Date | undefined): string {
  if (!date) return "N/A";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd MMM yyyy, hh:mm a");
  } catch (e) {
    return typeof date === "string" ? date : "Invalid date";
  }
}