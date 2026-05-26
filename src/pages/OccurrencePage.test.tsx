// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OccurrencePage from "./OccurrencePage";
import { renderWithRouter } from "@/test/react";
import {
  buildAssociateInfo,
  buildOccurrence,
  buildOccurrenceType,
  buildUser,
} from "@/test/fixtures";

const authMock = vi.hoisted(() => ({
  user: null as unknown,
}));

const associatesMock = vi.hoisted(() => ({
  fetchAssociatesWithDesignation: vi.fn(),
  loading: false,
  error: null as string | null,
}));

const apiMock = vi.hoisted(() => ({
  getOccurrences: vi.fn(),
  getOccurrenceTypes: vi.fn(),
  addOccurrence: vi.fn(),
  getAssociatePointsAndNotification: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: authMock.user }),
}));

vi.mock("@/hooks/useAssociates", () => ({
  useAssociatesWithDesignation: () => ({
    fetchAssociatesWithDesignation:
      associatesMock.fetchAssociatesWithDesignation,
    loading: associatesMock.loading,
    error: associatesMock.error,
  }),
}));

vi.mock("@/lib/api", () => ({
  getOccurrences: apiMock.getOccurrences,
  getOccurrenceTypes: apiMock.getOccurrenceTypes,
  addOccurrence: apiMock.addOccurrence,
  getAssociatePointsAndNotification: apiMock.getAssociatePointsAndNotification,
  NotificationType: {
    OCCURRENCE: 0,
    CORRECTIVE_ACTION: 1,
  },
}));

vi.mock("@/components/AssociateSelect", () => ({
  default: ({
    selectedAssociateId,
    onAssociateSelect,
  }: {
    selectedAssociateId: string | null;
    onAssociateSelect: (associateId: string | null) => void;
  }) => (
    <div>
      <p>Selected associate: {selectedAssociateId ?? "none"}</p>
      <button type="button" onClick={() => onAssociateSelect("associate-1")}>
        Select Alex
      </button>
    </div>
  ),
}));

vi.mock("@/components/form/OccurrenceForm", () => ({
  default: ({
    associateId,
    onAddOccurrence,
  }: {
    associateId: string | null;
    onAddOccurrence: (occurrence: {
      typeId: string;
      date: Date;
      notes: string;
    }) => Promise<void>;
  }) => (
    <button
      type="button"
      disabled={!associateId}
      onClick={() =>
        onAddOccurrence({
          typeId: "type-1",
          date: new Date("2026-05-26T12:00:00.000Z"),
          notes: "Late arrival",
        })
      }
    >
      Add Occurrence
    </button>
  ),
}));

vi.mock("@/components/list/OccurrenceList", () => ({
  default: ({
    associateInfo,
    occurrences,
    allowEdit,
  }: {
    associateInfo: { name: string };
    occurrences: unknown[];
    allowEdit?: boolean;
  }) => (
    <section>
      <h2>Occurrences for {associateInfo.name}</h2>
      <p>Occurrence count: {occurrences.length}</p>
      <p>{allowEdit ? "Can edit occurrences" : "Read only occurrences"}</p>
    </section>
  ),
}));

vi.mock("@/components/NotificationTracker", () => ({
  NotificationTracker: ({
    associateName,
  }: {
    associateName: string;
  }) => <div>Notifications for {associateName}</div>,
}));

describe("OccurrencePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.user = buildUser({ roles: ["att-view"] });
    associatesMock.loading = false;
    associatesMock.error = null;
    apiMock.getOccurrenceTypes.mockResolvedValue([buildOccurrenceType()]);
    apiMock.getOccurrences.mockResolvedValue([buildOccurrence()]);
    apiMock.getAssociatePointsAndNotification.mockResolvedValue(
      buildAssociateInfo()
    );
    apiMock.addOccurrence.mockResolvedValue({});
  });

  it("shows view-only mode when the user cannot edit attendance", async () => {
    renderWithRouter(<OccurrencePage />);

    expect(await screen.findByText("View Only Mode")).toBeInTheDocument();
    expect(
      screen.getByText("You do not have permission to add or edit occurrences.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Add Occurrence")).not.toBeInTheDocument();
  });

  it("loads occurrences and notifications for the associate in the URL", async () => {
    renderWithRouter(<OccurrencePage />, {
      route: "/attendance?associateId=associate-1",
    });

    expect(
      await screen.findByText("Occurrences for Alex Associate")
    ).toBeInTheDocument();
    expect(screen.getByText("Occurrence count: 1")).toBeInTheDocument();
    expect(
      screen.getByText("Notifications for Alex Associate")
    ).toBeInTheDocument();
    expect(apiMock.getOccurrences).toHaveBeenCalledWith("associate-1");
    expect(apiMock.getAssociatePointsAndNotification).toHaveBeenCalledWith(
      "associate-1"
    );
  });

  it("submits a new occurrence for editors and refreshes dependent data", async () => {
    authMock.user = buildUser({ roles: ["att-edit"] });

    renderWithRouter(<OccurrencePage />, {
      route: "/attendance?associateId=associate-1",
    });

    await screen.findByText("Occurrences for Alex Associate");
    await userEvent.click(screen.getByRole("button", { name: "Add Occurrence" }));

    await waitFor(() => {
      expect(apiMock.addOccurrence).toHaveBeenCalledWith({
        associateId: "associate-1",
        typeId: "type-1",
        date: new Date("2026-05-26T12:00:00.000Z"),
        notes: "Late arrival",
      });
    });
    expect(apiMock.getOccurrences).toHaveBeenLastCalledWith("associate-1");
    expect(
      associatesMock.fetchAssociatesWithDesignation
    ).toHaveBeenCalledOnce();
    expect(screen.getByText("Can edit occurrences")).toBeInTheDocument();
  });
});
