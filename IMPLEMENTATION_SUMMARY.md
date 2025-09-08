# 12-Month Rolling Expiration Implementation

## Overview
Successfully abstracted the 12-month rolling expiration logic into reusable utilities and applied it consistently across all occurrence, corrective action, and notification components.

## What Was Implemented

### 1. Core Utilities (`src/lib/dateUtils.ts`)
- `isOverOneYearOld(date: Date)`: Checks if a date is older than 12 months
- `getExpiredItemStyle(date: Date)`: Returns CSS style object for expired items
- `getExpiredItemClassName(date: Date)`: Returns CSS classes for expired items

### 2. Custom Hook (`src/hooks/useExpiredItem.ts`)
- `useExpiredItem(date: Date)`: React hook that provides expiration status and styling
- Returns: `{ isExpired, style, className }`
- Uses `useMemo` for performance optimization

### 3. Component Updates

#### OccurrenceItem.tsx
- ✅ **Before**: Had inline `isOverOneYearOld` function
- ✅ **After**: Uses `useExpiredItem` hook for consistent styling

#### CAItem.tsx  
- ✅ **Before**: No expiration styling
- ✅ **After**: Added expiration styling using `useExpiredItem` hook

#### NotificationTracker.tsx
- ✅ **Before**: No expiration styling
- ✅ **After**: Added expiration styling with `NotificationRow` component using `useExpiredItem` hook

## Benefits

1. **Consistency**: All three components now have the same 12-month rolling expiration behavior
2. **Maintainability**: Single source of truth for expiration logic
3. **Reusability**: Easy to apply to future components
4. **Performance**: Optimized with `useMemo` in the hook
5. **Flexibility**: Provides both inline styles and CSS classes

## Usage Example

```tsx
import { useExpiredItem } from '@/hooks/useExpiredItem';

const MyComponent = ({ item }) => {
  const { isExpired, style, className } = useExpiredItem(item.date);
  
  return (
    <div style={style} className={className}>
      {/* Item content */}
    </div>
  );
};
```

## Visual Result
Items older than 12 months now appear with:
- Gray color
- Line-through text decoration
- Applied consistently across occurrences, corrective actions, and notifications
