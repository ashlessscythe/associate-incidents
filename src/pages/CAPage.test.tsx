// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CAPage from "./CAPage";
import { renderWithRouter } from "@/test/react";
import {
  buildAssociate,
  buildAssociateInfo,
  buildCorrectiveAction,
  buildRule,
  buildUser,
} from "@/test/fixtures";

const authMock = vi.hoisted(() => ({
  user: null as unknown,
}));

const associatesMock = vi.hoisted(() => ({
  associatesWithDesignation: [] as unknown[],
  fetchAssociatesWithDesignation: vi.fn(),
  loading: false,
  error: null as string | null,
}));

const apiMock = vi.hoisted(() => ({
  getRules: vi.fn(),
  getCorrectiveActions: vi.fn(),
  addCorrectiveAction: vi.fn(),
  updateCorrectiveAction: vi.fn(),
  deleteCorrectiveAction: vi.fn(),
  getAssociatePointsAndNotification: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  deleteFile: vi.fn(),
}));

const caFixture = vi.hoisted(() => ({
  editableCA: {
    id: "ca-1",
    associateId: "associate-1",
    ruleId: "rule-1",
    rule: {
      id: "rule-1",
      code: "SAF-1",
      description: "Safety rule",
      type: "SAFETY",
    },
    level: 1,
    description: "Documented verbal warning",
    date: new Date("2026-05-21T12:00:00.000Z"),
    files: [
      {
        id: "file-1",
        filename: "writeup.pdf",
        uploadDate: "2026-05-21T12:00:00.000Z",
        mimetype: "application/pdf",
        size: 123,
      },
    ],
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: authMock.user }),
}));

vi.mock("../hooks/useAssociates", () => ({
  useAssociatesWithDesignation: () => ({
    associatesWithDesignation: associatesMock.associatesWithDesignation,
    fetchAssociatesWithDesignation:
      associatesMock.fetchAssociatesWithDesignation,
    loading: associatesMock.loading,
    error: associatesMock.error,
  }),
}));

vi.mock("../lib/api", () => ({
  getRules: apiMock.getRules,
  getCorrectiveActions: apiMock.getCorrectiveActions,
  addCorrectiveAction: apiMock.addCorrectiveAction,
  updateCorrectiveAction: apiMock.updateCorrectiveAction,
  deleteCorrectiveAction: apiMock.deleteCorrectiveAction,
  getAssociatePointsAndNotification: apiMock.getAssociatePointsAndNotification,
  uploadFile: apiMock.uploadFile,
  downloadFile: apiMock.downloadFile,
  deleteFile: apiMock.deleteFile,
}));

vi.mock("../components/AssociateSelect", () => ({
  default: ({
    selectedAssociateId,
    onAssociateSelect,
  }: {
    selectedAssociateId: string | null;
    onAssociateSelect: (associateId: string | null) => void;
  }) => (
    <div>
      <p>Selected CA associate: {selectedAssociateId ?? "none"}</p>
      <button type="button" onClick={() => onAssociateSelect("associate-1")}>
        Select Alex
      </button>
    </div>
  ),
}));

vi.mock("../components/form/CAForm", () => ({
  default: ({
    associateId,
    onAddCorrectiveAction,
  }: {
    associateId: string | null;
    onAddCorrectiveAction: (data: {
      ruleId: string;
      description: string;
      level: number;
      date: Date;
    }) => Promise<void>;
  }) => (
    <button
      type="button"
      disabled={!associateId}
      onClick={() =>
        onAddCorrectiveAction({
          ruleId: "rule-1",
          description: "Documented warning",
          level: 1,
          date: new Date("2026-05-26T12:00:00.000Z"),
        })
      }
    >
      Add Corrective Action
    </button>
  ),
}));

vi.mock("../components/list/CAList", () => ({
  default: ({
    associate,
    correctiveActions,
    onEditCA,
  }: {
    associate: { name: string };
    correctiveActions: unknown[];
    onEditCA?: (ca: ReturnType<typeof buildCorrectiveAction>) => void;
  }) => (
    <section>
      <h2>Corrective Actions for {associate.name}</h2>
      <p>Corrective action count: {correctiveActions.length}</p>
      <button
        type="button"
        onClick={() =>
          onEditCA?.(
            caFixture.editableCA as ReturnType<typeof buildCorrectiveAction>
          )
        }
      >
        Edit CA
      </button>
    </section>
  ),
}));

vi.mock("../components/modals/CAEditModal", () => ({
  default: ({
    ca,
    onUpdate,
  }: {
    ca: ReturnType<typeof buildCorrectiveAction>;
    onUpdate: (ca: ReturnType<typeof buildCorrectiveAction>) => Promise<void>;
  }) => (
    <div role="dialog" aria-label="Edit CA">
      <button type="button" onClick={() => onUpdate(ca)}>
        Save CA Changes
      </button>
    </div>
  ),
}));

describe("CAPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.user = buildUser({ roles: ["ca-view"] });
    associatesMock.associatesWithDesignation = [buildAssociate()];
    associatesMock.loading = false;
    associatesMock.error = null;
    apiMock.getRules.mockResolvedValue([buildRule()]);
    apiMock.getCorrectiveActions.mockResolvedValue([buildCorrectiveAction()]);
    apiMock.getAssociatePointsAndNotification.mockResolvedValue(
      buildAssociateInfo()
    );
    apiMock.addCorrectiveAction.mockResolvedValue({});
    apiMock.updateCorrectiveAction.mockResolvedValue({});
  });

  it("shows view-only mode when the user cannot edit corrective actions", async () => {
    renderWithRouter(<CAPage />, {
      route: "/ca?associateId=associate-1",
    });

    expect(await screen.findByText("View Only Mode")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You do not have permission to add or edit corrective actions."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Add Corrective Action")
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText("Corrective Actions for Alex Associate")
    ).toBeInTheDocument();
  });

  it("adds a corrective action for editors and refreshes page data", async () => {
    authMock.user = buildUser({ roles: ["ca-edit"] });

    renderWithRouter(<CAPage />, {
      route: "/ca?associateId=associate-1",
    });

    await screen.findByText("Corrective Actions for Alex Associate");
    await userEvent.click(
      screen.getByRole("button", { name: "Add Corrective Action" })
    );

    await waitFor(() => {
      expect(apiMock.addCorrectiveAction).toHaveBeenCalledWith({
        associateId: "associate-1",
        ruleId: "rule-1",
        description: "Documented warning",
        level: 1,
        date: new Date("2026-05-26T12:00:00.000Z"),
      });
    });
    expect(apiMock.getCorrectiveActions).toHaveBeenCalledWith("associate-1");
    expect(
      associatesMock.fetchAssociatesWithDesignation
    ).toHaveBeenCalled();
  });

  it("strips attachment files before saving corrective action edits", async () => {
    authMock.user = buildUser({ roles: ["ca-edit"] });

    renderWithRouter(<CAPage />, {
      route: "/ca?associateId=associate-1",
    });

    await screen.findByText("Corrective Actions for Alex Associate");
    await userEvent.click(screen.getByRole("button", { name: "Edit CA" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Save CA Changes" })
    );

    await waitFor(() => {
      expect(apiMock.updateCorrectiveAction).toHaveBeenCalledWith(
        "ca-1",
        expect.not.objectContaining({ files: expect.anything() })
      );
    });
    expect(apiMock.updateCorrectiveAction).toHaveBeenCalledWith(
      "ca-1",
      expect.objectContaining({
        id: "ca-1",
        associateId: "associate-1",
        ruleId: "rule-1",
      })
    );
  });
});
