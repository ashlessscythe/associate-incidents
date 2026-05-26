// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import TemplateMappingConfig from "./TemplateMappingConfig";
import { TemplateMapping } from "@/lib/templateApi";

const apiMock = vi.hoisted(() => ({
  getTemplateMappings: vi.fn(),
  createOrUpdateTemplateMapping: vi.fn(),
  deleteTemplateMapping: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/lib/templateApi", () => ({
  getTemplateMappings: apiMock.getTemplateMappings,
  createOrUpdateTemplateMapping: apiMock.createOrUpdateTemplateMapping,
  deleteTemplateMapping: apiMock.deleteTemplateMapping,
}));

vi.mock("react-hot-toast", () => ({
  toast: toastMock,
}));

function mapping(overrides: Partial<TemplateMapping> = {}): TemplateMapping {
  return {
    id: "mapping-1",
    templateType: "CA",
    dataPoint: "associateName",
    cellValue: "A7",
    description: "Associate name",
    createdAt: "2026-05-26T12:00:00.000Z",
    updatedAt: "2026-05-26T12:00:00.000Z",
    ...overrides,
  };
}

function renderConfig() {
  return render(<TemplateMappingConfig isOpen onClose={vi.fn()} />);
}

describe("TemplateMappingConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.getTemplateMappings.mockResolvedValue([mapping()]);
    apiMock.createOrUpdateTemplateMapping.mockResolvedValue(mapping());
    apiMock.deleteTemplateMapping.mockResolvedValue(undefined);
  });

  it("auto-loads missing default mappings when a template has none", async () => {
    apiMock.getTemplateMappings
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mapping()]);

    renderConfig();

    await waitFor(() => {
      expect(apiMock.createOrUpdateTemplateMapping).toHaveBeenCalledWith(
        "CA",
        "associateName",
        "A7",
        "Associate name"
      );
    });
    expect(apiMock.createOrUpdateTemplateMapping).toHaveBeenCalledWith(
      "CA",
      "currentCA",
      JSON.stringify({ appendixA: "B13", appendixB: "B14" }),
      "Current CA cells (object)"
    );
    expect(toastMock.success).toHaveBeenCalledWith(
      "Default mappings loaded automatically"
    );
    expect(await screen.findByText("associateName")).toBeInTheDocument();
  });

  it("saves edits to an existing mapping", async () => {
    renderConfig();

    expect(await screen.findByText("associateName")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const cellValueInput = screen.getByPlaceholderText(
      'e.g., "A7" or ["B9", "E9"] or {"date": "B24", "type": "D24"}'
    );
    await userEvent.clear(cellValueInput);
    await userEvent.type(cellValueInput, "B8");
    await userEvent.clear(screen.getByDisplayValue("Associate name"));
    await userEvent.type(
      screen.getByPlaceholderText("Optional description"),
      "Updated associate name"
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(apiMock.createOrUpdateTemplateMapping).toHaveBeenCalledWith(
        "CA",
        "associateName",
        "B8",
        "Updated associate name"
      );
    });
    expect(toastMock.success).toHaveBeenCalledWith(
      "Mapping saved successfully"
    );
  });

  it("deletes mappings only after confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderConfig();
    expect(await screen.findByText("associateName")).toBeInTheDocument();

    const deleteButton = screen
      .getAllByRole("button")
      .find((button) => button.querySelector("svg") && !button.textContent);
    expect(deleteButton).toBeDefined();
    await userEvent.click(deleteButton as HTMLButtonElement);

    await waitFor(() => {
      expect(apiMock.deleteTemplateMapping).toHaveBeenCalledWith("mapping-1");
    });
    expect(toastMock.success).toHaveBeenCalledWith(
      "Mapping deleted successfully"
    );

    confirmSpy.mockRestore();
  });

  it("shows an error toast when deletion fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    apiMock.deleteTemplateMapping.mockRejectedValue(new Error("nope"));

    renderConfig();
    expect(await screen.findByText("associateName")).toBeInTheDocument();

    const deleteButton = screen
      .getAllByRole("button")
      .find((button) => button.querySelector("svg") && !button.textContent);
    expect(deleteButton).toBeDefined();
    await userEvent.click(deleteButton as HTMLButtonElement);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Failed to delete mapping");
    });
  });
});
