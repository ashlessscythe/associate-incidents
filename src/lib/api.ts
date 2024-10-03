// Re-export everything from the new modules
export * from './locationDepartmentApi';
export * from './associateApi';
export * from './occurrenceApi';
export * from './correctiveActionApi';
export * from './reportApi';
export * from './exportApi';
export * from './notificationApi';
export * from './types';

// Export the default api instance
export { default as api } from './apiConfig';
