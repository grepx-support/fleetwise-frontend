import type { Job } from '@/types/types';

/**
 * Generates a formatted text summary of a job for sharing
 * @param job The job object to generate summary for
 * @returns Formatted text summary
 */
export function generateJobSummary(job: Job): string {
  const lines: string[] = [];

  // Customer Account
  if (job.customer?.name) {
    lines.push(`Customer Account: ${job.customer.name}`);
  }

  // SIXT Booking Reference
  if (job.reference) {
    lines.push(`SIXT Booking Reference: ${job.reference}`);
  }

  // Type of vehicle
  if (job.vehicle_type) {
    lines.push(`Type of vehicle: ${job.vehicle_type}`);
  }

  // Pick up Date and Time
  if (job.pickup_date && job.pickup_time) {
    const formattedDateTime = formatDateTime(job.pickup_date, job.pickup_time);
    if (formattedDateTime) {
      lines.push(`Pick up Date and Time: ${formattedDateTime}`);
    }
  }

  // Pick up Location
  if (job.pickup_location) {
    lines.push(`Pick up Location: ${job.pickup_location}`);
  }

  // Drop Off Location
  if (job.dropoff_location) {
    lines.push(`Drop Off Location: ${job.dropoff_location}`);
  }

  // Passenger Details
  const passengerDetails = [];
  if (job.passenger_name) {
    passengerDetails.push(job.passenger_name);
  }
  if (job.passenger_mobile) {
    passengerDetails.push(job.passenger_mobile);
  }
  
  if (passengerDetails.length > 0) {
    lines.push(`Passenger Details: ${passengerDetails.join(', ')}`);
  }

  // Driver Notes
  if (job.remarks) {
    lines.push(`Driver Notes: ${job.remarks}`);
  }

  return lines.join('\n');
}

/**
 * Formats date and time according to DD/MM/YYYY HH:MM format
 * @param date Date string in YYYY-MM-DD format
 * @param time Time string in HH:MM format
 * @returns Formatted date and time string
 */
function formatDateTime(date: string, time: string): string {
  if (!date || !time) return '';
  const dateParts = date.split('-');
  if (dateParts.length === 3 && dateParts.every(part => part && !isNaN(Number(part)))) {
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    return `${formattedDate} ${time}`;
  }
  return `${date} ${time}`;
}