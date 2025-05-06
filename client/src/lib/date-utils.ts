import { format, formatInTimeZone } from "date-fns-tz";

/**
 * Format a date in Indian Standard Time (IST/Asia-Kolkata)
 * @param date The date to format
 * @param formatStr The format string (see date-fns format options)
 * @returns The formatted date string in IST
 */
export const formatInIST = (date: Date | string, formatStr: string) => {
  // Ensure all time formats use 24-hour format
  const updatedFormat = formatStr.replace('HH:mm', 'HH:mm').replace('h:mm', 'HH:mm');
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, 'Asia/Kolkata', updatedFormat);
};

/**
 * Get the current date in IST timezone
 * @returns A Date object representing the current time in IST
 */
export const getCurrentISTDate = (): Date => {
  // Create a date object for the current time in IST
  const now = new Date();
  const nowIST = formatInTimeZone(now, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
  return new Date(nowIST);
};