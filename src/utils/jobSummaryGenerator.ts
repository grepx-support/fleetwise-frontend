import type { Job } from '@/types/job';

/**
 * Generates a formatted text summary of a job for sharing
 * @param job The job object to generate summary for
 * @returns Formatted text summary
 */
export function generateJobSummary(job: Job): string {
  const lines: string[] = [];

  // Customer Account
  if (job.customer_name) {
    lines.push(`Customer Account: ${job.customer_name}`);
  }

  // SIXT Booking Reference
  if (job.booking_ref) {
    lines.push(`SIXT Booking Reference: ${job.booking_ref}`);
  }

  // Type of vehicle
  if (job.vehicle_type) {
    lines.push(`Type of vehicle: ${job.vehicle_type}`);
  }

  // Pick up Date and Time
  if (job.pickup_date && job.pickup_time) {
    lines.push(`Pick up Date and Time: ${formatDateTime(job.pickup_date, job.pickup_time)}`);
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
  if (job.customer_remark) {
    lines.push(`Driver Notes: ${job.customer_remark}`);
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
  // Convert YYYY-MM-DD to DD/MM/YYYY
  const dateParts = date.split('-');
  if (dateParts.length === 3) {
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    return `${formattedDate} ${time}`;
  }
  return `${date} ${time}`;
}