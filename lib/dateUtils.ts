/**
 * Date utility functions for Financial Year, Quarter, and Month calculations
 * Financial Year in India: April 1 - March 31
 */

/**
 * Get the financial year for a given date
 * FY starts on April 1 and ends on March 31
 * FY is named after the starting year (e.g., April 2025 - March 2026 = FY25)
 * @param date - The date to check
 * @returns Financial year string (e.g., "FY25", "FY26")
 */
export function getFinancialYear(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // JavaScript months are 0-indexed
  
  // If month is Apr-Dec, FY is current year (FY starts in April)
  // If month is Jan-Mar, FY is previous year (part of FY that started last April)
  const fyYear = month >= 4 ? year : year - 1
  
  // Return last 2 digits of the year (e.g., 2025 -> "FY25")
  return `FY${fyYear.toString().slice(-2)}`
}

/**
 * Get the financial quarter for a given date
 * Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
 * @param date - The date to check
 * @returns Quarter string (e.g., "Q1", "Q2", "Q3", "Q4")
 */
export function getFinancialQuarter(date: Date): string {
  const month = date.getMonth() + 1 // 1-12
  
  if (month >= 7 && month <= 9) return 'Q1'  // Jul-Sep
  if (month >= 10 && month <= 12) return 'Q2' // Oct-Dec
  if (month >= 1 && month <= 3) return 'Q3'   // Jan-Mar
  return 'Q4' // Apr-Jun (4-6)
}

/**
 * Get the month name (short form) for a given date
 * @param date - The date to check
 * @returns Month name (e.g., "Jan", "Feb", "Mar")
 */
export function getMonthName(date: Date): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  return monthNames[date.getMonth()]
}

/**
 * Get the month number (1-12) for a given date
 * @param date - The date to check
 * @returns Month number (1-12)
 */
export function getMonthNumber(date: Date): number {
  return date.getMonth() + 1
}

/**
 * Get the first day of the month for a given date
 * @param date - The date to check
 * @returns First day of the month as Date object
 */
export function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Get the last day of the month for a given date
 * @param date - The date to check
 * @returns Last day of the month as Date object
 */
export function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/**
 * Calculate period information from a date range
 * @param fromDate - Start date of the period
 * @param toDate - End date of the period
 * @returns Object containing FY, quarter, month, and other period info
 */
export function calculatePeriodInfo(fromDate: Date, toDate: Date) {
  // Use the start date to determine which month/quarter/FY this period belongs to
  const startDate = new Date(fromDate)
  
  return {
    financialYear: getFinancialYear(startDate),
    quarter: getFinancialQuarter(startDate),
    month: getMonthName(startDate),
    monthNumber: getMonthNumber(startDate),
    firstDayOfMonth: getFirstDayOfMonth(startDate),
    fromDate: startDate,
    toDate: new Date(toDate)
  }
}

/**
 * Validate that a date range is valid
 * @param fromDate - Start date
 * @param toDate - End date
 * @returns true if valid, false otherwise
 */
export function isValidDateRange(fromDate: Date, toDate: Date): boolean {
  return fromDate <= toDate
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateDisplay(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format date for ISO storage (YYYY-MM-DD)
 * @param date - Date to format
 * @returns ISO date string
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Parse date string in various formats
 * @param dateStr - Date string (DD/MM/YYYY, YYYY-MM-DD, or any parseable format)
 * @returns Date object
 */
export function parseDate(dateStr: string): Date {
  // Try DD/MM/YYYY format first
  const ddmmyyyyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = dateStr.match(ddmmyyyyRegex)
  
  if (match) {
    const [, day, month, year] = match
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }
  
  // Fall back to standard parsing
  return new Date(dateStr)
}

/**
 * Get week number of the month (1-5)
 * @param date - Date to check
 * @returns Week number of the month
 */
export function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const dayOfMonth = date.getDate()
  const firstDayOfWeek = firstDay.getDay()
  
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7)
}

/**
 * Calculate the number of days between two dates
 * @param fromDate - Start date
 * @param toDate - End date
 * @returns Number of days
 */
export function getDaysBetween(fromDate: Date, toDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round(Math.abs((toDate.getTime() - fromDate.getTime()) / oneDay)) + 1
}
