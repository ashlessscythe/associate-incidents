import { User } from "@/contexts/AuthContext";
import {
  Associate,
  AssociateAndDesignation,
  AssociateInfo,
  CorrectiveAction,
  Occurrence,
  OccurrenceType,
  Rule,
  RuleType,
} from "@/lib/types";

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "manager@example.com",
    name: "Manager User",
    isActive: true,
    isAdmin: false,
    roles: ["att-view"],
    ...overrides,
  };
}

export function buildAssociate(
  overrides: Partial<AssociateAndDesignation> = {}
): AssociateAndDesignation {
  return {
    id: "associate-1",
    name: "Alex Associate",
    designation: "MH",
    isActive: true,
    department: { id: "dept-1", name: "Operations" },
    location: { id: "loc-1", name: "Denver" },
    points: 1,
    ...overrides,
  };
}

export function buildAssociateInfo(
  overrides: Partial<AssociateInfo> = {}
): AssociateInfo {
  return {
    id: "associate-1",
    name: "Alex Associate",
    points: 1,
    occurrencePoints: 1,
    pointsAdjustment: 0,
    notificationLevel: "Level 1",
    designation: "MH",
    isActive: true,
    department: { id: "dept-1", name: "Operations" },
    location: { id: "loc-1", name: "Denver" },
    ...overrides,
  };
}

export function buildOccurrenceType(
  overrides: Partial<OccurrenceType> = {}
): OccurrenceType {
  return {
    id: "type-1",
    code: "LATE",
    description: "Late arrival",
    points: 1,
    ...overrides,
  };
}

export function buildOccurrence(overrides: Partial<Occurrence> = {}): Occurrence {
  const type = buildOccurrenceType();

  return {
    id: "occurrence-1",
    typeId: type.id,
    type,
    date: new Date("2026-05-20T12:00:00.000Z"),
    pointsAtTime: type.points,
    notes: "Late arrival",
    files: [],
    ...overrides,
  };
}

export function buildRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "rule-1",
    code: "SAF-1",
    description: "Safety rule",
    type: RuleType.SAFETY,
    ...overrides,
  };
}

export function buildCorrectiveAction(
  overrides: Partial<CorrectiveAction> = {}
): CorrectiveAction {
  const rule = buildRule();

  return {
    id: "ca-1",
    associateId: "associate-1",
    ruleId: rule.id,
    rule,
    level: 1,
    description: "Documented verbal warning",
    date: new Date("2026-05-21T12:00:00.000Z"),
    files: [],
    ...overrides,
  };
}

export function toAssociate(associate = buildAssociate()): Associate {
  return {
    id: associate.id,
    name: associate.name,
    department: associate.department,
    location: associate.location,
    isActive: associate.isActive,
  };
}
