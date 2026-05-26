import { describe, expect, it } from "vitest";
import { omitFiles } from "./exportPayload";

describe("omitFiles", () => {
  it("removes file attachments from export payloads without mutating the source", () => {
    const source = {
      id: "ca-1",
      description: "Corrective action",
      files: [{ id: "file-1", filename: "document.pdf" }],
    };

    const payload = omitFiles(source);

    expect(payload).toEqual({
      id: "ca-1",
      description: "Corrective action",
    });
    expect("files" in payload).toBe(false);
    expect(source.files).toEqual([{ id: "file-1", filename: "document.pdf" }]);
  });
});
