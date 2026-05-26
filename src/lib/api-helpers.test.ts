import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("./apiConfig", () => ({
  default: mockApi,
}));

import { getUploadedFiles } from "./fileApi";
import { updateTemplateMapping } from "./templateApi";

describe("file API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps uploaded file responses into the client file shape", async () => {
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: "file-1",
          filename: "notes.txt",
          createdAt: "2026-05-26T12:00:00.000Z",
          mimetype: "text/plain",
        },
      ],
    });

    await expect(getUploadedFiles("associate-1")).resolves.toEqual([
      {
        id: "file-1",
        filename: "notes.txt",
        uploadDate: "2026-05-26T12:00:00.000Z",
        mimetype: "text/plain",
        size: 0,
      },
    ]);
    expect(mockApi.get).toHaveBeenCalledWith("/files/associate-1");
  });
});

describe("template API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stringifies object cell values when updating a template mapping", async () => {
    mockApi.patch.mockResolvedValue({
      data: {
        mapping: {
          id: "mapping-1",
          templateType: "CA",
          dataPoint: "currentCA",
          cellValue: "{\"appendixA\":\"B13\"}",
          description: "Current CA cells",
          createdAt: "2026-05-26T12:00:00.000Z",
          updatedAt: "2026-05-26T12:00:00.000Z",
        },
      },
    });

    await updateTemplateMapping(
      "mapping-1",
      { appendixA: "B13" },
      "Current CA cells"
    );

    expect(mockApi.patch).toHaveBeenCalledWith(
      "/admin/template-mappings/mapping-1",
      {
        cellValue: "{\"appendixA\":\"B13\"}",
        description: "Current CA cells",
      }
    );
  });
});
