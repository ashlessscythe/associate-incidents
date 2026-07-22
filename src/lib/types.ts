export enum Designation {
  MH = "MH",
  CLERK = "CLERK",
  OFFICE = "OFFICE",
  INACTIVE = "INACTIVE",
  NONE = "NONE",
}

export interface Location {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Associate {
  id: string;
  name: string;
  currentPoints?: number;
  correctiveAction?: CorrectiveAction[];
  occurrences?: Occurrence[];
  department?: Department;
  location?: Location;
  isActive: boolean;
}

export interface OccurrenceType {
  id: string;
  code: string;
  description: string;
  points: number;
}

export interface Occurrence {
  id: string;
  typeId?: string;
  type: OccurrenceType;
  date: Date;
  pointsAtTime: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
  files?: UploadedFile[];
}

export interface AssociateInfo {
  id: string;
  name: string;
  points: number;
  /** Sum of counted occurrence type points in the rolling window (before adjustment). */
  occurrencePoints?: number;
  /** Sum of points for in-window occurrences before pointTotalsEffectiveDate (excluded from totals). */
  priorOccurrencePoints?: number;
  /** Manual offset stored on the associate; included in `points`. */
  pointsAdjustment?: number;
  /** Inclusive: associate-only cutoff; overrides designation policy when set. */
  pointTotalsEffectiveDate?: string | null;
  /** Admin default for this associate's designation (inclusive). */
  designationPointTotalsEffectiveDate?: string | null;
  /** Cutoff actually used for totals (associate if set, else designation). */
  resolvedPointTotalsEffectiveDate?: string | null;
  notificationLevel: string;
  designation: string;
  department?: Department;
  location?: Location;
  isActive: boolean;
}

export interface AssociateAndDesignation {
  id: string;
  name: string;
  designation: string;
  department?: Department;
  location?: Location;
  isActive: boolean;
  /** Rolling-window occurrence sum (same window as `points` elsewhere). */
  occurrencePoints?: number;
  pointsAdjustment?: number;
  /** Inclusive associate-only cutoff (overrides designation when set). */
  pointTotalsEffectiveDate?: string | null;
  /** Designation-level default from admin. */
  designationPointTotalsEffectiveDate?: string | null;
  /** occurrencePoints + pointsAdjustment */
  points?: number;
}

export interface AssociateAndOccurrences {
  id: string;
  name: string;
  occurrences: Occurrence[];
  info: AssociateInfo;
}

export enum RuleType {
  SAFETY = "SAFETY",
  WORK = "WORK",
  OPERATIONS = "OPERATIONS",
  SIGNAL = "SIGNAL",
  CBA_VIOLATION = "CBA VIOLATION",
}

export interface Rule {
  id: string;
  code: string;
  description: string;
  type: RuleType;
}

export interface CorrectiveAction {
  id: string;
  associateId: string;
  ruleId: string;
  rule: Rule;
  level: number;
  description: string;
  date: Date;
  files?: UploadedFile[];
}

export interface ExportOccRecord {
  id: string;
  associateId: string;
  exportedBy: string;
  exportedAt: Date;
  location: string;
  department: string;
}

export enum NotificationType {
  OCCURRENCE,
  CORRECTIVE_ACTION,
}

export interface Notification {
  id: string;
  associateId: string;
  date: Date;
  type: NotificationType;
  level: string;
  totalPoints?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  files?: UploadedFile[];
}

export interface NotificationLevel {
  id?: string;
  designation: Designation;
  level: number;
  name: string;
  pointThreshold?: number;
}

export interface CreateNotificationData {
  associateId: string;
  date: Date;
  type: NotificationType;
  level: string;
  totalPoints?: number;
  description?: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  uploadDate: string;
  mimetype: string;
  size: number;
}
