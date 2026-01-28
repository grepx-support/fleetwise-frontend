/**
 * Timezone utility functions for FleetWise application
 * Handles conversion between UTC and display timezone (configurable, default Asia/Singapore)
 */

/**
 * Get the configured display timezone
 * For now, defaults to Asia/Singapore, but can be extended to read from settings
 */
export function getDisplayTimezone(): string {
  // In production, this would read from system settings or user preferences
  // For now, defaulting to Asia/Singapore as per requirements
  return "Asia/Singapore";
}

/**
 * Convert a UTC date/time to the configured display timezone
 * @param utcDateTime - UTC date/time string or Date object
 * @returns Date object in the display timezone
 */
export function convertUtcToDisplay(utcDateTime: string | Date): Date {
  let date = utcDateTime instanceof Date ? utcDateTime : new Date(utcDateTime);
  
  // Create a new Date object that represents the same moment in the target timezone
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const targetTimezoneOffset = getTimezoneOffset(getDisplayTimezone(), date);
  
  return new Date(utcTime + (targetTimezoneOffset * 60000));
}

/**
 * Convert a date/time in the configured display timezone to UTC
 * @param displayDateTime - Display timezone date/time string or Date object
 * @returns Date object in UTC
 */
export function convertDisplayToUtc(displayDateTime: string | Date): Date {
  let date = displayDateTime instanceof Date ? displayDateTime : new Date(displayDateTime);
  
  // Get the timezone offset for the display timezone
  const displayTimezone = getDisplayTimezone();
  const offsetMinutes = getTimezoneOffset(displayTimezone, date);
  
  // Create a UTC date by subtracting the offset
  return new Date(date.getTime() - offsetMinutes * 60000);
}

/**
 * Format a UTC date for display in the configured timezone
 * @param utcDate - UTC date string or Date object
 * @param format - Format string ('date', 'time', 'datetime')
 * @returns Formatted string in the display timezone
 */
export function formatUtcForDisplay(utcDate: string | Date, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate);
  
  // Convert UTC time to display timezone
  const displayDate = convertUtcToDisplay(date);
  
  const options: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case 'date':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
      break;
    case 'datetime':
    default:
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
      break;
  }
  
  // Use the display timezone for formatting
  return displayDate.toLocaleString('en-GB', { 
    ...options, 
    timeZone: getDisplayTimezone() 
  });
}

/**
 * Format a date for API submission (in UTC)
 * @param displayDate - Date in display timezone
 * @returns ISO string in UTC
 */
export function formatForApi(displayDate: Date): string {
  // Convert to UTC before sending to API
  return new Date(displayDate.getTime() + displayDate.getTimezoneOffset() * 60000).toISOString();
}

/**
 * Helper function to get timezone offset in minutes for a given timezone and date
 * This is a simplified approach using Intl.DateTimeFormat
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  // Create a formatter for the target timezone
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Format the date in the target timezone
  const parts = formatter.formatToParts(date);
  const partMap = new Map(parts.map(part => [part.type, part.value]));

  // Create a date object in the target timezone
  const targetDate = new Date(
    parseInt(partMap.get('year')!),
    parseInt(partMap.get('month')!) - 1,
    parseInt(partMap.get('day')!),
    parseInt(partMap.get('hour')!),
    parseInt(partMap.get('minute')!),
    parseInt(partMap.get('second')!),
    0 // milliseconds
  );

  // Calculate the offset in minutes
  // The difference in time divided by 60000 gives us minutes
  return (targetDate.getTime() - date.getTime()) / 60000;
}

/**
 * Parse a date string in display format (DD/MM/YYYY) to a Date object
 * @param dateString - Date string in DD/MM/YYYY format
 * @param timeString - Optional time string in HH:MM format
 * @returns Date object in display timezone
 */
export function parseDisplayDate(dateString: string, timeString?: string): Date {
  if (!dateString) return new Date();
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  
  return date;
}

/**
 * Format a Date object to display format (DD/MM/YYYY)
 * @param date - Date object
 * @returns Date string in DD/MM/YYYY format
 */
export function formatDisplayDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // month is 0-indexed
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a Date object to time format (HH:MM)
 * @param date - Date object
 * @returns Time string in HH:MM format
 */
export function formatDisplayTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}