import { format, formatISO, addHours, addMinutes } from 'date-fns';

// IST timezone is UTC+5:30
const IST_HOURS_OFFSET = 5;
const IST_MINUTES_OFFSET = 30;

/**
 * Format a date in IST timezone by applying the UTC+5:30 offset
 * @param date The date to format
 * @param formatStr The format string to use
 * @returns Formatted date string in IST timezone
 */
export function formatInIST(date: Date | string, formatStr: string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Add 5 hours and 30 minutes to convert from UTC to IST
    const istDate = addMinutes(addHours(dateObj, IST_HOURS_OFFSET), IST_MINUTES_OFFSET);
    return format(istDate, formatStr);
  } catch (error) {
    console.error('Error formatting date in IST:', error);
    return 'Invalid date';
  }
}

/**
 * Get the current date and time in IST timezone
 * @returns Current date in IST timezone
 */
export function getCurrentISTDate(): Date {
  const now = new Date();
  return addMinutes(addHours(now, IST_HOURS_OFFSET), IST_MINUTES_OFFSET);
}

/**
 * Convert IST time string to UTC Date object
 * @param dateStr Date string in format 'YYYY-MM-DD'
 * @param timeStr Time string in format 'HH:MM'
 * @returns Date object in UTC
 */
export function istToUTC(dateStr: string, timeStr: string): Date {
  try {
    // Parse the date and time into a Date object (browser will treat as local time)
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    const localDate = new Date(dateTimeStr);
    
    // Subtract 5 hours and 30 minutes to convert from IST to UTC
    const utcDate = addMinutes(addHours(localDate, -IST_HOURS_OFFSET), -IST_MINUTES_OFFSET);
    return utcDate;
  } catch (error) {
    console.error('Error converting IST to UTC:', error);
    return new Date();
  }
}

/**
 * Check if a date is today in IST timezone
 * @param date The date to check
 * @returns Whether the date is today
 */
export function isISTToday(date: Date): boolean {
  const today = getCurrentISTDate();
  const istDate = addMinutes(addHours(date, IST_HOURS_OFFSET), IST_MINUTES_OFFSET);
  
  return (
    istDate.getFullYear() === today.getFullYear() &&
    istDate.getMonth() === today.getMonth() &&
    istDate.getDate() === today.getDate()
  );
}

/**
 * Format a date for ISO string in IST timezone
 * @param date The date to format
 * @returns ISO formatted date string in IST timezone
 */
export function formatISOInIST(date: Date): string {
  const istDate = addMinutes(addHours(date, IST_HOURS_OFFSET), IST_MINUTES_OFFSET);
  return formatISO(istDate);
}