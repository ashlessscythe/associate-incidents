export enum Designation {
  NONE = "NONE",
  MH = "MH",
  CLERK = "CLERK",
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
}

export interface AssociateInfo {
  id: string;
  name: string;
  points: number;
  notificationLevel: string;
  designation: string;
  department?: Department;
  location?: Location;
}

export interface AssociateAndDesignation {
  id: string;
  name: string;
  designation: string;
  department?: Department;
  location?: Location;
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
  designation: Designation;
  levelNumber: number;
  levelText: string;
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
