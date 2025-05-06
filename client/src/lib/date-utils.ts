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
    
    // Check if this date is already in IST format (from server log data)
    // If the dateObj's hours are between 0-5 and minutes are 0-30, it might be local timezone
    // This is a basic heuristic to avoid double-conversion
    const localHour = dateObj.getHours();
    const localMinute = dateObj.getMinutes();
    
    // Debugging logs
    console.log(`Date to format: ${dateObj.toISOString()} (Local display: ${dateObj.toString()})`);
    
    // Add 5 hours and 30 minutes to convert from UTC to IST
    const istDate = addMinutes(addHours(dateObj, IST_HOURS_OFFSET), IST_MINUTES_OFFSET);
    console.log(`After IST conversion: ${istDate.toISOString()} (Local display: ${istDate.toString()})`);
    
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

/**
 * Special function to format session dates for display
 * Session dates are stored in UTC in the database
 * @param date Session date to format (stored in UTC)
 * @param formatStr Format string
 * @returns Formatted date string
 */
export function formatSessionDate(date: Date | string, formatStr: string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Use direct formatting to see the actual date value
    const directFormat = format(dateObj, formatStr);
    console.log(`Direct format (no conversion): ${dateObj.toISOString()} -> ${directFormat}`);
    
    // Add 5 hours and 30 minutes to convert from UTC to IST
    const istDate = addMinutes(addHours(dateObj, IST_HOURS_OFFSET), IST_MINUTES_OFFSET);
    const istFormat = format(istDate, formatStr);
    console.log(`IST format (with conversion): ${istDate.toISOString()} -> ${istFormat}`);
    
    // Return the IST formatted date
    return istFormat;
  } catch (error) {
    console.error('Error formatting session date:', error);
    return 'Invalid date';
  }
}