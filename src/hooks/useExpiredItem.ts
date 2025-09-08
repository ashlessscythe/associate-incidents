import { useMemo } from 'react';
import { isOverOneYearOld, getExpiredItemStyle, getExpiredItemClassName } from '@/lib/dateUtils';

/**
 * Custom hook for handling expired item styling based on 12-month rolling window
 * @param date - The date to check against
 * @returns Object containing expiration status and styling utilities
 */
export const useExpiredItem = (date: Date) => {
  return useMemo(() => {
    const isExpired = isOverOneYearOld(date);
    
    return {
      isExpired,
      style: getExpiredItemStyle(date),
      className: getExpiredItemClassName(date),
    };
  }, [date]);
};
