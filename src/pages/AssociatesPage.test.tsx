// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssociatesPage from "./AssociatesPage";
import { renderWithRouter } from "@/test/react";
import { buildAssociate, buildUser } from "@/test/fixtures";

const authMock = vi.hoisted(() => ({
  user: null as unknown,
}));

const associatesMock = vi.hoisted(() => ({
  associatesWithDesignation: [] as unknown[],
  loading: false,
  error: null as string | null,
  fetchAssociatesWithDesignation: vi.fn(),
  updateAssociateActiveStatus: vi.fn(),
  updateAssociateOptimistically: vi.fn(),
}));

const apiMock = vi.hoisted(() => ({
  addAssociate: vi.fn(),
  deleteAssociate: vi.fn(),
  updateAssociate: vi.fn(),
  toggleAssociateActive: vi.fn(),
  getDepartments: vi.fn(),
  getLocations: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: authMock.user }),
}));

vi.mock("../hooks/useAssociates", () => ({
  useAssociatesWithDesignation: () => associatesMock,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    addAssociate: apiMock.addAssociate,
    deleteAssociate: apiMock.deleteAssociate,
    updateAssociate: apiMock.updateAssociate,
    toggleAssociateActive: apiMock.toggleAssociateActive,
    getDepartments: apiMock.getDepartments,
    getLocations: apiMock.getLocations,
  };
});

vi.mock("@/lib/apiConfig", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AssociatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.user = buildUser({ roles: ["user-edit"] });
    associatesMock.associatesWithDesignation = [
      buildAssociate({ id: "associate-1", name: "Alex Associate" }),
    ];
    associatesMock.loading = false;
    associatesMock.error = null;
    apiMock.getDepartments.mockResolvedValue([
      { id: "dept-1", name: "Operations" },
    ]);
    apiMock.getLocations.mockResolvedValue([{ id: "loc-1", name: "Denver" }]);
    apiMock.addAssociate.mockResolvedValue({ id: "associate-2", name: "Blake" });
  });

  it("loads associates and supports adding with designation fields", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AssociatesPage />);

    expect(await screen.findByText("Alex Associate")).toBeInTheDocument();
    expect(associatesMock.fetchAssociatesWithDesignation).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /add new associate/i }));
    await user.type(screen.getByLabelText(/^name$/i), "Blake Builder");
    await user.click(screen.getByRole("button", { name: /^add associate$/i }));

    await waitFor(() => {
      expect(apiMock.addAssociate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Blake Builder",
          designation: "NONE",
        })
      );
    });
    expect(associatesMock.fetchAssociatesWithDesignation).toHaveBeenCalledTimes(
      2
    );
  });

  it("disables add when the user lacks editor role", async () => {
    authMock.user = buildUser({ roles: ["att-view"] });
    renderWithRouter(<AssociatesPage />);

    expect(
      await screen.findByRole("button", {
        name: /add new associate \(requires editor role\)/i,
      })
    ).toBeDisabled();
  });
});
