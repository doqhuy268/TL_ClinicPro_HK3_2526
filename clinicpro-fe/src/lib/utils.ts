import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date string to yyyy-mm-dd format for HTML date input
 * @param dateString - Date string from API or database
 * @returns Formatted date string in yyyy-mm-dd format
 */
export function formatDateForInput(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0]; // Format: yyyy-mm-dd
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
}

/**
 * Format date string for display in Vietnamese locale
 * @param dateString - Date string from API or database
 * @returns Formatted date string for display
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return dateString || '—';
  }
}

/**
 * Validate if a date string is in valid format
 * @param dateString - Date string to validate
 * @returns True if valid, false otherwise
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
