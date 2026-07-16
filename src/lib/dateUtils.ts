/**
 * Utility functions for date-based operations
 */

import type { CSSProperties } from "react";

/**
 * Checks if a date is older than 12 months from today
 * @param date - The date to check
 * @returns true if the date is older than 12 months
 */
export const isOverOneYearOld = (date: Date): boolean => {
  const targetDate = new Date(date);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return targetDate < oneYearAgo;
};

/**
 * Gets the styling for items that are older than 12 months
 * @param date - The date to check
 * @returns CSS style object for crossed-out appearance
 */
export const getExpiredItemStyle = (date: Date): CSSProperties => {
  return isOverOneYearOld(date)
    ? { color: "gray", textDecoration: "line-through" }
    : {};
};

/**
 * Gets CSS classes for items that are older than 12 months
 * @param date - The date to check
 * @returns CSS class string for expired items
 */
export const getExpiredItemClassName = (date: Date): string => {
  return isOverOneYearOld(date) 
    ? "text-gray-500 line-through" 
    : "";
};
